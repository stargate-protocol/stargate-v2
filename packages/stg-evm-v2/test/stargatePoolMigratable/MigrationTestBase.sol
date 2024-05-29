// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import { FeeLibV1, FeeConfig } from "../../src/feelibs/FeeLibV1.sol";
import { ComposerMock } from "../mocks/ComposerMock.sol";
import { CreditMessaging } from "../../src/messaging/CreditMessaging.sol";
import { FeeLibV1 } from "../../src/feelibs/FeeLibV1.sol";
import { LzFixture } from "../layerzero/LzTestHelper.sol";
import { OFTTokenERC20 } from "../../src/utils/OFTTokenERC20.sol";
import { OFTTokenERC20Upgradeable } from "../../src/utils/OFTTokenERC20Upgradeable.sol";
import { PoolToken } from "../../src/mocks/PoolToken.sol";
import { StargateBase } from "../../src/StargateBase.sol";
import { StargateTestHelper } from "../StargateTestHelper.sol";
import { TokenMessaging } from "../../src/messaging/TokenMessaging.sol";
import { StargateFixture, StargateTestHelper } from "../StargateTestHelper.sol";
import { StargateOFT } from "../../src/StargateOFT.sol";
import { StargateType } from "../../src/interfaces/IStargate.sol";
import { StargatePoolMigratable } from "../../src/StargatePoolMigratable.sol";

/// @title IMinterManager
/// @notice Support polymorphic access to addMinter and removeMinter functions for OFTTokenERC20 and
///         OFTTokenERC20Upgradeable for testing purposes.
interface IMinterManager {
    function addMinter(address _minter) external;
    function removeMinter(address _minter) external;
}

/// @title MigrationTestBase
/// @notice Consolidates common logic for USDT migration tests in a base contract.
abstract contract MigrationTestBase is Test, StargateTestHelper {
    uint16 internal constant ASSET_ID = 1;
    uint8 internal constant NUM_CHAINS = 2;
    uint8 internal constant STARGATE_POOL_FIXTURE_INDEX = 1;
    uint8 internal constant STARGATE_OFT_FIXTURE_INDEX = 2;

    string internal constant USDT_NAME = "USD Tether";
    string internal constant USDT_SYMBOL = "USDT";
    uint8 internal constant USDT_DECIMALS = 18;

    address internal ALICE = makeAddr("alice");
    address internal BOB = makeAddr("bob");
    address internal DRIVER = makeAddr("driver");
    address internal PLANNER = makeAddr("planner");
    address internal TOKEN_ADMIN_ROLE = makeAddr("tokenAdmin");

    function createOFTTokenERC20(bool _upgradeable) internal returns (address) {
        if (_upgradeable) {
            OFTTokenERC20Upgradeable token = new OFTTokenERC20Upgradeable();
            token.initialize(USDT_NAME, USDT_SYMBOL, USDT_DECIMALS);
            return address(token);
        } else {
            return address(new OFTTokenERC20(USDT_NAME, USDT_SYMBOL, USDT_DECIMALS));
        }
    }

    /// @dev Set up and wire an initial USDT pool.
    function setUpInitialUSDTPool(LzFixture memory _usdtPoolFixture, bool _useOFTTokenERC20Upgradeable) internal {
        uint32 eid = _usdtPoolFixture.eid;
        TokenMessaging tokenMessaging = new TokenMessaging(
            address(_usdtPoolFixture.endpoint),
            address(this),
            QUEUE_CAPACITY
        );
        tokenMessagingList.push(tokenMessaging);
        tokenMessagingByEid[eid] = tokenMessaging;

        CreditMessaging creditMessaging = new CreditMessaging(address(_usdtPoolFixture.endpoint), address(this));
        creditMessagingList.push(creditMessaging);
        creditMessagingByEid[eid] = creditMessaging;

        StargateType stargateType = StargateType.Pool;
        address tokenAddress = createOFTTokenERC20(_useOFTTokenERC20Upgradeable);
        StargatePoolMigratable sg = new StargatePoolMigratable(
            "StargatePoolMigratable",
            "SMG",
            tokenAddress,
            IERC20Metadata(tokenAddress).decimals(),
            6,
            address(_usdtPoolFixture.endpoint),
            address(this)
        );
        address lpAddress = sg.lpToken();
        stargateType = StargateType.Pool;
        address sgAddress = address(sg);
        IMinterManager(tokenAddress).addMinter(sgAddress);

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
            assetId: ASSET_ID,
            lz: _usdtPoolFixture,
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
        stargateFixtures[eid][ASSET_ID] = fixture;
        // store stargate fixture
        stargateFixtureList.push(fixture);
    }

    /// @dev Set up and wire an initial USDT OFT.
    function setUpInitialUSDTOFT(LzFixture memory _usdtOFTFixture, bool _transferOwnership) internal {
        // Set up an initial USDT OFT
        uint32 eid = _usdtOFTFixture.eid;
        TokenMessaging tokenMessaging = new TokenMessaging(
            address(_usdtOFTFixture.endpoint),
            address(this),
            QUEUE_CAPACITY
        );
        tokenMessagingList.push(tokenMessaging);
        tokenMessagingByEid[eid] = tokenMessaging;

        CreditMessaging creditMessaging = new CreditMessaging(address(_usdtOFTFixture.endpoint), address(this));
        creditMessagingList.push(creditMessaging);
        creditMessagingByEid[eid] = creditMessaging;

        address tokenAddress;
        address lpAddress;
        StargateType stargateType = StargateType.Pool;
        address sgAddress;

        OFTTokenERC20Upgradeable token = OFTTokenERC20Upgradeable(createOFTTokenERC20(true));
        tokenAddress = address(token);
        StargateOFT sg = new StargateOFT(tokenAddress, 6, address(_usdtOFTFixture.endpoint), address(this));
        stargateType = StargateType.OFT;
        sgAddress = address(sg);
        token.addMinter(sgAddress);
        if (_transferOwnership) {
            token.transferOwnership(sgAddress);
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
            assetId: ASSET_ID,
            lz: _usdtOFTFixture,
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
        stargateFixtures[eid][ASSET_ID] = fixture;
        // store stargate fixture
        stargateFixtureList.push(fixture);
    }

    function setUpMigrationTest(bool _transferOwnership, bool _useOFTTokenERC20Upgradeable) public {
        // create two chains
        LzFixture[] memory lzFixtures = setUpEndpoints(NUM_CHAINS);
        LzFixture memory usdtPoolFixture = lzFixtures[0];
        LzFixture memory usdtOFTFixture = lzFixtures[1];

        setUpInitialUSDTPool(usdtPoolFixture, _useOFTTokenERC20Upgradeable);
        setUpInitialUSDTOFT(usdtOFTFixture, _transferOwnership);

        for (uint256 i = 0; i < NUM_CHAINS; i++) {
            uint32 eid = lzFixtures[i].eid;
            TokenMessaging tokenMessaging = tokenMessagingList[i];
            tokenMessaging.setPlanner(address(this));
            CreditMessaging creditMessaging = creditMessagingList[i];
            creditMessaging.setPlanner(address(this));

            for (uint256 j = 0; j < NUM_CHAINS; j++) {
                uint32 dstEid = lzFixtures[j].eid;
                if (eid == dstEid) continue; // skip loop-back
                tokenMessaging.setFares(dstEid, BUS_FARE, NATIVE_DROP_FARE);
                tokenMessaging.setNativeDropAmount(dstEid, NATIVE_DROP_AMOUNT);
                tokenMessaging.setMaxNumPassengers(dstEid, BUS_PASSENGER_CAPACITY);
                StargateBase sg = StargateBase(stargateFixtures[eid][ASSET_ID].stargate);
                if (j == 1) {
                    sg.setOFTPath(dstEid, true);
                }

                // config fee
                FeeLibV1 feeLib = stargateFixtures[eid][ASSET_ID].feeLib;
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
                tokenMessaging.setAssetId(address(sg), ASSET_ID);
                creditMessaging.setAssetId(address(sg), ASSET_ID);
                tokenMessaging.setGasLimit(dstEid, MIN_TOKEN_GAS, NATIVE_DROP_GAS_LIMIT);
                creditMessaging.setGasLimit(dstEid, MIN_CREDIT_GAS);

                setEnforcedOptions(tokenMessaging, dstEid);

                // common oapp config
                address tokenPeer = address(tokenMessagingList[j]);
                tokenMessaging.setPeer(dstEid, addressToBytes32(tokenPeer));
                address creditPeer = address(creditMessagingList[j]);
                creditMessaging.setPeer(dstEid, addressToBytes32(creditPeer));
            }
        }
    }

    function assumeAmountLD(uint256 _amountLD) internal pure returns (uint256 amountLD) {
        // Avoid Stargate.Invalid_Amount (_amountLD is too low) and Path.Path_UnlimitedCredit (_amountLD is too high) errors
        vm.assume(_amountLD >= 10e12 && _amountLD < type(uint64).max);
        amountLD = sdToLd(ldToSd(_amountLD)); // remove dust for the test, or accounting will be off
    }

    function assertCredit(address _stargate, uint32 _dstEid, uint256 _amount) internal {
        uint256 credit = _getCredit(_stargate, _dstEid);
        assertEq(ldToSd(_amount), credit);
    }

    function assertBalance(StargateFixture memory fixture, uint256 _amount) internal {
        PoolToken tokenPool = PoolToken(fixture.token);
        uint256 balance = tokenPool.balanceOf(fixture.stargate);
        assertEq(_amount, balance);
    }

    function assertSupply(StargateFixture memory fixture, uint256 _amount) internal {
        assertEq(_amount, IERC20(fixture.token).totalSupply()); // works because IERC20 and IERC20Upgradeable have the same totalSupply() interface
    }

    function assertSendDisabled(
        address _sender,
        address _stargate,
        uint32 _srcEid,
        uint32 _dstEid,
        uint256 _amount,
        address _receiver
    ) internal {
        try this.rideBusExternal(_sender, _stargate, _srcEid, _dstEid, _amount, _receiver, false) {
            revert("Expected bus to fail");
        } catch {}

        try this.sendTaxiExternal(_sender, _stargate, _dstEid, _amount) {
            revert("Expected taxi to fail");
        } catch {}
    }

    function rideBusExternal(
        address _sender,
        address _stargate,
        uint32 _srcEid,
        uint32 _dstEid,
        uint256 _amount,
        address _receiver,
        bool nativeDrop
    ) external {
        rideBus(_sender, _stargate, _srcEid, _dstEid, _amount, _receiver, nativeDrop);
    }

    function sendTaxiExternal(address _sender, address _stargate, uint32 _dstEid, uint256 _amount) external {
        sendTaxi(_sender, _stargate, _dstEid, _amount, _sender, "");
    }
}
