// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { Vm, console } from "forge-std/Test.sol";

import { DoubleEndedQueue } from "@openzeppelin/contracts/utils/structs/DoubleEndedQueue.sol";

import { UlnConfig, SetDefaultUlnConfigParam } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/UlnBase.sol";
import { IDVN } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/interfaces/IDVN.sol";
import { SetDefaultExecutorConfigParam, ExecutorConfig } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/SendLibBase.sol";
import { ReceiveUln302 } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/uln302/ReceiveUln302.sol";
import { VerificationState } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/ReceiveUlnBase.sol";
import { DVN, ExecuteParam } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/dvn/DVN.sol";
import { DVNFeeLib } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/dvn/DVNFeeLib.sol";
import { IExecutor } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/interfaces/IExecutor.sol";
import { Executor } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/Executor.sol";
import { PriceFeed } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/PriceFeed.sol";
import { ILayerZeroPriceFeed } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/interfaces/ILayerZeroPriceFeed.sol";
import { IReceiveUlnE2 } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/interfaces/IReceiveUlnE2.sol";
import { ReceiveUln302 } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/uln302/ReceiveUln302.sol";
import { IMessageLib } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessageLib.sol";
import { ExecutorOptions } from "@layerzerolabs/lz-evm-protocol-v2/contracts/messagelib/libs/ExecutorOptions.sol";
import { PacketV1Codec } from "@layerzerolabs/lz-evm-protocol-v2/contracts/messagelib/libs/PacketV1Codec.sol";
import { Origin, ILayerZeroEndpointV2 } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { Treasury } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/Treasury.sol";

//import { EndpointV2 } from "@layerzerolabs/lz-evm-protocol-v2/contracts/EndpointV2.sol";
//import { EndpointV2Alt } from "@layerzerolabs/lz-evm-protocol-v2/contracts/EndpointV2Alt.sol";

import { OptionsHelper } from "./OptionsHelper.sol";
import { SendUln302Mock as SendUln302 } from "./mocks/SendUln302Mock.sol";
import { SimpleMessageLibMock } from "./mocks/SimpleMessageLibMock.sol";
import { ExecutorFeeLibMock as ExecutorFeeLib } from "./mocks/ExecutorFeeLibMock.sol";
import { ZROMock } from "./mocks/ZROMock.sol";
import { AltFeeTokenMock } from "./mocks/AltFeeTokenMock.sol";
import { LzUtil } from "./LzUtil.sol";

interface ILayerZeroEndpointV2Ext is ILayerZeroEndpointV2 {
    function lzReceiveAlert(
        Origin calldata _origin,
        address _receiver,
        bytes32 _guid,
        uint256 _gas,
        uint256 _value,
        bytes calldata _message,
        bytes calldata _extraData,
        bytes calldata _reason
    ) external;

    function lzComposeAlert(
        address _from,
        address _to,
        bytes32 _guid,
        uint16 _index,
        uint256 _gas,
        uint256 _value,
        bytes calldata _message,
        bytes calldata _extraData,
        bytes calldata _reason
    ) external;
}

struct LzFixture {
    uint32 eid;
    // endpoint
    ILayerZeroEndpointV2Ext endpoint;
    bool isEndpointAlt;
    // ZRO
    ZROMock lzToken;
    // message libs (ULN302)
    SendUln302 sendUln;
    ReceiveUln302 receiveUln;
    // message libs (SimpleMessageLib)
    SimpleMessageLibMock simpleMessageLib;
    // executor
    Executor executor;
    // verifier
    DVN[] requiredDVNs;
    DVN[] optionalDVNs;
    uint8 optionalDVNThreshold;
    // priceFeed
    PriceFeed priceFeed;
    // Treasury
    Treasury treasury;
}

contract LzTestHelper is OptionsHelper {
    using DoubleEndedQueue for DoubleEndedQueue.Bytes32Deque;
    using PacketV1Codec for bytes;

    // --- Param Struct ---
    struct InitEndpointParam {
        uint8 endpointNum;
        uint8 endpointAltNum;
    }

    struct InitVerifierParam {
        uint8 requiredDVNCount;
        uint8 optionalDVNCount;
        uint8 optionalDVNThreshold;
    }

    // --- Struct ---
    struct ComposeMessage {
        address from;
        address to;
        bytes32 guid;
        uint16 index;
        bytes message;
    }

    enum LibraryType {
        UltraLightNode,
        SimpleMessageLib
    }

    // --- constants ---
    uint32 public constant CONFIG_TYPE_ULN = 2;
    uint256 public constant TREASURY_GAS_CAP = 1000000000000;
    uint256 public constant TREASURY_GAS_FOR_FEE_CAP = 100000;

    uint128 public executorValueCap = 0.1 ether;

    // Cheat code address, 0x7109709ECfa91a80626fF3989D68f67F5b1DD12D.
    address private constant VM_ADDRESS = address(uint160(uint256(keccak256("hevm cheat code"))));
    Vm internal constant VM = Vm(VM_ADDRESS);

    // --- state ---
    mapping(uint32 => address) public endpoints; // eid => endpoint
    mapping(uint32 => LzFixture) public fixtures; // eid => fixture

    // --- runtime packets state ---
    DoubleEndedQueue.Bytes32Deque internal packetsQueue; // guids queue
    mapping(bytes32 => bytes) internal packets; // guid => packet bytes
    mapping(bytes32 => bytes) internal optionsLookup; // guid => options
    mapping(bytes32 => ComposeMessage[]) public composeLookup; // guid => compose messages

    /**
     * @dev set executorValueCap if more than 0.1 ether is necessary
     * @dev this must be called prior to setUpEndpoints() if the value is to be used
     * @param _valueCap amount executor can pass as msg.value to lzReceive()
     */
    function setExecutorValueCap(uint128 _valueCap) public {
        executorValueCap = _valueCap;
    }

    function setUpEndpoints(uint8 _endpointNum) public returns (LzFixture[] memory lzFixtures) {
        return
            setUpEndpoints(InitEndpointParam(_endpointNum, 0), LibraryType.UltraLightNode, InitVerifierParam(1, 0, 0));
    }

    function setUpEndpointAlts(uint8 _endpointAltNum) public returns (LzFixture[] memory lzFixtures) {
        return
            setUpEndpoints(
                InitEndpointParam(0, _endpointAltNum),
                LibraryType.UltraLightNode,
                InitVerifierParam(1, 0, 0)
            );
    }

    function setUpEndpoints(
        uint8 _endpointNum,
        LibraryType _libraryType
    ) public returns (LzFixture[] memory lzFixtures) {
        return setUpEndpoints(InitEndpointParam(_endpointNum, 0), _libraryType, InitVerifierParam(1, 0, 0));
    }

    function setUpEndpointAlts(
        uint8 _endpointAltNum,
        LibraryType _libraryType
    ) public returns (LzFixture[] memory lzFixtures) {
        return setUpEndpoints(InitEndpointParam(0, _endpointAltNum), _libraryType, InitVerifierParam(1, 0, 0));
    }

    function setUpEndpoints(
        InitEndpointParam memory _endpointParam,
        LibraryType _libraryType,
        InitVerifierParam memory _verifierParam
    ) public returns (LzFixture[] memory lzFixtures) {
        uint8 _endpointNum = _endpointParam.endpointNum + _endpointParam.endpointAltNum;
        lzFixtures = new LzFixture[](_endpointNum);

        // deploy modules
        for (uint8 i = 0; i < _endpointNum; i++) {
            uint32 eid = i + 1;
            LzFixture memory fixture = lzFixtures[i];
            fixture.eid = eid;

            _deployEndpoint(fixture, i >= _endpointParam.endpointNum);
            _deployLzToken(fixture);
            _deployTreasury(fixture);
            _deployMessageLibs(fixture);
            _deployPriceFeed(fixture);
            _deployExecutor(fixture);
            _deployDVNs(fixture, _verifierParam);

            _registerFixture(fixture);
        }

        // wire-all modules
        LibraryType libraryType = _libraryType;
        InitVerifierParam memory verifierConfig = _verifierParam;
        for (uint32 eid = 1; eid <= _endpointNum; eid++) {
            LzFixture memory fixture = fixtures[eid];
            for (uint32 remoteEid = 1; remoteEid <= _endpointNum; remoteEid++) {
                // wire priceFeed
                {
                    uint128 denominator = fixture.priceFeed.getPriceRatioDenominator();
                    ILayerZeroPriceFeed.UpdatePrice[] memory prices = new ILayerZeroPriceFeed.UpdatePrice[](1);
                    prices[0] = ILayerZeroPriceFeed.UpdatePrice(
                        remoteEid,
                        ILayerZeroPriceFeed.Price(1 * denominator, 1, 1)
                    );
                    fixture.priceFeed.setPrice(prices);
                }

                // wire executor
                {
                    IExecutor.DstConfigParam[] memory executorConfigParams = new IExecutor.DstConfigParam[](1);
                    executorConfigParams[0] = IExecutor.DstConfigParam({
                        dstEid: remoteEid,
                        baseGas: 5000,
                        multiplierBps: 10000,
                        floorMarginUSD: 1e10,
                        nativeCap: executorValueCap
                    });
                    fixture.executor.setDstConfig(executorConfigParams);
                }

                // wire verifier
                {
                    IDVN.DstConfigParam[] memory verifierConfigParams = new IDVN.DstConfigParam[](1);
                    verifierConfigParams[0] = IDVN.DstConfigParam({
                        dstEid: remoteEid,
                        gas: 5000,
                        multiplierBps: 10000,
                        floorMarginUSD: 1e10
                    });
                    for (uint256 i = 0; i < fixture.requiredDVNs.length; i++) {
                        fixture.requiredDVNs[i].setDstConfig(verifierConfigParams);
                    }
                    for (uint256 i = 0; i < fixture.optionalDVNs.length; i++) {
                        fixture.optionalDVNs[i].setDstConfig(verifierConfigParams);
                    }
                }

                // wire sendUln/receiveUln - verifiers
                {
                    SetDefaultUlnConfigParam[] memory ulnParams = new SetDefaultUlnConfigParam[](1);
                    address[] memory requiredVerifiers = new address[](verifierConfig.requiredDVNCount);
                    for (uint256 i = 0; i < requiredVerifiers.length; i++) {
                        requiredVerifiers[i] = address(fixture.requiredDVNs[i]);
                    }
                    address[] memory optionalVerifiers = new address[](verifierConfig.optionalDVNCount);
                    for (uint256 i = 0; i < optionalVerifiers.length; i++) {
                        optionalVerifiers[i] = address(fixture.optionalDVNs[i]);
                    }
                    UlnConfig memory ulnConfig = UlnConfig({
                        confirmations: 1,
                        requiredDVNCount: verifierConfig.requiredDVNCount,
                        optionalDVNCount: verifierConfig.optionalDVNCount,
                        optionalDVNThreshold: verifierConfig.optionalDVNThreshold,
                        requiredDVNs: requiredVerifiers,
                        optionalDVNs: optionalVerifiers
                    });
                    ulnParams[0] = SetDefaultUlnConfigParam(remoteEid, ulnConfig);
                    fixture.sendUln.setDefaultUlnConfigs(ulnParams);
                    fixture.receiveUln.setDefaultUlnConfigs(ulnParams);
                }

                // wire sendUln - executor
                {
                    SetDefaultExecutorConfigParam[] memory executorParams = new SetDefaultExecutorConfigParam[](1);
                    ExecutorConfig memory executorConfig = ExecutorConfig({
                        maxMessageSize: 10000,
                        executor: address(fixture.executor)
                    });
                    executorParams[0] = SetDefaultExecutorConfigParam(remoteEid, executorConfig);
                    fixture.sendUln.setDefaultExecutorConfigs(executorParams);
                }

                // wire endpoint
                {
                    fixture.endpoint.setDefaultSendLibrary(
                        remoteEid,
                        libraryType == LibraryType.UltraLightNode
                            ? address(fixture.sendUln)
                            : address(fixture.simpleMessageLib)
                    );
                    fixture.endpoint.setDefaultReceiveLibrary(
                        remoteEid,
                        libraryType == LibraryType.UltraLightNode
                            ? address(fixture.receiveUln)
                            : address(fixture.simpleMessageLib),
                        0
                    );
                }
            }
        }
    }

    function schedulePacket(bytes calldata _packetBytes, bytes calldata _options) public {
        bytes32 guid = _packetBytes.guid();
        packetsQueue.pushFront(guid);
        packets[guid] = _packetBytes;
        optionsLookup[guid] = _options;
    }

    function verifyAndExecutePackets() public {
        uint256 numberOfPackets = packetsQueue.length();
        while (numberOfPackets > 0) {
            // first in first out
            bytes32 guid = packetsQueue.popBack();
            bytes memory packetBytes = packets[guid];
            this._assertGuid(packetBytes, guid);

            // DVNs verify on MessageLib
            this._verifyOnMsgLib(packetBytes);
            // commit verification from MessageLib to EndpointV2
            this._commitVerification(packetBytes);

            // execute (aka nativeDrop + lzReceive)
            this._nativeDropAndExecute(packetBytes);

            // compose
            this._lzCompose(packetBytes);

            numberOfPackets--;
        }
    }

    // --- deploy ---

    function _deployEndpoint(LzFixture memory _fixture, bool isAlt) internal {
        if (isAlt) {
            AltFeeTokenMock altFeeToken = new AltFeeTokenMock();
            _fixture.endpoint = ILayerZeroEndpointV2Ext(
                LzUtil.deployEndpointV2Alt(_fixture.eid, address(this), address(altFeeToken))
                //            _fixture.endpoint = ILayerZeroEndpointV2Ext(address(new EndpointV2Alt(_fixture.eid, address(this))));
            );
            _fixture.isEndpointAlt = true;
        } else {
            _fixture.endpoint = ILayerZeroEndpointV2Ext(LzUtil.deployEndpointV2(_fixture.eid, address(this)));
            //            _fixture.endpoint = ILayerZeroEndpointV2Ext(address(new EndpointV2(_fixture.eid, address(this))));
        }
    }

    function _deployLzToken(LzFixture memory _fixture) internal {
        ZROMock lzToken = new ZROMock();
        _fixture.endpoint.setLzToken(address(lzToken));
        _fixture.lzToken = lzToken;
    }

    function _deployTreasury(LzFixture memory _fixture) internal {
        Treasury treasury = new Treasury();
        treasury.setNativeFeeBP(1); // 0.01%
        treasury.setLzTokenEnabled(true);
        treasury.setLzTokenFee(1e18); // 1 zro
        _fixture.treasury = treasury;
    }

    function _deployUln302(LzFixture memory _fixture) internal {
        SendUln302 sendUln = new SendUln302(
            payable(address(this)),
            address(_fixture.endpoint),
            TREASURY_GAS_CAP,
            TREASURY_GAS_FOR_FEE_CAP
        );
        sendUln.setTreasury(address(_fixture.treasury));

        ReceiveUln302 receiveUln = new ReceiveUln302(address(_fixture.endpoint));
        _fixture.endpoint.registerLibrary(address(sendUln));
        _fixture.endpoint.registerLibrary(address(receiveUln));
        _fixture.sendUln = sendUln;
        _fixture.receiveUln = receiveUln;
    }

    function _deploySimpleMessageLib(LzFixture memory _fixture) internal {
        SimpleMessageLibMock messageLib = new SimpleMessageLibMock(payable(this), address(_fixture.endpoint));
        _fixture.endpoint.registerLibrary(address(messageLib));
        _fixture.simpleMessageLib = messageLib;
    }

    function _deployMessageLibs(LzFixture memory _fixture) internal {
        _deployUln302(_fixture);
        _deploySimpleMessageLib(_fixture);
    }

    function _deployPriceFeed(LzFixture memory _fixture) internal {
        PriceFeed priceFeed = new PriceFeed();
        address priceFeedUpdater = address(this);
        priceFeed.initialize(priceFeedUpdater);
        _fixture.priceFeed = priceFeed;
    }

    function _deployExecutor(LzFixture memory _fixture) internal {
        address[] memory admins = new address[](1);
        admins[0] = address(this);

        address[] memory messageLibs = new address[](2);
        messageLibs[0] = address(_fixture.sendUln);
        messageLibs[1] = address(_fixture.receiveUln);

        address roleAdmin = address(this);

        Executor executor = new Executor();
        executor.initialize(
            address(_fixture.endpoint),
            address(0x0),
            messageLibs,
            address(_fixture.priceFeed),
            roleAdmin,
            admins
        );
        ExecutorFeeLib executorLib = new ExecutorFeeLib();
        executor.setWorkerFeeLib(address(executorLib));
        _fixture.executor = executor;
    }

    function _deployDVNs(LzFixture memory _fixture, InitVerifierParam memory _config) internal {
        DVN[] memory requiredDVNs = new DVN[](_config.requiredDVNCount);
        for (uint256 i = 0; i < _config.requiredDVNCount; i++) {
            requiredDVNs[i] = _newDVN(_fixture);
        }
        _fixture.requiredDVNs = requiredDVNs;

        DVN[] memory optionalDVNs = new DVN[](_config.optionalDVNCount);
        for (uint256 i = 0; i < _config.optionalDVNCount; i++) {
            optionalDVNs[i] = _newDVN(_fixture);
        }
        _fixture.optionalDVNs = optionalDVNs;
        _fixture.optionalDVNThreshold = _config.optionalDVNThreshold;
        require(_fixture.optionalDVNThreshold <= _fixture.optionalDVNs.length, "invalid optional threshold");
    }

    function _newDVN(LzFixture memory _fixture) internal returns (DVN dvn) {
        // address(this) is the admin
        address[] memory verifierAdmins = new address[](1);
        verifierAdmins[0] = address(this);

        address[] memory messageLibs = new address[](2);
        messageLibs[0] = address(_fixture.sendUln);
        messageLibs[1] = address(_fixture.receiveUln);

        // 1 signer
        address[] memory signers = new address[](1);
        signers[0] = VM.addr(1);

        uint32 vid = _fixture.eid; // use eid as vid on test
        dvn = new DVN(vid, messageLibs, address(_fixture.priceFeed), signers, 1, verifierAdmins);
        DVNFeeLib dvnFeedLib = new DVNFeeLib(1e18);
        dvn.setWorkerFeeLib(address(dvnFeedLib));
    }

    function _registerFixture(LzFixture memory fixture) public {
        fixtures[fixture.eid] = fixture;
        endpoints[fixture.eid] = address(fixture.endpoint);
    }

    // --- workflow actions ---

    function _verifyOnMsgLib(bytes calldata _packetBytes) external {
        ILayerZeroEndpointV2Ext endpoint = ILayerZeroEndpointV2Ext(endpoints[_packetBytes.dstEid()]);
        (address receiveLib, ) = endpoint.getReceiveLibrary(_packetBytes.receiverB20(), _packetBytes.srcEid());
        (uint64 major, , ) = IMessageLib(receiveLib).version();
        if (major == 3) {
            ReceiveUln302 dstUln = ReceiveUln302(receiveLib);
            // it is ultra light node
            bytes memory configBytes = dstUln.getConfig(
                _packetBytes.srcEid(),
                _packetBytes.receiverB20(),
                CONFIG_TYPE_ULN
            );
            UlnConfig memory config = abi.decode(configBytes, (UlnConfig));
            DVN[] memory dvns = new DVN[](config.requiredDVNCount + config.optionalDVNCount);

            for (uint256 i = 0; i < config.requiredDVNCount; i++) {
                dvns[i] = DVN(config.requiredDVNs[i]);
            }
            for (uint256 i = 0; i < config.optionalDVNCount; i++) {
                dvns[i + config.requiredDVNCount] = DVN(config.optionalDVNs[i]);
            }

            uint32 dstEid = _packetBytes.dstEid();
            // verify by DVNs
            for (uint256 i = 0; i < dvns.length; i++) {
                DVN dvn = dvns[i];
                bytes memory packetHeader = _packetBytes.header();
                bytes32 payloadHash = keccak256(_packetBytes.payload());

                // sign and call `receiveLib.verify(packetHeader, payloadHash, 100)`
                bytes memory signatures;
                bytes memory verifyCalldata = abi.encodeWithSelector(
                    IReceiveUlnE2.verify.selector,
                    packetHeader,
                    payloadHash,
                    1000
                );
                {
                    bytes32 hash = dvn.hashCallData(dstEid, address(dstUln), verifyCalldata, block.timestamp + 1000);
                    bytes32 ethSignedMessageHash = keccak256(
                        abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
                    );
                    (uint8 v, bytes32 r, bytes32 s) = VM.sign(1, ethSignedMessageHash); // matches dvn signer
                    signatures = abi.encodePacked(r, s, v);
                }
                ExecuteParam[] memory params = new ExecuteParam[](1);
                uint32 vid = dstEid; // use eid as vid on test
                params[0] = ExecuteParam(vid, address(dstUln), verifyCalldata, block.timestamp + 1000, signatures);
                dvn.execute(params);
            }
        }
    }

    function _commitVerification(bytes calldata _packetBytes) public virtual returns (bool) {
        uint32 dstEid = _packetBytes.dstEid();
        ILayerZeroEndpointV2Ext endpoint = ILayerZeroEndpointV2Ext(endpoints[dstEid]);
        (address receiveLib, ) = endpoint.getReceiveLibrary(_packetBytes.receiverB20(), _packetBytes.srcEid());
        (uint64 major, , ) = IMessageLib(receiveLib).version();
        if (major == 3) {
            ReceiveUln302 dstUln = ReceiveUln302(receiveLib);
            bytes memory packetHeader = _packetBytes.header();
            bytes32 payloadHash = keccak256(_packetBytes.payload());
            VerificationState state = dstUln.verifiable(packetHeader, payloadHash);
            if (state != VerificationState.Verifiable) {
                return false;
            }
            dstUln.commitVerification(packetHeader, payloadHash);
        } else {
            SimpleMessageLibMock(payable(receiveLib)).validatePacket(_packetBytes);
        }
        return true;
    }

    function _nativeDropAndExecute(bytes calldata _packetBytes) external payable {
        bytes memory options = optionsLookup[_packetBytes.guid()];
        if (_executorOptionExists(options, ExecutorOptions.OPTION_TYPE_NATIVE_DROP)) {
            (uint256 amount, bytes32 receiver) = _parseExecutorNativeDropOption(options);
            address to = bytes32ToAddress(receiver);
            (bool sent, ) = to.call{ value: amount }("");
            require(sent, "Failed to send Ether");
        }
        if (_executorOptionExists(options, ExecutorOptions.OPTION_TYPE_LZRECEIVE)) {
            this._lzReceive(_packetBytes, options);
        }
    }

    function _lzReceive(bytes calldata _packetBytes, bytes memory _options) external payable {
        ILayerZeroEndpointV2Ext endpoint = ILayerZeroEndpointV2Ext(endpoints[_packetBytes.dstEid()]);
        (uint256 gas, uint256 value) = OptionsHelper._parseExecutorLzReceiveOption(_options);

        Origin memory origin = Origin(_packetBytes.srcEid(), _packetBytes.sender(), _packetBytes.nonce());

        {
            // if native token is set, pay fee by send native token to receiver instead of sending msg.value
            address nativeToken = endpoint.nativeToken();
            if (nativeToken != address(0)) {
                AltFeeTokenMock(nativeToken).mint(_packetBytes.receiverB20(), value);
                value = 0;
            }
        }

        // collect compose events
        VM.recordLogs();

        try
            endpoint.lzReceive{ value: value, gas: gas }(
                origin,
                _packetBytes.receiverB20(),
                _packetBytes.guid(),
                _packetBytes.message(),
                bytes("")
            )
        {} catch (bytes memory reason) {
            console.log("LzReceive failed, switch to lzReceiveAlert!");
            console.logBytes(reason);
            endpoint.lzReceiveAlert(
                origin,
                _packetBytes.receiverB20(),
                _packetBytes.guid(),
                gas,
                value,
                _packetBytes.message(),
                bytes(""),
                reason
            );
        }

        // handle compose logs
        Vm.Log[] memory entries = VM.getRecordedLogs();
        for (uint256 i = 0; i < entries.length; i++) {
            Vm.Log memory vmLog = entries[i];
            if (
                vmLog.emitter == address(endpoint) &&
                vmLog.topics[0] == keccak256("ComposeSent(address,address,bytes32,uint16,bytes)")
            ) {
                (address from, address to, bytes32 guid, uint16 index, bytes memory message) = abi.decode(
                    vmLog.data,
                    (address, address, bytes32, uint16, bytes)
                );
                // park compose message
                composeLookup[guid].push(ComposeMessage(from, to, guid, index, message));
            }
        }
    }

    function _lzCompose(bytes calldata _packetBytes) public payable {
        bytes32 guid = _packetBytes.guid();
        bytes memory options = optionsLookup[guid];
        if (!_executorOptionExists(options, ExecutorOptions.OPTION_TYPE_LZCOMPOSE)) {
            return;
        }

        ILayerZeroEndpointV2Ext endpoint = ILayerZeroEndpointV2Ext(endpoints[_packetBytes.dstEid()]);
        // only 1 compose option for now
        (uint16 index, uint256 gas, uint256 value) = _parseExecutorLzComposeOption(options);
        ComposeMessage[] memory composeMessages = composeLookup[guid];
        for (uint256 i = 0; i < composeMessages.length; i++) {
            ComposeMessage memory composeMessage = composeMessages[i];
            if (composeMessage.index != index) {
                continue;
            }

            // if native token is set, pay fee by sending native token to receiver instead of sending msg.value
            address nativeToken = endpoint.nativeToken();
            if (nativeToken != address(0)) {
                AltFeeTokenMock(nativeToken).mint(composeMessage.to, value);
                value = 0;
            }

            try
                endpoint.lzCompose{ value: value, gas: gas }(
                    composeMessage.from,
                    composeMessage.to,
                    composeMessage.guid,
                    composeMessage.index,
                    composeMessage.message,
                    bytes("")
                )
            {} catch (bytes memory reason) {
                console.log("LzCompose failed, switch to lzComposeAlert!");
                console.logBytes(reason);
                endpoint.lzComposeAlert(
                    composeMessage.from,
                    composeMessage.to,
                    composeMessage.guid,
                    composeMessage.index,
                    gas,
                    value,
                    composeMessage.message,
                    bytes(""),
                    reason
                );
            }
        }
    }

    function _assertGuid(bytes calldata packetBytes, bytes32 guid) external pure {
        bytes32 packetGuid = packetBytes.guid();
        require(packetGuid == guid, "guid not match");
    }

    // --- common utils ---

    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    function bytes32ToAddress(bytes32 _b32) internal pure returns (address) {
        return address(uint160(uint256(_b32)));
    }

    receive() external payable {}
}
