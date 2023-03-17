// SPDX-License-Identifier: Apache-2.0
pragma solidity >= 0.8.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC2771Context } from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { I_ExchangeProxy } from "./I_ExchangeProxy.sol";
import { I_Perpetual } from "../I_Perpetual.sol";

contract DepositProxy is
  ERC2771Context,
  Ownable,
  ReentrancyGuard
{
  using SafeERC20 for IERC20;

  I_Perpetual public immutable PERPETUAL_CONTRACT;
  IERC20 public immutable SYSTEM_TOKEN;
  address immutable ETH_PLACEHOLDER_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  constructor(
    I_Perpetual perpetualContract,
    IERC20 systemToken,
    address trustedForwarder
  )
    ERC2771Context(trustedForwarder)
  {
    PERPETUAL_CONTRACT = perpetualContract;
    SYSTEM_TOKEN = systemToken;

    // Set the allowance to the highest possible value.
    systemToken.safeApprove(address(perpetualContract), type(uint256).max);
  }

  event LogProxyDeposit(
    address sender,
    address tokenFrom,
    uint256 tokenFromAmount,
    uint256 usdcAmount
  );

  function deposit(
    uint256 depositAmount,
    uint256 starkKey,
    bytes calldata signature
  )
    external nonReentrant
  {
    address sender = _msgSender();

    // // Register address in perpetual Layer2.
    // if (signature.length > 0) {
    //   PERPETUAL_CONTRACT.registerUser(sender, starkKey, signature);
    // }

    // Deposit depositAmount of USDC to the L2 exchange account of the sender.
    SYSTEM_TOKEN.safeTransferFrom(
      sender,
      address(this),
      depositAmount
    );
    PERPETUAL_CONTRACT.deposit(
      starkKey,
      depositAmount
    );
  }

  function depositERC20(
    IERC20 tokenFrom,
    uint256 tokenFromAmount,
    uint256 starkKey,
    I_ExchangeProxy exchangeProxy,
    bytes calldata exchangeProxyData,
    bytes calldata signature
  )
    external
    nonReentrant
    returns (uint256)
  {
    address sender = _msgSender();

    // Register address in perpetual Layer2.
    // if (signature.length > 0) {
    //   PERPETUAL_CONTRACT.registerUser(sender, starkKey, signature);
    // }

    // Send `tokenFrom` to this contract.
    tokenFrom.safeTransferFrom(
      sender,
      address(exchangeProxy),
      tokenFromAmount
    );

    // Swap token.
    exchangeProxy.proxyExchange(exchangeProxyData);

    // Deposit full balance of USDC in DepositProxy to the L2 exchange account of the sender.
    uint256 tokenBalance = SYSTEM_TOKEN.balanceOf(address(this));
    PERPETUAL_CONTRACT.deposit(
      starkKey,
      tokenBalance
    );

    // Log the result.
    emit LogProxyDeposit(
      sender,
      address(tokenFrom),
      tokenFromAmount,
      tokenBalance
    );

    return tokenBalance;
  }

  function depositEth(
    uint256 starkKey,
    I_ExchangeProxy exchangeProxy,
    bytes calldata exchangeProxyData,
    bytes calldata signature
  )
    external payable nonReentrant
    returns (uint256)
  {
    address sender = _msgSender();

    // Register address in perpetual Layer2.
    // if (signature.length > 0) {
    //   PERPETUAL_CONTRACT.registerUser(sender, starkKey, signature);
    // }

    // Swap token.
    exchangeProxy.proxyExchange{ value: msg.value }(exchangeProxyData);

    // Deposit full balance of USDC in DepositProxy to the L2 exchange account of the sender.
    uint256 tokenBalance = SYSTEM_TOKEN.balanceOf(address(this));
    PERPETUAL_CONTRACT.deposit(
      starkKey,
      tokenBalance
    );

    // Log the result.
    emit LogProxyDeposit(
      sender,
      ETH_PLACEHOLDER_ADDRESS,
      msg.value,
      tokenBalance
    );

    return tokenBalance;
  }

  function _msgSender() internal view virtual
    override(Context, ERC2771Context)
    returns (address sender)
  {
    return ERC2771Context._msgSender();
  }

  function _msgData() internal view virtual
    override(Context, ERC2771Context)
    returns (bytes calldata)
  {
    return ERC2771Context._msgData();
  }
}
