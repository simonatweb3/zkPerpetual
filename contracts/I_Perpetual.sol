// SPDX-License-Identifier: Apache-2.0.
pragma solidity >= 0.8.0;

interface I_Perpetual {

    function deposit(
        uint256 l2Key,
        uint256 amount
    ) external;

    function registerUser(
        address ethAddr,
        uint256[] memory l2Keys,
        bytes calldata signature
    ) external;

}
