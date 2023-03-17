// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity >=0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { I_ExchangeProxy } from "./I_ExchangeProxy.sol";

contract TokenExchangeProxy is I_ExchangeProxy {
  using SafeERC20 for IERC20;

  IERC20 immutable TOKEN_ADDRESS;

  constructor(
    IERC20 tokenAddress
  ) {
    TOKEN_ADDRESS = tokenAddress;
  }

  function proxyExchange(
    bytes calldata proxyExchangeData
  )
    external
    override
    payable
  { // nonReentrant
    (
      IERC20 tokenFrom,
      address allowanceTarget,
      uint256 minTokenAmount,
      address exchange,
      bytes memory exchangeData
    ) = abi.decode(proxyExchangeData, (IERC20, address, uint256, address, bytes));

    // Set allowance (if non-zero addresses provided).
    if (
      tokenFrom != IERC20(address(0)) &&
      allowanceTarget != address(0)
    ) {
      // safeApprove requires unsetting the allowance first.
      tokenFrom.safeApprove(allowanceTarget, 0);
      tokenFrom.safeApprove(allowanceTarget, type(uint256).max);
    }

    // Call exchange with data to execute swap.
    (bool success, bytes memory returndata) = exchange.call{ value: msg.value }(
      exchangeData
    );
    require(success, string(returndata));

    uint256 tokenBalance = TOKEN_ADDRESS.balanceOf(address(this));
    require(tokenBalance >= minTokenAmount, 'Received Token is less than minTokenAmount');

    // Transfer all Token balance back to msg.sender.
    TOKEN_ADDRESS.safeTransfer(
      msg.sender,
      tokenBalance
    );
  }
}
