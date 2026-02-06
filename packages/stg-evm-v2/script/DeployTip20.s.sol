// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import { Tip20Config, Tip20AssetsConfig } from "script/Tip20Constants.sol";

// forge script script/DeployTip20.s.sol:DeployTip20 \
//   --sig "run(string)" <usdc|eurc> \
//   --rpc-url <RPC_URL> -vvvv
contract DeployTip20 is Script {
    uint256 internal PK = vm.envUint("PRIVATE_KEY");
    address internal CALLER = vm.addr(PK);

    // TIP-20 Factory precompile on Tempo mainnet
    address public constant TIP20_FACTORY = 0x20Fc000000000000000000000000000000000000;

    function run(string memory asset) public {
        Tip20Config memory config = Tip20AssetsConfig.load(asset);

        address owner = CALLER;

        if (config.quote == address(0)) revert("Quote token missing");

        console2.log("TIP-20 Factory:", TIP20_FACTORY);
        console2.log("Creating TIP-20 token:");
        console2.log("  name:", config.name);
        console2.log("  symbol:", config.symbol);
        console2.log("  currency:", config.currency);
        console2.log("  quoteToken:", config.quote);
        console2.log("  owner:", owner);
        console2.logBytes32(config.salt);

        vm.startBroadcast(PK);
        // Deploy via factory and retrieve returned token address
        address deployed = ITip20Factory(TIP20_FACTORY).createToken(
            config.name,
            config.symbol,
            config.currency,
            config.quote,
            owner,
            config.salt
        );
        console2.log("createToken() returned:", deployed);
        vm.stopBroadcast();
    }
}

interface ITip20Factory {
    function createToken(
        string calldata name,
        string calldata symbol,
        string calldata currency,
        address quoteToken,
        address owner,
        bytes32 salt
    ) external returns (address token);
}
