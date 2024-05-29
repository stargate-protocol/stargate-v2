// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { StargateBaseTest, console } from "../../stargate/StargateBase.t.sol";
import { TestToken } from "../../../utils/TestToken.sol";
import { RewarderMock } from "../../../mocks/RewarderMock.sol";
import { DepositorMock } from "../../../mocks/DepositorMock.sol";

import { StargateStaking, IERC20, IRewarder, IStargateStaking, IStakingReceiver } from "../../../../src/peripheral/rewarder/StargateStaking.sol";

import { StargateZapperV1, IStargateV1Router, IStargateZapperV1, IStargateEthVault } from "../../../../src/peripheral/zapper/StargateZapperV1.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { EndpointMock } from "../../../layerzero/mocks/EndpointMock.sol";

import { StargatePool } from "../../../../src/StargatePool.sol";
import { StargatePoolNative } from "../../../../src/StargatePoolNative.sol";

contract StargateZapperV1Test is StargateBaseTest {
    using SafeERC20 for IERC20;
    StargateStaking staking;
    StargateZapperV1 zapper;
    IStargateV1Router routerV1 = IStargateV1Router(0x8731d54E9D02c286767d56ac03e8037C07e01e98);
    IStargateEthVault ethVault = IStargateEthVault(0x72E2F4830b9E45d52F80aC08CB2bEC0FeF72eD9c);
    StargatePool pool;
    StargatePool pool2;
    IERC20 lpToken;
    IERC20 lpToken2;
    address private constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    TestToken private token1;
    TestToken private token2;
    address alice = address(vm.addr(101));
    address bob = address(vm.addr(102));

    uint16 usdtPID = 2;
    IERC20 usdt = IERC20(0xdAC17F958D2ee523a2206206994597C13D831ec7);
    IERC20 usdtLpV1 = IERC20(0x38EA452219524Bb87e18dE1C24D3bB59510BD783);
    StargatePool poolUsdt;
    IERC20 usdtLp;

    uint16 wethPID = 13;
    IERC20 wethLpV1 = IERC20(0x101816545F6bd2b1076434B54383a1E633390A2E);
    StargatePoolNative poolEth;
    IERC20 ethLp;

    function setUp() public override {
        super.setUp();
        vm.createSelectFork(vm.rpcUrl("ethereum_mainnet"));

        token1 = new TestToken("Test1", "TST1", 0);
        token2 = new TestToken("Test2", "TST2", 0);

        staking = new StargateStaking();
        zapper = new StargateZapperV1(staking, routerV1, ethVault);
        pool = new StargatePool(
            "TestPool",
            "TESTPOOL",
            address(token1),
            18,
            6,
            address(new EndpointMock()), // We mock out endpoint for now
            address(this)
        );
        lpToken = IERC20(pool.lpToken());

        pool2 = new StargatePool(
            "TestPool2",
            "TESTPOOL2",
            address(token2),
            18,
            6,
            address(new EndpointMock()), // We mock out endpoint for now
            address(this)
        );
        lpToken2 = IERC20(pool2.lpToken());

        poolUsdt = new StargatePool(
            "UsdtPool",
            "POOLUSDT",
            address(usdt),
            6,
            6,
            address(new EndpointMock()), // We mock out endpoint for now
            address(this)
        );
        usdtLp = IERC20(poolUsdt.lpToken());

        poolEth = new StargatePoolNative(
            "EthPool",
            "POOLETH",
            18,
            6,
            address(new EndpointMock()), // We mock out endpoint for now
            address(this)
        );
        ethLp = IERC20(poolEth.lpToken());

        // @todo native pool for WETH!
    }

    function _addToken(IERC20 token) internal {
        staking.setPool(token, new RewarderMock());
    }

    function test_revert_unauthorizedOwnerFunctionCalls() external {
        vm.startPrank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        zapper.transferOwnership(bob);
        vm.expectRevert("Ownable: caller is not the owner");
        zapper.renounceOwnership();
        vm.expectRevert("Ownable: caller is not the owner");
        zapper.configureLpToken(token1, true);
        vm.expectRevert("Ownable: caller is not the owner");
        zapper.configureV1Pool(0, token1);
        vm.expectRevert("Ownable: caller is not the owner");
        zapper.sweep(address(token1), bob, 10);
    }

    function test_constructorVariablesSet() external {
        assertEq(address(zapper.staking()), address(staking));
        assertEq(address(zapper.routerV1()), 0x8731d54E9D02c286767d56ac03e8037C07e01e98);
        assertEq(address(zapper.factoryV1()), 0x06D538690AF257Da524f25D0CD52fD85b1c2173E);
    }

    function test_sweepTokens() external {
        token1.mint(address(zapper), 10e18);
        vm.expectEmit();
        emit IStargateZapperV1.TokenSwept(address(token1), bob, 6e18);
        zapper.sweep(address(token1), bob, 6e18);
        vm.expectEmit();
        emit IStargateZapperV1.TokenSwept(address(token1), alice, 4e18);
        zapper.sweep(address(token1), alice, 4e18);
        vm.expectRevert();
        zapper.sweep(address(token1), alice, 1e18);
        vm.expectRevert();
        zapper.sweep(address(token2), alice, 1e18);

        (bool success, ) = address(zapper).call{ value: 1e18 }("");
        assertEq(success, true);
        uint256 ethAliceBalBefore = alice.balance;
        vm.expectEmit();
        emit IStargateZapperV1.TokenSwept(ETH, alice, 0.4 * 1e18);
        zapper.sweep(ETH, alice, 0.4 * 1e18);
        assertEq(alice.balance - ethAliceBalBefore, 0.4 * 1e18);
        assertEq(address(zapper).balance, 0.6 * 1e18);

        vm.expectRevert();
        zapper.sweep(ETH, alice, 1e18);
        emit IStargateZapperV1.TokenSwept(ETH, alice, 0.6 * 1e18);
        zapper.sweep(ETH, alice, 0.6 * 1e18);
        assertEq(alice.balance - ethAliceBalBefore, 1e18);
        assertEq(address(zapper).balance, 0);
    }

    function test_revert_unregisteredLP() external {
        vm.expectRevert(
            abi.encodeWithSelector(IStargateZapperV1.StargateZapperV1__UnknownLpToken.selector, address(lpToken))
        );
        zapper.depositAndStake(lpToken, 1e18, (1e18 * 99) / 100);
        vm.expectRevert(abi.encodeWithSelector(IStargateZapperV1.StargateZapperV1__InvalidPoolId.selector, 10));
        zapper.migrateV1LpToV2Stake(10, 1e18, (1e18 * 99) / 100);

        uint256 minExpected = (1e18 * 99) / 100;
        vm.expectRevert(abi.encodeWithSelector(IStargateStaking.NonExistentPool.selector, lpToken));
        staking.withdrawToAndCall(lpToken, zapper, 1e18, abi.encode(minExpected));

        _addToken(lpToken);
        token1.mint(address(this), 2e18);
        token1.approve(address(pool), 2e18);
        pool.deposit(address(this), 2e18);
        lpToken.approve(address(staking), 2e18);
        staking.deposit(lpToken, 1e18);
        vm.expectRevert(
            abi.encodeWithSelector(IStargateZapperV1.StargateZapperV1__UnknownLpToken.selector, address(lpToken))
        );
        staking.withdrawToAndCall(lpToken, zapper, 1e18, abi.encode(minExpected));
    }

    function test_revert_DepositAndStakeWithoutApproval() external {
        _addToken(lpToken);
        zapper.configureLpToken(lpToken, true);

        token1.mint(address(alice), 1e18);
        vm.startPrank(alice);
        //token1.approve(address(zapper), 1e18);
        vm.expectRevert("ERC20: insufficient allowance");
        zapper.depositAndStake(lpToken, 1e18, (1e18 * 99) / 100);
    }

    function test_revert_DepositAndStakeWithoutBalance() external {
        _addToken(lpToken);
        zapper.configureLpToken(lpToken, true);

        //token1.mint(alice, 1e18);
        vm.startPrank(alice);
        token1.approve(address(zapper), 1e18);
        vm.expectRevert("ERC20: transfer amount exceeds balance");
        zapper.depositAndStake(lpToken, 1e18, (1e18 * 99) / 100);
    }

    function test_DepositAndStake() external {
        _addToken(lpToken);
        _addToken(lpToken2);
        zapper.configureLpToken(lpToken, true);
        zapper.configureLpToken(lpToken2, true);
        assertEq(address(zapper.lpToPool(lpToken)), address(pool));
        assertEq(address(zapper.lpToAsset(lpToken)), address(token1));

        token1.mint(alice, 2e18);
        vm.startPrank(alice);
        uint256 token1BalanceBefore = token1.balanceOf(alice);
        assertEq(staking.balanceOf(token1, alice), 0);
        assertEq(staking.balanceOf(lpToken, alice), 0);
        token1.approve(address(zapper), 2e18);
        zapper.depositAndStake(lpToken, 1e18, 1e18);
        assertEq(token1BalanceBefore - token1.balanceOf(alice), 1e18);
        assertEq(staking.balanceOf(lpToken, alice), 1e18);
        assertEq(staking.balanceOf(token1, alice), 0);
        assertEq(staking.balanceOf(lpToken, bob), 0);
        assertEq(staking.balanceOf(token1, bob), 0);
        assertEq(token1.balanceOf(address(zapper)), 0);

        zapper.depositAndStake(lpToken, 1e12 + 1, 1e12);
        assertEq(token1BalanceBefore - token1.balanceOf(alice), 1e18 + 1e12 + 1); // @note A rounding error occurs here
        assertEq(token1.balanceOf(address(zapper)), 1);
        assertEq(staking.balanceOf(lpToken, alice), 1e18 + 1e12);
        assertEq(staking.balanceOf(token1, alice), 0);

        token2.mint(bob, 2e18);
        uint256 token2BalanceBobBefore = token2.balanceOf(bob);
        vm.startPrank(bob);
        token2.approve(address(zapper), 2e18);
        zapper.depositAndStake(lpToken2, 1e17, 1e17);
        assertEq(token2BalanceBobBefore - token2.balanceOf(bob), 1e17);
        assertEq(staking.balanceOf(lpToken, alice), 1e18 + 1e12);
        assertEq(staking.balanceOf(token1, alice), 0);
        assertEq(staking.balanceOf(lpToken, bob), 0);
        assertEq(staking.balanceOf(token1, bob), 0);
        assertEq(staking.balanceOf(lpToken2, bob), 1e17);
        assertEq(staking.balanceOf(token2, bob), 0);
        assertEq(token2.balanceOf(alice), 0);

        vm.startPrank(address(this));
        zapper.configureLpToken(lpToken, false);
        vm.expectRevert(
            abi.encodeWithSelector(IStargateZapperV1.StargateZapperV1__UnknownLpToken.selector, address(lpToken))
        );
        zapper.depositAndStake(lpToken, 1e12 + 1, 1e12);
    }

    function test_revert_DepositAndStakeZero() external {
        _addToken(lpToken);
        zapper.configureLpToken(lpToken, true);

        token1.mint(alice, 2e18);
        vm.startPrank(alice);
        token1.approve(address(zapper), 2e18);

        vm.expectRevert(IStargateZapperV1.StargateZapperV1__ZeroAmount.selector);
        zapper.depositAndStake(lpToken, 0, 0);
    }

    function test_revert_DepositAndStakeSlippage() external {
        _addToken(lpToken);
        zapper.configureLpToken(lpToken, true);

        token1.mint(alice, 2e18);
        vm.startPrank(alice);
        token1.approve(address(zapper), 2e18);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStargateZapperV1.StargateZapperV1__InsufficientOutputAmount.selector,
                1e18,
                1e18 + 1
            )
        );
        zapper.depositAndStake(lpToken, 1e18, 1e18 + 1);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStargateZapperV1.StargateZapperV1__InsufficientOutputAmount.selector,
                1e12,
                1e12 + 1
            )
        );
        zapper.depositAndStake(lpToken, 1e12 + 1, 1e12 + 1);
    }

    function test_depositAndStakeEthPool() external {
        _addToken(ethLp);
        zapper.configureLpToken(ethLp, true);

        vm.startPrank(alice);
        vm.deal(alice, 1e18);
        uint256 aliceBalBefore = alice.balance;
        zapper.depositAndStake{ value: 1e18 }(ethLp, 1e18, 1e18);
        assertEq(staking.balanceOf(ethLp, alice), 1e18);
        assertEq(aliceBalBefore - alice.balance, 1e18);
    }

    function test_revert_depositAndStakeEthPoolRounding() external {
        _addToken(ethLp);
        zapper.configureLpToken(ethLp, true);

        vm.startPrank(alice);
        vm.deal(alice, 1e18);
        vm.expectRevert();
        zapper.depositAndStake{ value: 1e12 + 1 }(ethLp, 1e12 + 1, 1e12);
    }

    function test_revert_depositAndStakeEthPool_insufficientValue() external {
        _addToken(ethLp);
        zapper.configureLpToken(ethLp, true);

        vm.startPrank(alice);
        vm.deal(alice, 1e18);
        vm.expectRevert(
            abi.encodeWithSelector(IStargateZapperV1.StargateZapperV1__IncorrectNative.selector, 1e18 - 1, 1e18)
        );
        zapper.depositAndStake{ value: 1e18 - 1 }(ethLp, 1e18, 1e18);
    }

    function test_withdrawToAndCall() external {
        _addToken(lpToken);
        zapper.configureLpToken(lpToken, true);

        token1.mint(alice, 2e18);
        uint256 token1BalanceBefore = token1.balanceOf(alice);
        assertEq(staking.balanceOf(lpToken, alice), 0);
        vm.startPrank(alice);
        token1.approve(address(zapper), 2e18);
        zapper.depositAndStake(lpToken, 1e18, 1e18);
        assertEq(token1.balanceOf(alice), token1BalanceBefore - 1e18);
        assertEq(staking.balanceOf(lpToken, alice), 1e18);

        uint256 amount = 0.4 * 1e18;
        staking.withdrawToAndCall(lpToken, zapper, amount, abi.encodePacked(amount));
        assertEq(staking.balanceOf(lpToken, alice), 1e18 - amount);
        assertEq(token1.balanceOf(alice), token1BalanceBefore - 1e18 + amount);

        staking.withdrawToAndCall(lpToken, zapper, 1e18 - amount, abi.encodePacked(1e18 - amount - 1000));
        assertEq(staking.balanceOf(lpToken, alice), 0);
        assertEq(token1.balanceOf(alice), token1BalanceBefore);
    }

    function test_revert_withdrawToAndCallZero() external {
        _addToken(lpToken);
        zapper.configureLpToken(lpToken, true);

        token1.mint(alice, 2e18);
        vm.startPrank(alice);
        token1.approve(address(zapper), 2e18);
        zapper.depositAndStake(lpToken, 1e18, 1e18);
        vm.expectRevert(IStargateZapperV1.StargateZapperV1__ZeroAmount.selector);
        uint256 amount = 0;
        staking.withdrawToAndCall(lpToken, zapper, amount, abi.encodePacked(amount));
    }

    function test_withdrawToAndCallEthPool() external {
        _addToken(ethLp);
        zapper.configureLpToken(ethLp, true);

        vm.startPrank(alice);
        vm.deal(alice, 1e18);
        zapper.depositAndStake{ value: 1e18 }(ethLp, 1e18, 1e18);
        assertEq(staking.balanceOf(ethLp, alice), 1e18);

        uint256 amount = 0.4 * 1e18;
        staking.withdrawToAndCall(ethLp, zapper, amount, abi.encodePacked(amount));
        assertEq(staking.balanceOf(ethLp, alice), 1e18 - amount);

        staking.withdrawToAndCall(ethLp, zapper, 1e18 - amount, abi.encodePacked(1e18 - amount - 1000));
        assertEq(staking.balanceOf(ethLp, alice), 0);
    }

    function test_revert_withdrawToAndCallEthPoolSlippage() external {
        _addToken(ethLp);
        zapper.configureLpToken(ethLp, true);

        vm.startPrank(alice);
        vm.deal(alice, 1e18);
        zapper.depositAndStake{ value: 1e18 }(ethLp, 1e18, 1e18);
        assertEq(staking.balanceOf(ethLp, alice), 1e18);

        uint256 amount = 0.4 * 1e18;

        vm.expectRevert(
            abi.encodeWithSelector(
                IStargateZapperV1.StargateZapperV1__InsufficientOutputAmount.selector,
                amount,
                amount + 1
            )
        );
        staking.withdrawToAndCall(ethLp, zapper, amount, abi.encodePacked(amount + 1));
    }

    function test_revert_withdrawToAndCallSlippage() external {
        _addToken(lpToken);
        zapper.configureLpToken(lpToken, true);

        token1.mint(alice, 2e18);
        uint256 token1BalanceBefore = token1.balanceOf(alice);
        assertEq(staking.balanceOf(lpToken, alice), 0);
        vm.startPrank(alice);
        token1.approve(address(zapper), 2e18);
        zapper.depositAndStake(lpToken, 1e18, 1e18);
        assertEq(token1.balanceOf(alice), token1BalanceBefore - 1e18);
        assertEq(staking.balanceOf(lpToken, alice), 1e18);

        uint256 amount = 0.4 * 1e18;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStargateZapperV1.StargateZapperV1__InsufficientOutputAmount.selector,
                amount,
                amount + 1
            )
        );
        staking.withdrawToAndCall(lpToken, zapper, amount, abi.encodePacked(amount + 1));
    }

    function test_revert_withdrawToAndCallBadData() external {
        _addToken(lpToken);
        zapper.configureLpToken(lpToken, true);

        token1.mint(alice, 2e18);
        uint256 token1BalanceBefore = token1.balanceOf(alice);
        assertEq(staking.balanceOf(lpToken, alice), 0);
        vm.startPrank(alice);
        token1.approve(address(zapper), 2e18);
        zapper.depositAndStake(lpToken, 1e18, 1e18);
        assertEq(token1.balanceOf(alice), token1BalanceBefore - 1e18);
        assertEq(staking.balanceOf(lpToken, alice), 1e18);

        uint256 amount = 0.4 * 1e18;
        vm.expectRevert();
        staking.withdrawToAndCall(lpToken, zapper, amount, abi.encodePacked(bob)); // Note We can pack bytes after "value" and it would still pass, as these are simply ignored in abi.decode
    }

    function test_revert_onWithdrawReceivedUnauthorized() external {
        bytes memory data;
        vm.expectRevert(IStargateZapperV1.StargateZapperV1__OnlyCallableByStaking.selector);
        zapper.onWithdrawReceived(lpToken, alice, 123, data);
        vm.startPrank(alice);
        vm.expectRevert(IStargateZapperV1.StargateZapperV1__OnlyCallableByStaking.selector);
        zapper.onWithdrawReceived(lpToken, alice, 123, data);
        vm.expectRevert(IStargateZapperV1.StargateZapperV1__OnlyCallableByStaking.selector);
        zapper.onWithdrawReceived(lpToken, bob, 123, data);
        vm.startPrank(bob);
        vm.expectRevert(IStargateZapperV1.StargateZapperV1__OnlyCallableByStaking.selector);
        zapper.onWithdrawReceived(lpToken, bob, 123, data);
    }

    function test_revert_migrateNoPoolIdConfigured() external {
        _addToken(usdtLp);
        zapper.configureLpToken(usdtLp, true);

        deal(address(usdt), alice, 1e18);
        vm.startPrank(alice);
        usdt.forceApprove(address(routerV1), 1e10);
        routerV1.addLiquidity(usdtPID, 1000 * 1e6, alice);

        vm.expectRevert(abi.encodeWithSelector(IStargateZapperV1.StargateZapperV1__InvalidPoolId.selector, usdtPID));
        zapper.migrateV1LpToV2Stake(usdtPID, 1000 * 1e6, 1000 * 1e6);
    }

    function test_revert_migrateNoApproval() external {
        _addToken(usdtLp);
        zapper.configureLpToken(usdtLp, true);
        zapper.configureV1Pool(usdtPID, usdtLp);

        deal(address(usdt), alice, 1e18);
        vm.startPrank(alice);
        usdt.forceApprove(address(routerV1), 1e10);
        routerV1.addLiquidity(usdtPID, 1000 * 1e6, alice);

        vm.expectRevert("SafeMath: subtraction overflow");
        zapper.migrateV1LpToV2Stake(usdtPID, 1000 * 1e6, 1000 * 1e6);
    }

    function test_revert_migrateNoBalance() external {
        _addToken(usdtLp);
        zapper.configureLpToken(usdtLp, true);
        zapper.configureV1Pool(usdtPID, usdtLp);

        deal(address(usdt), alice, 1e18);
        vm.startPrank(alice);
        usdt.forceApprove(address(routerV1), 1e10);
        // routerV1.addLiquidity(usdtPID, 1000* 1e6, alice);

        usdtLpV1.approve(address(zapper), 1e18);
        uint256 bal = 1000 * 1e6;
        vm.expectRevert();
        zapper.migrateV1LpToV2Stake(usdtPID, bal, 1000 * 1e6 - 1); // @note 1 is removed presumably due to rounding in the LP addition.
    }

    function test_migrate() external {
        _addToken(usdtLp);
        zapper.configureLpToken(usdtLp, true);
        zapper.configureV1Pool(usdtPID, usdtLp);

        deal(address(usdt), alice, 1e18);
        vm.startPrank(alice);
        usdt.forceApprove(address(routerV1), 1e10);
        routerV1.addLiquidity(usdtPID, 1000 * 1e6, alice);

        usdtLpV1.approve(address(zapper), 1e18);
        zapper.migrateV1LpToV2Stake(usdtPID, usdtLpV1.balanceOf(alice), 1000 * 1e6 - 1); // @note 1 is removed presumably due to rounding in the LP addition.
        assertEq(staking.balanceOf(usdtLp, alice), 1000 * 1e6 - 1);
        assertEq(usdt.balanceOf(alice), 1e18 - 1000 * 1e6);

        routerV1.addLiquidity(usdtPID, 1000 * 1e6, alice);

        vm.startPrank(address(this));
        zapper.configureV1Pool(usdtPID, IERC20(address(0)));

        vm.startPrank(alice);
        uint256 bal = usdtLpV1.balanceOf(alice);
        vm.expectRevert(abi.encodeWithSelector(IStargateZapperV1.StargateZapperV1__InvalidPoolId.selector, usdtPID));
        zapper.migrateV1LpToV2Stake(usdtPID, bal, 1000 * 1e6 - 1);
    }

    function test_revert_migrateZero() external {
        _addToken(usdtLp);
        zapper.configureLpToken(usdtLp, true);
        zapper.configureV1Pool(usdtPID, usdtLp);

        deal(address(usdt), alice, 1e18);
        vm.startPrank(alice);
        usdt.forceApprove(address(routerV1), 1e10);
        routerV1.addLiquidity(usdtPID, 1000 * 1e6, alice);

        usdtLpV1.approve(address(zapper), 1e18);
        vm.expectRevert(IStargateZapperV1.StargateZapperV1__ZeroAmount.selector);
        zapper.migrateV1LpToV2Stake(usdtPID, 0, 0);
    }

    function test_revert_configureWrongV1Pool() external {
        _addToken(usdtLp);
        zapper.configureLpToken(usdtLp, true);
        zapper.configureLpToken(ethLp, true);
        vm.expectRevert(abi.encodeWithSelector(IStargateZapperV1.StargateZapperV1__UnknownLpToken.selector, ethLp));
        zapper.configureV1Pool(usdtPID, ethLp);
        vm.expectRevert(abi.encodeWithSelector(IStargateZapperV1.StargateZapperV1__UnknownLpToken.selector, usdtLp));
        zapper.configureV1Pool(wethPID, usdtLp);
    }
    function test_migrateEthPool() external {
        _addToken(ethLp);
        zapper.configureLpToken(ethLp, true);
        assertEq(address(zapper.lpToAsset(ethLp)), 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
        zapper.configureV1Pool(wethPID, ethLp);

        deal(address(ethVault), alice, 1e18);
        vm.startPrank(alice);
        IERC20(address(ethVault)).forceApprove(address(routerV1), 1e18);
        routerV1.addLiquidity(wethPID, 1e18, alice);

        wethLpV1.approve(address(zapper), 1e18);
        zapper.migrateV1LpToV2Stake(wethPID, wethLpV1.balanceOf(alice), 1e18 - 1e12); // @note due to the rounding in the LP pools, we can only provide granularity of 1e6, hence we need to truncate 12 decimals.
        assertEq(staking.balanceOf(ethLp, alice), 1e18 - 1e12);
        assertEq(address(zapper).balance, 1e12 - 1); // @note 1 weth got lost during the `addLiquidity` V1 rounding
    }

    function test_revert_migrateSlippage() external {
        _addToken(usdtLp);
        zapper.configureLpToken(usdtLp, true);
        zapper.configureV1Pool(usdtPID, usdtLp);

        deal(address(usdt), alice, 1e18);
        vm.startPrank(alice);
        usdt.forceApprove(address(routerV1), 1e10);
        routerV1.addLiquidity(usdtPID, 1000 * 1e6, alice);

        usdtLpV1.approve(address(zapper), 1e18);
        uint256 bal = usdtLpV1.balanceOf(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStargateZapperV1.StargateZapperV1__InsufficientOutputAmount.selector,
                1000 * 1e6 - 1,
                1000 * 1e6
            )
        );
        zapper.migrateV1LpToV2Stake(usdtPID, bal, 1000 * 1e6); // @note 1 is removed presumably due to rounding in the LP addition.
    }

    receive() external payable {}
}
