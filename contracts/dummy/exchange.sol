// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract exchange {
    IERC20 public immutable SYSTEM_TOKEN;

    constructor(IERC20 systemToken) {
        SYSTEM_TOKEN = systemToken;
    }

    function sellEthForTokenToUniswapV3(
        bytes memory encodedPath,
        uint256 minBuyAmount,
        address recipient
    )
        public
        payable
        returns (uint256 buyAmount) {
            SYSTEM_TOKEN.transfer(msg.sender, minBuyAmount);
            return minBuyAmount;
        }

    function sellTokenForTokenToUniswapV3(
        bytes memory encodedPath,
        uint256 sellAmount,
        uint256 minBuyAmount,
        address recipient
    )
        public
        returns (uint256 buyAmount) {
            SYSTEM_TOKEN.transfer(msg.sender, minBuyAmount);
            return minBuyAmount;
        }
}
