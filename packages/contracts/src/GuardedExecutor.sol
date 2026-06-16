// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {IDecisionLog} from "./interfaces/IDecisionLog.sol";
import {ICovenantRegistry} from "./interfaces/ICovenantRegistry.sol";
import {IIdentityRegistry} from "./interfaces/IIdentityRegistry.sol";
import {IGuardedExecutor} from "./interfaces/IGuardedExecutor.sol";
/// @notice Executes agent intents only when backed by a fresh ALLOW attestation.
contract GuardedExecutor is IGuardedExecutor, EIP712, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    bytes32 private constant ALLOW_ATTESTATION_TYPEHASH = keccak256(
        "AllowAttestation(address agent,bytes32 intentHash,bytes32 covenantHash,uint8 verdict,uint256 deadline)"
    );

    IDecisionLog public immutable override decisionLog;
    ICovenantRegistry public immutable override covenantRegistry;
    IIdentityRegistry public immutable override identityRegistry;

    address public override attester;

    mapping(address agent => mapping(uint256 nonce => bool used)) public override usedNonces;

    constructor(
        address initialOwner,
        address decisionLog_,
        address covenantRegistry_,
        address identityRegistry_,
        address attester_
    ) EIP712("COVENANT", "1") Ownable(initialOwner) {
        require(decisionLog_ != address(0), "GuardedExecutor: zero log");
        require(covenantRegistry_ != address(0), "GuardedExecutor: zero registry");
        require(identityRegistry_ != address(0), "GuardedExecutor: zero identity");
        require(attester_ != address(0), "GuardedExecutor: zero attester");

        decisionLog = IDecisionLog(decisionLog_);
        covenantRegistry = ICovenantRegistry(covenantRegistry_);
        identityRegistry = IIdentityRegistry(identityRegistry_);
        attester = attester_;
    }

    /// @inheritdoc IGuardedExecutor
    function computeIntentHash(Intent calldata intent) public pure returns (bytes32 intentHash) {
        return keccak256(
            abi.encode(intent.agent, intent.target, keccak256(intent.data), intent.value, intent.nonce)
        );
    }

    /// @inheritdoc IGuardedExecutor
    function execute(
        Intent calldata intent,
        bytes32 covenantHash,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable nonReentrant returns (bytes memory result) {
        bytes32 intentHash = computeIntentHash(intent);

        if (!_isValidAllowAttestation(intent, intentHash, covenantHash, deadline, v, r, s)) {
            emit CovenantBreached(intent.agent, intentHash);
            revert CovenantBreach();
        }

        usedNonces[intent.agent][intent.nonce] = true;

        (bool success, bytes memory callResult) = intent.target.call{value: intent.value}(intent.data);
        require(success, "GuardedExecutor: call failed");

        bytes32 outcomeHash = keccak256(callResult);
        decisionLog.logDecision(
            intent.agent,
            intentHash,
            IDecisionLog.Verdict.ALLOW,
            bytes32(0),
            outcomeHash
        );

        emit ExecutionSucceeded(intent.agent, intentHash, intent.target, outcomeHash);
        return callResult;
    }

    /// @inheritdoc IGuardedExecutor
    function setAttester(address newAttester) external onlyOwner {
        require(newAttester != address(0), "GuardedExecutor: zero attester");
        address oldAttester = attester;
        attester = newAttester;
        emit AttesterUpdated(oldAttester, newAttester);
    }

    function _isValidAllowAttestation(
        Intent calldata intent,
        bytes32 intentHash,
        bytes32 covenantHash,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) private view returns (bool) {
        if (block.timestamp > deadline) {
            return false;
        }

        if (usedNonces[intent.agent][intent.nonce]) {
            return false;
        }

        address owner = identityRegistry.ownerOfAgent(intent.agent);
        if (owner == address(0) || !identityRegistry.isActive(intent.agent)) {
            return false;
        }

        (bytes32 storedHash,,,) = covenantRegistry.covenants(owner, intent.agent);
        if (storedHash != covenantHash || storedHash == bytes32(0)) {
            return false;
        }

        bytes32 structHash = keccak256(
            abi.encode(
                ALLOW_ATTESTATION_TYPEHASH,
                intent.agent,
                intentHash,
                covenantHash,
                uint8(IDecisionLog.Verdict.ALLOW),
                deadline
            )
        );

        address signer = _hashTypedDataV4(structHash).recover(v, r, s);
        return signer == attester;
    }
}
