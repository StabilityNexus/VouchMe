// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract VouchMe is ERC721URIStorage {
    using ECDSA for bytes32;
    using Strings for uint256;    
    uint256 private _tokenIdTracker; // Manually track token IDs

    // Maps user address to their received testimonial token IDs
    mapping(address => uint256[]) private _receivedTestimonials;
    
    // Maps token ID to testimonial details
    mapping(uint256 => Testimonial) private _testimonials;
    
    // Maps sender to receiver to their active testimonial (for one-per-pair rule)
    mapping(address => mapping(address => uint256)) private _activeTestimonial;
    
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
        bool isDeleted;
    }
    
    event TestimonialCreated(uint256 tokenId, address sender, address receiver);
    event TestimonialVerified(uint256 tokenId, address receiver);
    event TestimonialRemoved(uint256 tokenId, address receiver);
    event TestimonialUpdated(address sender, address receiver, uint256 newTokenId);
    event ProfileUpdated(address user);
    
    constructor() ERC721("VouchMe Testimonial", "VOUCH") {}    /**
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
    ) external returns (uint256) {        // Hash the message that was signed
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

        // Check if there's an existing active testimonial from this sender to this receiver
        uint256 existingTokenId = _activeTestimonial[senderAddress][msg.sender];
        if (existingTokenId != 0) {
            // Soft delete the existing testimonial
            _testimonials[existingTokenId].isDeleted = true;
            
            // Remove it from the receiver's list
            uint256[] storage testimonials = _receivedTestimonials[msg.sender];
            for (uint256 i = 0; i < testimonials.length; i++) {
                if (testimonials[i] == existingTokenId) {
                    // Swap with the last element and pop
                    testimonials[i] = testimonials[testimonials.length - 1];
                    testimonials.pop();
                    break;
                }
            }
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
            verified: true,
            isDeleted: false
        });
          // Add to receiver's testimonials
        _receivedTestimonials[msg.sender].push(newTokenId);
        
        // Update active testimonial mapping
        _activeTestimonial[senderAddress][msg.sender] = newTokenId;
        
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
        require(!_testimonials[tokenId].isDeleted, "Testimonial has been deleted");
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
                '","isDeleted":"', testimonial.isDeleted ? "true" : "false",
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
    }    /**
     * @dev Sets or updates a user's profile information
     * @param name The user's name
     * @param contact The user's contact information
     * @param bio The user's biography
     */    function setProfile(
        string calldata name,
        string calldata contact,
        string calldata bio    ) external {        userProfiles[msg.sender] = Profile({
            name: name,
            contact: contact,
            bio: bio
        });
        
        emit ProfileUpdated(msg.sender);
    }
    
    /**
     * @dev Checks if an active testimonial already exists from a sender to a receiver
     * @param sender The address of the sender
     * @param receiver The address of the receiver
     * @return exists Whether an active testimonial exists
     * @return tokenId The token ID of the existing testimonial (0 if none exists)
     */
    function hasExistingTestimonial(address sender, address receiver) external view returns (bool exists, uint256 tokenId) {
        tokenId = _activeTestimonial[sender][receiver];
        exists = tokenId != 0;
        return (exists, tokenId);
    }
    
    /**
     * @dev Removes a testimonial (soft delete)
     * @param tokenId The token ID to remove
     */
    function removeTestimonial(uint256 tokenId) external {
        require(_ownerOf(tokenId) == msg.sender, "Only recipient can remove");
        require(!_testimonials[tokenId].isDeleted, "Testimonial already deleted");
        
        _testimonials[tokenId].isDeleted = true;
        
        // Remove from active testimonial mapping
        address sender = _testimonials[tokenId].sender;
        if (_activeTestimonial[sender][msg.sender] == tokenId) {
            delete _activeTestimonial[sender][msg.sender];
        }
        
        // Remove from received testimonials array
        uint256[] storage testimonials = _receivedTestimonials[msg.sender];
        for (uint256 i = 0; i < testimonials.length; i++) {
            if (testimonials[i] == tokenId) {
                // Swap with the last element and pop
                testimonials[i] = testimonials[testimonials.length - 1];
                testimonials.pop();
                break;
            }
        }
        
        emit TestimonialRemoved(tokenId, msg.sender);
    }
}
