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
    
    struct Testimonial {
        address sender;
        address receiver;
        string content;
        uint256 timestamp;
        bool verified;
    }
    
    event TestimonialCreated(uint256 tokenId, address sender, address receiver);
    event TestimonialVerified(uint256 tokenId, address receiver);
    
    constructor() ERC721("VouchMe Testimonial", "VOUCH") {}

    /**
     * @dev Creates a testimonial NFT based on a signed message
     * @param senderAddress Address of the sender who created the testimonial
     * @param content The testimonial content
     * @param signature Signature of the testimonial data
     * @return tokenId The ID of the newly created testimonial NFT
     */
    function createTestimonial(
        address senderAddress, 
        string calldata content, 
        bytes calldata signature
    ) external returns (uint256) {
        // Hash the message that was signed
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                senderAddress,
                msg.sender, // receiver
                content
            )
        );
        
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        // Verify the signature matches the sender
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        require(recoveredSigner == senderAddress, "Invalid signature");

        uint256 newTokenId = ++_tokenIdTracker; // Manually increment token ID

        // Mint the NFT to the receiver
        _mint(msg.sender, newTokenId);
        
        // Store the testimonial details
        _testimonials[newTokenId] = Testimonial({
            sender: senderAddress,
            receiver: msg.sender,
            content: content,
            timestamp: block.timestamp,
            verified: true
        });
        
        // Add to receiver's testimonials
        _receivedTestimonials[msg.sender].push(newTokenId);
        
        // Generate token URI
        string memory tokenURI = generateTokenURI(newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        emit TestimonialCreated(newTokenId, senderAddress, msg.sender);
        
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
}
