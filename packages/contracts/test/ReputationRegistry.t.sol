// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CovenantTestBase} from "./helpers/CovenantTestBase.sol";
import {IReputationRegistry} from "../src/interfaces/IReputationRegistry.sol";
import {IDecisionLog} from "../src/interfaces/IDecisionLog.sol";

contract ReputationRegistryTest is CovenantTestBase {
    function setUp() public override {
        super.setUp();
        _registerAgent(owner, agent);
    }

    function _logDecisionForAgent() internal returns (uint256 decisionId) {
        vm.prank(address(guardedExecutor));
        decisionId = decisionLog.logDecision(
            agent, keccak256("intent"), IDecisionLog.Verdict.ALLOW, bytes32(0), keccak256("outcome")
        );
    }

    function test_updateScore_success() public {
        uint256 decisionId = _logDecisionForAgent();
        uint256[] memory decisionIds = new uint256[](1);
        decisionIds[0] = decisionId;

        vm.expectEmit(true, false, false, true);
        emit IReputationRegistry.ReputationUpdated(agent, 900, 3, decisionIds);

        vm.prank(oracle);
        reputationRegistry.updateScore(agent, 900, 3, decisionIds);

        (uint256 score, uint8 tier,) = reputationRegistry.reputations(agent);
        assertEq(score, 900);
        assertEq(tier, 3);
    }

    function test_updateScore_revertsForNonOracle() public {
        uint256[] memory decisionIds = new uint256[](1);
        decisionIds[0] = 0;

        vm.prank(owner);
        vm.expectRevert(bytes("ReputationRegistry: not oracle"));
        reputationRegistry.updateScore(agent, 100, 1, decisionIds);
    }

    function test_updateScore_revertsOnInvalidDecisionId() public {
        uint256[] memory decisionIds = new uint256[](1);
        decisionIds[0] = 999;

        vm.prank(oracle);
        vm.expectRevert(bytes("ReputationRegistry: invalid decision id"));
        reputationRegistry.updateScore(agent, 100, 1, decisionIds);
    }

    function test_updateScore_revertsOnAgentMismatch() public {
        uint256 decisionId = _logDecisionForAgent();
        uint256[] memory decisionIds = new uint256[](1);
        decisionIds[0] = decisionId;

        vm.prank(oracle);
        vm.expectRevert(bytes("ReputationRegistry: agent mismatch"));
        reputationRegistry.updateScore(makeAddr("other"), 100, 1, decisionIds);
    }

    function testFuzz_updateScore(uint256 score, uint8 tier) public {
        uint256 decisionId = _logDecisionForAgent();
        uint256[] memory decisionIds = new uint256[](1);
        decisionIds[0] = decisionId;

        vm.prank(oracle);
        reputationRegistry.updateScore(agent, score, tier, decisionIds);

        (uint256 storedScore, uint8 storedTier,) = reputationRegistry.reputations(agent);
        assertEq(storedScore, score);
        assertEq(storedTier, tier);
    }
}
