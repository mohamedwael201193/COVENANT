// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CovenantTestBase, MockTarget} from "./helpers/CovenantTestBase.sol";
import {IGuardedExecutor} from "../src/interfaces/IGuardedExecutor.sol";
import {IDecisionLog} from "../src/interfaces/IDecisionLog.sol";

contract GuardedExecutorTest is CovenantTestBase {
    MockTarget internal target;
    uint256 internal constant ATTESTER_PRIVATE_KEY = 0xA77E57;

    function setUp() public override {
        super.setUp();
        target = new MockTarget();
        _registerAgent(owner, agent);
        _setCovenant(owner, agent);
    }

    function test_computeIntentHash() public view {
        IGuardedExecutor.Intent memory intent =
            _buildIntent(agent, address(target), abi.encodeWithSelector(MockTarget.setValue.selector, 42), 0, 1);

        bytes32 expected = keccak256(
            abi.encode(
                intent.agent,
                intent.target,
                keccak256(intent.data),
                intent.value,
                intent.nonce
            )
        );
        assertEq(guardedExecutor.computeIntentHash(intent), expected);
    }

    function test_execute_success() public {
        IGuardedExecutor.Intent memory intent =
            _buildIntent(agent, address(target), abi.encodeWithSelector(MockTarget.setValue.selector, 42), 0, 1);
        uint256 deadline = block.timestamp + 1 hours;

        _executeWithAllowAttestation(intent, deadline);

        assertEq(target.value(), 42);
        assertTrue(guardedExecutor.usedNonces(agent, 1));
        assertEq(decisionLog.nextId(), 1);
    }

    function test_execute_revertsOnExpiredDeadline() public {
        IGuardedExecutor.Intent memory intent =
            _buildIntent(agent, address(target), abi.encodeWithSelector(MockTarget.setValue.selector, 1), 0, 2);
        uint256 deadline = block.timestamp + 1 hours;

        vm.warp(block.timestamp + 2 hours);

        (uint8 v, bytes32 r, bytes32 s) = _signExecution(intent, COVENANT_HASH, deadline);

        vm.expectRevert(IGuardedExecutor.CovenantBreach.selector);
        guardedExecutor.execute(intent, COVENANT_HASH, deadline, v, r, s);
    }

    function test_execute_revertsOnReusedNonce() public {
        IGuardedExecutor.Intent memory intent =
            _buildIntent(agent, address(target), abi.encodeWithSelector(MockTarget.setValue.selector, 7), 0, 3);
        uint256 deadline = block.timestamp + 1 hours;

        _executeWithAllowAttestation(intent, deadline);

        (uint8 v, bytes32 r, bytes32 s) = _signExecution(intent, COVENANT_HASH, deadline);

        vm.expectRevert(IGuardedExecutor.CovenantBreach.selector);
        guardedExecutor.execute(intent, COVENANT_HASH, deadline, v, r, s);
    }

    function test_execute_revertsOnWrongSigner() public {
        IGuardedExecutor.Intent memory intent =
            _buildIntent(agent, address(target), abi.encodeWithSelector(MockTarget.setValue.selector, 9), 0, 4);
        bytes32 intentHash = guardedExecutor.computeIntentHash(intent);
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 digest = _allowAttestationDigest(intent.agent, intentHash, COVENANT_HASH, deadline);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(0xBEEF, digest);

        vm.expectRevert(IGuardedExecutor.CovenantBreach.selector);
        guardedExecutor.execute(intent, COVENANT_HASH, deadline, v, r, s);
    }

    function test_execute_revertsOnWrongCovenantHash() public {
        IGuardedExecutor.Intent memory intent =
            _buildIntent(agent, address(target), abi.encodeWithSelector(MockTarget.setValue.selector, 11), 0, 5);
        bytes32 intentHash = guardedExecutor.computeIntentHash(intent);
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 wrongHash = keccak256("wrong");
        bytes32 digest = _allowAttestationDigest(intent.agent, intentHash, wrongHash, deadline);
        (uint8 v, bytes32 r, bytes32 s) = _signAllowAttestation(digest, ATTESTER_PRIVATE_KEY);

        vm.expectRevert(IGuardedExecutor.CovenantBreach.selector);
        guardedExecutor.execute(intent, wrongHash, deadline, v, r, s);
    }

    function test_execute_revertsForRevokedAgent() public {
        vm.prank(owner);
        identityRegistry.revoke();

        IGuardedExecutor.Intent memory intent =
            _buildIntent(agent, address(target), abi.encodeWithSelector(MockTarget.setValue.selector, 13), 0, 6);

        (uint8 v, bytes32 r, bytes32 s) = _signExecution(intent, COVENANT_HASH, block.timestamp + 1 hours);

        vm.expectRevert(IGuardedExecutor.CovenantBreach.selector);
        guardedExecutor.execute(intent, COVENANT_HASH, block.timestamp + 1 hours, v, r, s);
    }

    function test_setAttester() public {
        address newAttester = makeAddr("newAttester");

        vm.expectEmit(true, true, false, false);
        emit IGuardedExecutor.AttesterUpdated(attester, newAttester);
        guardedExecutor.setAttester(newAttester);

        assertEq(guardedExecutor.attester(), newAttester);
    }

    function testFuzz_executeWithValidAttestation(uint256 newValue, uint256 nonce) public {
        vm.assume(nonce < type(uint128).max);
        vm.assume(!guardedExecutor.usedNonces(agent, nonce));

        IGuardedExecutor.Intent memory intent = _buildIntent(
            agent,
            address(target),
            abi.encodeWithSelector(MockTarget.setValue.selector, newValue),
            0,
            nonce
        );

        _executeWithAllowAttestation(intent, block.timestamp + 1 hours);
        assertEq(target.value(), newValue);
    }

    function testFuzz_computeIntentHash(
        address agentKey,
        address targetAddr,
        bytes calldata data,
        uint256 value,
        uint256 nonce
    ) public view {
        IGuardedExecutor.Intent memory intent =
            IGuardedExecutor.Intent({agent: agentKey, target: targetAddr, data: data, value: value, nonce: nonce});

        bytes32 expected = keccak256(abi.encode(agentKey, targetAddr, keccak256(data), value, nonce));
        assertEq(guardedExecutor.computeIntentHash(intent), expected);
    }
}

contract GuardedExecutorDenyAttestationTest is CovenantTestBase {
    MockTarget internal target;

    function setUp() public override {
        super.setUp();
        target = new MockTarget();
        _registerAgent(owner, agent);
        _setCovenant(owner, agent);
    }

    function test_execute_revertsOnDenyVerdictInSignature() public {
        IGuardedExecutor.Intent memory intent =
            _buildIntent(agent, address(target), abi.encodeWithSelector(MockTarget.setValue.selector, 99), 0, 7);
        bytes32 intentHash = guardedExecutor.computeIntentHash(intent);
        uint256 deadline = block.timestamp + 1 hours;

        bytes32 structHash = keccak256(
            abi.encode(
                ALLOW_ATTESTATION_TYPEHASH,
                intent.agent,
                intentHash,
                COVENANT_HASH,
                uint8(IDecisionLog.Verdict.DENY),
                deadline
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", _domainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = _signAllowAttestation(digest, 0xA77E57);

        vm.expectRevert(IGuardedExecutor.CovenantBreach.selector);
        guardedExecutor.execute(intent, COVENANT_HASH, deadline, v, r, s);
    }
}
