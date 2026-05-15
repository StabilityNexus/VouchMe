// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/VouchMe.sol";
import "./helpers/TestHelpers.sol";

contract VouchMeFuzzTest is TestHelpers {
    VouchMe public vouchMe;
    
    uint256 private constant ALICE_PRIVATE_KEY = 0x1;
    uint256 private constant BOB_PRIVATE_KEY = 0x2;
    
    address public alice;
    address public bob;

    function setUp() public {
        vouchMe = new VouchMe();
        alice = vm.addr(ALICE_PRIVATE_KEY);
        bob = vm.addr(BOB_PRIVATE_KEY);
    }

    /**
     * @dev Fuzz test for profile creation with random strings
     */
    function testFuzzSetProfile(
        string calldata name,
        string calldata contact,
        string calldata bio
    ) public {
        vm.prank(alice);
        vouchMe.setProfile(name, contact, bio);
        
        (string memory retrievedName, string memory retrievedContact, string memory retrievedBio) = 
            vouchMe.userProfiles(alice);
        
        assertEq(retrievedName, name);
        assertEq(retrievedContact, contact);
        assertEq(retrievedBio, bio);
    }

    /**
     * @dev Fuzz test for testimonial creation with random valid addresses
     */
    function testFuzzCreateTestimonial(
        address receiver,
        string calldata content,
        string calldata giverName,
        string calldata profileUrl
    ) public {
        // Skip zero address and precompile addresses
        vm.assume(receiver != address(0) && receiver > address(0x9));
        
        uint256 tokenId = createTestimonialWithValidSignature(
            vouchMe, BOB_PRIVATE_KEY, bob, receiver, content, giverName, profileUrl
        );
        
        assertEq(vouchMe.ownerOf(tokenId), receiver);
        assertEq(vouchMe.getTestimonialCount(receiver), 1);
        
        VouchMe.Testimonial memory testimonial = vouchMe.getTestimonialDetails(tokenId);
        assertEq(testimonial.sender, bob);
        assertEq(testimonial.receiver, receiver);
        assertEq(testimonial.content, content);
        assertEq(testimonial.giverName, giverName);
        assertEq(testimonial.profileUrl, profileUrl);
    }

    /**
     * @dev Fuzz test for multiple testimonials from different senders
     */
    function testFuzzMultipleTestimonials(
        uint8 numSenders,
        address receiver,
        string calldata baseContent
    ) public {
        // Limit to reasonable number and valid receiver
        vm.assume(numSenders > 0 && numSenders <= 10);
        vm.assume(receiver != address(0) && receiver > address(0x9));
        
        for (uint256 i = 0; i < numSenders; i++) {
            uint256 senderPrivateKey = 0x100 + i; // Different private key for each sender
            address sender = vm.addr(senderPrivateKey);
            
            string memory content = string(abi.encodePacked(baseContent, " from sender ", vm.toString(i)));
            
            createTestimonialWithValidSignature(
                vouchMe, senderPrivateKey, sender, receiver, content, "Test Giver", ""
            );
        }
        
        assertEq(vouchMe.getTestimonialCount(receiver), numSenders);
        
        uint256[] memory testimonials = vouchMe.getReceivedTestimonials(receiver);
        assertEq(testimonials.length, numSenders);
    }

    /**
     * @dev Fuzz test for testimonial replacement
     */
    function testFuzzTestimonialReplacement(
        address receiver,
        string calldata content1,
        string calldata content2,
        string calldata giverName1,
        string calldata giverName2
    ) public {
        vm.assume(receiver != address(0) && receiver > address(0x9));
        
        // Create first testimonial
        uint256 tokenId1 = createTestimonialWithValidSignature(
            vouchMe, BOB_PRIVATE_KEY, bob, receiver, content1, giverName1, ""
        );
        
        assertEq(vouchMe.getTestimonialCount(receiver), 1);
        
        // Create second testimonial from same sender (should replace first)
        uint256 tokenId2 = createTestimonialWithValidSignature(
            vouchMe, BOB_PRIVATE_KEY, bob, receiver, content2, giverName2, ""
        );
        
        // Should still have only 1 testimonial
        assertEq(vouchMe.getTestimonialCount(receiver), 1);
        
        // Old testimonial should be deleted
        vm.expectRevert(VouchMe.TestimonialHasBeenDeleted.selector);
        vouchMe.getTestimonialDetails(tokenId1);
        
        // New testimonial should be accessible
        VouchMe.Testimonial memory testimonial = vouchMe.getTestimonialDetails(tokenId2);
        assertEq(testimonial.content, content2);
        assertEq(testimonial.giverName, giverName2);
    }

    /**
     * @dev Fuzz test for array management during deletions
     */
    function testFuzzArrayManagement(
        uint8 numTestimonials,
        uint8 deleteIndex
    ) public {
        vm.assume(numTestimonials >= 2 && numTestimonials <= 20);
        vm.assume(deleteIndex < numTestimonials);
        
        address receiver = alice;
        uint256[] memory tokenIds = new uint256[](numTestimonials);
        
        // Create multiple testimonials from different senders
        for (uint256 i = 0; i < numTestimonials; i++) {
            uint256 senderPrivateKey = 0x100 + i;
            address sender = vm.addr(senderPrivateKey);
            
            tokenIds[i] = createTestimonialWithValidSignature(
                vouchMe,
                senderPrivateKey,
                sender,
                receiver,
                string(abi.encodePacked("Content ", vm.toString(i))),
                string(abi.encodePacked("Giver ", vm.toString(i))),
                ""
            );
        }
        
        assertEq(vouchMe.getTestimonialCount(receiver), numTestimonials);
        
        // Delete one testimonial
        vm.prank(receiver);
        vouchMe.deleteTestimonial(tokenIds[deleteIndex]);
        
        assertEq(vouchMe.getTestimonialCount(receiver), numTestimonials - 1);
        
        // Verify the deleted testimonial is not accessible
        vm.expectRevert(VouchMe.TestimonialHasBeenDeleted.selector);
        vouchMe.getTestimonialDetails(tokenIds[deleteIndex]);
        
        // Verify remaining testimonials are still accessible
        uint256[] memory remainingTokens = vouchMe.getReceivedTestimonials(receiver);
        assertEq(remainingTokens.length, numTestimonials - 1);
        
        // Count how many original testimonials are still accessible
        uint256 accessibleCount = 0;
        for (uint256 i = 0; i < numTestimonials; i++) {
            if (i != deleteIndex) {
                try vouchMe.getTestimonialDetails(tokenIds[i]) {
                    accessibleCount++;
                } catch {
                    // Should not happen for non-deleted testimonials
                    fail();
                }
            }
        }
        assertEq(accessibleCount, numTestimonials - 1);
    }
}
