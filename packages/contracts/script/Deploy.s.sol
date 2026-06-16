// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {CovenantRegistry} from "../src/CovenantRegistry.sol";
import {DecisionLog} from "../src/DecisionLog.sol";
import {ReputationRegistry} from "../src/ReputationRegistry.sol";
import {GuardedExecutor} from "../src/GuardedExecutor.sol";

contract Deploy is Script {
    struct Deployment {
        IdentityRegistry identityRegistry;
        CovenantRegistry covenantRegistry;
        DecisionLog decisionLog;
        ReputationRegistry reputationRegistry;
        GuardedExecutor guardedExecutor;
    }

    function run() external returns (Deployment memory deployment) {
        address deployer = vm.envOr("DEPLOYER_ADDRESS", msg.sender);
        address oracle = vm.envOr("ORACLE_ADDRESS", deployer);
        address attester = vm.envOr("ATTESTER_ADDRESS", deployer);

        vm.startBroadcast(deployer);

        deployment.identityRegistry = new IdentityRegistry(deployer);
        deployment.covenantRegistry = new CovenantRegistry(address(deployment.identityRegistry));
        deployment.decisionLog = new DecisionLog(deployer);
        deployment.reputationRegistry =
            new ReputationRegistry(deployer, address(deployment.decisionLog), oracle);
        deployment.guardedExecutor = new GuardedExecutor(
            deployer,
            address(deployment.decisionLog),
            address(deployment.covenantRegistry),
            address(deployment.identityRegistry),
            attester
        );

        deployment.decisionLog.setAuthorizedWriter(address(deployment.guardedExecutor), true);

        vm.stopBroadcast();
    }
}
