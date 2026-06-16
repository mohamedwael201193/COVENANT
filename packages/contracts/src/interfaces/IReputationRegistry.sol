// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IReputationRegistry {
    struct Reputation {
        uint256 score;
        uint8 tier;
        uint256 updatedAt;
    }

    event ReputationUpdated(
        address indexed agent,
        uint256 score,
        uint8 tier,
        uint256[] decisionIds
    );

    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    function oracle() external view returns (address);

    function reputations(address agent)
        external
        view
        returns (uint256 score, uint8 tier, uint256 updatedAt);

    function updateScore(
        address agent,
        uint256 score,
        uint8 tier,
        uint256[] calldata decisionIds
    ) external;
}
