// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CovenantTestBase} from "./helpers/CovenantTestBase.sol";
import {ICovenantRegistry} from "../src/interfaces/ICovenantRegistry.sol";

contract CovenantRegistryTest is CovenantTestBase {
    function setUp() public override {
        super.setUp();
        _registerAgent(owner, agent);
    }

    function test_setCovenant_success() public {
        vm.expectEmit(true, true, false, true);
        emit ICovenantRegistry.CovenantSet(owner, agent, COVENANT_HASH, TIER_CURVE_REF, IPFS_URI);

        vm.prank(owner);
        covenantRegistry.setCovenant(agent, COVENANT_HASH, TIER_CURVE_REF, IPFS_URI);

        (bytes32 hash, bytes32 tierRef, string memory uri, uint256 updatedAt) =
            covenantRegistry.covenants(owner, agent);
        assertEq(hash, COVENANT_HASH);
        assertEq(tierRef, TIER_CURVE_REF);
        assertEq(uri, IPFS_URI);
        assertGt(updatedAt, 0);
    }

    function test_setCovenant_revertsForNonOwner() public {
        vm.prank(makeAddr("stranger"));
        vm.expectRevert(bytes("CovenantRegistry: not agent owner"));
        covenantRegistry.setCovenant(agent, COVENANT_HASH, TIER_CURVE_REF, IPFS_URI);
    }

    function test_setCovenant_revertsOnZeroHash() public {
        vm.prank(owner);
        vm.expectRevert(bytes("CovenantRegistry: zero hash"));
        covenantRegistry.setCovenant(agent, bytes32(0), TIER_CURVE_REF, IPFS_URI);
    }

    function testFuzz_setCovenant(bytes32 covenantHash, bytes32 tierRef, string calldata uri) public {
        vm.assume(covenantHash != bytes32(0));
        vm.assume(bytes(uri).length < 256);

        vm.prank(owner);
        covenantRegistry.setCovenant(agent, covenantHash, tierRef, uri);

        (bytes32 storedHash, bytes32 storedTier,,) = covenantRegistry.covenants(owner, agent);
        assertEq(storedHash, covenantHash);
        assertEq(storedTier, tierRef);
    }
}
