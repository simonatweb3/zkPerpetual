// SPDX-License-Identifier: MIT OR Apache-2.0

pragma solidity >= 0.8.0;

import "./libs/Bytes.sol";

library Operations {
    /// @notice operation type
    enum OpType {
        Noop,    // 0
        Deposit,
        ForceTrade,
        ForceWithdraw,
        Withdraw,
        Trade,
        Transfer,
        ConditionalTransfer,
        FundingTick,
        OraclePriceTick,
        Liquidate,
        Deleverage
    }

    struct DepositOrWithdraw {
        uint24 accountId;
        uint160 l2Key;
        uint64 amount;
    }

    function readDepositOrWithdrawPubdata(bytes memory _data, uint256 offset) internal pure returns (DepositOrWithdraw memory parsed) {
        (offset, parsed.accountId) = Bytes.readUInt24(_data, offset);   // accountId
        (offset, parsed.l2Key) = Bytes.readUInt160(_data, offset);      // l2Key
        (offset, parsed.amount) = Bytes.readUInt64(_data, offset);      // amount
    }

    uint256 constant FORCED_WITHDRAWAL_PUBDATA_BYTES = 33;
    uint256 constant CONDITIONAL_TRANSFER_PUBDATA_BYTES = 54;
    uint32 constant DEPOSIT_WITHDRAW_PUBDATA_BYTES = 31 ;

    uint32 constant ACCOUNT_COLLATERAL_BALANCE_PUBDATA_BYTES = 11 ;
    uint32 constant ACCOUNT_POSITION_PUBDATA_BYTES = 13 ;

    uint8 constant OP_TYPE_BYTES = 1;

    // Withdraw pubdata
    struct Withdraw {
        uint8 opType;    // 0x04
        uint24 accountId;
        uint160 l2Key;
        uint64 amount;
    }

    // ForcedWithdrawal pubdata
    struct ForcedWithdrawal {
        uint8 opType;    // 0x03
        uint24 accountId;
        uint160 l2Key;
        uint64 amount;
        uint8 isSuccess;
    }

    /// Deserialize forcedWithdrawal pubdata
    function readForcedWithdrawalPubdata(bytes memory _data, uint256 offset) internal pure returns (ForcedWithdrawal memory parsed) {
        offset += OP_TYPE_BYTES;
        (offset, parsed.accountId) = Bytes.readUInt24(_data, offset);   // accountId
        (offset, parsed.l2Key) = Bytes.readUInt160(_data, offset);      // l2Key
        (offset, parsed.amount) = Bytes.readUInt64(_data, offset);      // amount
        parsed.isSuccess = uint8(_data[offset++]);
    }

    struct ConditionalTransfer {
        uint8 opType;    // 0x07
        uint24 fromAccountId;
        uint24 toAccountId;
        uint64 collateralAmount;
        uint64 fee;
        bytes31 condition;
    }

    function readConditionalTransferPubdata(bytes memory _data, uint256 offset) internal pure returns (ConditionalTransfer memory parsed) {
        offset += OP_TYPE_BYTES;
        (offset, parsed.fromAccountId) = Bytes.readUInt24(_data, offset);   // accountId
        (offset, parsed.toAccountId) = Bytes.readUInt24(_data, offset);   // accountId
        (offset, parsed.collateralAmount) = Bytes.readUInt64(_data, offset);      // amount
        (offset, parsed.fee) = Bytes.readUInt64(_data, offset);      // amount
        parsed.condition = bytes31(_data[offset++]);    // TODO : fix
    }


}
