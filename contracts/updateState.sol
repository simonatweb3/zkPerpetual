// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity >= 0.8.12;

import "./Storage.sol";
import "./Config.sol";

// #if PEPV2
import "./ForcedWithdrawals.sol";
import "./ForcedTrade.sol";
import "./ConditionalTransfer.sol";
abstract contract UpdateState is ForcedWithdrawals, ForcedTrade,  ConditionalTransfer, Config {
// #else
abstract contract UpdateState is Config, Storage {
// #endif

    event LogWithdrawalAllowed(
        uint256 l2Key,
        uint256 amount
    );

    event BlockUpdate(uint32 firstBlock, uint32 lastBlock);

    struct GlobalFunding {
        uint64[] index;      // per asset when block have funding_tick transaction
        uint256 indexHashOrTimeStamp;  // if index.length==0, = bytes32 hash, else uint32 timestamp
    }

    struct CommitBlockInfo {
        uint32 blockNumber;
        uint32 timestamp;

        bytes32 accountRoot;                // root hash of account
        bytes32 validiumAccountRoot;        // for rollup merkle path, rollupAccount could be restore from pubData
        bytes32 orderRoot;

        GlobalFunding globalFunding;
        bytes32 oraclePriceHash;
        bytes32 orderStateHash;             // include funding index, oracle price, orderRoot
        bytes32 all_data_commitment;        // account Full Data Hash

        uint32 blockChunkSize;              // per pubdata type(balance/position/onchain) padding zero
        bytes collateralBalancePubData;     // per account [accountId, collateral_balance]
        bytes positonPubData;               // per account [accountId, asset_id, balance]
        bytes onchainPubData;               // per onchain operation (deposit/withdraw/...) [op_type, ...]
    }

    struct ProofInput {
        uint256[] recursiveInput;
        uint256[] proof;
        uint256[] commitments;
        uint8[] vkIndexes;
        uint256[16] subproofsLimbs;
    }

    function getPadLen(
        uint256 realSize,
        uint32 alignSize
    ) internal pure returns (uint256 padLen) {
        padLen = realSize % alignSize;
        if (padLen != 0) {
            padLen = alignSize - padLen;
        } else if (realSize == 0) {
            padLen = alignSize;
        }
    }

    function pubdataPadCommitment(
        bytes calldata pubdata,
        uint32 alignSize
    ) internal pure returns (bytes32 commitment) {
        uint256 padLen = getPadLen(pubdata.length, alignSize);
        if (padLen != 0) {
            bytes memory padZero = new bytes(padLen);
            commitment = sha256(bytes.concat(pubdata, padZero));
        } else {
            commitment = sha256(pubdata);
        }
    }

    function createBlockCommitment(
        bytes32 oldAccountRoot,
        bytes32 oldOrderStateHash,
        bytes32 newOrderStateHash,
        CommitBlockInfo calldata newBlock
    ) internal view returns (bytes32 commitment) {
        bytes32 h = sha256(abi.encodePacked(uint256(newBlock.blockNumber), oldAccountRoot));
        h = sha256(bytes.concat(h, newBlock.accountRoot));
        h = sha256(bytes.concat(h, oldOrderStateHash));
        h = sha256(bytes.concat(h, newOrderStateHash));
        h = sha256(bytes.concat(h, globalConfigHash));
        h = sha256(bytes.concat(h, newBlock.validiumAccountRoot));

        uint32 alignSize = newBlock.blockChunkSize * Operations.ACCOUNT_COLLATERAL_BALANCE_PUBDATA_BYTES;
        bytes32 rollup_col_commitment = pubdataPadCommitment(newBlock.collateralBalancePubData, alignSize);

        alignSize = newBlock.blockChunkSize * Operations.ACCOUNT_POSITION_PUBDATA_BYTES;
        bytes32 rollup_assets_commitment = pubdataPadCommitment(newBlock.positonPubData, alignSize);

        bytes32 rollup_data_commitment = sha256(bytes.concat(rollup_col_commitment, rollup_assets_commitment));
        bytes32 account_data_commitment = sha256(bytes.concat(rollup_data_commitment, newBlock.all_data_commitment));
        h = sha256(bytes.concat(h, account_data_commitment));

        alignSize = newBlock.blockChunkSize * Operations.DEPOSIT_WITHDRAW_PUBDATA_BYTES;
        bytes32 onchain_commitment = pubdataPadCommitment(newBlock.onchainPubData, alignSize);
        commitment = sha256(bytes.concat(h, onchain_commitment));
    }

    function postProcess(
        bytes calldata pubData
    ) internal {
        uint256 offset = 0;
        uint256 factor = 10 ** (systemTokenDecimal - innerDecimal);

        while (offset < pubData.length) {

            Operations.DepositOrWithdraw memory op = Operations.readDepositOrWithdrawPubdata(pubData, offset);
            if (op.amount > DEPOSIT_LOWER_BOUND) {
                uint256 innerAmount = (uint256(op.amount) - DEPOSIT_LOWER_BOUND);
                pendingDeposits[op.l2Key] -= innerAmount * factor;
            } else {
                uint256 innerAmount = (DEPOSIT_LOWER_BOUND - uint256(op.amount));
                uint256 externalAmount = innerAmount * factor;
                pendingWithdrawals[op.l2Key] += externalAmount;
                emit LogWithdrawalAllowed(op.l2Key, externalAmount);
            }
            
            offset += Operations.DEPOSIT_WITHDRAW_PUBDATA_BYTES;
        }
    }

    function encodePackU64Array(
        uint64[] memory a, uint start, uint padLen, uint64 padValue
    ) internal pure returns(bytes memory data) {
        for(uint i = start; i< start + padLen; i++){
            if (i < a.length) {
                data = abi.encodePacked(data, a[i]);
            } else {
                data = abi.encodePacked(data, padValue);
            }
        }
    }

    function getOrderStateHash(
        CommitBlockInfo calldata b,
        uint64[] memory oracle_price
    ) internal view returns (bytes32 newOrderStateHash) {
        if (oracle_price.length == 0 && b.globalFunding.index.length == 0) {
            return b.orderStateHash;
        }

        bytes32 oraclePriceHash = b.oraclePriceHash;
        if (oracle_price.length != 0) {
            bytes memory encode_data = encodePackU64Array(oracle_price, 0, MAX_ASSETS_COUNT, 0);
            oraclePriceHash = sha256(encode_data);
        }

        bytes32 globalFundingIndexHash;
        if (b.globalFunding.index.length != 0) {
            uint32 timestamp = uint32(b.globalFunding.indexHashOrTimeStamp);
            bytes memory encode_data = abi.encodePacked(timestamp, encodePackU64Array(b.globalFunding.index, 0, MAX_ASSETS_COUNT, 1 << 63));
            globalFundingIndexHash = sha256(encode_data);
        } else {
            globalFundingIndexHash = bytes32(b.globalFunding.indexHashOrTimeStamp);
        }

        bytes32 global_state_hash = sha256(abi.encodePacked(uint32(b.timestamp), globalFundingIndexHash, oraclePriceHash));
        newOrderStateHash = sha256(bytes.concat(b.orderRoot, global_state_hash));
    }

    function verifyProofCommitment(
        CommitBlockInfo[] calldata _newBlocks,
        uint256[] calldata proof_commitments,
        uint64[] calldata lastestOraclePrice
    ) internal returns (bytes32 curOrderStateHash) {
        bytes32 curAccountRoot = accountRoot;
        curOrderStateHash = orderStateHash;
        for (uint256 i = 0; i < _newBlocks.length; ++i) {
            if (is_pending_global_config() && _newBlocks[i].blockNumber >= newGlobalConfigValidBlockNum) {
                resetGlobalConfigValidBlockNum();
                globalConfigHash = newGlobalConfigHash;
                emit LogNewGlobalConfigHash(newGlobalConfigHash);
            }

            // Create block commitment, and check with proof commitment
            uint64[] memory oraclePrice;
            if (i == _newBlocks.length - 1) {
                oraclePrice = lastestOraclePrice;
            }
            bytes32 newOrderStateHash = getOrderStateHash(_newBlocks[i], oraclePrice);
            bytes32 commitment = createBlockCommitment(curAccountRoot, curOrderStateHash, newOrderStateHash, _newBlocks[i]);
            require(proof_commitments[i] & INPUT_MASK == uint256(commitment) & INPUT_MASK, "proof commitment invalid");

            curAccountRoot = _newBlocks[i].accountRoot;
            curOrderStateHash = newOrderStateHash;
        }
    }

    function verifyValidiumSignature(
        CommitBlockInfo[] calldata newBlocks,
        bytes[] calldata validium_signature
    ) internal view {
        bytes32 concatValdiumHash = EMPTY_STRING_KECCAK;
        for (uint256 i = 0; i < newBlocks.length; ++i) {
            concatValdiumHash = keccak256(bytes.concat(concatValdiumHash, newBlocks[i].all_data_commitment));
        }

        bytes memory message = bytes.concat(
                "\x19Ethereum Signed Message:\n66",
                "0x",
                Bytes.bytesToHexASCIIBytes(abi.encodePacked(concatValdiumHash))
        );
        bytes32 msgHash = keccak256(message);

        uint32 sig_dac_num = 0;
        address[MIN_SIGNATURE_MEMBER] memory signers;
        for (uint256 i = 0; i < validium_signature.length; ++i) {
            address signer = ECDSA.recover(msgHash, validium_signature[i]);
            require(dacs[signer], "notDac");

            uint256 j;
            for (j = 0; j < sig_dac_num; ++j) {
                if (signers[j] == signer) {
                    break;
                }
            }

            if (j != sig_dac_num) { // ignore same signer
                continue;
            }


            signers[sig_dac_num++] = signer;
            if (sig_dac_num == MIN_SIGNATURE_MEMBER) {
                // ignore additional signature.
                break;
            }
        }
        require(sig_dac_num >= MIN_SIGNATURE_MEMBER, "sig3");
    }

    function updateBlocks(
        CommitBlockInfo[] calldata _newBlocks,
        bytes[] calldata validium_signature,
        ProofInput calldata _proof,
        uint64[] calldata lastestOraclePrice
    ) external onlyValidator onlyActive nonReentrant {

        require (_newBlocks.length >= 1);
        verifyValidiumSignature(_newBlocks, validium_signature);
        bytes32 newOrderStateHash = verifyProofCommitment(_newBlocks, _proof.commitments, lastestOraclePrice);

        // block prove
        // #if DUMMY_VERIFIER
        console.info("Dummy Verifier!!!");
        // #else
        require(verifier.verifyAggregatedBlockProof(
                            _proof.subproofsLimbs,
                            _proof.recursiveInput,
                            _proof.proof,
                            _proof.vkIndexes,
                            _proof.commitments), "p");
        // #endif

        //postprocess onchain operation
        for (uint256 i = 0; i < _newBlocks.length; ++i) {
            postProcess(_newBlocks[i].onchainPubData);
        }

        // update block status
        accountRoot = _newBlocks[_newBlocks.length - 1].accountRoot;
        orderStateHash = newOrderStateHash;
        emit BlockUpdate(_newBlocks[0].blockNumber,
                         _newBlocks[_newBlocks.length - 1].blockNumber);
    }

}
