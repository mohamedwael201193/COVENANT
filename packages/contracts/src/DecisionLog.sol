// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IDecisionLog} from "./interfaces/IDecisionLog.sol";

/// @title DecisionLog
/// @notice Append-only log of agent decisions with monotonic ids.
contract DecisionLog is IDecisionLog, Ownable {
    uint256 public override nextId;

    mapping(uint256 id => Decision decision) private _decisions;
    mapping(address writer => bool authorized) public override authorizedWriters;

    modifier onlyAuthorizedWriter() {
        require(authorizedWriters[msg.sender], "DecisionLog: unauthorized");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @inheritdoc IDecisionLog
    function decisions(uint256 id)
        external
        view
        returns (
            address agent,
            bytes32 intentHash,
            Verdict verdict,
            bytes32 reasonHash,
            bytes32 outcomeHash,
            uint256 timestamp
        )
    {
        Decision storage decision = _decisions[id];
        return (
            decision.agent,
            decision.intentHash,
            decision.verdict,
            decision.reasonHash,
            decision.outcomeHash,
            decision.timestamp
        );
    }

    /// @inheritdoc IDecisionLog
    function logDecision(
        address agent,
        bytes32 intentHash,
        Verdict verdict,
        bytes32 reasonHash,
        bytes32 outcomeHash
    ) external onlyAuthorizedWriter returns (uint256 id) {
        require(agent != address(0), "DecisionLog: zero agent");
        require(intentHash != bytes32(0), "DecisionLog: zero intent hash");

        id = nextId++;
        _decisions[id] = Decision({
            agent: agent,
            intentHash: intentHash,
            verdict: verdict,
            reasonHash: reasonHash,
            outcomeHash: outcomeHash,
            timestamp: block.timestamp
        });

        emit DecisionLogged(id, agent, intentHash, verdict, reasonHash, outcomeHash);
    }

    /// @inheritdoc IDecisionLog
    function setAuthorizedWriter(address writer, bool authorized) external onlyOwner {
        require(writer != address(0), "DecisionLog: zero writer");
        authorizedWriters[writer] = authorized;
        emit AuthorizedWriterUpdated(writer, authorized);
    }
}
