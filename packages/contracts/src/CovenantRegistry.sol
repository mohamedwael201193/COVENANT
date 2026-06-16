// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IIdentityRegistry} from "./interfaces/IIdentityRegistry.sol";
import {ICovenantRegistry} from "./interfaces/ICovenantRegistry.sol";

/// @title CovenantRegistry
/// @notice Stores covenant hashes and tier curve references per owner-agent pair.
contract CovenantRegistry is ICovenantRegistry {
    IIdentityRegistry public immutable identityRegistry;

    mapping(address owner => mapping(address agent => Covenant covenant)) private _covenants;

    constructor(address identityRegistry_) {
        require(identityRegistry_ != address(0), "CovenantRegistry: zero registry");
        identityRegistry = IIdentityRegistry(identityRegistry_);
    }

    /// @inheritdoc ICovenantRegistry
    function covenants(address owner, address agent)
        external
        view
        returns (bytes32 covenantHash, bytes32 tierCurveRef, string memory ipfsURI, uint256 updatedAt)
    {
        Covenant storage covenant = _covenants[owner][agent];
        return (covenant.covenantHash, covenant.tierCurveRef, covenant.ipfsURI, covenant.updatedAt);
    }

    /// @inheritdoc ICovenantRegistry
    function setCovenant(
        address agent,
        bytes32 covenantHash,
        bytes32 tierCurveRef,
        string calldata ipfsURI
    ) external {
        require(agent != address(0), "CovenantRegistry: zero agent");
        require(covenantHash != bytes32(0), "CovenantRegistry: zero hash");
        require(
            identityRegistry.ownerOfAgent(agent) == msg.sender && identityRegistry.isActive(agent),
            "CovenantRegistry: not agent owner"
        );

        _covenants[msg.sender][agent] = Covenant({
            covenantHash: covenantHash,
            tierCurveRef: tierCurveRef,
            ipfsURI: ipfsURI,
            updatedAt: block.timestamp
        });

        emit CovenantSet(msg.sender, agent, covenantHash, tierCurveRef, ipfsURI);
    }
}
