// SPDX-License-Identifier: Apache-2.0.
pragma solidity >= 0.8.0;

import "./Storage.sol";

abstract contract ForcedTrade is Storage {
    event LogForcedTradeRequest(
		uint256 l2KeyA,
		uint256 l2KeyB,
		uint256 syntheticAssetId,
        uint256 amountSynthetic,
		uint256 amountCollateral,
        bool aIsBuyingSynthetic,
        uint256 nonce
	);

	function getForceTradeHash(
		uint256 l2KeyA,
		uint256 l2KeyB,
		uint256 syntheticAssetId,
        uint256 amountSynthetic,
		uint256 amountCollateral,
        bool aIsBuyingSynthetic,
        uint256 submissionExpirationTime,
        uint256 nonce,
        bytes calldata signature
	) internal pure returns (bytes32 h) {
		h = keccak256(abi.encode(
			"FORCED_TRADE",
			l2KeyA,
			l2KeyB,
			syntheticAssetId,
        	amountSynthetic,
			amountCollateral,
        	aIsBuyingSynthetic,
        	submissionExpirationTime,
        	nonce,
        	signature
		));
	}

    function forcedTradeRequest(
		uint256 l2KeyA,
		uint256 l2KeyB,
		uint256 syntheticAssetId,	// BTC-USD, ETH-USD...
        uint256 amountSynthetic,
		uint256 amountCollateral,	// only USDC?
        bool aIsBuyingSynthetic,	// a is buyer(true), or seller(false)
        uint256 submissionExpirationTime,
        uint256 nonce,				// protect from reply attacker
        bytes calldata signature	// non-submitter's signature.
        // bool premiumCost
    //) external notFrozen onlyKeyOwner(starkKey) {
    ) external {
		bytes32 req = getForceTradeHash(
			l2KeyA,
			l2KeyB,
			syntheticAssetId,
        	amountSynthetic,
			amountCollateral,
        	aIsBuyingSynthetic,
        	submissionExpirationTime,
        	nonce,
        	signature
		);

		// TODO : validate non-submitter signature

		addForceRequest(req);

        // Log request.
        emit LogForcedTradeRequest(
			l2KeyA,
			l2KeyB,
			syntheticAssetId,
        	amountSynthetic,
			amountCollateral,
        	aIsBuyingSynthetic,
        	nonce
		);
    }
}
