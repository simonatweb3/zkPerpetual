// SPDX-License-Identifier: Apache-2.0.
pragma solidity >= 0.8.12;

import "./Storage.sol";
import "./libs/Bytes.sol";

abstract contract Users is Storage {
    event LogUserRegistered(address ethAddr, uint256[] l2Keys, address sender);
    
    function registerUser(
        address ethAddr,
        uint256[] memory l2Keys,
        bytes calldata signature
    ) public {
	    for (uint32 i = 0; i < l2Keys.length; ++i) {
            require(ethKeys[l2Keys[i]] == address(0), "l2Key already registered");
        }

        bytes32 concatKeyHash = EMPTY_STRING_KECCAK;
        for (uint256 i = 0; i < l2Keys.length; ++i) {
            concatKeyHash = keccak256(abi.encodePacked(concatKeyHash, l2Keys[i]));
        }

        bytes memory orig_msg = bytes.concat(
                abi.encode(ethAddr),
                concatKeyHash);

        bytes memory message = bytes.concat(
                "\x19Ethereum Signed Message:\n130",  // 10-th 130
                "0x",
                Bytes.bytesToHexASCIIBytes(orig_msg)
        );

        address signer = ECDSA.recover(keccak256(message), signature);
        require(signer == userAdmin, "User Register Sinature Invalid");

	    for (uint32 i = 0; i < l2Keys.length; ++i) {
 	        ethKeys[l2Keys[i]] = ethAddr;
	    }
        emit LogUserRegistered(ethAddr, l2Keys, msg.sender);
    }
}
