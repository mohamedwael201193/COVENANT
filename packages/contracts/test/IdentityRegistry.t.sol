// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CovenantTestBase} from "./helpers/CovenantTestBase.sol";
import {IIdentityRegistry} from "../src/interfaces/IIdentityRegistry.sol";

contract IdentityRegistryTest is CovenantTestBase {
    address internal newAgent = makeAddr("newAgent");

    function test_register_success() public {
        vm.expectEmit(true, true, false, true);
        emit IIdentityRegistry.AgentRegistered(owner, agent, "ipfs://meta");

        vm.prank(owner);
        identityRegistry.register(agent, "ipfs://meta");

        assertEq(identityRegistry.ownerOfAgent(agent), owner);
        assertEq(identityRegistry.agentOfOwner(owner), agent);
        assertEq(identityRegistry.metadataURI(agent), "ipfs://meta");
        assertTrue(identityRegistry.isActive(agent));
    }

    function test_register_revertsOnZeroAgent() public {
        vm.prank(owner);
        vm.expectRevert(bytes("IdentityRegistry: zero agent"));
        identityRegistry.register(address(0), "ipfs://meta");
    }

    function test_register_revertsWhenOwnerAlreadyHasAgent() public {
        _registerAgent(owner, agent);

        vm.prank(owner);
        vm.expectRevert(bytes("IdentityRegistry: owner has agent"));
        identityRegistry.register(newAgent, "ipfs://meta2");
    }

    function test_rotateKey_success() public {
        _registerAgent(owner, agent);

        vm.prank(owner);
        identityRegistry.rotateKey(newAgent);

        assertFalse(identityRegistry.isActive(agent));
        assertEq(identityRegistry.ownerOfAgent(agent), address(0));
        assertEq(identityRegistry.ownerOfAgent(newAgent), owner);
        assertEq(identityRegistry.agentOfOwner(owner), newAgent);
        assertEq(identityRegistry.metadataURI(newAgent), "ipfs://agent-metadata");
    }

    function test_revoke_success() public {
        _registerAgent(owner, agent);

        vm.prank(owner);
        identityRegistry.revoke();

        assertFalse(identityRegistry.isActive(agent));
        assertEq(identityRegistry.agentOfOwner(owner), address(0));
        assertEq(identityRegistry.ownerOfAgent(agent), address(0));
    }

    function testFuzz_registerAndRevoke(address agentOwner, address agentKey, string calldata uri) public {
        vm.assume(agentOwner != address(0));
        vm.assume(agentKey != address(0));
        vm.assume(bytes(uri).length < 256);

        vm.prank(agentOwner);
        identityRegistry.register(agentKey, uri);

        assertEq(identityRegistry.ownerOfAgent(agentKey), agentOwner);

        vm.prank(agentOwner);
        identityRegistry.revoke();

        assertFalse(identityRegistry.isActive(agentKey));
    }
}
