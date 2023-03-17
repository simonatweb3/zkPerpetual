// SPDX-License-Identifier: MIT OR Apache-2.0

pragma solidity >= 0.8.0;

/// @title configuration constants
contract Config {
    /// @dev Bit mask to apply for verifier public input before verifying.
    uint256 constant INPUT_MASK = (~uint256(0) >> 3);
}
