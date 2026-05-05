// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/VouchMe.sol";

contract RejectingContract {
    function submitTestimonial(
        VouchMe target,
        address senderAddress,
        string calldata content,
        string calldata giverName,
        string calldata profileUrl,
        bytes calldata signature
    ) external payable {
        target.createTestimonial{value: msg.value}(
            senderAddress,
            content,
            giverName,
            profileUrl,
            signature
        );
    }
}

contract VouchMeMonetizationTest is Test {
    VouchMe public vouchMe;
    
    // Test addresses (derived from private keys)
    address public alice;
    address public bob;
    address public charlie;
    address public owner;
    address public treasury;
    
    // Private keys for testing
    uint256 private constant ALICE_PRIVATE_KEY = 0xa11ce;
    uint256 private constant BOB_PRIVATE_KEY = 0xb0b;
    uint256 private constant CHARLIE_PRIVATE_KEY = 0xc4a12e;
    
    // Sample data
    string constant CONTENT = "Great developer!";
    string constant GIVER_NAME = "Bob Smith";
    string constant PROFILE_URL = "https://linkedin.com/in/bob";
    
    // Events
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event FreeThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event FeePaid(address indexed payer, uint256 amount);
    event TestimonialCreated(uint256 tokenId, address sender, address receiver);

    function setUp() public {
        owner = address(this); // Test contract is the deployer/owner
        vouchMe = new VouchMe();
        
        alice = vm.addr(ALICE_PRIVATE_KEY);
        bob = vm.addr(BOB_PRIVATE_KEY);
        charlie = vm.addr(CHARLIE_PRIVATE_KEY);
        treasury = makeAddr("treasury");
        
        // Fund test accounts
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(charlie, 10 ether);
    }
    
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
        
        uint256 privateKey;
        if (signer == alice) privateKey = ALICE_PRIVATE_KEY;
        else if (signer == bob) privateKey = BOB_PRIVATE_KEY;
        else if (signer == charlie) privateKey = CHARLIE_PRIVATE_KEY;
        else privateKey = 0x123;
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, ethSignedMessageHash);
        return abi.encodePacked(r, s, v);
    }
    
    // Helper to create testimonial
    function createTestimonial(
        address sender,
        address receiver,
        string memory content
    ) internal returns (uint256) {
        bytes memory signature = createValidSignature(sender, receiver, content, GIVER_NAME, PROFILE_URL);
        vm.prank(receiver);
        return vouchMe.createTestimonial(sender, content, GIVER_NAME, PROFILE_URL, signature);
    }
    
    // Helper to create testimonial with value
    function createTestimonialWithValue(
        address sender,
        address receiver,
        string memory content,
        uint256 value
    ) internal returns (uint256) {
        bytes memory signature = createValidSignature(sender, receiver, content, GIVER_NAME, PROFILE_URL);
        vm.prank(receiver);
        return vouchMe.createTestimonial{value: value}(sender, content, GIVER_NAME, PROFILE_URL, signature);
    }

    /////////////////////////////////////////////////
    // DEFAULT STATE TESTS
    /////////////////////////////////////////////////

    function testDefaultMonetizationState() public view {
        assertEq(vouchMe.fee(), 0, "Default fee should be 0");
        assertEq(vouchMe.treasury(), address(0), "Default treasury should be address(0)");
        assertEq(vouchMe.freeThreshold(), type(uint256).max, "Default threshold should be max uint256");
    }
    
    function testOwnerIsDeployer() public view {
        assertEq(vouchMe.owner(), owner, "Owner should be deployer");
    }

    /////////////////////////////////////////////////
    // BACKWARD COMPATIBILITY TESTS
    /////////////////////////////////////////////////

    function testCreateTestimonialWithoutPaymentWhenMonetizationDisabled() public {
        // With default settings (fee=0), creating testimonials should work without payment
        uint256 tokenId = createTestimonial(bob, alice, CONTENT);
        assertEq(vouchMe.ownerOf(tokenId), alice);
        assertEq(vouchMe.getTestimonialCount(alice), 1);
    }
    
    function testCreateMultipleTestimonialsWithoutPaymentWhenMonetizationDisabled() public {
        // Create many testimonials - all should be free with default monetization disabled
        createTestimonial(bob, alice, "Testimonial 1");
        createTestimonial(charlie, alice, "Testimonial 2");
        
        assertEq(vouchMe.getTestimonialCount(alice), 2);
    }
    
    function testRefundWhenPaymentSentButMonetizationDisabled() public {
        uint256 aliceBalanceBefore = alice.balance;
        
        // Send payment even though fee is 0
        createTestimonialWithValue(bob, alice, CONTENT, 0.1 ether);
        
        // Alice should get full refund
        assertEq(alice.balance, aliceBalanceBefore, "Should refund full amount when monetization disabled");
    }

    /////////////////////////////////////////////////
    // ADMIN FUNCTION TESTS
    /////////////////////////////////////////////////

    function testSetTreasury() public {
        vm.expectEmit(true, true, false, false);
        emit TreasuryUpdated(address(0), treasury);
        
        vouchMe.setTreasury(treasury);
        assertEq(vouchMe.treasury(), treasury);
    }
    
    function testSetTreasuryRevertsForZeroAddress() public {
        vm.expectRevert("Treasury cannot be zero address");
        vouchMe.setTreasury(address(0));
    }
    
    function testSetTreasuryOnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", alice));
        vouchMe.setTreasury(treasury);
    }
    
    function testSetFee() public {
        // Must set treasury first
        vouchMe.setTreasury(treasury);
        
        vm.expectEmit(true, true, false, false);
        emit FeeUpdated(0, 0.001 ether);
        
        vouchMe.setFee(0.001 ether);
        assertEq(vouchMe.fee(), 0.001 ether);
    }
    
    function testSetFeeRevertsWithoutTreasury() public {
        vm.expectRevert("Set treasury before enabling fees");
        vouchMe.setFee(0.001 ether);
    }
    
    function testSetFeeToZeroWithoutTreasury() public {
        // Setting fee to 0 should work even without treasury
        vouchMe.setFee(0);
        assertEq(vouchMe.fee(), 0);
    }
    
    function testSetFeeOnlyOwner() public {
        vouchMe.setTreasury(treasury);
        
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", alice));
        vouchMe.setFee(0.001 ether);
    }
    
    function testSetFreeThreshold() public {
        vm.expectEmit(true, true, false, false);
        emit FreeThresholdUpdated(type(uint256).max, 5);
        
        vouchMe.setFreeThreshold(5);
        assertEq(vouchMe.freeThreshold(), 5);
    }
    
    function testSetFreeThresholdOnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", alice));
        vouchMe.setFreeThreshold(5);
    }

    /////////////////////////////////////////////////
    // FEE CALCULATION TESTS
    /////////////////////////////////////////////////

    function testGetRemainingFreeTestimonialsUnlimited() public view {
        // With default threshold (max uint256), remaining should be huge
        uint256 remaining = vouchMe.getRemainingFreeTestimonials(alice);
        assertEq(remaining, type(uint256).max);
    }
    
    function testGetRemainingFreeTestimonialsWithThreshold() public {
        vouchMe.setFreeThreshold(5);
        
        assertEq(vouchMe.getRemainingFreeTestimonials(alice), 5);
        
        // Create 2 testimonials
        createTestimonial(bob, alice, "Test 1");
        createTestimonial(charlie, alice, "Test 2");
        
        assertEq(vouchMe.getRemainingFreeTestimonials(alice), 3);
    }
    
    function testGetRemainingFreeTestimonialsZeroWhenExceeded() public {
        vouchMe.setFreeThreshold(1);
        
        createTestimonial(bob, alice, "Test 1");
        
        assertEq(vouchMe.getRemainingFreeTestimonials(alice), 0);
    }
    
    function testGetRequiredFeeWhenMonetizationDisabled() public view {
        assertEq(vouchMe.getRequiredFee(alice), 0);
    }
    
    function testGetRequiredFeeWhenUnderThreshold() public {
        vouchMe.setTreasury(treasury);
        vouchMe.setFee(0.001 ether);
        vouchMe.setFreeThreshold(5);
        
        // No testimonials yet, should be free
        assertEq(vouchMe.getRequiredFee(alice), 0);
        
        // Create 4 testimonials (still under threshold of 5)
        createTestimonial(bob, alice, "Test 1");
        createTestimonial(charlie, alice, "Test 2");
        
        // Still under threshold
        assertEq(vouchMe.getRequiredFee(alice), 0);
    }
    
    function testGetRequiredFeeWhenAtOrOverThreshold() public {
        vouchMe.setTreasury(treasury);
        vouchMe.setFee(0.001 ether);
        vouchMe.setFreeThreshold(2);
        
        createTestimonial(bob, alice, "Test 1");
        createTestimonial(charlie, alice, "Test 2");
        
        // Now at threshold, next one requires fee
        assertEq(vouchMe.getRequiredFee(alice), 0.001 ether);
    }

    /////////////////////////////////////////////////
    // FEE PAYMENT TESTS
    /////////////////////////////////////////////////

    function testFeePaymentWhenOverThreshold() public {
        vouchMe.setTreasury(treasury);
        vouchMe.setFreeThreshold(1);
        vouchMe.setFee(0.01 ether);
        
        // First testimonial is free
        createTestimonial(bob, alice, "Free testimonial");
        
        // Second requires payment
        uint256 treasuryBalanceBefore = treasury.balance;
        
        vm.expectEmit(true, true, false, false);
        emit FeePaid(alice, 0.01 ether);
        
        bytes memory signature = createValidSignature(charlie, alice, "Paid testimonial", GIVER_NAME, PROFILE_URL);
        vm.prank(alice);
        vouchMe.createTestimonial{value: 0.01 ether}(charlie, "Paid testimonial", GIVER_NAME, PROFILE_URL, signature);
        
        assertEq(treasury.balance, treasuryBalanceBefore + 0.01 ether, "Treasury should receive fee");
        assertEq(vouchMe.getTestimonialCount(alice), 2);
    }
    
    function testFeePaymentRevertsWhenInsufficient() public {
        vouchMe.setTreasury(treasury);
        vouchMe.setFreeThreshold(0); // All testimonials require fee
        vouchMe.setFee(0.01 ether);
        
        bytes memory signature = createValidSignature(bob, alice, CONTENT, GIVER_NAME, PROFILE_URL);
        
        vm.prank(alice);
        vm.expectRevert("Insufficient fee payment");
        vouchMe.createTestimonial{value: 0.005 ether}(bob, CONTENT, GIVER_NAME, PROFILE_URL, signature);
    }
    
    function testExcessPaymentRefunded() public {
        vouchMe.setTreasury(treasury);
        vouchMe.setFreeThreshold(0);
        vouchMe.setFee(0.01 ether);
        
        uint256 aliceBalanceBefore = alice.balance;
        
        bytes memory signature = createValidSignature(bob, alice, CONTENT, GIVER_NAME, PROFILE_URL);
        vm.prank(alice);
        vouchMe.createTestimonial{value: 0.05 ether}(bob, CONTENT, GIVER_NAME, PROFILE_URL, signature);
        
        // Alice should only be charged 0.01 ether (the fee), excess 0.04 refunded
        assertEq(alice.balance, aliceBalanceBefore - 0.01 ether, "Should only deduct exact fee");
        assertEq(treasury.balance, 0.01 ether, "Treasury should receive exact fee");
    }

    /////////////////////////////////////////////////
    // EDGE CASE TESTS
    /////////////////////////////////////////////////

    function testFreeThresholdZero() public {
        // All testimonials require payment from the start
        vouchMe.setTreasury(treasury);
        vouchMe.setFreeThreshold(0);
        vouchMe.setFee(0.001 ether);
        
        assertEq(vouchMe.getRemainingFreeTestimonials(alice), 0);
        assertEq(vouchMe.getRequiredFee(alice), 0.001 ether);
    }
    
    function testDisableMonetizationBySettingFeeToZero() public {
        // Enable monetization
        vouchMe.setTreasury(treasury);
        vouchMe.setFreeThreshold(1);
        vouchMe.setFee(0.01 ether);
        
        createTestimonial(bob, alice, "Test 1");
        
        // Now requires fee
        assertEq(vouchMe.getRequiredFee(alice), 0.01 ether);
        
        // Disable by setting fee to 0
        vouchMe.setFee(0);
        
        // Should be free again
        assertEq(vouchMe.getRequiredFee(alice), 0);
        
        // Can create without payment
        createTestimonial(charlie, alice, "Test 2");
        assertEq(vouchMe.getTestimonialCount(alice), 2);
    }

    function testFeeTransferFailsWithRejectingTreasury() public {
        RejectingContract rejectingTreasury = new RejectingContract();

        vouchMe.setTreasury(address(rejectingTreasury));
        vouchMe.setFreeThreshold(0);
        vouchMe.setFee(0.01 ether);

        bytes memory signature = createValidSignature(bob, alice, CONTENT, GIVER_NAME, PROFILE_URL);

        vm.prank(alice);
        vm.expectRevert("Fee transfer failed");
        vouchMe.createTestimonial{value: 0.01 ether}(bob, CONTENT, GIVER_NAME, PROFILE_URL, signature);
    }

    function testRefundFailsWithRejectingReceiver() public {
        RejectingContract rejectingReceiver = new RejectingContract();

        vouchMe.setTreasury(treasury);
        vouchMe.setFreeThreshold(0);
        vouchMe.setFee(0.01 ether);

        vm.deal(address(rejectingReceiver), 1 ether);

        bytes memory signature = createValidSignature(
            bob,
            address(rejectingReceiver),
            CONTENT,
            GIVER_NAME,
            PROFILE_URL
        );

        vm.expectRevert("Refund failed");
        rejectingReceiver.submitTestimonial{value: 0.02 ether}(
            vouchMe,
            bob,
            CONTENT,
            GIVER_NAME,
            PROFILE_URL,
            signature
        );
    }
    
    function testOwnershipTransfer() public {
        address newOwner = makeAddr("newOwner");
        
        vouchMe.transferOwnership(newOwner);
        assertEq(vouchMe.owner(), newOwner);
        
        // Old owner can't set fee anymore
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", owner));
        vouchMe.setFee(0.001 ether);
        
        // New owner can
        vm.prank(newOwner);
        vouchMe.setTreasury(treasury);
        
        vm.prank(newOwner);
        vouchMe.setFee(0.001 ether);
        
        assertEq(vouchMe.fee(), 0.001 ether);
    }

    /////////////////////////////////////////////////
    // FUZZ TESTS
    /////////////////////////////////////////////////

    function testFuzzSetFee(uint256 _fee) public {
        vouchMe.setTreasury(treasury);
        vouchMe.setFee(_fee);
        assertEq(vouchMe.fee(), _fee);
    }
    
    function testFuzzSetFreeThreshold(uint256 _threshold) public {
        vouchMe.setFreeThreshold(_threshold);
        assertEq(vouchMe.freeThreshold(), _threshold);
    }
    
    function testFuzzGetRemainingFreeTestimonials(uint256 _threshold) public {
        vm.assume(_threshold > 0 && _threshold < type(uint256).max - 10);
        
        vouchMe.setFreeThreshold(_threshold);
        
        uint256 remaining = vouchMe.getRemainingFreeTestimonials(alice);
        assertEq(remaining, _threshold);
    }
}
