// SPDX-LICENSE-IDENTIFIER: UNLICENSED

pragma solidity ^0.8.0;

import { console, Test } from "@layerzerolabs/toolbox-foundry/lib/forge-std/Test.sol";

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import { IOFT as IOFTEpv2, MessagingFee as MessagingFeeEpv2, SendParam as SendParamEpv2 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

import { IOFTWrapper, OFTWrapper } from "../../../../src/peripheral/oft-wrapper/OFTWrapper.sol";

import { LzTestHelper } from "../../../layerzero/LzTestHelper.sol";

import { ERC20Mock } from "./mocks/ERC20Mock.sol";
import { CustomQuoteSendMockOFT, CustomQuoteSendMockOFTAdapter, MockOFT, MockOFTAdapter } from "./mocks/epv2/MockOFT.sol";

contract OFTWrapperTest is Test, LzTestHelper {
    using OptionsBuilder for bytes;

    bytes internal constant INCORRECT_BPS_ERROR = "OFTWrapper: defaultBps >= 100%";

    string internal ERC20_MOCK_NAME = "ERC20Mock";
    string internal ERC20_MOCK_SYMBOL = "ERC";
    string internal OFT_NAME = "OFTA";
    string internal OFT_SYMBOL = "OFTA";

    uint8 internal constant NUM_ENDPOINTS = 2;
    uint32 internal constant A_EID = 1;
    uint32 internal constant B_EID = 2;

    uint16 internal constant DEFAULT_BPS = 97;

    OFTWrapper internal oftWrapper;

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
        oftWrapper = new OFTWrapper(DEFAULT_BPS);

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

    function test_constructor(uint16 _defaultBps) public {
        if (_defaultBps >= 10000) {
            vm.expectRevert(INCORRECT_BPS_ERROR);
            new OFTWrapper(_defaultBps);
        } else {
            OFTWrapper wrapper = new OFTWrapper(_defaultBps);
            assertEq(_defaultBps, wrapper.defaultBps());
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
            OptionsBuilder.newOptions().addExecutorLzReceiveOption(200_000, 0),
            "",
            ""
        );
        IOFTWrapper.FeeObj memory feeObj = _createFeeObj(_callerBps, caller, bytes2(0x0034));

        MessagingFeeEpv2 memory fee = oftWrapper.estimateSendFeeEpv2(
            address(adapter),
            address(token),
            sendParam,
            false,
            feeObj
        );

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
        fee = oftWrapper.estimateSendFeeEpv2(address(oft), address(oft), sendParam, false, feeObj);
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
    }

    function _removeDust(uint256 _amount, MockOFTAdapter _adapter) internal view returns (uint256) {
        uint256 decimalConversionRate = _adapter.decimalConversionRate();
        return (_amount / decimalConversionRate) * decimalConversionRate;
    }

    function _addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
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
        uint256 bpsDenom = oftWrapper.BPS_DENOMINATOR();
        vm.assume(_defaultBps < bpsDenom);
        vm.assume(_callerBps < bpsDenom);
        vm.assume(_customBps < bpsDenom);
        if (_customBps == 0) {
            vm.assume(_defaultBps + uint256(_callerBps) < 10_000);
        } else {
            vm.assume(_customBps + uint256(_callerBps) < 10_000);
        }

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
        MessagingFeeEpv2 memory fee = oftWrapper.estimateSendFeeEpv2(
            address(customAdapter),
            address(token),
            sendParam,
            false,
            feeObj
        );

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
        uint256 bpsDenom = oftWrapper.BPS_DENOMINATOR();
        vm.assume(_defaultBps < bpsDenom);
        vm.assume(_callerBps < bpsDenom);
        vm.assume(_customBps < bpsDenom);
        if (_customBps == 0) {
            vm.assume(_defaultBps + uint256(_callerBps) < 10_000);
        } else {
            vm.assume(_customBps + uint256(_callerBps) < 10_000);
        }

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
        MessagingFeeEpv2 memory fee = oftWrapper.estimateSendFeeEpv2(
            address(customOFT),
            address(customOFT),
            sendParam,
            false,
            feeObj
        );

        // 5. Assert that the fee is as expected.
        (uint256 expectedAmount, , ) = oftWrapper.getAmountAndFees(address(customOFT), _amountLD, _callerBps);
        assertEq(expectedAmount, fee.nativeFee); /// @dev in this example, nativeFee is manipulated to be amount
        assertEq(0, fee.lzTokenFee);
    }
}
