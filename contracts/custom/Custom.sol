// SPDX-License-Identifier: Apache-2.0.
pragma solidity >= 0.8.0;

import "../Storage.sol";

abstract contract Custom is Storage {

    function set_accountRoot(bytes32 root) onlyGovernor external {
        accountRoot = root;
    }

    function set_userAdmin(address newAdmin) onlyGovernor external {
        userAdmin = newAdmin;
    }

    function set_orderStateHash(bytes32 root) onlyGovernor external {
        orderStateHash = root;
    }

    function set_globalConfigHash(bytes32 root) onlyGovernor external {
        globalConfigHash = root;
    }

    function set_newGlobalConfigHash(bytes32 root) onlyGovernor external {
        newGlobalConfigHash = root;
    }

    function set_pendingDeposit(uint256 l2Key, uint256 amount) onlyGovernor external {
        pendingDeposits[l2Key] = amount;
    }

    function set_systemTokenDecimal(uint8 amount) onlyGovernor external {
        systemTokenDecimal = amount;
    }

    function set_newGlobalConfigValidBlockNum(uint256 amount) onlyGovernor external {
        newGlobalConfigValidBlockNum = amount;
    }

    // function simulate_sender_updateBlock() onlyGovernor external {
    //         if (is_pending_global_config()) {
    //             resetGlobalConfigValidBlockNum();
    //             globalConfigHash = newGlobalConfigHash;
    //             emit LogNewGlobalConfigHash(newGlobalConfigHash);
    //         }
    // }

    function set_MAX_ASSETS_COUNT(uint16 amount) onlyGovernor external {
        MAX_ASSETS_COUNT = amount;
    }

}
