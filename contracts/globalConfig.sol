// SPDX-License-Identifier: MIT OR Apache-2.0

pragma solidity >= 0.8.12;

import "./Storage.sol";

abstract contract GlobalConfig is Storage {
    uint256 constant GLOBAL_CONFIG_KEY = ~uint256(0);
    event LogGlobalConfigChangeReg(bytes32 configHash);
    event LogGlobalConfigChangeApplied(bytes32 configHash, uint256 valid_layer2_block_num);
    event LogGlobalConfigChangeRemoved(bytes32 configHash);

    function encodeSyntheticAssets (
        SyntheticAssetInfo[] calldata synthetic_assets,
        uint16 _max_oracle_num
    ) internal pure returns (bytes memory config) {
        for (uint32 i=0; i< synthetic_assets.length; ++i) {
            uint256 real_oracle_num = synthetic_assets[i].oracle_price_signers_pubkey_hash.length / 20; // TODO
            bytes memory padZero = new bytes((_max_oracle_num - real_oracle_num) * 20);
            config = bytes.concat(config, 
                    abi.encodePacked(
                        synthetic_assets[i].resolution,
                        synthetic_assets[i].risk_factor,
                        synthetic_assets[i].asset_name,
                        synthetic_assets[i].oracle_price_signers_pubkey_hash
                    ), padZero);
        }
    }

    function initGlobalConfig(
        SyntheticAssetInfo[] calldata synthetic_assets,
        uint32 funding_validity_period,
        uint32 price_validity_period,
        uint64 max_funding_rate,
        uint16 _max_asset_count,
        uint16 _max_oracle_num
    ) internal pure returns (bytes32) {
        bytes memory padAsset = new bytes((_max_asset_count - synthetic_assets.length) * (24 + _max_oracle_num * 20));

        bytes memory globalConfig =bytes.concat(
            abi.encodePacked(
                uint16(synthetic_assets.length),
                funding_validity_period,
                price_validity_period,
                max_funding_rate
            ),
            encodeSyntheticAssets(synthetic_assets, _max_oracle_num),
            padAsset
        );

        return sha256(globalConfig);
        // event
    }

    function encodeOracleSigners (
        bytes20[] memory signers
    ) internal pure returns (bytes memory config) {
        for (uint32 i=0; i< signers.length; ++i) {
            config = bytes.concat(config, signers[i]);
        }
    }

    function addSyntheticAssets (
        SyntheticAssetInfo[] calldata synthetic_assets,
        bytes calldata oldGlobalConfig,
        uint256 valid_layer2_block_num
    ) external onlyGovernor {
        require(globalConfigHash == sha256(oldGlobalConfig), "iog");  // "invalid oldGlobalConfig"
        uint16 old_n_synthetic_assets_info = Bytes.bytesToUInt16(oldGlobalConfig[0:2], 0);
        require(old_n_synthetic_assets_info < MAX_ASSETS_COUNT, "aml");   // "asset max limit"
        uint256 old_pad_zero_num = (MAX_ASSETS_COUNT - old_n_synthetic_assets_info) * (24 + MAX_NUMBER_ORACLES * 20);
        bytes memory newPadding = new bytes((MAX_ASSETS_COUNT - old_n_synthetic_assets_info - 1) * (24 + MAX_NUMBER_ORACLES * 20));
        bytes memory newGlobalConfig = bytes.concat(
            bytes2(old_n_synthetic_assets_info + 1),
            oldGlobalConfig[2:oldGlobalConfig.length-old_pad_zero_num],
            encodeSyntheticAssets(synthetic_assets, MAX_NUMBER_ORACLES),
            newPadding
        );
        newGlobalConfigHash = sha256(newGlobalConfig);

        newGlobalConfigValidBlockNum = valid_layer2_block_num;
        emit LogGlobalConfigChangeApplied(newGlobalConfigHash, valid_layer2_block_num);
    }

    function regGlobalConfigChange(bytes32 configHash) external onlyGovernor
    {
        bytes32 actionKey = keccak256(bytes.concat(bytes32(GLOBAL_CONFIG_KEY), configHash));
        actionsTimeLock[actionKey] = block.timestamp + TIMELOCK_GLOBAL_CONFIG_CHANGE;
        emit LogGlobalConfigChangeReg(configHash);
    }

    function applyGlobalConfigChange(
        bytes32 configHash,
        uint256 valid_layer2_block_num)
        external onlyGovernor
    {
        bytes32 actionKey = keccak256(abi.encode(GLOBAL_CONFIG_KEY, configHash));
        uint256 activationTime = actionsTimeLock[actionKey];
        require(!is_pending_global_config(), "pgcce"); // "PENDING_GLOBAL_CONFIG_CHANGE_EXIST"
        require(activationTime > 0, "cng0"); // "CONFIGURATION_NOT_REGSITERED"
        require(activationTime <= block.timestamp, "cney"); // "CONFIGURATION_NOT_ENABLE_YET"
        newGlobalConfigHash = configHash;
        newGlobalConfigValidBlockNum = valid_layer2_block_num;
        emit LogGlobalConfigChangeApplied(configHash, valid_layer2_block_num);
    }

    function removeGlobalConfigChange(bytes32 configHash)
        external onlyGovernor
    {
        bytes32 actionKey = keccak256(bytes.concat(bytes32(GLOBAL_CONFIG_KEY), configHash));
        require(actionsTimeLock[actionKey] > 0, "cnr0"); // "CONFIGURATION_NOT_REGSITERED"
        delete actionsTimeLock[actionKey];
        emit LogGlobalConfigChangeRemoved(configHash);
    }

}
