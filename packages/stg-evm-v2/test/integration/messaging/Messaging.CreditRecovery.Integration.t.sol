// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Test, Vm } from "forge-std/Test.sol";
import { TargetCredit, TargetCreditBatch } from "../../../src/interfaces/ICreditMessaging.sol";
import { Credit } from "../../../src/interfaces/ICreditMessagingHandler.sol";
import { CreditMessagingRecovery } from "../../../src/messaging/CreditMessagingRecovery.sol";
import { StargateBase } from "../../../src/StargateBase.sol";
import { StargatePool } from "../../../src/StargatePool.sol";
import { StargateOFT } from "../../../src/StargateOFT.sol";
import { CreditBatch } from "../../../src/libs/CreditMsgCodec.sol";
import { PoolToken } from "../../../src/mocks/PoolToken.sol";
import { OFTTokenERC20 } from "../../../src/utils/OFTTokenERC20.sol";
import { LzFixture } from "../../layerzero/LzTestHelper.sol";
import { StargateTestHelper } from "../../StargateTestHelper.sol";

/// @notice Integration tests for CreditMessagingRecovery wired to real StargatePool and StargateOFT instances.
///         These tests verify that paths[eid].credit actually changes after mintCredits/burnCredits,
///         and that the LZ endpoint emits no events — confirming all operations are strictly local.
contract CreditMessagingRecoveryIntegrationTest is Test, StargateTestHelper {
    uint16 internal constant ASSET_ID_POOL = 1;
    uint16 internal constant ASSET_ID_OFT = 2;
    uint32 internal constant SRC_EID = 10;
    string internal constant MINT_REASON = "restoring lost credits";
    string internal constant BURN_REASON = "correcting over-minted credits";

    CreditMessagingRecovery internal recoveryMessaging;
    StargatePool internal pool;
    StargateOFT internal oft;

    function setUp() public {
        LzFixture[] memory fixtures = setUpEndpoints(1);
        address endpoint = address(fixtures[0].endpoint);

        recoveryMessaging = new CreditMessagingRecovery(endpoint, address(this));

        PoolToken poolToken = new PoolToken("Pool Token", "PT");
        pool = new StargatePool(
            "StargatePool",
            "SGP",
            address(poolToken),
            poolToken.decimals(),
            6,
            endpoint,
            address(this)
        );
        pool.setAddressConfig(
            StargateBase.AddressConfig({
                feeLib: address(0),
                planner: address(0),
                treasurer: address(0),
                tokenMessaging: address(0),
                creditMessaging: address(recoveryMessaging),
                lzToken: address(0)
            })
        );
        recoveryMessaging.setAssetId(address(pool), ASSET_ID_POOL);

        OFTTokenERC20 oftToken = new OFTTokenERC20("OFT Token", "OFT", 18);
        oft = new StargateOFT(address(oftToken), 6, endpoint, address(this));
        oftToken.addMinter(address(oft));
        oft.setAddressConfig(
            StargateBase.AddressConfig({
                feeLib: address(0),
                planner: address(0),
                treasurer: address(0),
                tokenMessaging: address(0),
                creditMessaging: address(recoveryMessaging),
                lzToken: address(0)
            })
        );
        recoveryMessaging.setAssetId(address(oft), ASSET_ID_OFT);
    }

    // ---------------------------------- mintCredits ------------------------------------------

    function test_MintCredits_IncreasesPoolCredit(uint64 _amount) public {
        // type(uint64).max is UNLIMITED_CREDIT sentinel — increaseCredit reverts if credit reaches it
        _amount = uint64(bound(_amount, 1, type(uint64).max - 1));

        assertEq(pool.paths(SRC_EID), 0);

        VM.recordLogs();
        recoveryMessaging.mintCredits(_buildMintBatches(ASSET_ID_POOL, _amount), MINT_REASON);
        _assertNoLzEndpointActivity();

        assertEq(pool.paths(SRC_EID), _amount);
    }

    function test_MintCredits_IncreasesOFTCredit(uint64 _amount) public {
        _amount = uint64(bound(_amount, 1, type(uint64).max - 1));

        assertEq(oft.paths(SRC_EID), 0);

        VM.recordLogs();
        recoveryMessaging.mintCredits(_buildMintBatches(ASSET_ID_OFT, _amount), MINT_REASON);
        _assertNoLzEndpointActivity();

        assertEq(oft.paths(SRC_EID), _amount);
    }

    function test_MintCredits_AccumulatesOnMultipleCalls(uint64 _firstAmount, uint64 _secondAmount) public {
        _firstAmount = uint64(bound(_firstAmount, 1, type(uint64).max / 2));
        _secondAmount = uint64(bound(_secondAmount, 1, type(uint64).max / 2));

        VM.recordLogs();
        recoveryMessaging.mintCredits(_buildMintBatches(ASSET_ID_POOL, _firstAmount), MINT_REASON);
        _assertNoLzEndpointActivity();

        VM.recordLogs();
        recoveryMessaging.mintCredits(_buildMintBatches(ASSET_ID_POOL, _secondAmount), MINT_REASON);
        _assertNoLzEndpointActivity();

        assertEq(pool.paths(SRC_EID), _firstAmount + _secondAmount);
    }

    // ---------------------------------- burnCredits ------------------------------------------

    function test_BurnCredits_DecreasesPoolCredit(uint64 _initialCredit, uint64 _burnAmount) public {
        // type(uint64).max is UNLIMITED_CREDIT sentinel — increaseCredit reverts if credit reaches it
        _initialCredit = uint64(bound(_initialCredit, 2, type(uint64).max - 1));
        _burnAmount = uint64(bound(_burnAmount, 1, _initialCredit - 1));

        recoveryMessaging.mintCredits(_buildMintBatches(ASSET_ID_POOL, _initialCredit), MINT_REASON);
        assertEq(pool.paths(SRC_EID), _initialCredit);

        VM.recordLogs();
        recoveryMessaging.burnCredits(_buildBurnBatches(ASSET_ID_POOL, _burnAmount, 0), BURN_REASON);
        _assertNoLzEndpointActivity();

        assertEq(pool.paths(SRC_EID), _initialCredit - _burnAmount);
    }

    function test_BurnCredits_DecreasesOFTCredit(uint64 _initialCredit, uint64 _burnAmount) public {
        _initialCredit = uint64(bound(_initialCredit, 2, type(uint64).max - 1));
        _burnAmount = uint64(bound(_burnAmount, 1, _initialCredit - 1));

        recoveryMessaging.mintCredits(_buildMintBatches(ASSET_ID_OFT, _initialCredit), MINT_REASON);
        assertEq(oft.paths(SRC_EID), _initialCredit);

        VM.recordLogs();
        recoveryMessaging.burnCredits(_buildBurnBatches(ASSET_ID_OFT, _burnAmount, 0), BURN_REASON);
        _assertNoLzEndpointActivity();

        assertEq(oft.paths(SRC_EID), _initialCredit - _burnAmount);
    }

    function test_BurnCredits_DoesNotChangeCredit_WhenCreditIsBelowMinAmount_Pool(uint64 _credit) public {
        _credit = uint64(bound(_credit, 1, type(uint64).max - 1));

        recoveryMessaging.mintCredits(_buildMintBatches(ASSET_ID_POOL, _credit), MINT_REASON);

        // minAmount >= currentCredit: tryDecreaseCredit returns 0 without changing state
        VM.recordLogs();
        recoveryMessaging.burnCredits(_buildBurnBatches(ASSET_ID_POOL, _credit, _credit), BURN_REASON);
        _assertNoLzEndpointActivity();

        assertEq(pool.paths(SRC_EID), _credit);
    }

    function test_BurnCredits_DoesNotChangeCredit_WhenCreditIsBelowMinAmount_OFT(uint64 _credit) public {
        _credit = uint64(bound(_credit, 1, type(uint64).max - 1));

        recoveryMessaging.mintCredits(_buildMintBatches(ASSET_ID_OFT, _credit), MINT_REASON);

        VM.recordLogs();
        recoveryMessaging.burnCredits(_buildBurnBatches(ASSET_ID_OFT, _credit, _credit), BURN_REASON);
        _assertNoLzEndpointActivity();

        assertEq(oft.paths(SRC_EID), _credit);
    }

    // ---------------------------------- Helpers ------------------------------------------

    function _buildMintBatches(uint16 _assetId, uint64 _amount) internal pure returns (CreditBatch[] memory batches) {
        Credit[] memory credits = new Credit[](1);
        credits[0] = Credit({ srcEid: SRC_EID, amount: _amount });
        batches = new CreditBatch[](1);
        batches[0] = CreditBatch(_assetId, credits);
    }

    function _buildBurnBatches(
        uint16 _assetId,
        uint64 _amount,
        uint64 _minAmount
    ) internal pure returns (TargetCreditBatch[] memory batches) {
        TargetCredit[] memory credits = new TargetCredit[](1);
        credits[0] = TargetCredit({ srcEid: SRC_EID, amount: _amount, minAmount: _minAmount });
        batches = new TargetCreditBatch[](1);
        batches[0] = TargetCreditBatch(_assetId, credits);
    }

    /// @dev Asserts that the LZ endpoint emitted no events, proving no send, receive,
    ///      or any other endpoint interaction occurred during the operation.
    function _assertNoLzEndpointActivity() internal {
        address endpoint = address(recoveryMessaging.endpoint());
        Vm.Log[] memory logs = VM.getRecordedLogs();
        for (uint256 i = 0; i < logs.length; i++) {
            assertNotEq(logs[i].emitter, endpoint, "unexpected event emitted by LZ endpoint");
        }
    }
}
