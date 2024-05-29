// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { BusPassenger, BusCodec } from "./BusCodec.sol";

/* Bus Parameters
    There is three relevant bus parameters regarding the number of passengers than can queue up for it 
    and later sit on it to be driven:

    queueCapacity
    maxNumPassengers
    plannerPassengers

    In simple terms, up to queueCapacity passengers can queue up at once, up to maxNumPassengers can be driven per bus
    at once, and plannerPassengers passengers will be driven under steady state conditions. 
    
    When and how to set these parameters is explained next:

    queueCapacity
    Queue capacity is an on-chain parameter set at deployment time (it is part of the constructor). It limits the amount
    of passengers that can queue up for the bus at once. It also sets the size of the circular buffer used to represent
    the queue. The capacity impacts the cost of initialization since each capacity slot should be initialized, so it is
    a number that we want to bound. At the same time, the size of the circular buffer defines the bus behaviour under
    re-orgs: Because a re-org will re-order txs, that changes the hashChain, which will cause the `drive` txs to revert
    as they will contain the wrong hashes. Reverting the drives means that in the now-canonical fork there is no
    available room in the queue for all the passengers that queued up in the abandoned fork. This will cause all those
    txs to revert as well, leading to a bad UX. If the circular buffer is made larger, then the passengers txs can
    still be re-arranged despite all the `drive` txs reverting. This parameter should be set by estimating the inflow
    of txs for each chain and multiplying that by the p99 finality window (confirmation time) or another such indicator
    to minimize the chances that passengers `ride` tx revert under re-orgs. Naturally the queue constrains the
    `maxNumPassengers`.

    maxNumPassengers
    The max number of passengers to drive is an on-chain parameter that limits how many passengers can be driven at
    once. It is set through the `setMaxNumPassengers` function at wire/configure time but can be later
    modified. Its purpose is to ensure that all LZ messages are deliverable. Since LZ has a limit on the destination on
    the message size, we need to ensure on the source that we do not go above that limit.

    plannerPassengers
    The number of passengers that the Planner will actually attempt to drive. This is an off-chain parameter that tries
    to balance cost (by driving as many passengers as possible at once) with speed (by driving as often as possible).
    It is dynamically set on the off-chain side and the only significance on the contract side is that it corresponds
    to the typical value the contract will see on calls to `ride`.

    The way each parameter limits the next one means queueCapacity > maxNumPassengers > plannerPassengers.
*/

// Represents the bus state. This includes bus identifiers, current seats and a proof to verify the current passengers.
struct BusQueue {
    uint8 maxNumPassengers; // set by the owner
    uint80 busFare; // set by the planner
    uint80 busAndNativeDropFare; // set by the planner
    uint16 qLength; // the length of the queue, i.e. how many passengers are queued up
    uint72 nextTicketId; // the last ticketId driven + 1, so the next ticketId to be driven
    mapping(uint16 index => bytes32 hash) hashChain; // hash chain of passengers, range of the index is the bus capacity
}

struct Bus {
    uint72 startTicketId;
    uint8 numPassengers;
    uint8 totalNativeDrops;
    bytes passengersBytes;
}

using BusLib for BusQueue global;

/// @title A library containing functionality for riding and driving buses.
/// @dev A bus allows sending multiple Stargate `Send`s on a single LZ message, making it very
/// @dev cheap. This batching incurs in additional latency, as the messages sent using the bus
/// @dev are not immediately sent, but rather stored in the bus until the bus is `drive`n.
/// @dev The messages are not actually stored on-chain, but a hash representing them is stored.
/// @dev This hash serves as proof that the driver provided the original data when calling
/// @dev `drive`. This saves storage.
library BusLib {
    error Bus_InvalidFare(bool nativeDrop);
    error Bus_InvalidPassenger();
    error Bus_QueueFull();
    error Bus_InvalidStartTicket();
    error Bus_InvalidNumPassengers(uint8 numPassengers);

    event BusRode(uint32 dstEid, uint72 ticketId, uint80 fare, bytes passenger);
    event BusDriven(uint32 dstEid, uint72 startTicketId, uint8 numPassengers, bytes32 guid);

    function setMaxNumPassengers(BusQueue storage _queue, uint8 _maxNumPassengers) internal {
        _queue.maxNumPassengers = _maxNumPassengers;
    }

    function setFares(BusQueue storage _queue, uint80 _busFare, uint80 _busAndNativeDropFare) internal {
        _queue.busFare = _busFare;
        _queue.busAndNativeDropFare = _busAndNativeDropFare;
    }

    function safeGetFare(BusQueue storage _queue, bool _nativeDrop) internal view returns (uint80 fare) {
        fare = _nativeDrop ? _queue.busAndNativeDropFare : _queue.busFare;
        if (fare == 0) revert Bus_InvalidFare(_nativeDrop);
    }

    /// @notice Ride the bus, queueing the message for processing.
    /// @dev Updates the bus structure and emits an event with the relevant data.
    /// @dev Reverts with BusFull if the bus is full.
    /// @dev Emits BusRode with the passenger information.
    function ride(
        BusQueue storage _queue,
        uint16 _queueCapacity,
        uint32 _dstEid,
        BusPassenger memory _passenger
    ) internal returns (uint72 ticketId, bytes memory passengerBytes, uint80 fare) {
        // step 1: generate the ticketId
        unchecked {
            // create a new ticket
            ticketId = _queue.nextTicketId + _queue.qLength++;

            // check if the bus is full
            if (_queue.qLength >= _queueCapacity) revert Bus_QueueFull();
        }

        // step 2: generate the passenger bytes
        passengerBytes = BusCodec.encodePassenger(_passenger);

        // step 3: calculate the fare
        fare = _queue.safeGetFare(_passenger.nativeDrop);

        // step 4: update the hash chain
        bytes32 lastHash;
        unchecked {
            lastHash = ticketId == 0 ? bytes32(0) : _queue.hashChain[uint16((ticketId - 1) % _queueCapacity)];
        }
        _queue.hashChain[uint16(ticketId % _queueCapacity)] = keccak256(abi.encodePacked(lastHash, passengerBytes));

        // step 5: emit the event
        emit BusRode(_dstEid, ticketId, fare, passengerBytes);
    }

    /// @notice Drive the bus, validating the payload
    /// @dev This function validates the payload by re-seating all passengers and also resets the bus state.
    /// @param _queue The queue to get passengers from
    /// @param _queueCapacity An immutable value set on TokenMessaging, always larger than the maxNumPassengers
    /// @param _passengersBytes The concatenated data of all passengers in the bus
    function checkTicketsAndDrive(
        BusQueue storage _queue,
        uint16 _queueCapacity,
        bytes calldata _passengersBytes
    ) internal returns (Bus memory bus) {
        bus = checkTickets(_queue, _queueCapacity, _passengersBytes);
        // This effectively 'drives' the bus
        unchecked {
            _queue.nextTicketId += bus.numPassengers;
            _queue.qLength -= bus.numPassengers;
        }
    }

    /// @notice Validate that the aggregated payload corresponds to the list of bus passengers.
    /// @dev Verification is done by re-seating the passengers and recalculating the hash-chain.
    /// @dev Reverts with InvalidPassenger if the top hashes do not match.
    function checkTickets(
        BusQueue storage _queue,
        uint16 _queueCapacity,
        bytes calldata _passengersBytes
    ) internal view returns (Bus memory bus) {
        // Validate the number of passengers
        uint8 numPassengers = BusCodec.getNumPassengers(_passengersBytes);
        if (numPassengers == 0 || numPassengers > _queue.maxNumPassengers || numPassengers > _queue.qLength) {
            revert Bus_InvalidNumPassengers(numPassengers);
        }

        // Generate the last hash
        uint72 startTicketId = _queue.nextTicketId;
        bytes32 previousHash = startTicketId == 0
            ? bytes32(0)
            : _queue.hashChain[uint16((startTicketId - 1) % _queueCapacity)];
        (uint8 totalNativeDrops, bytes32 lastHash) = BusCodec.parsePassengers(_passengersBytes, previousHash);

        // Validate the last hash
        uint72 lastTicketIdToDrive = startTicketId + numPassengers - 1;
        if (lastHash != _queue.hashChain[uint16(lastTicketIdToDrive % _queueCapacity)]) revert Bus_InvalidPassenger();

        // Set the bus params
        bus.startTicketId = startTicketId;
        bus.numPassengers = numPassengers;
        bus.passengersBytes = _passengersBytes;
        bus.totalNativeDrops = totalNativeDrops;
    }
}
