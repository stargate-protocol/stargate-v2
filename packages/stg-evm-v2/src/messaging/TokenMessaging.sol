// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { MessagingReceipt, MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

import { ITokenMessaging, TaxiParams, RideBusParams, Ticket } from "../interfaces/ITokenMessaging.sol";
import { ITokenMessagingHandler } from "../interfaces/ITokenMessagingHandler.sol";
import { BusQueue, BusLib, Bus, BusPassenger, BusCodec } from "../libs/Bus.sol";
import { Transfer } from "../libs/Transfer.sol";
import { TokenMessagingOptions } from "./TokenMessagingOptions.sol";
import { MessagingBase, Origin } from "./MessagingBase.sol";
import { TaxiCodec } from "../libs/TaxiCodec.sol";
import { AddressCast } from "../libs/AddressCast.sol";

contract TokenMessaging is Transfer, MessagingBase, TokenMessagingOptions, ITokenMessaging {
    /// @dev The maximum number of passengers is queueCapacity - 1 to avoid overwriting the hash root.
    /// @dev queueCapacity *must* be a divisor of 2**16.
    uint16 public immutable queueCapacity;
    uint32 internal immutable localEid;

    mapping(uint32 dstEid => BusQueue queue) public busQueues;
    mapping(uint32 dstEid => uint128 nativeDropAmount) public nativeDropAmounts;

    event FaresSet(uint32 dstEid, uint80 busFare, uint80 busAndNativeDropFare);
    event NativeDropAmountSet(uint32 dstEid, uint128 nativeDropAmount);
    event MaxNumPassengersSet(uint32 dstEid, uint8 maxNumPassengers);
    event NativeDropApplied(address receiver, uint128 amount);
    event NativeDropFailed(address receiver, uint128 amount);
    event BusQueueStorageInitialized(uint32 dstEid, uint16 startSlot, uint16 endSlot);

    error Messaging_InvalidEid();
    error Messaging_InvalidQueueCapacity();
    error Messaging_InvalidMsgValue();
    error Messaging_MaxNumPassengersExceedsQueueCapacity();
    error Messaging_NotEnoughPassengers();

    /// @param _queueCapacity The maximum number of passengers that can be accommodated in the bus queue.  Must be a divisor of 2**16.
    constructor(address _endpoint, address _owner, uint16 _queueCapacity) MessagingBase(_endpoint, _owner) {
        if (_queueCapacity < 2 || (2 ** 16) % _queueCapacity != 0) revert Messaging_InvalidQueueCapacity(); // queue capacity must be at least 2
        queueCapacity = _queueCapacity;
        localEid = endpoint.eid();
    }

    // ---------------------------------- Only Owner ------------------------------------------

    function setMaxNumPassengers(uint32 _dstEid, uint8 _maxNumPassengers) external onlyOwner {
        if (_maxNumPassengers >= queueCapacity) revert Messaging_MaxNumPassengersExceedsQueueCapacity();
        busQueues[_dstEid].setMaxNumPassengers(_maxNumPassengers);
        emit MaxNumPassengersSet(_dstEid, _maxNumPassengers);
    }

    function setNativeDropAmount(uint32 _dstEid, uint128 _nativeDropAmount) external onlyOwner {
        nativeDropAmounts[_dstEid] = _nativeDropAmount;
        emit NativeDropAmountSet(_dstEid, _nativeDropAmount);
    }

    /// @notice Initialize the queue storage to pay the storage costs upfront
    /// @dev Emits BusQueueStorageInitialized per queue initialized
    /// @param _dstEids The endpoint IDs of the busQueues to initialize
    /// @param _startSlot The first slot to initialize (inclusive)
    /// @param _endSlot The last slot to initialize (inclusive)
    function initializeBusQueueStorage(
        uint32[] calldata _dstEids,
        uint16 _startSlot,
        uint16 _endSlot
    ) external onlyOwner {
        for (uint256 i = 0; i < _dstEids.length; i++) {
            BusQueue storage queue = busQueues[_dstEids[i]];

            if (queue.nextTicketId + queue.qLength > queueCapacity) continue; // whole buffer already used
            uint16 lastTicketId = uint16(queue.nextTicketId + queue.qLength);

            // only initialize unused slots
            uint16 startSlot = _startSlot >= lastTicketId ? _startSlot : lastTicketId;
            // storage slots go from 0 to queueCapacity - 1
            uint16 endSlot = _endSlot >= queueCapacity - 1 ? queueCapacity - 1 : _endSlot;

            // use a non-zero value to initialize storage between [startSlot, endSlot], both inclusive
            for (uint16 slot = startSlot; slot <= endSlot; slot++) {
                queue.hashChain[slot] = bytes32("F");
            }
            emit BusQueueStorageInitialized(_dstEids[i], startSlot, endSlot);
        }
    }

    // ---------------------------------- Planner ------------------------------------------

    function quoteFares(
        uint32 _dstEid,
        uint8 _numPassengers
    ) external view returns (uint256 busFare, uint256 busAndNativeDropFare) {
        if (_numPassengers == 0) revert Messaging_NotEnoughPassengers();
        bytes memory mockPassengersBytes = new bytes(uint256(_numPassengers) * PASSENGER_SIZE);
        bytes memory message = BusCodec.encodeBus(0, 0, mockPassengersBytes);

        // Retrieve the LZ quote based on the busFare and NO native drop
        bytes memory optionsBusFare = _buildOptionsForDriveBus(_dstEid, _numPassengers, 0, 0);
        busFare = _quote(_dstEid, message, optionsBusFare, false).nativeFee / _numPassengers;

        // Retrieve the LZ quote based on the busFare and nativeDrop option
        bytes memory optionsBusAndNativeDropFare = _buildOptionsForDriveBus(
            _dstEid,
            _numPassengers,
            _numPassengers, // Assume every rider in this case is using nativeDrop
            nativeDropAmounts[_dstEid]
        );
        busAndNativeDropFare = _quote(_dstEid, message, optionsBusAndNativeDropFare, false).nativeFee / _numPassengers;
    }

    // The '_busAndNativeDropFare' is the cost for riding the bus AND the native drop
    function setFares(uint32 _dstEid, uint80 _busFare, uint80 _busAndNativeDropFare) external onlyPlanner {
        // If the planner sets the bus fare with the localEid, users can ride the bus to the local endpoint,
        // but the bus will never be driven.
        if (_dstEid == localEid) revert Messaging_InvalidEid();
        busQueues[_dstEid].setFares(_busFare, _busAndNativeDropFare);
        emit FaresSet(_dstEid, _busFare, _busAndNativeDropFare);
    }

    // ---------------------------------- Taxi ------------------------------------------

    function quoteTaxi(
        TaxiParams calldata _params,
        bool _payInLzToken
    ) external view returns (MessagingFee memory fee) {
        (bytes memory message, bytes memory options) = _encodeMessageAndOptionsForTaxi(_params);
        fee = _quote(_params.dstEid, message, options, _payInLzToken);
    }

    function taxi(
        TaxiParams calldata _params,
        MessagingFee calldata _messagingFee,
        address _refundAddress
    ) external payable returns (MessagingReceipt memory receipt) {
        (bytes memory message, bytes memory options) = _encodeMessageAndOptionsForTaxi(_params);
        receipt = _lzSend(_params.dstEid, message, options, _messagingFee, _refundAddress);
    }

    function _encodeMessageAndOptionsForTaxi(
        TaxiParams calldata _params
    ) internal view returns (bytes memory message, bytes memory options) {
        uint16 assetId = _safeGetAssetId(msg.sender);
        message = TaxiCodec.encodeTaxi(_params.sender, assetId, _params.receiver, _params.amountSD, _params.composeMsg);
        options = _buildOptionsForTaxi(_params.dstEid, _params.extraOptions);
    }

    // ---------------------------------- RideBus ------------------------------------------

    function quoteRideBus(uint32 _dstEid, bool _airdrop) external view returns (MessagingFee memory fee) {
        fee.nativeFee = busQueues[_dstEid].safeGetFare(_airdrop);
    }

    function rideBus(
        RideBusParams calldata _params
    ) external returns (MessagingReceipt memory receipt, Ticket memory ticket) {
        // step 1: check the msg.sender is the stargate by getting the assetId.  This acts as a form of access control,
        // as the function will revert if the msg.sender is not a stargate.
        uint16 assetId = _safeGetAssetId(msg.sender);

        // step 2: ride the bus and get the encoded passenger bytes etc.
        uint32 dstEid = _params.dstEid;
        (uint72 ticketId, bytes memory passengerBytes, uint256 fare) = busQueues[dstEid].ride(
            queueCapacity,
            dstEid,
            BusPassenger({
                assetId: assetId,
                receiver: _params.receiver,
                amountSD: _params.amountSD,
                nativeDrop: _params.nativeDrop
            })
        );

        // step 3: create the 'Ticket' which acts like a 'receipt' for the passenger
        ticket = Ticket(ticketId, passengerBytes);

        // step 4: refund any excess fare passed
        receipt.fee.nativeFee = fare;
    }

    function getPassengerHash(uint32 _dstEid, uint16 _index) external view returns (bytes32 hash) {
        hash = busQueues[_dstEid].hashChain[_index];
    }

    // ---------------------------------- Bus ------------------------------------------

    function quoteDriveBus(uint32 _dstEid, bytes calldata _passengers) external view returns (MessagingFee memory fee) {
        // Step 1: check the tickets
        Bus memory bus = busQueues[_dstEid].checkTickets(queueCapacity, _passengers);

        // Step 2: generate the lzMsg and lzOptions
        (bytes memory message, bytes memory options) = _encodeMessageAndOptionsForDriveBus(_dstEid, bus);

        // Step 3: quote the fee
        fee = _quote(_dstEid, message, options, false);
    }

    /// @dev Anyone can drive the bus with all or partial of the passengers
    function driveBus(
        uint32 _dstEid,
        bytes calldata _passengers
    ) external payable returns (MessagingReceipt memory receipt) {
        // Step 1: check the tickets and drive
        Bus memory bus = busQueues[_dstEid].checkTicketsAndDrive(queueCapacity, _passengers);

        // Step 2: generate the lzMsg and lzOptions
        (bytes memory message, bytes memory options) = _encodeMessageAndOptionsForDriveBus(_dstEid, bus);

        // Step 3: send the message through LZ
        receipt = _lzSend(_dstEid, message, options, MessagingFee(msg.value, 0), msg.sender);

        // Step 4: emit the bus driven event with the guid
        emit BusLib.BusDriven(_dstEid, bus.startTicketId, bus.numPassengers, receipt.guid);
    }

    function _encodeMessageAndOptionsForDriveBus(
        uint32 _dstEid,
        Bus memory _bus
    ) internal view returns (bytes memory message, bytes memory options) {
        // In the event that nativeDropAmount is zero, the transfer is skipped in _lzReceiveBus(...) on destination.
        uint128 nativeDropAmount = nativeDropAmounts[_dstEid];
        message = BusCodec.encodeBus(_bus.totalNativeDrops, nativeDropAmount, _bus.passengersBytes);
        options = _buildOptionsForDriveBus(_dstEid, _bus.numPassengers, _bus.totalNativeDrops, nativeDropAmount);
    }

    // ---------------------------------- OApp Functions ------------------------------------------

    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        if (BusCodec.isBus(_message)) {
            _lzReceiveBus(_origin, _guid, _message);
        } else {
            _lzReceiveTaxi(_origin, _guid, _message);
        }
    }

    function _lzReceiveBus(Origin calldata _origin, bytes32 _guid, bytes calldata _busBytes) internal {
        (uint128 totalNativeDrops, uint128 nativeDropAmount, BusPassenger[] memory passengers) = BusCodec.decodeBus(
            _busBytes
        );
        if (totalNativeDrops > 0 && msg.value != (totalNativeDrops * nativeDropAmount))
            revert Messaging_InvalidMsgValue();

        uint256 nativeDropAmountLeft = msg.value;

        for (uint8 seatNumber = 0; seatNumber < passengers.length; seatNumber++) {
            BusPassenger memory passenger = passengers[seatNumber];
            address stargate = _safeGetStargateImpl(passenger.assetId);
            address receiver = AddressCast.toAddress(passenger.receiver);

            if (nativeDropAmount > 0 && passenger.nativeDrop) {
                // limit the native token transfer.
                // if it fails, the token drop will be considered failed and the receiver will not receive the token
                // if the receiver is a contract with custom receive function, this might OOG
                if (Transfer.transferNative(receiver, nativeDropAmount, true)) {
                    unchecked {
                        nativeDropAmountLeft -= nativeDropAmount;
                    }
                    emit NativeDropApplied(receiver, nativeDropAmount);
                } else {
                    emit NativeDropFailed(receiver, nativeDropAmount);
                }
            }

            ITokenMessagingHandler(stargate).receiveTokenBus(_origin, _guid, seatNumber, receiver, passenger.amountSD);
        }

        // refund the remaining native token to the planner without a gas limit
        if (nativeDropAmountLeft > 0) Transfer.safeTransferNative(planner, nativeDropAmountLeft, false);
    }

    function _lzReceiveTaxi(Origin calldata _origin, bytes32 _guid, bytes calldata _taxiBytes) internal {
        (uint16 assetId, bytes32 receiverBytes32, uint64 amountSD, bytes memory composeMsg) = TaxiCodec.decodeTaxi(
            _taxiBytes
        );
        address receiver = AddressCast.toAddress(receiverBytes32);

        address stargate = _safeGetStargateImpl(assetId);

        ITokenMessagingHandler(stargate).receiveTokenTaxi(_origin, _guid, receiver, amountSD, composeMsg);
    }

    /// @dev The native coin is already checked in the stargate contract and transferred to this contract
    function _payNative(uint256 _nativeFee) internal pure override returns (uint256 nativeFee) {
        nativeFee = _nativeFee;
    }

    function isComposeMsgSender(
        Origin calldata /*_origin*/,
        bytes calldata _message,
        address _sender
    ) public view override returns (bool) {
        // only compose msgs can come from taxi, so if its not a taxi its false
        if (TaxiCodec.isTaxi(_message)) {
            (uint16 assetId, , , ) = TaxiCodec.decodeTaxi(_message);
            if (stargateImpls[assetId] == _sender) return true;
        }
        return false;
    }
}
