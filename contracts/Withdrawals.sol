// SPDX-License-Identifier: Apache-2.0.
pragma solidity >= 0.8.0;

import "./Storage.sol";

abstract contract Withdrawals is Storage {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    event LogWithdrawalPerformed(
        uint256 ownerKey,
        uint256 amount,
        address recipient
    );

    function withdrawERC20(IERC20Upgradeable token, uint256 ownerKey, address payable recipient) internal {
        require(recipient != address(0), "w0");
        uint256 amount = pendingWithdrawals[ownerKey];
        pendingWithdrawals[ownerKey] = 0;

        token.safeTransfer(recipient, amount); 

        emit LogWithdrawalPerformed(
            ownerKey,
            amount,
            recipient
        );
    }

    function withdraw(uint256 ownerKey) external nonReentrant {
        address payable recipient = payable(ethKeys[ownerKey]);
        withdrawERC20(collateralToken, ownerKey, recipient);
    }

    function withdrawTo(
        uint256 ownerKey, address payable recipient)
        external onlyKeyOwner(ownerKey) nonReentrant
    {
        withdrawERC20(collateralToken, ownerKey, recipient);
    }

}
