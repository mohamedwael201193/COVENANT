// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IdentityRegistry} from "../../src/IdentityRegistry.sol";
import {CovenantRegistry} from "../../src/CovenantRegistry.sol";
import {DecisionLog} from "../../src/DecisionLog.sol";
import {ReputationRegistry} from "../../src/ReputationRegistry.sol";
import {GuardedExecutor} from "../../src/GuardedExecutor.sol";
import {IDecisionLog} from "../../src/interfaces/IDecisionLog.sol";
import {IGuardedExecutor} from "../../src/interfaces/IGuardedExecutor.sol";

abstract contract CovenantTestBase is Test {
    IdentityRegistry internal identityRegistry;
    CovenantRegistry internal covenantRegistry;
    DecisionLog public decisionLog;
    ReputationRegistry internal reputationRegistry;
    GuardedExecutor public guardedExecutor;

    address public owner = makeAddr("owner");
    address public agent = makeAddr("agent");
    address internal oracle = makeAddr("oracle");
    address internal attester;

    bytes32 internal constant COVENANT_HASH = keccak256("covenant-json");
    bytes32 internal constant TIER_CURVE_REF = keccak256("tier-curve");
    string internal constant IPFS_URI = "ipfs://covenant";

    bytes32 internal constant ALLOW_ATTESTATION_TYPEHASH = keccak256(
        "AllowAttestation(address agent,bytes32 intentHash,bytes32 covenantHash,uint8 verdict,uint256 deadline)"
    );

    function setUp() public virtual {
        attester = vm.addr(0xA77E57);

        identityRegistry = new IdentityRegistry(address(this));
        covenantRegistry = new CovenantRegistry(address(identityRegistry));
        decisionLog = new DecisionLog(address(this));
        reputationRegistry = new ReputationRegistry(address(this), address(decisionLog), oracle);
        guardedExecutor = new GuardedExecutor(
            address(this),
            address(decisionLog),
            address(covenantRegistry),
            address(identityRegistry),
            attester
        );

        decisionLog.setAuthorizedWriter(address(guardedExecutor), true);
    }

    function _registerAgent(address agentOwner, address agentKey) internal {
        vm.prank(agentOwner);
        identityRegistry.register(agentKey, "ipfs://agent-metadata");
    }

    function _setCovenant(address agentOwner, address agentKey) internal {
        vm.prank(agentOwner);
        covenantRegistry.setCovenant(agentKey, COVENANT_HASH, TIER_CURVE_REF, IPFS_URI);
    }

    function _domainSeparator() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("COVENANT")),
                keccak256(bytes("1")),
                block.chainid,
                address(guardedExecutor)
            )
        );
    }

    function _allowAttestationDigest(
        address agentKey,
        bytes32 intentHash,
        bytes32 covenantHash,
        uint256 deadline
    ) internal view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                ALLOW_ATTESTATION_TYPEHASH,
                agentKey,
                intentHash,
                covenantHash,
                uint8(IDecisionLog.Verdict.ALLOW),
                deadline
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", _domainSeparator(), structHash));
    }

    function _signAllowAttestation(
        bytes32 digest,
        uint256 privateKey
    ) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        (v, r, s) = vm.sign(privateKey, digest);
    }

    function _buildIntent(
        address agentKey,
        address target,
        bytes memory data,
        uint256 value,
        uint256 nonce
    ) internal pure returns (IGuardedExecutor.Intent memory) {
        return IGuardedExecutor.Intent({
            agent: agentKey,
            target: target,
            data: data,
            value: value,
            nonce: nonce
        });
    }

    function _executeWithAllowAttestation(
        IGuardedExecutor.Intent memory intent,
        uint256 deadline
    ) internal returns (bytes memory result) {
        bytes32 intentHash = guardedExecutor.computeIntentHash(intent);
        bytes32 digest = _allowAttestationDigest(intent.agent, intentHash, COVENANT_HASH, deadline);
        (uint8 v, bytes32 r, bytes32 s) = _signAllowAttestation(digest, 0xA77E57);

        if (intent.value > 0) {
            vm.deal(address(this), intent.value);
            return guardedExecutor.execute{value: intent.value}(intent, COVENANT_HASH, deadline, v, r, s);
        }

        return guardedExecutor.execute(intent, COVENANT_HASH, deadline, v, r, s);
    }

    function _signExecution(
        IGuardedExecutor.Intent memory intent,
        bytes32 covenantHash,
        uint256 deadline
    ) internal view returns (uint8 v, bytes32 r, bytes32 s) {
        bytes32 intentHash = guardedExecutor.computeIntentHash(intent);
        bytes32 digest = _allowAttestationDigest(intent.agent, intentHash, covenantHash, deadline);
        return _signAllowAttestation(digest, 0xA77E57);
    }
}

contract MockTarget {
    uint256 public value;
    event Updated(uint256 newValue);

    function setValue(uint256 newValue) external payable {
        value = newValue;
        emit Updated(newValue);
    }
}
