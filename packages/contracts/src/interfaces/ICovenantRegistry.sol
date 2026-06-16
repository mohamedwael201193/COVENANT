// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICovenantRegistry {
    struct Covenant {
        bytes32 covenantHash;
        bytes32 tierCurveRef;
        string ipfsURI;
        uint256 updatedAt;
    }

    event CovenantSet(
        address indexed owner,
        address indexed agent,
        bytes32 covenantHash,
        bytes32 tierCurveRef,
        string ipfsURI
    );

    function covenants(address owner, address agent)
        external
        view
        returns (bytes32 covenantHash, bytes32 tierCurveRef, string memory ipfsURI, uint256 updatedAt);

    function setCovenant(
        address agent,
        bytes32 covenantHash,
        bytes32 tierCurveRef,
        string calldata ipfsURI
    ) external;
}
