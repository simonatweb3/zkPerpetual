// SPDX-License-Identifier: MIT OR Apache-2.0

pragma solidity >= 0.8.0;

import "./Storage.sol";

abstract contract Dac is Storage {

    function regDac(address member) external onlyGovernor {
        // TimeLock : User not trust the feeder, will be able to withdraw
        require(!DacRegisterActive, "dir");     // "dac in register"
        require(!dacs[member], "dae");    // "dac already exist"
        DacRegisterActive = true;
        DacRegisterTime = block.timestamp;
        pendingDacMember = member;
    }

    function updateDac() external onlyGovernor {
        require(DacRegisterActive, "dnr"); // "dac not register"
        require(block.timestamp > DacRegisterTime + TIMELOCK_DAC_REG, "drit"); // "dac register still in timelock"
        DacRegisterActive = false;

        addDac(pendingDacMember);
    }

    function cancelDacReg() external onlyGovernor {
        DacRegisterActive = false;
    }

    function addDac(address member) internal {
        require(member != address(0), "da0");
        dacs[member] = true;
        dacNum += 1;
    }
    
    function deleteDac(address member) external onlyGovernor {
        // Time-Lock ?
        require(dacs[member] != false, "dane"); // "dac member not exist"
        require(dacNum > MIN_DAC_MEMBER, "dmu");  // "dac memeber underflow"
        delete dacs[member];
        dacNum -= 1;
    }

}
