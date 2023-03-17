// SPDX-License-Identifier: Apache-2.0.
pragma solidity >= 0.8.0;

import "./Storage.sol";

abstract contract Deposits is Storage {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    event LogDeposit(
        address ethAddr,
        uint256 l2Key,
        uint256 amount
    );

    event LogDepositCancel(uint256 l2Key);

    event LogDepositCancelReclaimed(
        uint256 l2Key,
        uint256 amount
    );

    function depositERC20(
        IERC20Upgradeable token,
        uint256 l2Key,
        uint256 amount
    ) internal {
        pendingDeposits[l2Key] += amount;

        // Disable the cancellationRequest timeout when users deposit into their own account.
        if (cancellationRequests[l2Key] != 0 && ethKeys[l2Key] == msg.sender)
        {
            delete cancellationRequests[l2Key];
        }

        token.safeTransferFrom(msg.sender, address(this), amount);
        emit LogDeposit(msg.sender, l2Key, amount);
    }

    function deposit(
        uint256 l2Key,
        uint256 amount
    ) public nonReentrant {
        require(ethKeys[l2Key] != address(0), "need reg");
        depositERC20(collateralToken, l2Key, amount);
    }

    function depositCancel(
        uint256 l2Key
    ) external onlyKeyOwner(l2Key) {
        cancellationRequests[l2Key] = block.timestamp;
        emit LogDepositCancel(l2Key);
    }

    function depositReclaim(
        uint256 l2Key
    ) external onlyKeyOwner(l2Key) nonReentrant {
        uint256 requestTime = cancellationRequests[l2Key];
        require(requestTime != 0, "drnc");  // DEPOSIT_NOT_CANCELED
        uint256 freeTime = requestTime + DEPOSIT_CANCEL_TIMELOCK;
        require(block.timestamp >= freeTime, "dl"); // "DEPOSIT_LOCKED"

        // Clear deposit.
        uint256 amount = pendingDeposits[l2Key];
        delete pendingDeposits[l2Key];
        delete cancellationRequests[l2Key];

        collateralToken.safeTransfer(ethKeys[l2Key], amount); 
        emit LogDepositCancelReclaimed(l2Key, amount);
    }
}
