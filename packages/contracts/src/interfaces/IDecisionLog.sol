// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDecisionLog {
    enum Verdict {
        DENY,
        WARN,
        ALLOW
    }

    struct Decision {
        address agent;
        bytes32 intentHash;
        Verdict verdict;
        bytes32 reasonHash;
        bytes32 outcomeHash;
        uint256 timestamp;
    }

    event DecisionLogged(
        uint256 indexed id,
        address indexed agent,
        bytes32 indexed intentHash,
        Verdict verdict,
        bytes32 reasonHash,
        bytes32 outcomeHash
    );

    event AuthorizedWriterUpdated(address indexed writer, bool authorized);

    function nextId() external view returns (uint256);

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
        );

    function authorizedWriters(address writer) external view returns (bool);

    function logDecision(
        address agent,
        bytes32 intentHash,
        Verdict verdict,
        bytes32 reasonHash,
        bytes32 outcomeHash
    ) external returns (uint256 id);

    function setAuthorizedWriter(address writer, bool authorized) external;
}
