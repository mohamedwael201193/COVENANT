// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IIdentityRegistry} from "./interfaces/IIdentityRegistry.sol";

/// @title IdentityRegistry
/// @notice Maps agent keys to owners with metadata and lifecycle management.
contract IdentityRegistry is IIdentityRegistry, Ownable {
    mapping(address agent => address owner) private _ownerOfAgent;
    mapping(address owner => address agent) private _agentOfOwner;
    mapping(address agent => string uri) private _metadataURI;
    mapping(address agent => bool active) private _isActive;

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @inheritdoc IIdentityRegistry
    function ownerOfAgent(address agent) external view returns (address owner) {
        return _ownerOfAgent[agent];
    }

    /// @inheritdoc IIdentityRegistry
    function agentOfOwner(address owner) external view returns (address agent) {
        return _agentOfOwner[owner];
    }

    /// @inheritdoc IIdentityRegistry
    function metadataURI(address agent) external view returns (string memory uri) {
        return _metadataURI[agent];
    }

    /// @inheritdoc IIdentityRegistry
    function isActive(address agent) external view returns (bool active) {
        return _isActive[agent];
    }

    /// @inheritdoc IIdentityRegistry
    function register(address agent, string calldata metadataURI_) external {
        require(agent != address(0), "IdentityRegistry: zero agent");
        require(_ownerOfAgent[agent] == address(0), "IdentityRegistry: agent taken");
        require(_agentOfOwner[msg.sender] == address(0), "IdentityRegistry: owner has agent");

        _ownerOfAgent[agent] = msg.sender;
        _agentOfOwner[msg.sender] = agent;
        _metadataURI[agent] = metadataURI_;
        _isActive[agent] = true;

        emit AgentRegistered(msg.sender, agent, metadataURI_);
    }

    /// @inheritdoc IIdentityRegistry
    function rotateKey(address newAgent) external {
        require(newAgent != address(0), "IdentityRegistry: zero agent");
        require(_ownerOfAgent[newAgent] == address(0), "IdentityRegistry: agent taken");

        address oldAgent = _agentOfOwner[msg.sender];
        require(oldAgent != address(0), "IdentityRegistry: no agent");
        require(_isActive[oldAgent], "IdentityRegistry: inactive agent");

        string memory uri = _metadataURI[oldAgent];

        _isActive[oldAgent] = false;
        delete _ownerOfAgent[oldAgent];
        delete _agentOfOwner[msg.sender];

        _ownerOfAgent[newAgent] = msg.sender;
        _agentOfOwner[msg.sender] = newAgent;
        _metadataURI[newAgent] = uri;
        _isActive[newAgent] = true;

        emit KeyRotated(msg.sender, oldAgent, newAgent);
    }

    /// @inheritdoc IIdentityRegistry
    function revoke() external {
        address agent = _agentOfOwner[msg.sender];
        require(agent != address(0), "IdentityRegistry: no agent");
        require(_isActive[agent], "IdentityRegistry: inactive agent");

        _isActive[agent] = false;
        delete _ownerOfAgent[agent];
        delete _agentOfOwner[msg.sender];
        delete _metadataURI[agent];

        emit AgentRevoked(msg.sender, agent);
    }
}
