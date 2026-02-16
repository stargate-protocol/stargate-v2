// SPDX-LICENSE-IDENTIFIER: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";

import { console, Test } from "@layerzerolabs/toolbox-foundry/lib/forge-std/Test.sol";

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { ICommonOFT } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/ICommonOFT.sol";

import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import { EnforcedOptionParam } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppOptionsType3.sol";
import { IOFT as IOFTEpv2, MessagingFee as MessagingFeeEpv2, SendParam as SendParamEpv2, OFTLimit, OFTFeeDetail, OFTReceipt } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

import { IOFTWrapper, OFTWrapper } from "../../../../src/peripheral/oft-wrapper/OFTWrapper.sol";

import { LzTestHelper } from "../../../layerzero/LzTestHelper.sol";

import { ERC20Mock } from "./mocks/ERC20Mock.sol";
import { Fee } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/fee/Fee.sol";
import { OFTWithFee } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/fee/OFTWithFee.sol";
import { CustomQuoteSendMockOFT, CustomQuoteSendMockOFTAdapter, MockOFT, MockOFTAdapter, CustomQuoteOFTMockOFT } from "./mocks/epv2/MockOFT.sol";
import { MockOFTWrapper } from "./mocks/wrapper/MockOFtWrapper.sol";
import { OFT as OFTEpv2 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";
import { MockLayerZeroEndpoint } from "./mocks/epv1/MockLayerZeroEndpoint.sol";

import { OFTProxyMock as OFTv2ProxyMock } from "./mocks/oftv2/OFTProxyMock.sol";
import { OFTMock as OFTv2Mock } from "./mocks/oftv2/OFTMock.sol";
import { MockEpv1OFTv1 } from "./mocks/oft/MockEpv1OFTv1.sol";

import { OFTProxyMock as OFTv1ProxyMock } from "./mocks/oft/OFTProxyMock.sol";
import { OFTMock as OFTv1Mock } from "./mocks/oft/OFTMock.sol";
import { QuoteOFTMock as OFTv1QuoteMock } from "./mocks/oft/OFTMock.sol";
import { OFTWithFeeMock } from "./mocks/oft/OFTWithFeeMock.sol";

import { IOFT } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/interfaces/IOFT.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { OFTCoreV2 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/OFTCoreV2.sol";

contract OFTWrapperTest is Test, LzTestHelper {
    using OptionsBuilder for bytes;

    bytes internal constant EXCESSIVE_DEFAULT_BPS_CONFIG_ERROR = "OFTWrapper: defaultBps >= 100%";
    bytes internal constant EXCESSIVE_CALLER_BPS_CONFIG_ERROR = "OFTWrapper: callerBpsCap > 100%";
    bytes internal constant EXCESSIVE_CALLER_BPS_ERROR = "OFTWrapper: callerBps > callerBpsCap";

    string internal ERC20_MOCK_NAME = "ERC20Mock";
    string internal ERC20_MOCK_SYMBOL = "ERC";
    string internal OFT_NAME = "OFTA";
    string internal OFT_SYMBOL = "OFTA";
    string internal WRAPPER_FEE_NAME = "wrapperFee";
    string internal CALLER_FEE_NAME = "callerFee";
    string internal NATIVE_FEE_NAME = "nativeFee";

    uint8 internal constant NUM_ENDPOINTS = 2;
    uint32 internal constant A_EID = 1;
    uint32 internal constant B_EID = 2;
    uint256 internal constant INITIAL_AMOUNT = 1000 * 1e18;
    uint256 internal constant MIN_AMOUNT = 900 * 1e18;
    uint256 internal constant DECIMAL_CONVERSION_RATE = 1e18;
    uint256 internal constant BPS_DENOMINATOR = 10000;
    uint256 internal constant MOCK_MIN_AMOUNT_LD = 500 * 1e18;
    uint256 internal constant MOCK_MAX_AMOUNT_LD = 1500 * 1e18;
    uint256 internal constant MOCK_NATIVE_FEE = 0.001 ether;
    uint8 internal constant SHARED_DECIMALS = 6;
    uint8 internal constant LOCAL_DECIMALS = 18;
    uint16 internal constant CALLER_BPS = 50;

    uint16 internal constant DEFAULT_BPS = 97;
    uint256 internal constant DEFAULT_CALLER_BPS_CAP = type(uint256).max; // unset by default

    OFTWrapper internal oftWrapper;
    MockOFTWrapper internal mockOftWrapper;

    ERC20Mock internal token;
    MockOFTAdapter internal adapter;

    MockOFT internal oft;

    address internal sender;
    address internal receiver;
    address internal caller;
    address internal refundAddress;

    function _setUpUsers() internal {
        sender = makeAddr("sender");
        vm.deal(sender, 1 ether);

        receiver = makeAddr("receiver");
        assertEq(0, IERC20(adapter.token()).balanceOf(receiver));
        assertEq(0, IERC20(oft).balanceOf(receiver));

        caller = makeAddr("caller");
        assertEq(0, IERC20(adapter.token()).balanceOf(caller));
        assertEq(0, IERC20(oft).balanceOf(caller));

        refundAddress = makeAddr("refundAddress");
        assertEq(0, IERC20(adapter.token()).balanceOf(refundAddress));
        assertEq(0, IERC20(oft).balanceOf(refundAddress));
    }

    function setUp() public {
        // 1. Set up 2 endpoints.
        setUpEndpoints(NUM_ENDPOINTS);

        // 2. Create an OFTWrapper with defaultBps
        oftWrapper = new OFTWrapper(DEFAULT_BPS, DEFAULT_CALLER_BPS_CAP);
        mockOftWrapper = new MockOFTWrapper(DEFAULT_BPS, DEFAULT_CALLER_BPS_CAP);

        // 3. Create an Adapter on A_EID
        token = new ERC20Mock(ERC20_MOCK_NAME, ERC20_MOCK_SYMBOL);
        adapter = new MockOFTAdapter(address(token), endpoints[A_EID], address(this));

        // 4. Create an OFT on B_EID
        oft = new MockOFT(OFT_NAME, OFT_SYMBOL, endpoints[B_EID], address(this));

        // 5. Wire the two together.
        adapter.setPeer(B_EID, _addressToBytes32(address(oft)));
        oft.setPeer(A_EID, _addressToBytes32(address(adapter)));

        _setUpUsers();
    }

    function test_constructor(uint16 _defaultBps, uint16 _callerBpsCap) public {
        if (_defaultBps >= 10000) {
            vm.expectRevert(EXCESSIVE_DEFAULT_BPS_CONFIG_ERROR);
            new OFTWrapper(_defaultBps, _callerBpsCap);
        } else {
            OFTWrapper wrapper = new OFTWrapper(_defaultBps, _callerBpsCap);
            assertEq(_defaultBps, wrapper.defaultBps());
            assertEq(_callerBpsCap, wrapper.callerBpsCap());
        }
    }

    /// @dev Test the entire flow of sending tokens from A_EID to B_EID and back.
    function test_epv2_sendOFT(
        uint256 _amountLD,
        uint16 _callerBps,
        uint16 _defaultBps,
        bool _useTokenSpecificBps
    ) public {
        // 1. Assume:
        // * _amountLD won't be so small it will slip (even on the return trip), or too large that it will overflow.
        // * fees are somewhat realistic and at least don't near 100%
        // * token specific bps are enabled randomly in some cases.
        _assumeAmountLD(_amountLD);
        _assumeBps(_callerBps, _defaultBps);
        oftWrapper.setDefaultBps(_defaultBps);
        // Optionally set/use token-specific bps for A_EID -> B_EID transfer.
        uint16 _bps = _useTokenSpecificBps ? _defaultBps + 100 : _defaultBps; // won't overflow due to above assumptions
        if (_useTokenSpecificBps) {
            oftWrapper.setOFTBps(address(adapter.token()), _bps);
        }
        assertEq(0, IERC20(adapter.token()).balanceOf(address(this)));

        // 2. Mint some tokens to sender.
        token.mint(sender, _amountLD);

        // 3. Estimate the fee.
        SendParamEpv2 memory sendParam = SendParamEpv2(
            B_EID, // dstEid
            _addressToBytes32(receiver),
            token.balanceOf(sender),
            0, // zero to avoid SlippageExceeded
            // bytes memory _options, uint128 _gas, uint128 _value
            OptionsBuilder.newOptions().addExecutorLzReceiveOption(200_000, 0),
            "",
            ""
        );
        IOFTWrapper.FeeObj memory feeObj = _createFeeObj(_callerBps, caller, bytes2(0x0034));

        MessagingFeeEpv2 memory fee = oftWrapper.estimateSendFeeEpv2(address(adapter), sendParam, false, feeObj);

        // 4. Send the tokens from sender on A_EID to receiver on B_EID.
        vm.startPrank(sender);
        IERC20(token).approve(address(oftWrapper), _amountLD);
        oftWrapper.sendOFTAdapterEpv2{ value: fee.nativeFee }(address(adapter), sendParam, fee, refundAddress, feeObj);
        vm.stopPrank();
        verifyAndExecutePackets();

        // 5. Assert expected balance changes.
        uint256 _expectedReceiverBalanceLD = _removeDust(
            (_amountLD - (_amountLD * (_callerBps + _bps)) / oftWrapper.BPS_DENOMINATOR()),
            adapter
        );
        assertEq(_expectedReceiverBalanceLD, IERC20(oft).balanceOf(receiver)); // ensure receiver receives de-dusted amount

        uint256 _expectedCallerBalanceLD = (_amountLD * _callerBps) / oftWrapper.BPS_DENOMINATOR();
        assertEq(_expectedCallerBalanceLD, IERC20(adapter.token()).balanceOf(caller)); // ensure caller receives the appropriate fee

        assertEq(
            _amountLD - _expectedReceiverBalanceLD - _expectedCallerBalanceLD,
            IERC20(adapter.token()).balanceOf(address(oftWrapper))
        );

        assertEq(0, IERC20(adapter.token()).balanceOf(sender));

        // 6. Assert that the OFTAdapter allowance is reset after the call.
        assertEq(0, IERC20(token).allowance(address(oftWrapper), address(oftWrapper)));

        // 7. Complete the return trip from B_EID to A_EID.  This time, use default bps.
        address newReceiver = makeAddr("new_A_EID_receiver");
        sendParam = SendParamEpv2(
            A_EID, // dstEid
            _addressToBytes32(newReceiver),
            IERC20(oft).balanceOf(receiver),
            0, // zero to avoid SlippageExceeded
            OptionsBuilder.newOptions().addExecutorLzReceiveOption(200_000, 0),
            "",
            ""
        );
        fee = oftWrapper.estimateSendFeeEpv2(address(oft), sendParam, false, feeObj);
        vm.deal(receiver, 1 ether);

        uint256 receiverBalance = IERC20(oft).balanceOf(receiver);
        vm.startPrank(receiver);
        IERC20(oft).approve(address(oftWrapper), IERC20(oft).balanceOf(receiver));
        oftWrapper.sendOFTEpv2{ value: fee.nativeFee }(address(oft), sendParam, fee, refundAddress, feeObj);
        vm.stopPrank();
        verifyAndExecutePackets();

        // 8. Assert expected balance changes.
        assertLt(IERC20(oft).balanceOf(receiver), receiverBalance); // ensure receiver sent something
        assertGt(token.balanceOf(newReceiver), 0); // ensure newReceiver got something back.
    }

    function _createFeeObj(
        uint16 _callerBps,
        address _caller,
        bytes2 _partnerId
    ) internal pure returns (IOFTWrapper.FeeObj memory feeObj) {
        feeObj = IOFTWrapper.FeeObj({ callerBps: _callerBps, caller: _caller, partnerId: _partnerId });
    }

    function _assumeAmountLD(uint256 _amountLD) internal pure {
        vm.assume(_amountLD >= 1e16 && _amountLD <= type(uint64).max);
    }

    function _assumeBps(uint16 _callerBps, uint16 _defaultBps) internal view {
        vm.assume(_callerBps + uint256(_defaultBps) < oftWrapper.BPS_DENOMINATOR() - 1000);
        vm.assume(_callerBps <= oftWrapper.callerBpsCap());
    }

    function _removeDust(uint256 _amount, MockOFTAdapter _adapter) internal view returns (uint256) {
        uint256 decimalConversionRate = _adapter.decimalConversionRate();
        return (_amount / decimalConversionRate) * decimalConversionRate;
    }

    function _addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    function _assumeBpsSetup(
        uint16 _defaultBps,
        uint16 _callerBps,
        uint16 _customBps,
        uint256 _bpsDenom
    ) internal view {
        vm.assume(_defaultBps < _bpsDenom);
        vm.assume(_callerBps < _bpsDenom && _callerBps <= oftWrapper.callerBpsCap());
        vm.assume(_customBps < _bpsDenom);
        if (_customBps == 0) {
            vm.assume(_defaultBps + uint256(_callerBps) < _bpsDenom);
        } else {
            vm.assume(_customBps + uint256(_callerBps) < _bpsDenom);
        }
    }

    /// @dev EndpointV1 ProxyOFTv1
    function test_estimateSendFee_proxy(
        uint64 _amountLD,
        uint16 _defaultBps,
        uint16 _callerBps,
        uint16 _customBps,
        address _caller,
        bytes2 _partnerId
    ) public {
        // 1. Assume that all bps values are within bounds, and resulting sums will be in bounds (i.e., < 10_000).
        _assumeBpsSetup(_defaultBps, _callerBps, _customBps, oftWrapper.BPS_DENOMINATOR());

        address endpoint = makeAddr("EndpointV1Mock");
        OFTv1ProxyMock proxy = new OFTv1ProxyMock(endpoint, address(token));

        oftWrapper.setDefaultBps(_defaultBps);
        oftWrapper.setOFTBps(proxy.token(), _customBps);

        // 2. Set up a contrived adapter where the nativeFee is dynamic and set to amount.
        (uint256 nativeFee, uint256 zroFee) = oftWrapper.estimateSendFee(
            address(proxy),
            uint16(B_EID), // @dev trick into thinking it is EndpointV1...
            "",
            _amountLD,
            false,
            "",
            _createFeeObj(_callerBps, _caller, _partnerId)
        );

        // 3. Assert that the fee is as expected.
        (uint256 expectedAmount, , ) = oftWrapper.getAmountAndFees(address(token), _amountLD, _callerBps);
        assertEq(expectedAmount, nativeFee);
        assertEq(0, zroFee);
    }

    /// @dev EndpointV1 OFTv1
    function test_estimateSendFee_oft(
        uint64 _amountLD,
        uint16 _defaultBps,
        uint16 _callerBps,
        uint16 _customBps,
        address _caller,
        bytes2 _partnerId
    ) public {
        // 1. Assume that all bps values are within bounds, and resulting sums will be in bounds (i.e., < 10_000).
        _assumeBpsSetup(_defaultBps, _callerBps, _customBps, oftWrapper.BPS_DENOMINATOR());

        address endpoint = makeAddr("EndpointV1Mock");
        OFTv1Mock mock = new OFTv1Mock(OFT_NAME, OFT_SYMBOL, endpoint);

        oftWrapper.setDefaultBps(_defaultBps);
        oftWrapper.setOFTBps(mock.token(), _customBps);

        // 2. Set up a contrived adapter where the nativeFee is dynamic and set to amount.
        (uint256 nativeFee, uint256 zroFee) = oftWrapper.estimateSendFee(
            address(mock),
            uint16(B_EID), // @dev trick into thinking it is EndpointV1...
            "",
            _amountLD,
            false,
            "",
            _createFeeObj(_callerBps, _caller, _partnerId)
        );

        // 3. Assert that the fee is as expected.
        (uint256 expectedAmount, , ) = oftWrapper.getAmountAndFees(address(mock), _amountLD, _callerBps);
        assertEq(expectedAmount, nativeFee);
        assertEq(0, zroFee);
    }

    /// @dev EndpointV1 ProxyOFTv2
    function test_estimateSendFeeV2_proxy(
        uint64 _amountLD,
        bytes32 _to,
        uint16 _defaultBps,
        uint16 _callerBps,
        uint16 _customBps,
        address _caller,
        bytes2 _partnerId
    ) public {
        // 1. Assume that all bps values are within bounds, and resulting sums will be in bounds (i.e., < 10_000).
        _assumeBpsSetup(_defaultBps, _callerBps, _customBps, oftWrapper.BPS_DENOMINATOR());

        address endpoint = makeAddr("EndpointV1Mock");
        OFTv2ProxyMock proxy = new OFTv2ProxyMock(address(token), 6, endpoint);

        oftWrapper.setDefaultBps(_defaultBps);
        oftWrapper.setOFTBps(proxy.token(), _customBps);

        // 2. Set up a contrived adapter where the nativeFee is dynamic and set to amount.
        (uint256 nativeFee, uint256 zroFee) = oftWrapper.estimateSendFeeV2(
            address(proxy),
            uint16(B_EID), // @dev trick into thinking it is EndpointV1...
            _to,
            _amountLD,
            false,
            "",
            _createFeeObj(_callerBps, _caller, _partnerId)
        );

        // 3. Assert that the fee is as expected.
        (uint256 expectedAmount, , ) = oftWrapper.getAmountAndFees(address(token), _amountLD, _callerBps);
        assertEq(expectedAmount, nativeFee);
        assertEq(0, zroFee);
    }

    /// @dev EndpointV1 OFTv2
    function test_estimateSendFeeV2_oft(
        uint64 _amountLD,
        bytes32 _to,
        uint16 _defaultBps,
        uint16 _callerBps,
        uint16 _customBps,
        address _caller,
        bytes2 _partnerId
    ) public {
        // 1. Assume that all bps values are within bounds, and resulting sums will be in bounds (i.e., < 10_000).
        _assumeBpsSetup(_defaultBps, _callerBps, _customBps, oftWrapper.BPS_DENOMINATOR());

        address endpoint = makeAddr("EndpointV1Mock");
        OFTv2Mock mock = new OFTv2Mock(OFT_NAME, OFT_SYMBOL, 6, endpoint);

        oftWrapper.setDefaultBps(_defaultBps);
        oftWrapper.setOFTBps(mock.token(), _customBps);

        // 2. Set up a contrived adapter where the nativeFee is dynamic and set to amount.
        (uint256 nativeFee, uint256 zroFee) = oftWrapper.estimateSendFeeV2(
            address(mock),
            uint16(B_EID), // @dev trick into thinking it is EndpointV1...
            _to,
            _amountLD,
            false,
            "",
            _createFeeObj(_callerBps, _caller, _partnerId)
        );

        // 3. Assert that the fee is as expected.
        (uint256 expectedAmount, , ) = oftWrapper.getAmountAndFees(address(mock), _amountLD, _callerBps);
        assertEq(expectedAmount, nativeFee);
        assertEq(0, zroFee);
    }

    function test_estimateSendFeeEpv2_adapter(
        uint64 _amountLD,
        uint16 _defaultBps,
        uint16 _callerBps,
        uint16 _customBps,
        address _caller,
        bytes2 _partnerId
    ) public {
        // 1. Assume that all bps values are within bounds, and resulting sums will be in bounds (i.e., < 10_000).
        _assumeBpsSetup(_defaultBps, _callerBps, _customBps, oftWrapper.BPS_DENOMINATOR());

        // 2. Set up a contrived adapter where the nativeFee is dynamic and set to amount.
        CustomQuoteSendMockOFTAdapter customAdapter = new CustomQuoteSendMockOFTAdapter(
            address(token),
            endpoints[A_EID],
            address(this)
        );
        token.mint(sender, _amountLD);

        // 3. Set up the OFTWrapper with the default bps and the adapter token-specific bps.
        oftWrapper.setDefaultBps(_defaultBps);
        oftWrapper.setOFTBps(address(token), _customBps);
        IOFTWrapper.FeeObj memory feeObj = _createFeeObj(_callerBps, _caller, _partnerId);
        SendParamEpv2 memory sendParam = SendParamEpv2(
            B_EID,
            _addressToBytes32(receiver),
            token.balanceOf(sender),
            0,
            OptionsBuilder.newOptions().addExecutorLzReceiveOption(200_000, 0),
            "",
            ""
        );

        // 4. Estimate the fee.  This should be the same as amount from getAmountAndFees(...)
        MessagingFeeEpv2 memory fee = oftWrapper.estimateSendFeeEpv2(address(customAdapter), sendParam, false, feeObj);

        // 5. Assert that the fee is as expected.
        (uint256 expectedAmount, , ) = oftWrapper.getAmountAndFees(address(token), _amountLD, _callerBps);
        assertEq(expectedAmount, fee.nativeFee); /// @dev in this example, nativeFee is manipulated to be amount
        assertEq(0, fee.lzTokenFee);
    }

    function test_estimateSendFeeEpv2_oft(
        uint64 _amountLD,
        uint16 _defaultBps,
        uint16 _callerBps,
        uint16 _customBps,
        address _caller,
        bytes2 _partnerId
    ) public {
        // 1. Assume that all bps values are within bounds, and resulting sums will be in bounds (i.e., < 10_000).
        _assumeBpsSetup(_defaultBps, _callerBps, _customBps, oftWrapper.BPS_DENOMINATOR());

        // 2. Set up a contrived oft where the nativeFee is dynamic and set to amount.
        CustomQuoteSendMockOFT customOFT = new CustomQuoteSendMockOFT(
            OFT_NAME,
            OFT_SYMBOL,
            endpoints[A_EID],
            address(this)
        );
        customOFT.mint(sender, _amountLD);

        // 3. Set up the OFTWrapper with the default bps and the OFT-specific bps.
        oftWrapper.setDefaultBps(_defaultBps);
        oftWrapper.setOFTBps(address(customOFT), _customBps);
        IOFTWrapper.FeeObj memory feeObj = _createFeeObj(_callerBps, _caller, _partnerId);
        SendParamEpv2 memory sendParam = SendParamEpv2(
            B_EID,
            _addressToBytes32(receiver),
            customOFT.balanceOf(sender),
            0,
            OptionsBuilder.newOptions().addExecutorLzReceiveOption(200_000, 0),
            "",
            ""
        );

        // 4. Estimate the fee.  This should be the same as amount from getAmountAndFees(...)
        MessagingFeeEpv2 memory fee = oftWrapper.estimateSendFeeEpv2(address(customOFT), sendParam, false, feeObj);

        // 5. Assert that the fee is as expected.
        (uint256 expectedAmount, , ) = oftWrapper.getAmountAndFees(address(customOFT), _amountLD, _callerBps);
        assertEq(expectedAmount, fee.nativeFee); /// @dev in this example, nativeFee is manipulated to be amount
        assertEq(0, fee.lzTokenFee);
    }

    function test_setCallerBpsCap(uint256 _callerBpsCap) public {
        if (_callerBpsCap > 10_000) {
            vm.expectRevert(EXCESSIVE_CALLER_BPS_CONFIG_ERROR);
            oftWrapper.setCallerBpsCap(_callerBpsCap);
        } else {
            oftWrapper.setCallerBpsCap(_callerBpsCap);
            assertEq(_callerBpsCap, oftWrapper.callerBpsCap());
        }
    }

    function _assumeThenSetCallerBpsCap(uint256 _callerBps, uint256 _callerBpsCap) public {
        vm.assume(_callerBps > _callerBpsCap && _callerBps < oftWrapper.BPS_DENOMINATOR());
        oftWrapper.setCallerBpsCap(_callerBpsCap);
    }

    function test_sendOFT_ExcessiveCallerBps(
        uint16 _callerBpsCap,
        address _oft,
        uint16 _dstChainId,
        bytes calldata _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams,
        uint16 _callerBps
    ) public {
        _assumeThenSetCallerBpsCap(_callerBps, _callerBpsCap);
        vm.expectRevert(EXCESSIVE_CALLER_BPS_ERROR);
        oftWrapper.sendOFT(
            _oft,
            _dstChainId,
            _toAddress,
            _amount,
            _minAmount,
            _refundAddress,
            _zroPaymentAddress,
            _adapterParams,
            _createFeeObj(_callerBps, address(this), bytes2(0x0034))
        );
    }

    function test_sendProxyOFT_ExcessiveCallerBps(
        uint16 _callerBpsCap,
        address _oft,
        uint16 _dstChainId,
        bytes calldata _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams,
        uint16 _callerBps
    ) public {
        _assumeThenSetCallerBpsCap(_callerBps, _callerBpsCap);
        vm.expectRevert(EXCESSIVE_CALLER_BPS_ERROR);
        oftWrapper.sendProxyOFT(
            _oft,
            _dstChainId,
            _toAddress,
            _amount,
            _minAmount,
            _refundAddress,
            _zroPaymentAddress,
            _adapterParams,
            _createFeeObj(_callerBps, address(this), bytes2(0x0034))
        );
    }

    function test_sendNativeOFT_ExcessiveCallerBps(
        uint16 _callerBpsCap,
        address _oft,
        uint16 _dstChainId,
        bytes calldata _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams,
        uint16 _callerBps
    ) public {
        _assumeThenSetCallerBpsCap(_callerBps, _callerBpsCap);
        vm.expectRevert(EXCESSIVE_CALLER_BPS_ERROR);
        oftWrapper.sendNativeOFT(
            _oft,
            _dstChainId,
            _toAddress,
            _amount,
            _minAmount,
            _refundAddress,
            _zroPaymentAddress,
            _adapterParams,
            _createFeeObj(_callerBps, address(this), bytes2(0x0034))
        );
    }

    function test_sendOFTV2_ExcessiveCallerBps(
        uint16 _callerBpsCap,
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        uint16 _callerBps
    ) public {
        _assumeThenSetCallerBpsCap(_callerBps, _callerBpsCap);
        vm.expectRevert(EXCESSIVE_CALLER_BPS_ERROR);
        oftWrapper.sendOFTV2(
            _oft,
            _dstChainId,
            _toAddress,
            _amount,
            _minAmount,
            ICommonOFT.LzCallParams(payable(address(this)), address(this), ""),
            _createFeeObj(_callerBps, address(this), bytes2(0x0034))
        );
    }

    function test_sendOFTFeeV2_ExcessiveCallerBps(
        uint16 _callerBpsCap,
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        uint16 _callerBps
    ) public {
        _assumeThenSetCallerBpsCap(_callerBps, _callerBpsCap);
        vm.expectRevert(EXCESSIVE_CALLER_BPS_ERROR);
        oftWrapper.sendOFTFeeV2(
            _oft,
            _dstChainId,
            _toAddress,
            _amount,
            _minAmount,
            ICommonOFT.LzCallParams(payable(address(this)), address(this), ""),
            _createFeeObj(_callerBps, address(this), bytes2(0x0034))
        );
    }

    function test_sendProxyOFTV2_ExcessiveCallerBps(
        uint16 _callerBpsCap,
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        uint16 _callerBps
    ) public {
        _assumeThenSetCallerBpsCap(_callerBps, _callerBpsCap);
        vm.expectRevert(EXCESSIVE_CALLER_BPS_ERROR);
        oftWrapper.sendProxyOFTV2(
            _oft,
            _dstChainId,
            _toAddress,
            _amount,
            _minAmount,
            ICommonOFT.LzCallParams(payable(address(this)), address(this), ""),
            _createFeeObj(_callerBps, address(this), bytes2(0x0034))
        );
    }

    function test_sendProxyOFTFeeV2_ExcessiveCallerBps(
        uint16 _callerBpsCap,
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        uint16 _callerBps
    ) public {
        _assumeThenSetCallerBpsCap(_callerBps, _callerBpsCap);
        vm.expectRevert(EXCESSIVE_CALLER_BPS_ERROR);
        oftWrapper.sendProxyOFTFeeV2(
            _oft,
            _dstChainId,
            _toAddress,
            _amount,
            _minAmount,
            ICommonOFT.LzCallParams(payable(address(this)), address(this), ""),
            _createFeeObj(_callerBps, address(this), bytes2(0x0034))
        );
    }

    function test_sendNativeOFTFeeV2_ExcessiveCallerBps(
        uint16 _callerBpsCap,
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        uint16 _callerBps
    ) public {
        _assumeThenSetCallerBpsCap(_callerBps, _callerBpsCap);
        vm.expectRevert(EXCESSIVE_CALLER_BPS_ERROR);
        oftWrapper.sendNativeOFTFeeV2(
            _oft,
            _dstChainId,
            _toAddress,
            _amount,
            _minAmount,
            ICommonOFT.LzCallParams(payable(address(this)), address(this), ""),
            _createFeeObj(_callerBps, address(this), bytes2(0x0034))
        );
    }

    function test_sendOFTEpv2_ExcessiveCallerBps(
        uint16 _callerBpsCap,
        address _oft,
        address _refundAddress,
        uint16 _callerBps
    ) public {
        _assumeThenSetCallerBpsCap(_callerBps, _callerBpsCap);

        SendParamEpv2 memory _sendParam = SendParamEpv2(
            B_EID,
            _addressToBytes32(receiver),
            IERC20(oft).balanceOf(receiver),
            0,
            OptionsBuilder.newOptions().addExecutorLzReceiveOption(200_000, 0),
            "",
            ""
        );
        vm.expectRevert(EXCESSIVE_CALLER_BPS_ERROR);
        oftWrapper.sendOFTEpv2(
            _oft,
            _sendParam,
            MessagingFeeEpv2(100_000, 0),
            _refundAddress,
            _createFeeObj(_callerBps, address(this), bytes2(0x0034))
        );
    }

    function test_sendOFTAdapterEpv2_ExcessiveCallerBps(
        uint16 _callerBpsCap,
        address _oft,
        address _refundAddress,
        uint16 _callerBps
    ) public {
        _assumeThenSetCallerBpsCap(_callerBps, _callerBpsCap);
        SendParamEpv2 memory _sendParam = SendParamEpv2(
            B_EID,
            _addressToBytes32(receiver),
            IERC20(oft).balanceOf(receiver),
            0,
            OptionsBuilder.newOptions().addExecutorLzReceiveOption(200_000, 0),
            "",
            ""
        );
        vm.expectRevert(EXCESSIVE_CALLER_BPS_ERROR);
        oftWrapper.sendOFTEpv2(
            _oft,
            _sendParam,
            MessagingFeeEpv2(100_000, 0),
            _refundAddress,
            _createFeeObj(_callerBps, address(this), bytes2(0x0034))
        );
    }

    function test_getAmountAndFees_ExcessiveCallerBps(uint16 _callerBpsCap, uint256 _amount, uint16 _callerBps) public {
        _assumeThenSetCallerBpsCap(_callerBps, _callerBpsCap);
        vm.expectRevert(EXCESSIVE_CALLER_BPS_ERROR);
        oftWrapper.getAmountAndFees(address(this), _amount, _callerBps);
    }

    function test_estimateSendFee_ExcessiveCallerBps(uint256 _callerBpsCap, uint256 _amount, uint16 _callerBps) public {
        _assumeThenSetCallerBpsCap(_callerBps, _callerBpsCap);
        vm.expectRevert(EXCESSIVE_CALLER_BPS_ERROR);
        oftWrapper.estimateSendFee(
            address(this),
            1,
            "",
            _amount,
            false,
            "",
            _createFeeObj(_callerBps, address(this), bytes2(0x0034))
        );
    }

    function test_estimateSendFeeV2_ExcessiveCallerBps(
        uint256 _callerBpsCap,
        uint256 _amount,
        uint16 _callerBps
    ) public {
        _assumeThenSetCallerBpsCap(_callerBps, _callerBpsCap);
        vm.expectRevert(EXCESSIVE_CALLER_BPS_ERROR);
        oftWrapper.estimateSendFeeV2(
            address(this),
            1,
            "",
            _amount,
            false,
            "",
            _createFeeObj(_callerBps, address(this), bytes2(0x0034))
        );
    }

    function test_estimateSendFeeEpv2_ExcessiveCallerBps(
        uint256 _callerBpsCap,
        uint256 _amount,
        uint16 _callerBps
    ) public {
        _assumeThenSetCallerBpsCap(_callerBps, _callerBpsCap);
        vm.expectRevert(EXCESSIVE_CALLER_BPS_ERROR);
        oftWrapper.estimateSendFeeEpv2(
            address(this),
            SendParamEpv2(1, "", _amount, 0, OptionsBuilder.newOptions(), "", ""),
            false,
            _createFeeObj(_callerBps, address(this), bytes2(0x0034))
        );
    }

    function test_removeDust_NoDust() public {
        uint256 amount = 1 ether;
        uint256 localDecimals = LOCAL_DECIMALS;
        uint256 sharedDecimals = SHARED_DECIMALS;

        (uint256 amountAfter, uint256 dust) = mockOftWrapper.exposed_removeDust(amount, localDecimals, sharedDecimals);

        assertEq(amountAfter, 1 ether, "Amount should remain unchanged when no dust");
        assertEq(dust, 0, "Dust should be zero when no dust");
    }

    function test_removeDust_WithDust() public {
        uint256 amount = 1000000000000000001;
        uint256 localDecimals = LOCAL_DECIMALS;
        uint256 sharedDecimals = SHARED_DECIMALS;

        (uint256 amountAfter, uint256 dust) = mockOftWrapper.exposed_removeDust(amount, localDecimals, sharedDecimals);

        assertEq(amountAfter, 1 ether, "Amount should be rounded down to nearest whole unit");
        assertEq(dust, 1, "Dust should be 1 wei");
    }

    function test_removeDust_DifferentDecimals() public {
        uint256 amount = 123456789123456789;
        uint256 localDecimals = LOCAL_DECIMALS;
        uint256 sharedDecimals = SHARED_DECIMALS + 3;

        (uint256 amountAfter, uint256 dust) = mockOftWrapper.exposed_removeDust(amount, localDecimals, sharedDecimals);

        assertEq(
            amountAfter,
            123456789000000000,
            "Amount should be rounded down to SHARED_DECIMALS + 3 decimal places"
        );
        assertEq(dust, 123456789, "Dust should be the remainder");
    }

    function testQuote_OFTEpV2_BasicScenario() public {
        CustomQuoteOFTMockOFT oft = new CustomQuoteOFTMockOFT(OFT_NAME, OFT_SYMBOL, endpoints[B_EID], address(this));

        IOFTWrapper.QuoteInput memory input = IOFTWrapper.QuoteInput({
            version: IOFTWrapper.OFTVersion.Epv2OFT,
            token: address(oft),
            dstEid: uint16(B_EID),
            amountLD: INITIAL_AMOUNT,
            minAmountLD: MIN_AMOUNT,
            toAddress: _addressToBytes32(receiver),
            extraOptions: bytes("")
        });
        IOFTWrapper.FeeObj memory feeObj = IOFTWrapper.FeeObj({
            callerBps: CALLER_BPS,
            caller: address(0),
            partnerId: bytes2(0)
        });

        uint256 expectedWrapperFee = (input.amountLD * DEFAULT_BPS) / BPS_DENOMINATOR;
        uint256 expectedCallerFee = (input.amountLD * feeObj.callerBps) / BPS_DENOMINATOR;
        uint256 amountAfterWrapperFees = input.amountLD - expectedWrapperFee - expectedCallerFee;
        uint256 mockAmountSentLD = amountAfterWrapperFees;
        uint256 mockAmountReceivedLD = (amountAfterWrapperFees / DECIMAL_CONVERSION_RATE) * DECIMAL_CONVERSION_RATE;
        uint256 expectedSrcAmount = mockAmountSentLD + expectedWrapperFee + expectedCallerFee;

        oft.setQuoteOFTReturnValues(
            OFTReceipt({ amountSentLD: mockAmountSentLD, amountReceivedLD: mockAmountReceivedLD }),
            new OFTFeeDetail[](0),
            OFTLimit({ minAmountLD: MOCK_MIN_AMOUNT_LD, maxAmountLD: MOCK_MAX_AMOUNT_LD })
        );
        oft.setQuoteSendReturnValue(MessagingFeeEpv2({ nativeFee: MOCK_NATIVE_FEE, lzTokenFee: 0 }));

        IOFTWrapper.QuoteResult memory quoteResult = oftWrapper.quote(input, feeObj);

        IOFTWrapper.QuoteFee[] memory expectedFees = new IOFTWrapper.QuoteFee[](3);
        expectedFees[0] = IOFTWrapper.QuoteFee({
            fee: WRAPPER_FEE_NAME,
            amount: int256(expectedWrapperFee),
            token: input.token
        });
        expectedFees[1] = IOFTWrapper.QuoteFee({
            fee: CALLER_FEE_NAME,
            amount: int256(expectedCallerFee),
            token: input.token
        });
        expectedFees[2] = IOFTWrapper.QuoteFee({
            fee: NATIVE_FEE_NAME,
            amount: int256(MOCK_NATIVE_FEE),
            token: input.token
        });

        assertFees(quoteResult, expectedFees);

        assertEq(quoteResult.srcAmountMax, MOCK_MAX_AMOUNT_LD);
        assertEq(quoteResult.srcAmountMin, MOCK_MIN_AMOUNT_LD);
        assertEq(quoteResult.amountReceivedLD, mockAmountReceivedLD);
        assertEq(quoteResult.srcAmount, expectedSrcAmount);
        assertGt(quoteResult.confirmations, 0);
    }

    function testQuote_OFTEpV2_WithNativeDrop() public {
        CustomQuoteOFTMockOFT oft = new CustomQuoteOFTMockOFT(OFT_NAME, OFT_SYMBOL, endpoints[B_EID], address(this));
        uint128 nativeDropAmount = 500;

        bytes memory options = OptionsBuilder.newOptions().addExecutorNativeDropOption(
            uint128(nativeDropAmount),
            _addressToBytes32(receiver)
        );
        IOFTWrapper.QuoteInput memory input = IOFTWrapper.QuoteInput({
            version: IOFTWrapper.OFTVersion.Epv2OFT,
            token: address(oft),
            dstEid: uint16(B_EID),
            amountLD: INITIAL_AMOUNT,
            minAmountLD: MIN_AMOUNT,
            toAddress: _addressToBytes32(receiver),
            extraOptions: options
        });

        IOFTWrapper.FeeObj memory feeObj = IOFTWrapper.FeeObj({
            callerBps: CALLER_BPS,
            caller: address(this),
            partnerId: bytes2(0)
        });

        uint256 expectedWrapperFee = (input.amountLD * DEFAULT_BPS) / BPS_DENOMINATOR;
        uint256 expectedCallerFee = (input.amountLD * feeObj.callerBps) / BPS_DENOMINATOR;
        uint256 amountAfterWrapperFees = input.amountLD - expectedWrapperFee - expectedCallerFee;
        uint256 mockAmountSentLD = amountAfterWrapperFees;
        uint256 mockAmountReceivedLD = (input.amountLD / DECIMAL_CONVERSION_RATE) * DECIMAL_CONVERSION_RATE;
        uint256 expectedSrcAmount = mockAmountSentLD + expectedWrapperFee + expectedCallerFee;

        oft.setQuoteOFTReturnValues(
            OFTReceipt({ amountSentLD: mockAmountSentLD, amountReceivedLD: mockAmountReceivedLD }),
            new OFTFeeDetail[](0),
            OFTLimit({ minAmountLD: MOCK_MIN_AMOUNT_LD, maxAmountLD: MOCK_MAX_AMOUNT_LD })
        );

        oft.setQuoteSendReturnValue(MessagingFeeEpv2({ nativeFee: MOCK_NATIVE_FEE, lzTokenFee: 0 }));

        SendParamEpv2 memory sendParam = SendParamEpv2({
            dstEid: input.dstEid,
            to: input.toAddress,
            amountLD: mockAmountSentLD,
            minAmountLD: input.minAmountLD,
            extraOptions: options,
            composeMsg: bytes(""),
            oftCmd: bytes("")
        });

        // Check that call to quoteSend with native drop is made
        vm.expectCall(address(oft), abi.encodeWithSelector(oft.quoteSend.selector, sendParam, false));

        IOFTWrapper.QuoteResult memory quoteResult = oftWrapper.quote(input, feeObj);

        IOFTWrapper.QuoteFee[] memory expectedFees = new IOFTWrapper.QuoteFee[](3);
        expectedFees[0] = IOFTWrapper.QuoteFee({
            fee: WRAPPER_FEE_NAME,
            amount: int256(expectedWrapperFee),
            token: input.token
        });
        expectedFees[1] = IOFTWrapper.QuoteFee({
            fee: CALLER_FEE_NAME,
            amount: int256(expectedCallerFee),
            token: input.token
        });
        expectedFees[2] = IOFTWrapper.QuoteFee({
            fee: NATIVE_FEE_NAME,
            amount: int256(MOCK_NATIVE_FEE),
            token: input.token
        });

        assertFees(quoteResult, expectedFees);

        assertEq(quoteResult.srcAmountMax, MOCK_MAX_AMOUNT_LD);
        assertEq(quoteResult.srcAmountMin, MOCK_MIN_AMOUNT_LD);
        assertEq(quoteResult.amountReceivedLD, mockAmountReceivedLD);
        assertEq(quoteResult.srcAmount, expectedSrcAmount);
        assertGt(quoteResult.confirmations, 0);
    }

    function testQuote_OFTEpV2_WithFeeDetails() public {
        CustomQuoteOFTMockOFT oft = new CustomQuoteOFTMockOFT(OFT_NAME, OFT_SYMBOL, endpoints[B_EID], address(this));

        IOFTWrapper.QuoteInput memory input = IOFTWrapper.QuoteInput({
            version: IOFTWrapper.OFTVersion.Epv2OFT,
            token: address(oft),
            dstEid: uint16(B_EID),
            amountLD: INITIAL_AMOUNT,
            minAmountLD: MIN_AMOUNT,
            toAddress: _addressToBytes32(receiver),
            extraOptions: bytes("")
        });

        IOFTWrapper.FeeObj memory feeObj = IOFTWrapper.FeeObj({
            callerBps: CALLER_BPS,
            caller: address(this),
            partnerId: bytes2(0)
        });

        uint256 expectedWrapperFee = (input.amountLD * DEFAULT_BPS) / BPS_DENOMINATOR;
        uint256 expectedCallerFee = (input.amountLD * feeObj.callerBps) / BPS_DENOMINATOR;
        uint256 amountAfterWrapperFees = input.amountLD - expectedWrapperFee - expectedCallerFee;
        uint256 mockAmountSentLD = amountAfterWrapperFees;
        uint256 mockAmountReceivedLD = (input.amountLD / DECIMAL_CONVERSION_RATE) * DECIMAL_CONVERSION_RATE;
        uint256 expectedSrcAmount = mockAmountSentLD + expectedWrapperFee + expectedCallerFee;

        // Setup fee details
        OFTFeeDetail[] memory mockOFTFeeDetails = new OFTFeeDetail[](2);
        mockOFTFeeDetails[0] = OFTFeeDetail({ feeAmountLD: 100, description: "oftFee" });
        mockOFTFeeDetails[1] = OFTFeeDetail({ feeAmountLD: 200, description: "oftFee2" });

        oft.setQuoteOFTReturnValues(
            OFTReceipt({ amountSentLD: mockAmountSentLD, amountReceivedLD: mockAmountReceivedLD }),
            mockOFTFeeDetails,
            OFTLimit({ minAmountLD: MOCK_MIN_AMOUNT_LD, maxAmountLD: MOCK_MAX_AMOUNT_LD })
        );
        oft.setQuoteSendReturnValue(MessagingFeeEpv2({ nativeFee: MOCK_NATIVE_FEE, lzTokenFee: 0 }));

        IOFTWrapper.QuoteResult memory quoteResult = oftWrapper.quote(input, feeObj);

        IOFTWrapper.QuoteFee[] memory expectedFees = new IOFTWrapper.QuoteFee[](5);
        expectedFees[0] = IOFTWrapper.QuoteFee({
            fee: WRAPPER_FEE_NAME,
            amount: int256(expectedWrapperFee),
            token: input.token
        });
        expectedFees[1] = IOFTWrapper.QuoteFee({
            fee: CALLER_FEE_NAME,
            amount: int256(expectedCallerFee),
            token: input.token
        });
        expectedFees[2] = IOFTWrapper.QuoteFee({
            fee: NATIVE_FEE_NAME,
            amount: int256(MOCK_NATIVE_FEE),
            token: input.token
        });
        expectedFees[3] = IOFTWrapper.QuoteFee({
            fee: "oftFee",
            amount: int256(mockOFTFeeDetails[0].feeAmountLD),
            token: input.token
        });
        expectedFees[4] = IOFTWrapper.QuoteFee({
            fee: "oftFee2",
            amount: int256(mockOFTFeeDetails[1].feeAmountLD),
            token: input.token
        });

        assertFees(quoteResult, expectedFees);

        assertEq(quoteResult.srcAmountMax, MOCK_MAX_AMOUNT_LD);
        assertEq(quoteResult.srcAmountMin, MOCK_MIN_AMOUNT_LD);
        assertEq(quoteResult.amountReceivedLD, mockAmountReceivedLD);
        assertEq(quoteResult.srcAmount, expectedSrcAmount);
        assertGt(quoteResult.confirmations, 0);
    }

    function testQuote_OFTEpV2_ReCalculationCase() public {
        CustomQuoteOFTMockOFT oft = new CustomQuoteOFTMockOFT(OFT_NAME, OFT_SYMBOL, endpoints[B_EID], address(this));

        IOFTWrapper.QuoteInput memory input = IOFTWrapper.QuoteInput({
            version: IOFTWrapper.OFTVersion.Epv2OFT,
            token: address(oft),
            dstEid: uint16(B_EID),
            amountLD: INITIAL_AMOUNT,
            minAmountLD: MIN_AMOUNT,
            toAddress: _addressToBytes32(receiver),
            extraOptions: bytes("")
        });
        IOFTWrapper.FeeObj memory feeObj = IOFTWrapper.FeeObj({
            callerBps: CALLER_BPS,
            caller: address(0),
            partnerId: bytes2(0)
        });

        uint256 expectedWrapperFee = (input.amountLD * DEFAULT_BPS) / BPS_DENOMINATOR;
        uint256 expectedCallerFee = (input.amountLD * feeObj.callerBps) / BPS_DENOMINATOR;
        uint256 amountAfterWrapperFees = input.amountLD - expectedWrapperFee - expectedCallerFee;
        uint256 mockAmountSentLD = amountAfterWrapperFees;
        uint256 mockAmountReceivedLD = (amountAfterWrapperFees / DECIMAL_CONVERSION_RATE) * DECIMAL_CONVERSION_RATE;
        uint256 expectedSrcAmount = mockAmountSentLD + expectedWrapperFee + expectedCallerFee;
        uint256 srcAmountMaxToTriggerReCalculation = input.amountLD - 1;

        oft.setQuoteOFTReturnValues(
            OFTReceipt({ amountSentLD: mockAmountSentLD, amountReceivedLD: mockAmountReceivedLD }),
            new OFTFeeDetail[](0),
            // set maxAmountLD to something less than amountLD to trigger the re-calculation
            OFTLimit({ minAmountLD: MOCK_MIN_AMOUNT_LD, maxAmountLD: srcAmountMaxToTriggerReCalculation })
        );
        oft.setQuoteSendReturnValue(MessagingFeeEpv2({ nativeFee: MOCK_NATIVE_FEE, lzTokenFee: 0 }));

        IOFTWrapper.QuoteResult memory quoteResult = oftWrapper.quote(input, feeObj);

        IOFTWrapper.QuoteFee[] memory expectedFees = new IOFTWrapper.QuoteFee[](3);
        expectedFees[0] = IOFTWrapper.QuoteFee({
            fee: WRAPPER_FEE_NAME,
            amount: int256(expectedWrapperFee),
            token: input.token
        });
        expectedFees[1] = IOFTWrapper.QuoteFee({
            fee: CALLER_FEE_NAME,
            amount: int256(expectedCallerFee),
            token: input.token
        });
        expectedFees[2] = IOFTWrapper.QuoteFee({
            fee: NATIVE_FEE_NAME,
            amount: int256(MOCK_NATIVE_FEE),
            token: input.token
        });

        assertFees(quoteResult, expectedFees);

        assertEq(quoteResult.srcAmountMax, srcAmountMaxToTriggerReCalculation, "Source amount max mismatch");
        assertEq(quoteResult.srcAmountMin, MOCK_MIN_AMOUNT_LD, "Source amount min mismatch");
        assertEq(quoteResult.amountReceivedLD, mockAmountReceivedLD, "Amount received mismatch");
        assertEq(quoteResult.srcAmount, expectedSrcAmount, "Source amount mismatch");
        assertGt(quoteResult.confirmations, 0);
    }

    function testQuote_OFTEpV2_Integration_With_SendEpv2() public {
        MockOFT oftMockA = new MockOFT(OFT_NAME, OFT_SYMBOL, endpoints[A_EID], address(this));
        MockOFT oftMockB = new MockOFT(OFT_NAME, OFT_SYMBOL, endpoints[B_EID], address(this));

        oftMockA.setPeer(uint16(B_EID), _addressToBytes32(address(oftMockB)));
        oftMockB.setPeer(uint16(A_EID), _addressToBytes32(address(oftMockA)));

        oftMockA.mint(sender, INITIAL_AMOUNT);

        uint256 senderInitialBalance = oftMockA.balanceOf(sender);
        uint256 receiverInitialBalance = oftMockB.balanceOf(receiver);

        bytes memory options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(200_000, 0);
        IOFTWrapper.QuoteInput memory input = IOFTWrapper.QuoteInput({
            version: IOFTWrapper.OFTVersion.Epv2OFT,
            token: address(oftMockA),
            dstEid: uint16(B_EID),
            amountLD: INITIAL_AMOUNT,
            minAmountLD: MIN_AMOUNT,
            toAddress: _addressToBytes32(receiver),
            extraOptions: options
        });
        IOFTWrapper.FeeObj memory feeObj = IOFTWrapper.FeeObj({
            callerBps: CALLER_BPS,
            caller: address(oftMockA),
            partnerId: bytes2(0)
        });

        IOFTWrapper.QuoteResult memory quoteResult = oftWrapper.quote(input, feeObj);
        IOFTWrapper.QuoteFee memory nativeFee = getQuoteResultFeeWithName(NATIVE_FEE_NAME, quoteResult);

        SendParamEpv2 memory sendParam = SendParamEpv2({
            dstEid: B_EID,
            to: _addressToBytes32(receiver),
            amountLD: quoteResult.srcAmount,
            minAmountLD: quoteResult.srcAmountMin,
            extraOptions: options,
            composeMsg: hex"",
            oftCmd: hex""
        });

        vm.startPrank(sender);
        oftMockA.approve(address(oftWrapper), quoteResult.srcAmount);

        oftWrapper.sendOFTEpv2{ value: uint256(nativeFee.amount) }(
            address(oftMockA),
            sendParam,
            MessagingFeeEpv2({ nativeFee: uint256(nativeFee.amount), lzTokenFee: 0 }),
            address(sender),
            feeObj
        );

        vm.stopPrank();
        verifyAndExecutePackets();

        uint256 receiverFinalBalance = oftMockB.balanceOf(receiver);
        uint256 senderFinalBalance = oftMockA.balanceOf(sender);
        IOFTWrapper.QuoteFee memory wrapperFee = getQuoteResultFeeWithName(WRAPPER_FEE_NAME, quoteResult);
        IOFTWrapper.QuoteFee memory callerFee = getQuoteResultFeeWithName(CALLER_FEE_NAME, quoteResult);

        assertEq(
            senderFinalBalance,
            senderInitialBalance - quoteResult.srcAmount,
            "Sender balance should decrease by srcAmount"
        );
        uint256 expectedReceiverFinalBalance = receiverInitialBalance + quoteResult.amountReceivedLD;
        assertEq(
            receiverFinalBalance,
            expectedReceiverFinalBalance,
            "Receiver balance should increase by amountReceivedLD"
        );
    }

    function testQuote_OFTEpV2_Integration_With_SendEpv2_OFTFeeDetailsCase() public {
        (CustomQuoteOFTMockOFT oftMockA, CustomQuoteOFTMockOFT oftMockB) = setupMocks();

        oftMockA.mint(sender, INITIAL_AMOUNT);
        uint256 senderInitialBalance = oftMockA.balanceOf(sender);
        uint256 receiverInitialBalance = oftMockB.balanceOf(receiver);

        (IOFTWrapper.QuoteInput memory input, IOFTWrapper.FeeObj memory feeObj) = prepareQuoteAndFee(oftMockA);

        uint256 expectedWrapperFee = (input.amountLD * DEFAULT_BPS) / BPS_DENOMINATOR;
        uint256 expectedCallerFee = (input.amountLD * feeObj.callerBps) / BPS_DENOMINATOR;
        uint256 amountAfterWrapperFees = input.amountLD - expectedWrapperFee - expectedCallerFee;

        setupMockReturnValues(amountAfterWrapperFees, input.amountLD, oftMockA);

        IOFTWrapper.QuoteResult memory quoteResult = oftWrapper.quote(input, feeObj);

        IOFTWrapper.QuoteFee memory nativeFee = getQuoteResultFeeWithName(NATIVE_FEE_NAME, quoteResult);

        SendParamEpv2 memory sendParam = prepareSendParam(quoteResult);

        vm.startPrank(sender);
        oftMockA.approve(address(oftWrapper), quoteResult.srcAmount);

        oftWrapper.sendOFTEpv2{ value: uint256(nativeFee.amount) }(
            address(oftMockA),
            sendParam,
            MessagingFeeEpv2({ nativeFee: uint256(nativeFee.amount), lzTokenFee: 0 }),
            address(sender),
            feeObj
        );

        vm.stopPrank();
        verifyAndExecutePackets();

        verifyBalances(senderInitialBalance, receiverInitialBalance, quoteResult, oftMockA, oftMockB);
    }

    function setupMocks() internal returns (CustomQuoteOFTMockOFT, CustomQuoteOFTMockOFT) {
        CustomQuoteOFTMockOFT oftMockA = new CustomQuoteOFTMockOFT(
            OFT_NAME,
            OFT_SYMBOL,
            endpoints[A_EID],
            address(this)
        );
        CustomQuoteOFTMockOFT oftMockB = new CustomQuoteOFTMockOFT(
            OFT_NAME,
            OFT_SYMBOL,
            endpoints[B_EID],
            address(this)
        );

        oftMockA.setPeer(uint16(B_EID), _addressToBytes32(address(oftMockB)));
        oftMockB.setPeer(uint16(A_EID), _addressToBytes32(address(oftMockA)));

        return (oftMockA, oftMockB);
    }

    function prepareQuoteAndFee(
        CustomQuoteOFTMockOFT oftMockA
    ) internal view returns (IOFTWrapper.QuoteInput memory, IOFTWrapper.FeeObj memory) {
        IOFTWrapper.QuoteInput memory input = IOFTWrapper.QuoteInput({
            version: IOFTWrapper.OFTVersion.Epv2OFT,
            token: address(oftMockA),
            dstEid: uint16(B_EID),
            amountLD: INITIAL_AMOUNT,
            minAmountLD: MIN_AMOUNT,
            toAddress: _addressToBytes32(receiver),
            extraOptions: bytes("")
        });

        IOFTWrapper.FeeObj memory feeObj = IOFTWrapper.FeeObj({
            callerBps: CALLER_BPS,
            caller: address(oftMockA),
            partnerId: bytes2(0)
        });

        return (input, feeObj);
    }

    function setupMockReturnValues(
        uint256 amountAfterWrapperFees,
        uint256 amountLD,
        CustomQuoteOFTMockOFT oftMockA
    ) internal {
        OFTFeeDetail[] memory oftFeeDetails = new OFTFeeDetail[](2);
        oftFeeDetails[0] = OFTFeeDetail({ feeAmountLD: 100, description: "oftFee" });
        oftFeeDetails[1] = OFTFeeDetail({ feeAmountLD: 200, description: "oftFee2" });

        (uint256 mockAmountReceivedLD, ) = mockOftWrapper.exposed_removeDust(
            amountAfterWrapperFees - uint256(oftFeeDetails[0].feeAmountLD) - uint256(oftFeeDetails[1].feeAmountLD),
            LOCAL_DECIMALS,
            SHARED_DECIMALS
        );
        uint256 mockAmountSentLD = amountAfterWrapperFees -
            uint256(oftFeeDetails[0].feeAmountLD) -
            uint256(oftFeeDetails[1].feeAmountLD);

        oftMockA.setQuoteOFTReturnValues(
            OFTReceipt({ amountSentLD: mockAmountSentLD, amountReceivedLD: mockAmountReceivedLD }),
            oftFeeDetails,
            OFTLimit({ minAmountLD: MOCK_MIN_AMOUNT_LD, maxAmountLD: MOCK_MAX_AMOUNT_LD })
        );
        oftMockA.setQuoteSendReturnValue(MessagingFeeEpv2({ nativeFee: MOCK_NATIVE_FEE, lzTokenFee: 0 }));
    }

    function prepareSendParam(IOFTWrapper.QuoteResult memory quoteResult) internal view returns (SendParamEpv2 memory) {
        bytes memory options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(200_000, 0);
        return
            SendParamEpv2({
                dstEid: B_EID,
                to: _addressToBytes32(receiver),
                amountLD: quoteResult.srcAmount,
                minAmountLD: quoteResult.srcAmountMin,
                extraOptions: options,
                composeMsg: hex"",
                oftCmd: hex""
            });
    }

    function verifyBalances(
        uint256 senderInitialBalance,
        uint256 receiverInitialBalance,
        IOFTWrapper.QuoteResult memory quoteResult,
        CustomQuoteOFTMockOFT oftMockA,
        CustomQuoteOFTMockOFT oftMockB
    ) internal {
        uint256 receiverFinalBalance = oftMockB.balanceOf(receiver);
        uint256 senderFinalBalance = oftMockA.balanceOf(sender);

        assertEq(
            senderFinalBalance,
            senderInitialBalance - quoteResult.srcAmount,
            "Sender balance should decrease by srcAmount"
        );
        assertEq(
            receiverFinalBalance,
            receiverInitialBalance + quoteResult.amountReceivedLD,
            "Receiver balance should increase by amountReceivedLD"
        );
    }

    function testQuote_Epv1FeeOFTv2_BasicScenario() public {
        MockLayerZeroEndpoint mockEndpoint = new MockLayerZeroEndpoint();
        OFTWithFee oftWithFeeMock = new OFTWithFeeMock(OFT_NAME, OFT_SYMBOL, SHARED_DECIMALS, address(mockEndpoint));
        uint16 specificFeeBp = 50;
        oftWithFeeMock.setFeeBp(uint16(B_EID), true, specificFeeBp);

        IOFTWrapper.QuoteInput memory input = IOFTWrapper.QuoteInput({
            version: IOFTWrapper.OFTVersion.Epv1FeeOFTv2,
            token: address(oftWithFeeMock),
            dstEid: uint16(B_EID),
            amountLD: INITIAL_AMOUNT,
            minAmountLD: MIN_AMOUNT,
            toAddress: _addressToBytes32(receiver),
            extraOptions: bytes("")
        });
        IOFTWrapper.FeeObj memory feeObj = IOFTWrapper.FeeObj({
            callerBps: CALLER_BPS,
            caller: address(0),
            partnerId: bytes2(0)
        });

        uint256 expectedWrapperFee = (input.amountLD * DEFAULT_BPS) / BPS_DENOMINATOR;
        uint256 expectedCallerFee = (input.amountLD * feeObj.callerBps) / BPS_DENOMINATOR;
        uint256 amountAfterWrapperFees = input.amountLD - expectedWrapperFee - expectedCallerFee;
        uint256 expectedOFTFee = (uint(amountAfterWrapperFees) * uint16(specificFeeBp)) / uint(BPS_DENOMINATOR);
        uint256 amountAfterWrapperAndOftFee = amountAfterWrapperFees - expectedOFTFee;
        (uint256 expectedAmountReceivedLD, ) = mockOftWrapper.exposed_removeDust(
            amountAfterWrapperAndOftFee,
            IERC20Metadata(address(oftWithFeeMock)).decimals(),
            OFTCoreV2(address(oftWithFeeMock)).sharedDecimals()
        );
        (uint256 expectedSrcAmountMax, ) = mockOftWrapper.exposed_removeDust(
            uint256(type(uint256).max),
            IERC20Metadata(address(oftWithFeeMock)).decimals(),
            OFTCoreV2(address(oftWithFeeMock)).sharedDecimals()
        );
        uint256 expectedSrcAmount = expectedAmountReceivedLD + expectedWrapperFee + expectedCallerFee + expectedOFTFee;
        uint256 expectedNativeFee = expectedSrcAmount - expectedCallerFee - expectedWrapperFee - expectedOFTFee;

        IOFTWrapper.QuoteResult memory quoteResult = oftWrapper.quote(input, feeObj);

        IOFTWrapper.QuoteFee[] memory expectedFees = new IOFTWrapper.QuoteFee[](3);
        expectedFees[0] = IOFTWrapper.QuoteFee({
            fee: WRAPPER_FEE_NAME,
            amount: int256(expectedWrapperFee),
            token: input.token
        });
        expectedFees[1] = IOFTWrapper.QuoteFee({
            fee: CALLER_FEE_NAME,
            amount: int256(expectedCallerFee),
            token: input.token
        });
        expectedFees[2] = IOFTWrapper.QuoteFee({
            fee: NATIVE_FEE_NAME,
            amount: int256(expectedNativeFee),
            token: input.token
        });

        assertFees(quoteResult, expectedFees);

        assertEq(quoteResult.amountReceivedLD, expectedAmountReceivedLD, "Amount received mismatch");
        assertEq(quoteResult.srcAmountMax, expectedSrcAmountMax, "Source amount max mismatch");
        assertEq(quoteResult.srcAmountMin, 0, "Source amount min mismatch");
        assertEq(quoteResult.srcAmount, expectedSrcAmount, "Source amount mismatch");
        assertEq(quoteResult.confirmations, 2, "Confirmations mismatch");
    }

    function testQuote_Epv1OFTv2_BasicScenario() public {
        MockLayerZeroEndpoint mockEndpoint = new MockLayerZeroEndpoint();
        OFTv2Mock oftMock = new OFTv2Mock(OFT_NAME, OFT_SYMBOL, SHARED_DECIMALS, address(mockEndpoint));

        IOFTWrapper.QuoteInput memory input = IOFTWrapper.QuoteInput({
            version: IOFTWrapper.OFTVersion.Epv1OFTv2,
            token: address(oftMock),
            dstEid: uint16(B_EID),
            amountLD: INITIAL_AMOUNT,
            minAmountLD: MIN_AMOUNT,
            toAddress: _addressToBytes32(receiver),
            extraOptions: bytes("")
        });
        IOFTWrapper.FeeObj memory feeObj = IOFTWrapper.FeeObj({
            callerBps: CALLER_BPS,
            caller: address(0),
            partnerId: bytes2(0)
        });

        uint256 expectedWrapperFee = (input.amountLD * DEFAULT_BPS) / BPS_DENOMINATOR;
        uint256 expectedCallerFee = (input.amountLD * feeObj.callerBps) / BPS_DENOMINATOR;
        uint256 amountAfterWrapperFees = input.amountLD - expectedWrapperFee - expectedCallerFee;
        (uint256 expectedAmountReceivedLD, ) = mockOftWrapper.exposed_removeDust(
            amountAfterWrapperFees,
            IERC20Metadata(address(oftMock)).decimals(),
            OFTCoreV2(address(oftMock)).sharedDecimals()
        );
        (uint256 expectedSrcAmountMax, ) = mockOftWrapper.exposed_removeDust(
            uint256(type(uint256).max),
            IERC20Metadata(address(oftMock)).decimals(),
            OFTCoreV2(address(oftMock)).sharedDecimals()
        );
        uint256 expectedSrcAmount = expectedAmountReceivedLD + expectedWrapperFee + expectedCallerFee;
        uint256 expectedNativeFee = expectedSrcAmount - expectedCallerFee - expectedWrapperFee;

        IOFTWrapper.QuoteResult memory quoteResult = oftWrapper.quote(input, feeObj);

        IOFTWrapper.QuoteFee[] memory expectedFees = new IOFTWrapper.QuoteFee[](3);
        expectedFees[0] = IOFTWrapper.QuoteFee({
            fee: WRAPPER_FEE_NAME,
            amount: int256(expectedWrapperFee),
            token: input.token
        });
        expectedFees[1] = IOFTWrapper.QuoteFee({
            fee: CALLER_FEE_NAME,
            amount: int256(expectedCallerFee),
            token: input.token
        });
        expectedFees[2] = IOFTWrapper.QuoteFee({
            fee: NATIVE_FEE_NAME,
            amount: int256(expectedNativeFee),
            token: input.token
        });

        assertFees(quoteResult, expectedFees);

        assertEq(quoteResult.amountReceivedLD, expectedAmountReceivedLD, "Amount received mismatch");
        assertEq(quoteResult.srcAmountMax, expectedSrcAmountMax, "Source amount max mismatch");
        assertEq(quoteResult.srcAmountMin, 0, "Source amount min mismatch");
        assertEq(quoteResult.srcAmount, expectedSrcAmount, "Source amount mismatch");
        assertEq(quoteResult.confirmations, 2, "Confirmations mismatch");
    }

    function testQuote_Epv1OFTv1_BasicScenario() public {
        MockLayerZeroEndpoint mockEndpoint = new MockLayerZeroEndpoint();
        MockEpv1OFTv1 oftMock = new MockEpv1OFTv1(OFT_NAME, OFT_SYMBOL, address(mockEndpoint));

        IOFTWrapper.QuoteInput memory input = IOFTWrapper.QuoteInput({
            version: IOFTWrapper.OFTVersion.Epv1OFTv1,
            token: address(oftMock),
            dstEid: uint16(B_EID),
            amountLD: INITIAL_AMOUNT,
            minAmountLD: MIN_AMOUNT,
            toAddress: _addressToBytes32(receiver),
            extraOptions: bytes("")
        });
        IOFTWrapper.FeeObj memory feeObj = IOFTWrapper.FeeObj({
            callerBps: CALLER_BPS,
            caller: address(0),
            partnerId: bytes2(0)
        });

        uint256 expectedWrapperFee = (input.amountLD * DEFAULT_BPS) / BPS_DENOMINATOR;
        uint256 expectedCallerFee = (input.amountLD * feeObj.callerBps) / BPS_DENOMINATOR;
        uint256 expectedAmountReceivedLD = input.amountLD - expectedWrapperFee - expectedCallerFee;
        uint256 expectedSrcAmountMax = type(uint256).max;
        uint256 expectedSrcAmount = expectedAmountReceivedLD + expectedWrapperFee + expectedCallerFee;
        uint256 expectedNativeFee = (expectedSrcAmount - expectedCallerFee - expectedWrapperFee) /
            oftMock.FEE_DIVISOR();

        IOFTWrapper.QuoteResult memory quoteResult = oftWrapper.quote(input, feeObj);

        IOFTWrapper.QuoteFee[] memory expectedFees = new IOFTWrapper.QuoteFee[](3);
        expectedFees[0] = IOFTWrapper.QuoteFee({
            fee: WRAPPER_FEE_NAME,
            amount: int256(expectedWrapperFee),
            token: input.token
        });
        expectedFees[1] = IOFTWrapper.QuoteFee({
            fee: CALLER_FEE_NAME,
            amount: int256(expectedCallerFee),
            token: input.token
        });
        expectedFees[2] = IOFTWrapper.QuoteFee({
            fee: NATIVE_FEE_NAME,
            amount: int256(expectedNativeFee),
            token: input.token
        });

        assertFees(quoteResult, expectedFees);

        assertEq(quoteResult.amountReceivedLD, expectedAmountReceivedLD, "Amount received mismatch");
        assertEq(quoteResult.srcAmountMax, expectedSrcAmountMax, "Source amount max mismatch");
        assertEq(quoteResult.srcAmountMin, 0, "Source amount min mismatch");
        assertEq(quoteResult.srcAmount, expectedSrcAmount, "Source amount mismatch");
        assertEq(quoteResult.confirmations, 2, "Confirmations mismatch");
    }

    function getQuoteResultFeeWithName(
        string memory _name,
        IOFTWrapper.QuoteResult memory _quoteResult
    ) internal pure returns (IOFTWrapper.QuoteFee memory) {
        for (uint256 i = 0; i < _quoteResult.fees.length; i++) {
            if (keccak256(abi.encodePacked(_quoteResult.fees[i].fee)) == keccak256(abi.encodePacked(_name))) {
                return _quoteResult.fees[i];
            }
        }
        revert("Fee not found");
    }

    function assertFees(
        IOFTWrapper.QuoteResult memory _quoteResult,
        IOFTWrapper.QuoteFee[] memory _expectedFees
    ) private {
        for (uint256 i = 0; i < _expectedFees.length; i++) {
            IOFTWrapper.QuoteFee memory actualFee = getQuoteResultFeeWithName(_expectedFees[i].fee, _quoteResult);

            assertEq(
                actualFee.fee,
                _expectedFees[i].fee,
                string.concat("Fee name mismatch for fee: ", _expectedFees[i].fee)
            );
            assertEq(
                actualFee.amount,
                int256(_expectedFees[i].amount),
                string.concat("Fee amount mismatch for fee: ", _expectedFees[i].fee)
            );
            assertEq(
                actualFee.token,
                _expectedFees[i].token,
                string.concat("Fee token mismatch for fee: ", _expectedFees[i].fee)
            );
        }
    }
}
