// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/VouchMe.sol";
import "./helpers/TestHelpers.sol";

contract VouchMeSignatureTest is TestHelpers {
    VouchMe public vouchMe;
    
    // Private keys for testing (these are for testing only, never use in production)
    uint256 private constant ALICE_PRIVATE_KEY = 0x1;
    uint256 private constant BOB_PRIVATE_KEY = 0x2;
    uint256 private constant CHARLIE_PRIVATE_KEY = 0x3;
    
    // Corresponding addresses
    address public alice;
    address public bob;
    address public charlie;
    
    // Sample data
    string constant CONTENT = "Excellent work on the project";
    string constant GIVER_NAME = "Bob Smith";
    string constant PROFILE_URL = "https://linkedin.com/in/bobsmith";

    function setUp() public {
        vouchMe = new VouchMe();
        
        // Derive addresses from private keys
        alice = vm.addr(ALICE_PRIVATE_KEY);
        bob = vm.addr(BOB_PRIVATE_KEY);
        charlie = vm.addr(CHARLIE_PRIVATE_KEY);
        
        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);
        vm.deal(charlie, 1 ether);
    }

    function testValidSignature() public {
        uint256 tokenId = createTestimonialWithValidSignature(
            vouchMe, BOB_PRIVATE_KEY, bob, alice, CONTENT, GIVER_NAME, PROFILE_URL
        );
        
        VouchMe.Testimonial memory testimonial = vouchMe.getTestimonialDetails(tokenId);
        assertTestimonialEqual(
            testimonial, bob, alice, CONTENT, GIVER_NAME, PROFILE_URL, true
        );
    }

    function testInvalidSignature() public {
        // Use Charlie's private key to sign but claim it's from Bob
        bytes memory invalidSignature = createProperSignature(
            CHARLIE_PRIVATE_KEY, bob, alice, CONTENT, GIVER_NAME, PROFILE_URL
        );
        
        vm.prank(alice);
        vm.expectRevert(VouchMe.InvalidSignature.selector);
        vouchMe.createTestimonial(bob, CONTENT, GIVER_NAME, PROFILE_URL, invalidSignature);
    }

    function testTamperedMessage() public {
        // Sign the original message
        bytes memory signature = createProperSignature(
            BOB_PRIVATE_KEY, bob, alice, CONTENT, GIVER_NAME, PROFILE_URL
        );
        
        // Try to use signature with different content
        vm.prank(alice);
        vm.expectRevert(VouchMe.InvalidSignature.selector);
        vouchMe.createTestimonial(bob, "Tampered content", GIVER_NAME, PROFILE_URL, signature);
    }

    function testSignatureDifferentReceiver() public {
        // Bob signs for Alice
        bytes memory signature = createProperSignature(
            BOB_PRIVATE_KEY, bob, alice, CONTENT, GIVER_NAME, PROFILE_URL
        );
        
        // Charlie tries to use the signature
        vm.prank(charlie);
        vm.expectRevert(VouchMe.InvalidSignature.selector);
        vouchMe.createTestimonial(bob, CONTENT, GIVER_NAME, PROFILE_URL, signature);
    }

    function testEmptySignature() public {
        vm.prank(alice);
        vm.expectRevert();
        vouchMe.createTestimonial(bob, CONTENT, GIVER_NAME, PROFILE_URL, "");
    }

    function testMalformedSignature() public {
        bytes memory malformedSignature = hex"1234567890abcdef";
        
        vm.prank(alice);
        vm.expectRevert();
        vouchMe.createTestimonial(bob, CONTENT, GIVER_NAME, PROFILE_URL, malformedSignature);
    }
}
