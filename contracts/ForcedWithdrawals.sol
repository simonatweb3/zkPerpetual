// SPDX-License-Identifier: Apache-2.0.
pragma solidity >= 0.8.0;

import "./Storage.sol";

abstract contract ForcedWithdrawals is Storage {
    event LogForcedWithdrawalRequest(uint256 l2Key, uint256 amount);

	function getForceWithdrawHash(
        uint256 ownerKey,
        uint256 amount
	) internal pure returns (bytes32 h) {
		h = keccak256(abi.encode(
			"FORCED_WITHDRAWAL",
			ownerKey,
			amount
		));
	}

    function forcedWithdrawalRequest(
        uint256 ownerKey,
        uint256 amount
        //bool premiumCost
    //) external notFrozen onlyKeyOwner(starkKey) {
    ) external {
		bytes32 req = getForceWithdrawHash(
			ownerKey,
			amount
		);

		addForceRequest(req);
        emit LogForcedWithdrawalRequest(ownerKey, amount);
    }
}
