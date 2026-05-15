// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/VouchMe.sol";

contract VouchMeTest is Test {
    VouchMe public vouchMe;
    
    // Test addresses (derived from private keys)
    address public alice;
    address public bob;
    address public charlie;
    
    // Sample data
    string constant CONTENT = "Alice is an excellent developer with strong problem-solving skills.";
    string constant GIVER_NAME = "Bob Smith";
    string constant PROFILE_URL = "https://linkedin.com/in/bobsmith";
    
    // Events to test
    event TestimonialCreated(uint256 tokenId, address sender, address receiver);
    event TestimonialDeleted(uint256 tokenId, address receiver);
    event TestimonialUpdated(address sender, address receiver, uint256 newTokenId);
    event ProfileUpdated(address user);

    function setUp() public {
        vouchMe = new VouchMe();
        
        // Derive addresses from private keys
        alice = vm.addr(ALICE_PRIVATE_KEY);
        bob = vm.addr(BOB_PRIVATE_KEY);
        charlie = vm.addr(CHARLIE_PRIVATE_KEY);
        
        // Give some ether to test addresses (not needed for this contract but good practice)
        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);
        vm.deal(charlie, 1 ether);
    }

    // Private keys for testing (only for testing, never use in production)
    uint256 private constant ALICE_PRIVATE_KEY = 0xa11ce;
    uint256 private constant BOB_PRIVATE_KEY = 0xb0b;
    uint256 private constant CHARLIE_PRIVATE_KEY = 0xc4a12e;
    uint256 private constant DAVID_PRIVATE_KEY = 0xdad;
    
    // Helper function to create a valid signature
    function createValidSignature(
        address signer,
        address receiver,
        string memory content,
        string memory giverName,
        string memory profileUrl
    ) internal view returns (bytes memory) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(signer, receiver, content, giverName, profileUrl)
        );
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        
        // Get the private key for the signer
        uint256 privateKey;
        if (signer == alice) privateKey = ALICE_PRIVATE_KEY;
        else if (signer == bob) privateKey = BOB_PRIVATE_KEY;
        else if (signer == charlie) privateKey = CHARLIE_PRIVATE_KEY;
        else if (signer == vm.addr(DAVID_PRIVATE_KEY)) privateKey = DAVID_PRIVATE_KEY;
        else privateKey = 0x123; // Default for other addresses
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, ethSignedMessageHash);
        return abi.encodePacked(r, s, v);
    }

    // Helper function to create a testimonial
    function createTestimonial(
        address sender,
        address receiver,
        string memory content,
        string memory giverName,
        string memory profileUrl
    ) internal returns (uint256) {
        bytes memory signature = createValidSignature(sender, receiver, content, giverName, profileUrl);
        
        vm.prank(receiver);
        return vouchMe.createTestimonial(sender, content, giverName, profileUrl, signature);
    }

    /////////////////////////////////////////////////
    // BASIC FUNCTIONALITY TESTS
    /////////////////////////////////////////////////

    function testContractDeployment() public {
        assertEq(vouchMe.name(), "VouchMe Testimonial");
        assertEq(vouchMe.symbol(), "VOUCH");
    }

    function testSetProfile() public {
        string memory name = "Alice Johnson";
        string memory contact = "alice@example.com";
        string memory bio = "Software engineer with 5 years experience";

        vm.expectEmit(true, false, false, false);
        emit ProfileUpdated(alice);

        vm.prank(alice);
        vouchMe.setProfile(name, contact, bio);

        (string memory retrievedName, string memory retrievedContact, string memory retrievedBio) = 
            vouchMe.userProfiles(alice);
        
        assertEq(retrievedName, name);
        assertEq(retrievedContact, contact);
        assertEq(retrievedBio, bio);
    }

    function testUpdateProfile() public {
        // Set initial profile
        vm.prank(alice);
        vouchMe.setProfile("Alice", "alice@old.com", "Old bio");

        // Update profile
        string memory newName = "Alice Smith";
        string memory newContact = "alice@new.com";
        string memory newBio = "Updated bio";

        vm.prank(alice);
        vouchMe.setProfile(newName, newContact, newBio);

        (string memory retrievedName, string memory retrievedContact, string memory retrievedBio) = 
            vouchMe.userProfiles(alice);
        
        assertEq(retrievedName, newName);
        assertEq(retrievedContact, newContact);
        assertEq(retrievedBio, newBio);
    }

    /////////////////////////////////////////////////
    // TESTIMONIAL CREATION TESTS
    /////////////////////////////////////////////////

    function testCreateTestimonialBasic() public {
        uint256 tokenId = createTestimonial(bob, alice, CONTENT, GIVER_NAME, PROFILE_URL);
        
        // Verify token was minted
        assertEq(vouchMe.ownerOf(tokenId), alice);
        assertEq(vouchMe.getTestimonialCount(alice), 1);
        
        // Verify testimonial details
        VouchMe.Testimonial memory testimonial = vouchMe.getTestimonialDetails(tokenId);
        assertEq(testimonial.sender, bob);
        assertEq(testimonial.receiver, alice);
        assertEq(testimonial.content, CONTENT);
        assertEq(testimonial.giverName, GIVER_NAME);
        assertEq(testimonial.profileUrl, PROFILE_URL);
        assertTrue(testimonial.verified);
        assertEq(testimonial.timestamp, uint64(block.timestamp));
    }

    function testCreateTestimonialEmitsEvent() public {
        bytes memory signature = createValidSignature(bob, alice, CONTENT, GIVER_NAME, PROFILE_URL);
        
        vm.expectEmit(true, true, true, false);
        emit TestimonialCreated(1, bob, alice); // tokenId will be 1 for first testimonial

        vm.prank(alice);
        vouchMe.createTestimonial(bob, CONTENT, GIVER_NAME, PROFILE_URL, signature);
    }

    function testCreateMultipleTestimonialsForSameReceiver() public {
        // Alice receives testimonials from Bob and Charlie
        uint256 tokenId1 = createTestimonial(bob, alice, CONTENT, GIVER_NAME, PROFILE_URL);
        uint256 tokenId2 = createTestimonial(charlie, alice, "Charlie's testimonial", "Charlie Wilson", "");
        
        assertEq(vouchMe.getTestimonialCount(alice), 2);
        
        uint256[] memory aliceTestimonials = vouchMe.getReceivedTestimonials(alice);
        assertEq(aliceTestimonials.length, 2);
        assertEq(aliceTestimonials[0], tokenId1);
        assertEq(aliceTestimonials[1], tokenId2);
    }

    /////////////////////////////////////////////////
    // ONE TESTIMONIAL PER PAIR RULE TESTS
    /////////////////////////////////////////////////

    function testReplaceExistingTestimonial() public {
        // Bob creates first testimonial for Alice
        uint256 firstTokenId = createTestimonial(bob, alice, "First testimonial", GIVER_NAME, PROFILE_URL);
        
        // Verify first testimonial exists
        (bool exists, uint256 existingTokenId) = vouchMe.hasExistingTestimonial(bob, alice);
        assertTrue(exists);
        assertEq(existingTokenId, firstTokenId);
        assertEq(vouchMe.getTestimonialCount(alice), 1);
        
        // Bob creates second testimonial for Alice (should replace first)
        bytes memory signature = createValidSignature(bob, alice, "Updated testimonial", GIVER_NAME, PROFILE_URL);
        
        vm.expectEmit(true, true, true, false);
        emit TestimonialUpdated(bob, alice, 2); // New token ID will be 2
        
        vm.prank(alice);
        uint256 secondTokenId = vouchMe.createTestimonial(bob, "Updated testimonial", GIVER_NAME, PROFILE_URL, signature);
        
        // Verify replacement
        assertEq(vouchMe.getTestimonialCount(alice), 1); // Still only 1 testimonial
        (exists, existingTokenId) = vouchMe.hasExistingTestimonial(bob, alice);
        assertTrue(exists);
        assertEq(existingTokenId, secondTokenId);
        
        // Verify old testimonial is deleted
        vm.expectRevert("Testimonial has been deleted");
        vouchMe.getTestimonialDetails(firstTokenId);
        
        // Verify new testimonial is accessible
        VouchMe.Testimonial memory newTestimonial = vouchMe.getTestimonialDetails(secondTokenId);
        assertEq(newTestimonial.content, "Updated testimonial");
    }

    /////////////////////////////////////////////////
    // TESTIMONIAL DELETION TESTS
    /////////////////////////////////////////////////

    function testDeleteTestimonial() public {
        uint256 tokenId = createTestimonial(bob, alice, CONTENT, GIVER_NAME, PROFILE_URL);
        
        vm.expectEmit(true, true, false, false);
        emit TestimonialDeleted(tokenId, alice);
        
        vm.prank(alice);
        vouchMe.deleteTestimonial(tokenId);
        
        // Verify testimonial is deleted
        assertEq(vouchMe.getTestimonialCount(alice), 0);
        
        (bool exists,) = vouchMe.hasExistingTestimonial(bob, alice);
        assertFalse(exists);
        
        vm.expectRevert("Testimonial has been deleted");
        vouchMe.getTestimonialDetails(tokenId);
    }

    function testCannotDeleteNonExistentTestimonial() public {
        vm.prank(alice);
        vm.expectRevert("Only recipient can delete");
        vouchMe.deleteTestimonial(999);
    }

    function testCannotDeleteOthersTestimonial() public {
        uint256 tokenId = createTestimonial(bob, alice, CONTENT, GIVER_NAME, PROFILE_URL);
        
        vm.prank(bob); // Bob tries to delete Alice's testimonial
        vm.expectRevert("Only recipient can delete");
        vouchMe.deleteTestimonial(tokenId);
    }

    function testCannotDeleteAlreadyDeletedTestimonial() public {
        uint256 tokenId = createTestimonial(bob, alice, CONTENT, GIVER_NAME, PROFILE_URL);
        
        // Delete testimonial
        vm.prank(alice);
        vouchMe.deleteTestimonial(tokenId);
        
        // Try to delete again
        vm.prank(alice);
        vm.expectRevert("Testimonial already deleted");
        vouchMe.deleteTestimonial(tokenId);
    }

    /////////////////////////////////////////////////
    // ARRAY MANAGEMENT TESTS (O(1) removal)
    /////////////////////////////////////////////////

    function testEfficientArrayRemoval() public {
        // Create 3 testimonials for Alice
        uint256 tokenId1 = createTestimonial(bob, alice, "Testimonial 1", "Bob", "");
        uint256 tokenId2 = createTestimonial(charlie, alice, "Testimonial 2", "Charlie", "");
        
        // Add one more person for a third testimonial
        address david = vm.addr(DAVID_PRIVATE_KEY);
        uint256 tokenId3 = createTestimonial(david, alice, "Testimonial 3", "David", "");
        
        assertEq(vouchMe.getTestimonialCount(alice), 3);
        
        // Delete the middle testimonial (should use swap and pop)
        vm.prank(alice);
        vouchMe.deleteTestimonial(tokenId2);
        
        assertEq(vouchMe.getTestimonialCount(alice), 2);
        
        uint256[] memory remainingTestimonials = vouchMe.getReceivedTestimonials(alice);
        assertEq(remainingTestimonials.length, 2);
        
        // The array should still contain tokenId1 and tokenId3
        // Order might have changed due to swap and pop
        bool foundToken1 = false;
        bool foundToken3 = false;
        
        for (uint i = 0; i < remainingTestimonials.length; i++) {
            if (remainingTestimonials[i] == tokenId1) foundToken1 = true;
            if (remainingTestimonials[i] == tokenId3) foundToken3 = true;
        }
        
        assertTrue(foundToken1);
        assertTrue(foundToken3);
    }

    /////////////////////////////////////////////////
    // EDGE CASE TESTS
    /////////////////////////////////////////////////

    function testEmptyStringInputs() public {
        uint256 tokenId = createTestimonial(bob, alice, "", "", "");
        
        VouchMe.Testimonial memory testimonial = vouchMe.getTestimonialDetails(tokenId);
        assertEq(testimonial.content, "");
        assertEq(testimonial.giverName, "");
        assertEq(testimonial.profileUrl, "");
    }

    function testZeroAddressChecks() public {
        // Create a signature for bob but try to claim it's from address(0)
        bytes memory signature = createValidSignature(bob, alice, CONTENT, GIVER_NAME, PROFILE_URL);
        
        // This should revert due to signature verification failure
        vm.prank(alice);
        vm.expectRevert("Invalid signature");
        vouchMe.createTestimonial(address(0), CONTENT, GIVER_NAME, PROFILE_URL, signature);
    }

    /////////////////////////////////////////////////
    // VIEW FUNCTION TESTS
    /////////////////////////////////////////////////

    function testGetReceivedTestimonialsEmpty() public {
        uint256[] memory testimonials = vouchMe.getReceivedTestimonials(alice);
        assertEq(testimonials.length, 0);
    }

    function testGetTestimonialCountZero() public {
        assertEq(vouchMe.getTestimonialCount(alice), 0);
    }

    function testHasExistingTestimonialFalse() public {
        (bool exists, uint256 tokenId) = vouchMe.hasExistingTestimonial(bob, alice);
        assertFalse(exists);
        assertEq(tokenId, 0);
    }

    /////////////////////////////////////////////////
    // TOKEN URI AND METADATA TESTS
    /////////////////////////////////////////////////

    function testTokenURIGeneration() public {
        uint256 tokenId = createTestimonial(bob, alice, CONTENT, GIVER_NAME, PROFILE_URL);
        
        string memory tokenURI = vouchMe.tokenURI(tokenId);
        assertTrue(bytes(tokenURI).length > 0);
        
        // Basic check that it contains expected data
        // Note: In a real test, you'd parse the JSON and verify each field
    }

    /////////////////////////////////////////////////
    // NON-TRANSFERABLE TOKEN TESTS
    /////////////////////////////////////////////////

    function testTokensAreNonTransferable() public {
        uint256 tokenId = createTestimonial(bob, alice, CONTENT, GIVER_NAME, PROFILE_URL);
        
        // Try to transfer from Alice to Charlie
        vm.prank(alice);
        vm.expectRevert("Tokens are non-transferrable");
        vouchMe.transferFrom(alice, charlie, tokenId);
        
        // Try safeTransferFrom
        vm.prank(alice);
        vm.expectRevert("Tokens are non-transferrable");
        vouchMe.safeTransferFrom(alice, charlie, tokenId);
    }
}
