// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/VouchMe.sol";

contract ConfigureMonetization is Script {
    function run() external {
        address vouchMeAddress = vm.envAddress("VOUCHME_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        uint256 freeThreshold = vm.envUint("FREE_THRESHOLD");
        uint256 fee = vm.envUint("FEE_WEI");

        vm.startBroadcast();

        VouchMe vouchMe = VouchMe(vouchMeAddress);

        // Safe ordering: treasury -> threshold -> fee.
        // setFee requires treasury when fee > 0.
        vouchMe.setTreasury(treasury);
        vouchMe.setFreeThreshold(freeThreshold);
        vouchMe.setFee(fee);

        vm.stopBroadcast();

        console.log("Configured monetization on:", vouchMeAddress);
        console.log("Treasury:", treasury);
        console.log("Free threshold:", freeThreshold);
        console.log("Fee (wei):", fee);
    }
}
