// SPDX-License-Identifier: Apache-2.0.
pragma solidity >= 0.8.0;

import "./Storage.sol";

abstract contract ConditionalTransfer is Storage {
    using SafeERC20Upgradeable for IERC20Upgradeable;

	event LogConditionalTransferProofReg(
		uint256 recieverL2Key,
		uint256 senderL2Key,
        uint64 amount,
		bytes32 condition);

	function getConditionalTransferHash(
		uint256 recieverL2Key,
		uint256 senderL2Key,
        uint64 amount
	) internal view returns (bytes32 h) {
		h = keccak256(abi.encode(
			"CONDITIONAL_TRANSFER",
			block.timestamp,
			recieverL2Key,
			senderL2Key,
        	amount
		));
	}

    function conditionalTransferRegProof(
		uint256 recieverL2Key,
		uint256 senderL2Key,
        uint64 amount
    ) internal {
		bytes32 cond = getConditionalTransferHash(
			recieverL2Key,
			senderL2Key,
        	amount
		);

		require(!proofRegister[cond], "pae"); //  "proof already exit"
		proofRegister[cond] = true;

        emit LogConditionalTransferProofReg(
			recieverL2Key,
			senderL2Key,
        	amount,
			cond
		);
    }

    function condTransfer(
		address reciever,
		uint256 recieverL2Key,
		uint256 senderL2Key,
		uint64 amount
	) external nonReentrant {
		require(ethKeys[recieverL2Key] == reciever);

        collateralToken.safeTransfer(reciever, amount);

		conditionalTransferRegProof(recieverL2Key, senderL2Key, amount);
	}
}
