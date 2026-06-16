// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IIdentityRegistry {
    event AgentRegistered(address indexed owner, address indexed agent, string metadataURI);
    event KeyRotated(address indexed owner, address indexed oldAgent, address indexed newAgent);
    event AgentRevoked(address indexed owner, address indexed agent);

    function ownerOfAgent(address agent) external view returns (address owner);

    function agentOfOwner(address owner) external view returns (address agent);

    function metadataURI(address agent) external view returns (string memory uri);

    function isActive(address agent) external view returns (bool active);

    function register(address agent, string calldata metadataURI_) external;

    function rotateKey(address newAgent) external;

    function revoke() external;
}
