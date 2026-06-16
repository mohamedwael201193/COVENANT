// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {CovenantTestBase, MockTarget} from "../helpers/CovenantTestBase.sol";
import {IGuardedExecutor} from "../../src/interfaces/IGuardedExecutor.sol";

/// @notice Fuzz handler that only submits signed ALLOW attestations with fresh nonces.
contract GuardedExecutorHandler is CovenantTestBase {
    MockTarget public target;

    uint256 public successfulExecutions;
    bool private _initialized;

    function setUp() public override {
        if (_initialized) {
            return;
        }
        _initialized = true;

        super.setUp();
        target = new MockTarget();
        _registerAgent(owner, agent);
        _setCovenant(owner, agent);
    }

    function attemptValidExecution(uint256 newValue, uint256 deadlineOffset) external {
        vm.assume(deadlineOffset < 1 days);

        uint256 nonce = successfulExecutions;

        IGuardedExecutor.Intent memory intent = _buildIntent(
            agent,
            address(target),
            abi.encodeWithSelector(MockTarget.setValue.selector, newValue),
            0,
            nonce
        );

        uint256 deadline = block.timestamp + deadlineOffset + 1;
        bytes32 intentHash = guardedExecutor.computeIntentHash(intent);
        bytes32 digest = _allowAttestationDigest(intent.agent, intentHash, COVENANT_HASH, deadline);
        (uint8 v, bytes32 r, bytes32 s) = _signAllowAttestation(digest, 0xA77E57);

        guardedExecutor.execute(intent, COVENANT_HASH, deadline, v, r, s);
        successfulExecutions++;
    }
}

contract GuardedExecutorInvariantTest is StdInvariant, Test {
    GuardedExecutorHandler internal handler;

    function setUp() public {
        handler = new GuardedExecutorHandler();
        handler.setUp();

        targetContract(address(handler));
        excludeSelector(
            FuzzSelector({addr: address(handler), selectors: _excludeSetUpSelector()})
        );
    }

    function _excludeSetUpSelector() private pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](1);
        selectors[0] = GuardedExecutorHandler.setUp.selector;
    }

    /// @dev Monotonic nonces 0..n-1 are consumed for n successful executions.
    function invariant_executionsAlwaysConsumeFreshNonce() public view {
        uint256 successes = handler.successfulExecutions();
        if (successes == 0) {
            assertFalse(handler.guardedExecutor().usedNonces(handler.agent(), 0));
            return;
        }

        assertTrue(handler.guardedExecutor().usedNonces(handler.agent(), successes - 1));
        assertFalse(handler.guardedExecutor().usedNonces(handler.agent(), successes));
    }

    /// @dev Each successful execution produces exactly one DecisionLog receipt.
    function invariant_noExecutionWithoutValidAllow() public view {
        assertEq(handler.decisionLog().nextId(), handler.successfulExecutions());
    }
}
