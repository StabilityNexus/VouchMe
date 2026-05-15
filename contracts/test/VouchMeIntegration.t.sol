// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/VouchMe.sol";
import "./helpers/TestHelpers.sol";

contract VouchMeIntegrationTest is TestHelpers {
    VouchMe public vouchMe;
    
    // Private keys for testing
    uint256 private constant ALICE_PRIVATE_KEY = 0x1;
    uint256 private constant BOB_PRIVATE_KEY = 0x2;
    uint256 private constant CHARLIE_PRIVATE_KEY = 0x3;
    uint256 private constant DAVID_PRIVATE_KEY = 0x4;
    uint256 private constant EVE_PRIVATE_KEY = 0x5;
    
    // Corresponding addresses
    address public alice;
    address public bob;
    address public charlie;
    address public david;
    address public eve;

    function setUp() public {
        vouchMe = new VouchMe();
        
        alice = vm.addr(ALICE_PRIVATE_KEY);
        bob = vm.addr(BOB_PRIVATE_KEY);
        charlie = vm.addr(CHARLIE_PRIVATE_KEY);
        david = vm.addr(DAVID_PRIVATE_KEY);
        eve = vm.addr(EVE_PRIVATE_KEY);
    }

    /**
     * @dev Complete workflow test: Profile setup + testimonials + management
     */
    function testCompleteWorkflow() public {
        // Step 1: Users set up their profiles
        vm.prank(alice);
        vouchMe.setProfile("Alice Johnson", "alice@example.com", "Senior Software Engineer");
        
        vm.prank(bob);
        vouchMe.setProfile("Bob Smith", "bob@example.com", "Product Manager");
        
        vm.prank(charlie);
        vouchMe.setProfile("Charlie Brown", "charlie@example.com", "UX Designer");
        
        // Verify profiles
        (string memory aliceName,,) = vouchMe.userProfiles(alice);
        assertEq(aliceName, "Alice Johnson");
        
        // Step 2: Create testimonials between team members
        // Bob vouches for Alice
        uint256 tokenId1 = createTestimonialWithValidSignature(
            vouchMe,
            BOB_PRIVATE_KEY,
            bob,
            alice,
            "Alice is an exceptional developer with strong technical skills",
            "Bob Smith",
            "https://linkedin.com/in/bobsmith"
        );
        
        // Charlie vouches for Alice
        uint256 tokenId2 = createTestimonialWithValidSignature(
            vouchMe,
            CHARLIE_PRIVATE_KEY,
            charlie,
            alice,
            "Alice delivers high-quality code and is great to work with",
            "Charlie Brown",
            "https://linkedin.com/in/charliebrown"
        );
        
        // Alice vouches for Bob
        uint256 tokenId3 = createTestimonialWithValidSignature(
            vouchMe,
            ALICE_PRIVATE_KEY,
            alice,
            bob,
            "Bob is an excellent product manager with clear vision",
            "Alice Johnson",
            ""
        );
        
        // Step 3: Verify testimonial counts
        assertEq(vouchMe.getTestimonialCount(alice), 2);
        assertEq(vouchMe.getTestimonialCount(bob), 1);
        assertEq(vouchMe.getTestimonialCount(charlie), 0);
        
        // Step 4: Verify testimonial relationships
        (bool exists1, uint256 foundTokenId1) = vouchMe.hasExistingTestimonial(bob, alice);
        assertTrue(exists1);
        assertEq(foundTokenId1, tokenId1);
        
        (bool exists2, uint256 foundTokenId2) = vouchMe.hasExistingTestimonial(charlie, alice);
        assertTrue(exists2);
        assertEq(foundTokenId2, tokenId2);
        
        // Step 5: Update a testimonial (Bob updates his testimonial for Alice)
        uint256 updatedTokenId = createTestimonialWithValidSignature(
            vouchMe,
            BOB_PRIVATE_KEY,
            bob,
            alice,
            "Alice is not just a great developer, but also an excellent mentor",
            "Bob Smith",
            "https://linkedin.com/in/bobsmith"
        );
        
        // Alice should still have 2 testimonials (one was replaced)
        assertEq(vouchMe.getTestimonialCount(alice), 2);
        
        // The old testimonial should be inaccessible
        vm.expectRevert(VouchMe.TestimonialHasBeenDeleted.selector);
        vouchMe.getTestimonialDetails(tokenId1);
        
        // The new testimonial should be accessible
        VouchMe.Testimonial memory updatedTestimonial = vouchMe.getTestimonialDetails(updatedTokenId);
        assertEq(updatedTestimonial.content, "Alice is not just a great developer, but also an excellent mentor");
        
        // Step 6: Delete a testimonial
        vm.prank(alice);
        vouchMe.deleteTestimonial(tokenId2);
        
        assertEq(vouchMe.getTestimonialCount(alice), 1);
        
        (bool exists3,) = vouchMe.hasExistingTestimonial(charlie, alice);
        assertFalse(exists3);
    }

    /**
     * @dev Test network effects - multiple users with interconnected testimonials
     */
    function testNetworkEffects() public {
        // Create a small network where everyone vouches for Alice
        address[] memory supporters = new address[](4);
        supporters[0] = bob;
        supporters[1] = charlie;
        supporters[2] = david;
        supporters[3] = eve;
        
        uint256[] memory privateKeys = new uint256[](4);
        privateKeys[0] = BOB_PRIVATE_KEY;
        privateKeys[1] = CHARLIE_PRIVATE_KEY;
        privateKeys[2] = DAVID_PRIVATE_KEY;
        privateKeys[3] = EVE_PRIVATE_KEY;
        
        // Everyone vouches for Alice
        for (uint256 i = 0; i < supporters.length; i++) {
            createTestimonialWithValidSignature(
                vouchMe,
                privateKeys[i],
                supporters[i],
                alice,
                string(abi.encodePacked("Testimonial from supporter ", vm.toString(i))),
                string(abi.encodePacked("Supporter ", vm.toString(i))),
                ""
            );
        }
        
        assertEq(vouchMe.getTestimonialCount(alice), 4);
        
        // Alice creates counter-testimonials
        for (uint256 i = 0; i < supporters.length; i++) {
            createTestimonialWithValidSignature(
                vouchMe,
                ALICE_PRIVATE_KEY,
                alice,
                supporters[i],
                string(abi.encodePacked("Alice vouches for supporter ", vm.toString(i))),
                "Alice Johnson",
                ""
            );
        }
        
        // Verify everyone has exactly one testimonial from Alice
        for (uint256 i = 0; i < supporters.length; i++) {
            assertEq(vouchMe.getTestimonialCount(supporters[i]), 1);
            
            (bool exists, uint256 tokenId) = vouchMe.hasExistingTestimonial(alice, supporters[i]);
            assertTrue(exists);
            assertTrue(tokenId > 0);
        }
    }

    /**
     * @dev Test large-scale deletion and array management
     */
    function testLargeScaleDeletion() public {
        uint256 numSupporters = 10;
        
        // Create many testimonials for Alice
        uint256[] memory tokenIds = new uint256[](numSupporters);
        for (uint256 i = 0; i < numSupporters; i++) {
            uint256 senderPrivateKey = 0x100 + i;
            address sender = vm.addr(senderPrivateKey);
            
            tokenIds[i] = createTestimonialWithValidSignature(
                vouchMe,
                senderPrivateKey,
                sender,
                alice,
                string(abi.encodePacked("Testimonial ", vm.toString(i))),
                string(abi.encodePacked("Supporter ", vm.toString(i))),
                ""
            );
        }
        
        assertEq(vouchMe.getTestimonialCount(alice), numSupporters);
        
        // Delete every other testimonial
        for (uint256 i = 0; i < numSupporters; i += 2) {
            vm.prank(alice);
            vouchMe.deleteTestimonial(tokenIds[i]);
        }
        
        uint256 expectedRemaining = numSupporters - (numSupporters / 2);
        assertEq(vouchMe.getTestimonialCount(alice), expectedRemaining);
        
        // Verify that non-deleted testimonials are still accessible
        uint256 accessibleCount = 0;
        for (uint256 i = 1; i < numSupporters; i += 2) {
            try vouchMe.getTestimonialDetails(tokenIds[i]) {
                accessibleCount++;
            } catch {
                fail();
            }
        }
        assertEq(accessibleCount, expectedRemaining);
    }

    /**
     * @dev Test profile updates during active testimonial management
     */
    function testProfileUpdatesWithTestimonials() public {
        // Bob creates testimonial for Alice
        uint256 tokenId = createTestimonialWithValidSignature(
            vouchMe,
            BOB_PRIVATE_KEY,
            bob,
            alice,
            "Great work on the project",
            "Bob Smith",
            "https://linkedin.com/in/bobsmith"
        );
        
        // Alice updates her profile
        vm.prank(alice);
        vouchMe.setProfile("Alice Johnson-Updated", "alice.new@example.com", "Senior Developer & Team Lead");
        
        // Testimonial should still be valid and accessible
        VouchMe.Testimonial memory testimonial = vouchMe.getTestimonialDetails(tokenId);
        assertEq(testimonial.content, "Great work on the project");
        
        // Profile should be updated
        (string memory name, string memory contact, string memory bio) = vouchMe.userProfiles(alice);
        assertEq(name, "Alice Johnson-Updated");
        assertEq(contact, "alice.new@example.com");
        assertEq(bio, "Senior Developer & Team Lead");
        
        // Bob updates his testimonial after Alice's profile change
        uint256 newTokenId = createTestimonialWithValidSignature(
            vouchMe,
            BOB_PRIVATE_KEY,
            bob,
            alice,
            "Alice's leadership skills have really improved",
            "Bob Smith",
            "https://linkedin.com/in/bobsmith"
        );
        
        // Old testimonial should be replaced
        vm.expectRevert(VouchMe.TestimonialHasBeenDeleted.selector);
        vouchMe.getTestimonialDetails(tokenId);
        
        // New testimonial should be accessible
        VouchMe.Testimonial memory newTestimonial = vouchMe.getTestimonialDetails(newTokenId);
        assertEq(newTestimonial.content, "Alice's leadership skills have really improved");
    }
}
