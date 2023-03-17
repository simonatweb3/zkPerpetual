// SPDX-License-Identifier: MIT OR Apache-2.0

pragma solidity >= 0.8.0;

/// @title Governance Contract
abstract contract Governance {
    /// @notice Governor changed
    event NewGovernor(address newGovernor);
    event ValidatorStatusUpdate(address validatorAddress, bool isActive);

    address public networkGovernor;
    mapping(address => bool) public validators;

    function initGovernor(address governor, address validator) internal {
        networkGovernor = governor;
        validators[validator] = true;
    }

    modifier onlyGovernor() {
        require(msg.sender == networkGovernor, "require Governor");
        _;
    }

    /// @notice Change current governor
    /// @param _newGovernor Address of the new governor
    function changeGovernor(address _newGovernor) external onlyGovernor {
        if (networkGovernor != _newGovernor) {
            networkGovernor = _newGovernor;
            emit NewGovernor(_newGovernor);
        }
    }

    function setValidator(address _validator, bool _active) external onlyGovernor {
        if (validators[_validator] != _active) {
            validators[_validator] = _active;
            emit ValidatorStatusUpdate(_validator, _active);
        }
    }

    modifier onlyValidator() {
        require(validators[msg.sender] == true, "require Validator");
        _;
    }

}
