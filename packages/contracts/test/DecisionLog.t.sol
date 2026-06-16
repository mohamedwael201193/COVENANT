// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CovenantTestBase} from "./helpers/CovenantTestBase.sol";
import {IDecisionLog} from "../src/interfaces/IDecisionLog.sol";

contract DecisionLogTest is CovenantTestBase {
    function test_logDecision_success() public {
        bytes32 intentHash = keccak256("intent");
        bytes32 reasonHash = keccak256("reason");
        bytes32 outcomeHash = keccak256("outcome");

        vm.expectEmit(true, true, true, true);
        emit IDecisionLog.DecisionLogged(0, agent, intentHash, IDecisionLog.Verdict.ALLOW, reasonHash, outcomeHash);

        vm.prank(address(guardedExecutor));
        uint256 id = decisionLog.logDecision(
            agent, intentHash, IDecisionLog.Verdict.ALLOW, reasonHash, outcomeHash
        );

        assertEq(id, 0);
        assertEq(decisionLog.nextId(), 1);

        (address loggedAgent, bytes32 loggedIntent, IDecisionLog.Verdict verdict,,,) =
            decisionLog.decisions(0);
        assertEq(loggedAgent, agent);
        assertEq(loggedIntent, intentHash);
        assertEq(uint8(verdict), uint8(IDecisionLog.Verdict.ALLOW));
    }

    function test_logDecision_revertsForUnauthorizedWriter() public {
        vm.prank(owner);
        vm.expectRevert(bytes("DecisionLog: unauthorized"));
        decisionLog.logDecision(agent, keccak256("intent"), IDecisionLog.Verdict.DENY, bytes32(0), bytes32(0));
    }

    function test_setAuthorizedWriter() public {
        address writer = makeAddr("writer");

        vm.expectEmit(true, false, false, true);
        emit IDecisionLog.AuthorizedWriterUpdated(writer, true);
        decisionLog.setAuthorizedWriter(writer, true);

        assertTrue(decisionLog.authorizedWriters(writer));
    }

    function testFuzz_monotonicIds(address agentKey, bytes32 intentHash) public {
        vm.assume(agentKey != address(0));
        vm.assume(intentHash != bytes32(0));

        vm.startPrank(address(guardedExecutor));
        uint256 firstId = decisionLog.logDecision(
            agentKey, intentHash, IDecisionLog.Verdict.WARN, bytes32(0), bytes32(0)
        );
        uint256 secondId = decisionLog.logDecision(
            agentKey, intentHash, IDecisionLog.Verdict.DENY, bytes32(0), bytes32(0)
        );
        vm.stopPrank();

        assertEq(secondId, firstId + 1);
        assertEq(decisionLog.nextId(), secondId + 1);
    }
}
