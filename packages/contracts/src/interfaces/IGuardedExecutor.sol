// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IDecisionLog} from "./IDecisionLog.sol";
import {ICovenantRegistry} from "./ICovenantRegistry.sol";
import {IIdentityRegistry} from "./IIdentityRegistry.sol";

interface IGuardedExecutor {
    struct Intent {
        address agent;
        address target;
        bytes data;
        uint256 value;
        uint256 nonce;
    }

    error CovenantBreach();

    event CovenantBreached(address indexed agent, bytes32 indexed intentHash);
    event ExecutionSucceeded(
        address indexed agent,
        bytes32 indexed intentHash,
        address indexed target,
        bytes32 outcomeHash
    );
    event AttesterUpdated(address indexed oldAttester, address indexed newAttester);

    function attester() external view returns (address);

    function decisionLog() external view returns (IDecisionLog);

    function covenantRegistry() external view returns (ICovenantRegistry);

    function identityRegistry() external view returns (IIdentityRegistry);

    function usedNonces(address agent, uint256 nonce) external view returns (bool used);

    function computeIntentHash(Intent calldata intent) external pure returns (bytes32 intentHash);

    function execute(
        Intent calldata intent,
        bytes32 covenantHash,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable returns (bytes memory result);

    function setAttester(address newAttester) external;
}
