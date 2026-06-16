// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";

/// @notice Prints deployed addresses for manual explorer verification.
/// Run: forge script script/Verify.s.sol:Verify --rpc-url $PHAROS_RPC_URL
contract Verify is Script {
    function run() external view {
        console.log("IdentityRegistry", vm.envAddress("IDENTITY_REGISTRY_ADDRESS"));
        console.log("CovenantRegistry", vm.envAddress("COVENANT_REGISTRY_ADDRESS"));
        console.log("DecisionLog", vm.envAddress("DECISION_LOG_ADDRESS"));
        console.log("ReputationRegistry", vm.envAddress("REPUTATION_REGISTRY_ADDRESS"));
        console.log("GuardedExecutor", vm.envAddress("GUARDED_EXECUTOR_ADDRESS"));
        console.log("Explorer", vm.envOr("PHAROS_EXPLORER_URL", string("https://atlantic.pharosscan.xyz")));
    }
}
