// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract VouchMe is ERC721URIStorage, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using Strings for uint256;
    
    uint256 private _tokenIdTracker; // Manually track token IDs
    uint256 public totalProfiles; // Counter for total profiles created
    uint256 public totalTestimonials; // Counter for total testimonials created
    
    // Monetization parameters (initially disabled)
    address public treasury; // Address to receive fees (address(0) = disabled)
    uint256 public fee; // Fee amount in wei (0 = free)
    uint256 public freeThreshold; // Number of free testimonials before fee kicks in (type(uint256).max = unlimited)

    // Maps user address to their received testimonial token IDs
    mapping(address => uint256[]) private _receivedTestimonials;
    
    // Maps token ID to its index in the receiver's testimonials array
    mapping(uint256 => uint256) private _testimonialIndexInArray;
    
    // Maps token ID to testimonial details
    mapping(uint256 => Testimonial) private _testimonials;
    
    // Maps sender to receiver to their testimonial (for one-per-pair rule)
    mapping(address => mapping(address => uint256)) private _testimonial;
    
    // Maps user address to their profile data
    mapping(address => Profile) public userProfiles;
    
    struct Profile {
        string name;
        string contact;
        string bio;
    }
    
    struct Testimonial {
        address sender;
        address receiver;
        string content;
        string giverName;
        string profileUrl;
        uint256 timestamp;
        bool verified;
    }
    
    event TestimonialCreated(uint256 tokenId, address sender, address receiver);
    event TestimonialVerified(uint256 tokenId, address receiver);
    event TestimonialDeleted(uint256 tokenId, address receiver);
    event TestimonialUpdated(address sender, address receiver, uint256 newTokenId);
    event ProfileUpdated(address user);
    
    // Monetization events
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event FreeThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event FeePaid(address indexed payer, uint256 amount);
    
    // Custom errors for gas-efficient reverts
    error InvalidSignature();
    error TestimonialDoesNotExist();
    error TestimonialHasBeenDeleted();
    error TokensAreNonTransferrable();
    error OnlyRecipientCanDelete();
    error TestimonialAlreadyDeleted();
    error InsufficientFeePayment();
    error FeeTransferFailed();
    error RefundFailed();
    error SetTreasuryBeforeEnablingFees();
    error TreasuryCannotBeZeroAddress();
    
    constructor() ERC721("VouchMe Testimonial", "VOUCH") Ownable(msg.sender) {
        // Initialize with monetization disabled
        treasury = address(0);
        fee = 0;
        freeThreshold = type(uint256).max; // Effectively unlimited free testimonials
    }
    
    /**
     * @dev Creates a testimonial NFT based on a signed message
     * @param senderAddress Address of the sender who created the testimonial
     * @param content The testimonial content
     * @param giverName Full name of the person giving the testimonial
     * @param profileUrl Optional LinkedIn or GitHub profile URL (can be empty)
     * @param signature Signature of the testimonial data
     * @return tokenId The ID of the newly created testimonial NFT
     */
    function createTestimonial(
        address senderAddress,
        string calldata content,
        string calldata giverName,
        string calldata profileUrl,
        bytes calldata signature
    ) external payable nonReentrant returns (uint256) {
        // Hash the message that was signed
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                senderAddress,
                msg.sender, // receiver
                content,
                giverName,
                profileUrl
            )
        );
        
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        // Verify the signature matches the sender
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        if (recoveredSigner != senderAddress) revert InvalidSignature();

        // Check if there's an existing testimonial from this sender to this receiver
        uint256 existingTokenId = _testimonial[senderAddress][msg.sender];
        bool isUpdate = false;
        if (existingTokenId != 0) {
            isUpdate = true;
            // Remove the existing testimonial
            _removeTestimonialFromList(existingTokenId, senderAddress, msg.sender);
        }
        
        // Determine fee requirement before modifying testimonial state
        uint256 currentCount = _receivedTestimonials[msg.sender].length;
        uint256 requiredFee = _calculateRequiredFee(currentCount);
        if (requiredFee > 0) {
            if (msg.value < requiredFee) revert InsufficientFeePayment();
        } else if (msg.value > 0) {
            // No fee is required, so any payment should be refunded later
        }

        uint256 newTokenId = ++_tokenIdTracker; // Manually increment token ID

        // Mint the NFT to the receiver
        _mint(msg.sender, newTokenId);
        
        // Store the testimonial details
        _testimonials[newTokenId] = Testimonial({
            sender: senderAddress,
            receiver: msg.sender,
            content: content,
            giverName: giverName,
            profileUrl: profileUrl,
            timestamp: block.timestamp,
            verified: true
        });
        
        // Add to receiver's testimonials
        uint256 newIndex = _receivedTestimonials[msg.sender].length;
        _receivedTestimonials[msg.sender].push(newTokenId);
        _testimonialIndexInArray[newTokenId] = newIndex;
        
        // Update testimonial mapping
        _testimonial[senderAddress][msg.sender] = newTokenId;
        
        // Increment testimonials counter only for new testimonials (not updates)
        if (!isUpdate) {
            totalTestimonials++;
        }
        
        // Generate token URI
        string memory tokenURI = generateTokenURI(newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        emit TestimonialCreated(newTokenId, senderAddress, msg.sender);
        
        // If we replaced an existing testimonial, emit the update event
        if (existingTokenId != 0) {
            emit TestimonialUpdated(senderAddress, msg.sender, newTokenId);
        }

        // Interactions: transfer fee/refund only after all state changes and events above.
        if (requiredFee > 0) {
            (bool sent, ) = treasury.call{value: requiredFee}("");
            if (!sent) revert FeeTransferFailed();
            emit FeePaid(msg.sender, requiredFee);

            uint256 excess = msg.value - requiredFee;
            if (excess > 0) {
                (bool refunded, ) = msg.sender.call{value: excess}("");
                if (!refunded) revert RefundFailed();
            }
        } else if (msg.value > 0) {
            (bool refunded, ) = msg.sender.call{value: msg.value}("");
            if (!refunded) revert RefundFailed();
        }
        
        return newTokenId;
    }

    /**
     * @dev Gets all testimonials received by a specific address
     * @param receiver The address to get testimonials for
     * @return An array of testimonial token IDs
     */
    function getReceivedTestimonials(address receiver) external view returns (uint256[] memory) {
        return _receivedTestimonials[receiver];
    }
    
    /**
     * @dev Gets details of a specific testimonial
     * @param tokenId The token ID of the testimonial
     * @return Testimonial struct containing details
     */
    function getTestimonialDetails(uint256 tokenId) external view returns (Testimonial memory) {
        if (_ownerOf(tokenId) == address(0)) revert TestimonialDoesNotExist();
        
        // Check if the testimonial exists in the contract state
        address sender = _testimonials[tokenId].sender;
        address receiver = _testimonials[tokenId].receiver;
        if (_testimonial[sender][receiver] != tokenId) revert TestimonialHasBeenDeleted();
        
        return _testimonials[tokenId];
    }

    /**
     * @dev Gets the total number of testimonials received by an address
     * @param receiver The address to check
     * @return The count of testimonials
     */
    function getTestimonialCount(address receiver) external view returns (uint256) {
        return _receivedTestimonials[receiver].length;
    }
    
    /**
     * @dev Gets the total number of profiles created on the platform
     * @return The total count of profiles
     */
    function getTotalProfiles() external view returns (uint256) {
        return totalProfiles;
    }
    
    /**
     * @dev Gets the total number of testimonials created on the platform
     * @return The total count of testimonials
     */
    function getTotalTestimonials() external view returns (uint256) {
        return totalTestimonials;
    }
    
    /**
     * @dev Generate token URI with testimonial data
     * @param tokenId The token ID
     * @return The token URI string
     */
    function generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        Testimonial memory testimonial = _testimonials[tokenId];
        
        return string(
            abi.encodePacked(
                '{"tokenId":"', tokenId.toString(),
                '","sender":"', addressToString(testimonial.sender),
                '","receiver":"', addressToString(testimonial.receiver),
                '","content":"', testimonial.content,
                '","giverName":"', testimonial.giverName,
                '","profileUrl":"', testimonial.profileUrl,
                '","timestamp":"', uint256(testimonial.timestamp).toString(),
                '","verified":"', testimonial.verified ? "true" : "false",
                '"}'
            )
        );
    }

    /**
     * @dev Prevents token transfers by allowing only minting.
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (_ownerOf(tokenId) != address(0)) revert TokensAreNonTransferrable();

        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Utility function to convert address to string
     */
    function addressToString(address _address) internal pure returns (string memory) {
        return Strings.toHexString(uint256(uint160(_address)), 20);
    }
    
    /**
     * @dev Sets or updates a user's profile information
     * @param name The user's name
     * @param contact The user's contact information
     * @param bio The user's biography
     */
    function setProfile(
        string calldata name,
        string calldata contact,
        string calldata bio
    ) external {
        // Check if this is a new profile (first time setting)
        bool isNewProfile = bytes(userProfiles[msg.sender].name).length == 0;
        
        userProfiles[msg.sender] = Profile({
            name: name,
            contact: contact,
            bio: bio
        });
        
        // Increment profiles counter only for new profiles
        if (isNewProfile) {
            totalProfiles++;
        }
        
        emit ProfileUpdated(msg.sender);
    }
    
    /**
     * @dev Checks if a testimonial already exists from a sender to a receiver
     * @param sender The address of the sender
     * @param receiver The address of the receiver
     * @return exists Whether a testimonial exists
     * @return tokenId The token ID of the existing testimonial (0 if none exists)
     */
    function hasExistingTestimonial(address sender, address receiver) external view returns (bool exists, uint256 tokenId) {
        tokenId = _testimonial[sender][receiver];
        exists = tokenId != 0;
        return (exists, tokenId);
    }
    
    /**
     * @dev Internal helper function to remove a testimonial from the contract state
     * @param tokenId The token ID to remove
     * @param sender The sender of the testimonial
     * @param receiver The receiver of the testimonial
     */
    function _removeTestimonialFromList(uint256 tokenId, address sender, address receiver) internal {
        // Delete from testimonial mapping
        delete _testimonial[sender][receiver];
        
        // Delete from received testimonials array
        uint256[] storage testimonials = _receivedTestimonials[receiver];
        uint256 indexToRemove = _testimonialIndexInArray[tokenId];
        uint256 lastIndex = testimonials.length - 1;
        
        // Only perform the swap if the testimonial to remove is not the last one
        if (indexToRemove != lastIndex) {
            uint256 lastTokenId = testimonials[lastIndex];
            testimonials[indexToRemove] = lastTokenId;
            _testimonialIndexInArray[lastTokenId] = indexToRemove;
        }
        
        // Remove the last element
        testimonials.pop();
        
        // Delete the index mapping for the removed testimonial
        delete _testimonialIndexInArray[tokenId];
    }
    
    /**
     * @dev Deletes a testimonial
     * @param tokenId The token ID to delete
     */
    function deleteTestimonial(uint256 tokenId) external {
        if (_ownerOf(tokenId) != msg.sender) revert OnlyRecipientCanDelete();
        
        // Check if the testimonial still exists
        address sender = _testimonials[tokenId].sender;
        if (_testimonial[sender][msg.sender] != tokenId) revert TestimonialAlreadyDeleted();
        
        _removeTestimonialFromList(tokenId, sender, msg.sender);
        
        emit TestimonialDeleted(tokenId, msg.sender);
    }
    
    // ============================================
    // MONETIZATION - ADMIN FUNCTIONS
    // ============================================
    
    /**
     * @dev Sets the fee amount for testimonials after free threshold
     * @param _fee The fee amount in wei (0 to disable fees)
     */
    function setFee(uint256 _fee) external onlyOwner {
        // If setting a non-zero fee, treasury must be set first
        if (_fee != 0 && treasury == address(0)) revert SetTreasuryBeforeEnablingFees();
        
        uint256 oldFee = fee;
        fee = _fee;
        emit FeeUpdated(oldFee, _fee);
    }
    
    /**
     * @dev Sets the treasury address to receive fees
     * @param _treasury The treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert TreasuryCannotBeZeroAddress();
        
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    /**
     * @dev Sets the number of free testimonials before fees apply
     * @param _threshold The threshold count (use type(uint256).max for unlimited)
     */
    function setFreeThreshold(uint256 _threshold) external onlyOwner {
        uint256 oldThreshold = freeThreshold;
        freeThreshold = _threshold;
        emit FreeThresholdUpdated(oldThreshold, _threshold);
    }
    
    // ============================================
    // MONETIZATION - VIEW FUNCTIONS
    // ============================================
    
    /**
     * @dev Returns the number of remaining free testimonials for a user
     * @param user The address to check
     * @return remaining The number of free testimonials remaining (0 if exceeded)
     */
    function getRemainingFreeTestimonials(address user) external view returns (uint256 remaining) {
        uint256 currentCount = _receivedTestimonials[user].length;
        if (currentCount >= freeThreshold) {
            return 0;
        }
        return freeThreshold - currentCount;
    }
    
    /**
     * @dev Returns the fee required for a user to add their next testimonial
     * @param user The address to check
     * @return requiredFee The fee amount in wei (0 if free)
     */
    function getRequiredFee(address user) external view returns (uint256 requiredFee) {
        uint256 currentCount = _receivedTestimonials[user].length;
        return _calculateRequiredFee(currentCount);
    }

    /**
     * @dev Returns the fee required for createTestimonial, accounting for replacement.
     * @param sender The testimonial sender address
     * @param receiver The testimonial receiver address (msg.sender in createTestimonial)
     * @return requiredFee The fee amount in wei after replacement adjustment
     */
    function getRequiredFeeForCreate(address sender, address receiver) external view returns (uint256 requiredFee) {
        uint256 currentCount = _receivedTestimonials[receiver].length;

        // createTestimonial removes an existing sender->receiver testimonial before fee calculation
        if (_testimonial[sender][receiver] != 0 && currentCount > 0) {
            currentCount -= 1;
        }

        return _calculateRequiredFee(currentCount);
    }
    
    /**
     * @dev Internal function to calculate the required fee based on current testimonial count
     * @param currentCount The user's current testimonial count
     * @return The fee amount in wei (0 if free or monetization disabled)
     */
    function _calculateRequiredFee(uint256 currentCount) internal view returns (uint256) {
        // Monetization is disabled if fee is 0 or treasury is not set
        if (fee == 0 || treasury == address(0)) {
            return 0;
        }
        
        // No fee required if under the free threshold
        if (currentCount < freeThreshold) {
            return 0;
        }
        
        return fee;
    }
}
