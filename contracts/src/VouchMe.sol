// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VouchMe is ERC721URIStorage, ReentrancyGuard {
    using ECDSA for bytes32;
    using Strings for uint256;
    
    uint256 private _tokenIdTracker; // Manually track token IDs
    uint256 public totalProfiles; // Counter for total profiles created
    uint256 public totalTestimonials; // Counter for total testimonials created

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
    
    constructor() ERC721("VouchMe Testimonial", "VOUCH") {}
    
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
    ) external nonReentrant returns (uint256) {
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
        require(recoveredSigner == senderAddress, "Invalid signature");

        // Check if there's an existing testimonial from this sender to this receiver
        uint256 existingTokenId = _testimonial[senderAddress][msg.sender];
        bool isUpdate = false;
        if (existingTokenId != 0) {
            isUpdate = true;
            // Remove the existing testimonial
            _removeTestimonialFromList(existingTokenId, senderAddress, msg.sender);
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
        require(_ownerOf(tokenId) != address(0), "Testimonial does not exist");
        
        // Check if the testimonial exists in the contract state
        address sender = _testimonials[tokenId].sender;
        address receiver = _testimonials[tokenId].receiver;
        require(_testimonial[sender][receiver] == tokenId, "Testimonial has been deleted");
        
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
        require(_ownerOf(tokenId) == address(0), "Tokens are non-transferrable");

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
        // Delete testimonial data to fix memory leak
        delete _testimonials[tokenId];
        
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
    function deleteTestimonial(uint256 tokenId) external nonReentrant {
        require(_ownerOf(tokenId) == msg.sender, "Only recipient can delete");
        
        // Check if the testimonial still exists
        address sender = _testimonials[tokenId].sender;
        require(_testimonial[sender][msg.sender] == tokenId, "Testimonial already deleted");
        
        _removeTestimonialFromList(tokenId, sender, msg.sender);
        
        emit TestimonialDeleted(tokenId, msg.sender);
    }
}
