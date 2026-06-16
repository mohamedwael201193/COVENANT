// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IDecisionLog} from "./interfaces/IDecisionLog.sol";
import {IReputationRegistry} from "./interfaces/IReputationRegistry.sol";

/// @title ReputationRegistry
/// @notice Oracle-written reputation scores with DecisionLog provenance citations.
contract ReputationRegistry is IReputationRegistry, Ownable {
    IDecisionLog public immutable decisionLog;

    address public override oracle;

    mapping(address agent => Reputation reputation) private _reputations;

    modifier onlyOracle() {
        require(msg.sender == oracle, "ReputationRegistry: not oracle");
        _;
    }

    constructor(address initialOwner, address decisionLog_, address oracle_) Ownable(initialOwner) {
        require(decisionLog_ != address(0), "ReputationRegistry: zero log");
        require(oracle_ != address(0), "ReputationRegistry: zero oracle");
        decisionLog = IDecisionLog(decisionLog_);
        oracle = oracle_;
    }

    /// @inheritdoc IReputationRegistry
    function reputations(address agent)
        external
        view
        returns (uint256 score, uint8 tier, uint256 updatedAt)
    {
        Reputation storage reputation = _reputations[agent];
        return (reputation.score, reputation.tier, reputation.updatedAt);
    }

    /// @inheritdoc IReputationRegistry
    function updateScore(
        address agent,
        uint256 score,
        uint8 tier,
        uint256[] calldata decisionIds
    ) external onlyOracle {
        require(agent != address(0), "ReputationRegistry: zero agent");
        require(decisionIds.length > 0, "ReputationRegistry: empty provenance");

        uint256 currentNextId = decisionLog.nextId();
        for (uint256 i = 0; i < decisionIds.length; ++i) {
            uint256 decisionId = decisionIds[i];
            require(decisionId < currentNextId, "ReputationRegistry: invalid decision id");

            (address loggedAgent,,,,,) = decisionLog.decisions(decisionId);
            require(loggedAgent == agent, "ReputationRegistry: agent mismatch");
        }

        _reputations[agent] = Reputation({
            score: score,
            tier: tier,
            updatedAt: block.timestamp
        });

        emit ReputationUpdated(agent, score, tier, decisionIds);
    }

    function setOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "ReputationRegistry: zero oracle");
        address oldOracle = oracle;
        oracle = newOracle;
        emit OracleUpdated(oldOracle, newOracle);
    }
}
