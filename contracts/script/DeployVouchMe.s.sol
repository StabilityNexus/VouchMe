// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/VouchMe.sol";

contract DeployVouchMe is Script {
    function setUp() public {}

    function run() external {
        vm.startBroadcast();
        
        // Deploy the VouchMe contract
        // The deployer (msg.sender) automatically becomes the owner
        VouchMe vouchMe = new VouchMe();
        
        // Note: Monetization is disabled by default:
        // - fee = 0
        // - treasury = address(0)
        // - freeThreshold = type(uint256).max (unlimited)
        //
        // To enable monetization later, the owner can call:
        // 1. setTreasury(treasuryAddress) - set where fees go
        // 2. setFreeThreshold(5) - e.g., 5 free testimonials
        // 3. setFee(0.001 ether) - e.g., 0.001 ETH per testimonial after threshold
        
        vm.stopBroadcast();

        console.log("VouchMe deployed at:", address(vouchMe));
        console.log("Owner:", vouchMe.owner());
        console.log("Monetization disabled (fee=0, treasury=address(0))");
    }
}
