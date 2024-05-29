// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { console } from "forge-std/Test.sol";

import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";

import { OFTLimit, OFTFeeDetail, OFTReceipt, SendParam, MessagingReceipt, MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { EnforcedOptionParam } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OAppOptionsType3.sol";
import { IStargateFeeLib } from "../src/interfaces/IStargateFeeLib.sol";
import { StargateType, IStargate } from "../src/interfaces/IStargate.sol";
import { TargetCredit, TargetCreditBatch } from "../src/interfaces/ICreditMessaging.sol";
import { OFTTokenERC20 } from "../src/utils/OFTTokenERC20.sol";
import { PoolToken } from "../src/mocks/PoolToken.sol";
import { StargatePool } from "../src/StargatePool.sol";
import { StargateOFT } from "../src/StargateOFT.sol";
import { StargatePoolNative } from "../src/StargatePoolNative.sol";
import { StargatePoolNativeWithTrackedPlannerFee } from "./mocks/StargatePoolNativeWithTrackedPlannerFee.sol";
import { TokenMessaging } from "../src/messaging/TokenMessaging.sol";
import { CreditMessaging, CreditBatch, Credit } from "../src/messaging/CreditMessaging.sol";
import { StargateBase, Ticket } from "../src/StargateBase.sol";
import { TaxiCodec } from "../src/libs/TaxiCodec.sol";
import { BusCodec } from "../src/libs/BusCodec.sol";
import { FeeLibV1, FeeConfig } from "../src/feelibs/FeeLibV1.sol";

import { LzFixture, LzTestHelper } from "./layerzero/LzTestHelper.sol";
import { ComposerMock } from "./mocks/ComposerMock.sol";
import { OftCmdHelper } from "./utils/OftCmdHelper.sol";

/// Stargate Fixture by chain and asset
struct StargateFixture {
    uint32 eid;
    uint16 assetId;
    LzFixture lz;
    TokenMessaging tokenMessaging;
    CreditMessaging creditMessaging;
    FeeLibV1 feeLib;
    address token;
    address lp;
    address stargate;
    StargateType stargateType;
    ComposerMock composer;
}

contract StargateTestHelper is LzTestHelper {
    using OptionsBuilder for bytes;

    error StargateNotFound(uint32 eid, uint16 assetId);

    StargateFixture[] public stargateFixtureList;
    mapping(uint32 => mapping(uint16 => StargateFixture)) public stargateFixtures; // eid => assetId => Fixture
    TokenMessaging[] public tokenMessagingList;
    mapping(uint32 => TokenMessaging) public tokenMessagingByEid;
    CreditMessaging[] public creditMessagingList;
    mapping(uint32 => CreditMessaging) public creditMessagingByEid;

    mapping(uint32 => mapping(uint32 => bytes[])) public passengersCache; // fromEid => toEid => passengers
    mapping(uint32 => mapping(uint32 => Amount[])) public passengersAmountLdCache; // fromEid => toEid => passengers

    struct Amount {
        uint16 assetId;
        uint256 amount;
    }

    uint80 public constant BUS_FARE = 0.0001 ether; // 0.0001 ETH
    uint128 public constant NATIVE_DROP_AMOUNT = 0.0001 ether;
    uint80 public constant NATIVE_DROP_FARE = 0.0002 ether; // 0.0002 ETH
    uint16 public constant PREMIUM_MULTIPLIER_BPS = 10000; // 100%
    uint128 public constant MIN_TOKEN_GAS = 200_000; // 200k gas
    uint128 public constant NATIVE_DROP_GAS_LIMIT = 50_000; // 50k gas
    uint128 public constant MIN_CREDIT_GAS = 200_000; // 200k gas
    uint8 public constant BUS_PASSENGER_CAPACITY = type(uint8).max;
    uint16 public constant MAX_COMPOSE_MSG_SIZE = 1000;
    uint256 public constant NATIVE_DECIMALS_RATE = 10_000;
    uint128 public constant NATIVE_CAP = type(uint128).max;
    uint16 public constant QUEUE_CAPACITY = 512;

    string internal constant OT_NAME = "OT";
    string internal constant OT_SYMBOL = "OT";
    uint8 internal constant OT_DECIMALS = 18;

    bytes4 public constant NO_ERROR = bytes4(0x00000000);

    function setUpStargate(
        uint16 _assetNum, // how many assets to create
        uint8 _poolNum, // how many pools to create for each asset
        uint8 _nativePoolNum, // how many native pools to create for each asset
        uint8 _oftNum // how many OFTs to create for each asset
    ) internal {
        setUpStargate(_assetNum, _poolNum, _nativePoolNum, _oftNum, false);
    }

    function setUpStargate(
        uint16 _assetNum, // how many assets to create
        uint8 _poolNum, // how many pools to create for each asset
        uint8 _nativePoolNum, // how many native pools to create for each asset
        uint8 _oftNum, // how many OFTs to create for each asset
        bool _explicitlyTrackPlannerFees // whether to track planner fees with StargatePoolNativeWithTrackedPlannerFee
    ) internal {
        require(_poolNum > 0 || _nativePoolNum > 0, "StargateTestHelper: at least 1 pool or native pool");

        // set up endpoints
        uint8 chainNum = _nativePoolNum + _poolNum + _oftNum;
        LzFixture[] memory lzFixtures = setUpEndpoints(chainNum);

        // create Stargate by asset on each chain
        for (uint8 i = 0; i < chainNum; i++) {
            uint32 eid = lzFixtures[i].eid;
            TokenMessaging tokenMessaging = new TokenMessaging(
                address(lzFixtures[i].endpoint),
                address(this),
                QUEUE_CAPACITY
            );
            {
                /// @dev Initialize the bus queue storage, in a separate block to avoid stack too deep errors
                uint32[] memory eids = new uint32[](1);
                eids[0] = eid;
                tokenMessaging.initializeBusQueueStorage(eids, 0, QUEUE_CAPACITY - 1);
            }
            tokenMessagingList.push(tokenMessaging);
            tokenMessagingByEid[eid] = tokenMessaging;

            CreditMessaging creditMessaging = new CreditMessaging(address(lzFixtures[i].endpoint), address(this));
            creditMessagingList.push(creditMessaging);
            creditMessagingByEid[eid] = creditMessaging;

            // create Stargate by asset
            for (uint8 j = 0; j < _assetNum; j++) {
                uint16 assetId = j + 1;

                address tokenAddress;
                address lpAddress;
                StargateType stargateType = StargateType.Pool;
                address sgAddress;

                if (i < _poolNum) {
                    // create pool
                    PoolToken token = new PoolToken("Pool Token", "PT");
                    tokenAddress = address(token);
                    StargatePool sg = new StargatePool(
                        "StargatePool",
                        "SGP",
                        tokenAddress,
                        token.decimals(),
                        6,
                        address(lzFixtures[i].endpoint),
                        address(this)
                    );
                    lpAddress = sg.lpToken();
                    stargateType = StargateType.Pool;
                    sgAddress = address(sg);
                } else if (i < _nativePoolNum + _poolNum) {
                    // Create native pool.
                    // Note:  a ternary is used here as abstracting a helper function led to StackTooDeep errors
                    StargatePoolNative sg = !_explicitlyTrackPlannerFees
                        ? new StargatePoolNative(
                            "StargatePoolNative",
                            "SGP",
                            18,
                            6,
                            address(lzFixtures[i].endpoint),
                            address(this)
                        )
                        : new StargatePoolNativeWithTrackedPlannerFee(
                            "StargatePoolNativeWithTrackedPlannerFee",
                            "SGP",
                            18,
                            6,
                            address(lzFixtures[i].endpoint),
                            address(this)
                        );
                    lpAddress = sg.lpToken();
                    stargateType = StargateType.Pool;
                    sgAddress = address(sg);
                } else {
                    OFTTokenERC20 token = new OFTTokenERC20(OT_NAME, OT_SYMBOL, OT_DECIMALS);
                    tokenAddress = address(token);
                    StargateOFT sg = new StargateOFT(tokenAddress, 6, address(lzFixtures[i].endpoint), address(this));

                    stargateType = StargateType.OFT;
                    sgAddress = address(sg);

                    // Add the Stargate asset as a minter so its able to be called during mint/burn
                    token.addMinter(sgAddress);
                }

                FeeLibV1 feeLib = new FeeLibV1(sgAddress);
                StargateBase(sgAddress).setAddressConfig(
                    StargateBase.AddressConfig(
                        address(feeLib),
                        address(this),
                        address(this),
                        address(tokenMessaging),
                        address(creditMessaging),
                        address(0)
                    )
                );

                StargateFixture memory fixture = StargateFixture({
                    eid: eid,
                    assetId: assetId,
                    lz: lzFixtures[i],
                    tokenMessaging: tokenMessaging,
                    creditMessaging: creditMessaging,
                    token: tokenAddress,
                    lp: lpAddress,
                    stargate: sgAddress,
                    feeLib: FeeLibV1(feeLib),
                    stargateType: stargateType,
                    composer: new ComposerMock()
                });
                // store stargate by eid and asset
                stargateFixtures[eid][assetId] = fixture;
                // store stargate fixture
                stargateFixtureList.push(fixture);
            }
        }

        // config stargate to remote
        for (uint256 i = 0; i < chainNum; i++) {
            address planner = address(0x1);
            uint32 eid = lzFixtures[i].eid;
            TokenMessaging tokenMessaging = tokenMessagingList[i];
            tokenMessaging.setPlanner(planner);
            CreditMessaging creditMessaging = creditMessagingList[i];
            creditMessaging.setPlanner(planner);

            for (uint256 j = 0; j < chainNum; j++) {
                uint32 dstEid = lzFixtures[j].eid;
                if (eid == dstEid) continue; // skip rollback to itself
                tokenMessaging.setMaxNumPassengers(dstEid, BUS_PASSENGER_CAPACITY);
                VM.prank(planner);
                tokenMessaging.setFares(dstEid, BUS_FARE, NATIVE_DROP_FARE);
                tokenMessaging.setNativeDropAmount(dstEid, NATIVE_DROP_AMOUNT);
                // config stargate by asset
                for (uint16 assetId = 1; assetId <= _assetNum; assetId++) {
                    StargateBase sg = StargateBase(stargateFixtures[eid][assetId].stargate);
                    if (j >= _poolNum + _nativePoolNum) {
                        sg.setOFTPath(dstEid, true);
                    }

                    // config fee
                    FeeLibV1 feeLib = stargateFixtures[eid][assetId].feeLib;
                    // no fee
                    feeLib.setFeeConfig(
                        dstEid,
                        10000000000, // zone1UpperBound: 0 - 10_000 SD: zone1
                        20000000000, // zone2UpperBound: 10_000 - 20_000 SD: zone2,  20_000 SD - unlimited: zone3
                        0, // zone1FeeMillionth: no fee for zone1
                        0, // zone2FeeMillionth: no fee for zone2
                        0, // zone3FeeMillionth: no fee for zone3
                        0 // rewardMillionth: no reward
                    );

                    // config messaging by eidPath + assetId
                    tokenMessaging.setAssetId(address(sg), assetId);
                    creditMessaging.setAssetId(address(sg), assetId);
                }
                tokenMessaging.setGasLimit(dstEid, MIN_TOKEN_GAS, NATIVE_DROP_GAS_LIMIT);
                setEnforcedOptions(tokenMessaging, dstEid);
                creditMessaging.setGasLimit(dstEid, MIN_CREDIT_GAS);
                // common oapp config
                address tokenPeer = address(tokenMessagingList[j]);
                tokenMessaging.setPeer(dstEid, addressToBytes32(tokenPeer));
                address creditPeer = address(creditMessagingList[j]);
                creditMessaging.setPeer(dstEid, addressToBytes32(creditPeer));
            }
        }
    }

    function setEnforcedOptions(TokenMessaging tokenMessaging, uint32 eid) internal {
        bytes memory enforcedOption = OptionsBuilder.newOptions().addExecutorLzReceiveOption(MIN_TOKEN_GAS, 0);

        EnforcedOptionParam memory enforcedOptionParam = EnforcedOptionParam({
            msgType: tokenMessaging.MSG_TYPE_TAXI(),
            eid: eid,
            options: enforcedOption
        });
        EnforcedOptionParam[] memory enforcedOptions = new EnforcedOptionParam[](1);
        enforcedOptions[0] = enforcedOptionParam;

        tokenMessaging.setEnforcedOptions(enforcedOptions);
    }

    // --- actions utils ---

    function donate(address _stargate, uint256 _amount) internal {
        StargateBase sg = StargateBase(_stargate);
        address token = sg.token();
        if (token != address(0x0)) {
            PoolToken poolToken = PoolToken(token);
            poolToken.mint(address(this), _amount);
            poolToken.transfer(_stargate, _amount);
        }
    }

    function recover(address _stargate, uint256 _amount) internal {
        StargateBase sg = StargateBase(_stargate);
        address token = sg.token();
        sg.recoverToken(token, address(this), _amount);
    }

    function mintAndAddLiquidity(address _sender, address _stargate, uint256 _amount) internal {
        StargateType sgType = IStargate(_stargate).stargateType();
        require(sgType == StargateType.Pool, "StargateTestHelper: only pool can add liquidity");
        StargatePool sg = StargatePool(payable(_stargate));
        PoolToken token = PoolToken(sg.token());
        if (address(token) == address(0x0)) {
            VM.deal(_sender, _amount);
            VM.prank(_sender);
            sg.deposit{ value: _amount }(_sender, _amount);
        } else {
            token.mint(_sender, _amount);
            VM.startPrank(_sender);
            token.approve(address(sg), _amount);
            sg.deposit(_sender, _amount);
            VM.stopPrank();
        }
    }

    function sendCredit(address _messaging, uint32 _dstEid, TargetCreditBatch[] memory _creditBatches) internal {
        CreditMessaging messaging = CreditMessaging(_messaging);
        address planner = messaging.planner();
        require(planner != address(0x0), "StargateTestHelper: planner not set");

        MessagingFee memory messagingFee = messaging.quoteSendCredits(_dstEid, _creditBatches);
        VM.deal(planner, messagingFee.nativeFee);
        VM.prank(planner);
        messaging.sendCredits{ value: messagingFee.nativeFee }(_dstEid, _creditBatches);
    }

    function sendCredit(address _stargate, uint32 _toEid, uint32 _srcEid, uint64 _amount) internal {
        StargateBase sg = StargateBase(_stargate);
        StargateBase.AddressConfig memory config = sg.getAddressConfig();
        address messagingAddr = config.creditMessaging;
        CreditMessaging messaging = CreditMessaging(messagingAddr);
        uint16 assetId = messaging.assetIds(_stargate);

        TargetCreditBatch[] memory creditBatches = new TargetCreditBatch[](1);
        creditBatches[0] = TargetCreditBatch({ assetId: assetId, credits: new TargetCredit[](1) });
        creditBatches[0].credits[0] = TargetCredit({ srcEid: _srcEid, amount: _amount, minAmount: 0 });

        sendCredit(messagingAddr, _toEid, creditBatches);
    }

    function sendCreditAndRelay(
        address _messaging,
        uint32 _dstEid,
        TargetCreditBatch[] memory _creditBatches
    ) internal {
        sendCredit(_messaging, _dstEid, _creditBatches);
        verifyAndExecutePackets();
    }

    function sendCreditAndRelay(address _stargate, uint32 _toEid, uint32 _srcEid, uint64 _amount) internal {
        sendCredit(_stargate, _toEid, _srcEid, _amount);
        verifyAndExecutePackets();
    }

    function sendTaxi(
        address _sender,
        address _stargate,
        uint32 _dstEid,
        uint256 _amount,
        uint128 _nativeDrop
    ) internal {
        sendTaxi(_sender, _stargate, _dstEid, _amount, _sender, "", _nativeDrop);
    }

    function sendTaxi(address _sender, address _stargate, uint32 _dstEid, uint256 _amount) internal {
        sendTaxi(_sender, _stargate, _dstEid, _amount, _sender, "", 0);
    }

    function sendTaxi(
        address _sender,
        address _stargate,
        uint32 _dstEid,
        uint256 _amount,
        address _receiver,
        bytes memory _composeMsg
    ) internal {
        sendTaxi(_sender, _stargate, _dstEid, _amount, _receiver, _composeMsg, 0);
    }

    function sendTaxi(
        address _sender,
        address _stargate,
        uint32 _dstEid,
        uint256 _amount,
        address _receiver,
        bytes memory _composeMsg,
        uint128 _nativeDropAmount
    ) internal {
        bytes memory extraOptions = _composeMsg.length > 0
            ? OptionsBuilder.newOptions().addExecutorLzComposeOption(0, 50_000, 0).addExecutorNativeDropOption(
                _nativeDropAmount,
                addressToBytes32(_receiver)
            ) // compose gas limit
            : bytes("");
        SendParam memory sendParam = SendParam({
            dstEid: _dstEid,
            to: addressToBytes32(_receiver),
            amountLD: _amount,
            minAmountLD: _amount,
            extraOptions: extraOptions,
            composeMsg: _composeMsg,
            oftCmd: OftCmdHelper.taxi()
        });
        send(_sender, _stargate, sendParam);
    }

    function sendTaxiAndRelay(address _sender, address _stargate, uint32 _dstEid, uint256 _amount) internal {
        sendTaxiAndRelay(_sender, _stargate, _dstEid, _amount, _sender, bytes(""));
    }

    function sendTaxiAndRelay(
        address _sender,
        address _stargate,
        uint32 _dstEid,
        uint256 _amount,
        address _receiver,
        bytes memory _composeMsg
    ) internal {
        sendTaxiAndRelay(_sender, _stargate, _dstEid, _amount, _receiver, _composeMsg, 0);
    }

    function sendTaxiAndRelay(
        address _sender,
        address _stargate,
        uint32 _dstEid,
        uint256 _amount,
        address _receiver,
        bytes memory _composeMsg,
        uint128 _nativeDropAmount
    ) internal {
        sendTaxi(_sender, _stargate, _dstEid, _amount, _receiver, _composeMsg, _nativeDropAmount);
        verifyAndExecutePackets();
    }

    function send(
        address _sender,
        address _stargate,
        SendParam memory _sendParam
    ) internal returns (Ticket memory ticket) {
        MessagingFee memory messagingFee = StargateBase(_stargate).quoteSend(_sendParam, false);
        return send(_sender, _stargate, _sendParam, messagingFee);
    }

    function send(
        address _sender,
        address _stargate,
        SendParam memory _sendParam,
        MessagingFee memory _messagingFee
    ) internal returns (Ticket memory ticket) {
        return send(_sender, _stargate, _sendParam, _messagingFee, _sender);
    }

    function send(
        address _sender,
        address _stargate,
        SendParam memory _sendParam,
        MessagingFee memory _messagingFee,
        address _refundAddress
    ) internal returns (Ticket memory ticket) {
        return send(_sender, _stargate, _sendParam, _messagingFee, _refundAddress, NO_ERROR);
    }

    function send(
        address _sender,
        address _stargate,
        SendParam memory _sendParam,
        MessagingFee memory _messagingFee,
        address _refundAddress,
        bytes4 _selector
    ) internal returns (Ticket memory ticket) {
        StargateBase sg = StargateBase(_stargate);

        // change the minAmountLD
        (, , OFTReceipt memory receipt) = sg.quoteOFT(_sendParam);
        _sendParam.minAmountLD = receipt.amountReceivedLD;

        uint256 valueToSend = _messagingFee.nativeFee;
        address token = StargateBase(_stargate).token();
        if (token != address(0x0)) {
            VM.prank(_sender);
            PoolToken(token).approve(_stargate, _sendParam.amountLD);
        } else {
            valueToSend += _sendParam.amountLD;
        }

        VM.deal(_sender, valueToSend);
        VM.prank(_sender);
        /// @dev optionally expect an error.  NO_ERROR sentinel value means no error expected.
        if (_selector != NO_ERROR) {
            VM.expectRevert(_selector);
        }
        (, , ticket) = StargateBase(_stargate).sendToken{ value: valueToSend }(
            _sendParam,
            _messagingFee,
            _refundAddress
        );
    }

    function sendAndRelay(address _sender, address _stargate, SendParam memory _sendParam) internal {
        send(_sender, _stargate, _sendParam);
        verifyAndExecutePackets();
    }

    function rideBus(
        address _sender,
        address _stargate,
        uint32 _srcEid,
        uint32 _dstEid,
        uint256 _amount,
        address _receiver,
        bool nativeDrop
    ) internal {
        bytes32 to = addressToBytes32(_receiver);
        SendParam memory sendParam = SendParam({
            dstEid: _dstEid,
            to: to,
            amountLD: _amount,
            minAmountLD: _amount,
            extraOptions: new bytes(nativeDrop ? 1 : 0), // non-zero length is used to indicate native drop
            composeMsg: "",
            oftCmd: OftCmdHelper.bus()
        });

        (, , OFTReceipt memory receipt) = StargateBase(_stargate).quoteOFT(sendParam);
        sendParam.minAmountLD = receipt.amountReceivedLD;

        Ticket memory ticket = send(_sender, _stargate, sendParam);
        passengersCache[_srcEid][_dstEid].push(ticket.passengerBytes);
        uint16 assetId = tokenMessagingByEid[_srcEid].assetIds(_stargate);
        passengersAmountLdCache[_srcEid][_dstEid].push(Amount(assetId, sendParam.minAmountLD));
    }

    function rideBus(
        address _sender,
        address _stargate,
        uint32 _srcEid,
        uint32 _dstEid,
        uint256 _amount,
        address _receiver
    ) internal {
        rideBus(_sender, _stargate, _srcEid, _dstEid, _amount, _receiver, false);
    }

    function rideBus(address _passenger, address _stargate, uint32 _srcEid, uint32 _dstEid, uint256 _amount) internal {
        rideBus(_passenger, _stargate, _srcEid, _dstEid, _amount, _passenger, false);
    }

    function driveBus(address _driver, uint32 _fromEid, uint32 _toEid, uint8 _passengerNum) internal {
        (, , , uint16 length, uint72 nextTicketId) = tokenMessagingByEid[_fromEid].busQueues(_toEid);
        uint16 passengerNum = _passengerNum > 0 ? _passengerNum : length;
        if (passengerNum == 0) return;
        bytes memory _passengers;
        for (uint72 index = nextTicketId; index < nextTicketId + passengerNum; index++) {
            _passengers = abi.encodePacked(_passengers, passengersCache[_fromEid][_toEid][index]);
        }

        MessagingFee memory messagingFee = tokenMessagingByEid[_fromEid].quoteDriveBus(_toEid, _passengers);
        VM.deal(_driver, messagingFee.nativeFee);
        VM.prank(_driver);
        tokenMessagingByEid[_fromEid].driveBus{ value: messagingFee.nativeFee }(_toEid, _passengers);
    }

    function driveBusAndRelay(address _driver, uint32 _fromEid, uint32 _toEid) internal {
        driveBus(_driver, _fromEid, _toEid, 0);
        verifyAndExecutePackets();
    }

    // can drive partial passengers
    function driveBusAndRelay(address _driver, uint32 _fromEid, uint32 _toEid, uint8 _passengerNum) internal {
        driveBus(_driver, _fromEid, _toEid, _passengerNum);
        verifyAndExecutePackets();
    }

    function redeem(
        address _sender,
        address _stargate,
        uint256 _amountLD,
        address _receiver
    ) internal returns (uint256) {
        StargatePool sg = StargatePool(_stargate);
        VM.prank(_sender);
        return sg.redeem(_amountLD, _receiver);
    }

    function redeem(address _sender, address _stargate, uint256 _amountLD) internal returns (uint256) {
        return redeem(_sender, _stargate, _amountLD, _sender);
    }

    function redeemSend(
        address _sender,
        address _stargate,
        uint32 _fromEid,
        uint32 _toEid,
        uint256 _amountLD
    ) internal {
        redeemSend(_sender, _stargate, _fromEid, _toEid, _amountLD, _sender);
    }

    function redeemSend(
        address _sender,
        address _stargate,
        uint32 _fromEid,
        uint32 _toEid,
        uint256 _amountLD,
        address _receiver
    ) internal {
        StargatePool sg = StargatePool(_stargate);
        require(sg.stargateType() == StargateType.Pool, "StargateTestHelper: only pool can redeem");
        SendParam memory sendParam = SendParam({
            dstEid: _toEid,
            to: addressToBytes32(_receiver),
            amountLD: _amountLD,
            minAmountLD: _amountLD,
            extraOptions: "",
            composeMsg: "",
            oftCmd: ""
        });

        // change the minAmountLD
        (, , OFTReceipt memory receipt) = sg.quoteOFT(sendParam);
        sendParam.minAmountLD = receipt.amountReceivedLD;

        uint64 localCredit = sg.paths(_fromEid);
        if (_amountLD > sendParam.minAmountLD) {
            if (ldToSd(_amountLD - sendParam.minAmountLD) > localCredit) {
                return;
            }
        }

        MessagingFee memory fee = sg.quoteRedeemSend(sendParam, false);
        VM.deal(_sender, fee.nativeFee);
        VM.prank(_sender);
        sg.redeemSend{ value: fee.nativeFee }(sendParam, fee, _receiver);
    }

    function redeemSendAndRelay(
        address _sender,
        address _stargate,
        uint32 _fromEid,
        uint32 _toEid,
        uint256 _amountLD
    ) internal {
        redeemSendAndRelay(_sender, _stargate, _fromEid, _toEid, _amountLD, _sender);
    }

    function redeemSendAndRelay(
        address _sender,
        address _stargate,
        uint32 _fromEid,
        uint32 _toEid,
        uint256 _amountLD,
        address _receiver
    ) internal {
        redeemSend(_sender, _stargate, _fromEid, _toEid, _amountLD, _receiver);
        verifyAndExecutePackets();
    }

    function setFeeConfig(
        uint16 _assetId,
        uint32 _srcEid,
        uint32 _dstEid,
        uint24 _feeMillionth,
        uint24 _rewardMillionth
    ) internal {
        StargateFixture memory fixture = stargateFixtures[_srcEid][_assetId];
        fixture.feeLib.setFeeConfig(
            _dstEid,
            0, // zone1UpperBound
            0, // zone2UpperBound
            0, // zone1FeeMillionth
            0, // zone2FeeMillionth
            _feeMillionth, // zone3FeeMillionth: only one zone
            _rewardMillionth // rewardMillionth
        );
    }

    function addTreasuryFee(address _stargate, uint256 _amountLD) internal {
        StargateBase sg = StargateBase(_stargate);
        StargateType sgType = sg.stargateType();
        address token = StargateBase(_stargate).token();
        if (token == address(0x0)) {
            sg.addTreasuryFee{ value: _amountLD }(_amountLD);
        } else if (sgType == StargateType.Pool) {
            PoolToken poolToken = PoolToken(token);
            poolToken.mint(address(this), _amountLD);
            poolToken.approve(address(sg), _amountLD);
            sg.addTreasuryFee(_amountLD);
        }
        // OFT does not need to add treasury fee
    }

    function withdrawTreasuryFee(address _stargate, address _to, uint64 _amountSD) internal {
        StargateBase sg = StargateBase(_stargate);
        sg.withdrawTreasuryFee(_to, _amountSD);
    }

    function withdrawPlannerFee(address _stargate) internal {
        StargateBase sg = StargateBase(_stargate);
        sg.withdrawPlannerFee();
    }

    // --- utils ---

    function sdToLd(uint64 _amountSD) internal pure returns (uint256) {
        return uint256(_amountSD) * 1e12;
    }

    function ldToSd(uint256 _amountLD) internal pure returns (uint64) {
        return uint64(_amountLD / 1e12);
    }

    function _getCredit(address _stargate, uint32 _srcEid) internal view returns (uint64 credit) {
        StargateBase sg = StargateBase(_stargate);
        credit = sg.paths(_srcEid);
    }

    function _safeGetStargateFixture(uint32 _eid, uint16 _assetId) internal view returns (address) {
        address sg = stargateFixtures[_eid][_assetId].stargate;
        if (sg == address(0)) revert StargateNotFound(_eid, _assetId);
        return sg;
    }

    function _isBusFull(uint32 _fromEid, uint32 _toEid) internal view returns (bool) {
        (, , , uint16 length, ) = tokenMessagingByEid[_fromEid].busQueues(_toEid);
        return length >= QUEUE_CAPACITY;
    }
}
