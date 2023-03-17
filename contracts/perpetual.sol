// SPDX-License-Identifier: MIT OR Apache-2.0

pragma solidity >= 0.8.0;

import "./Users.sol";
import "./Deposits.sol";
import "./Withdrawals.sol";
import "./updateState.sol";
import "./globalConfig.sol";
import "./dac.sol";

/// @title main contract
// #if ONCHAIN_CUSTOM_DEBUG
import "./custom/Custom.sol";
contract Perpetual is Users, Deposits, Withdrawals, UpdateState, GlobalConfig, Dac, Custom {
// #else
contract Perpetual is Users, Deposits, Withdrawals, UpdateState, GlobalConfig, Dac {
// #endif
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct perpetualParams {
        I_Verifier verifierAddress;
        bytes32 accountRoot;
        bytes32 orderStateHash;
        IERC20Upgradeable collateralToken;
        uint8 innerDecimal;
        address userAdmin;
        address genesisGovernor;
        address genesisValidator;
        address[] dacMembers;
        uint32 dac_reg_timelock;
        uint32 global_config_change_timelock;
        uint32 funding_validity_period;
        uint32 price_validity_period;
        uint64 max_funding_rate;
        uint16 max_asset_num;
        uint16 max_oracle_num;
        SyntheticAssetInfo[] synthetic_assets;
        uint256 deposit_cancel_timelock;
        uint256 forced_action_expire_time;
    }

    function initialize(
        perpetualParams calldata param
	) external {
        initializeReentrancyGuard();

        // genesis block state
        accountRoot      = param.accountRoot;
        orderStateHash   = param.orderStateHash;

        // verifier
        verifier = param.verifierAddress;

        // governor/validator/UserAdmin
        initGovernor(param.genesisGovernor, param.genesisValidator);
        userAdmin = param.userAdmin;

        // DAC
        MIN_DAC_MEMBER = 6;
        TIMELOCK_DAC_REG = param.dac_reg_timelock;
        for (uint256 i = 0; i < param.dacMembers.length; ++i) {
            addDac(param.dacMembers[i]);
        }
        require(dacNum >= MIN_DAC_MEMBER, "idmu");


        // global config
        MAX_ASSETS_COUNT = param.max_asset_num;
        MAX_NUMBER_ORACLES = param.max_oracle_num;
        TIMELOCK_GLOBAL_CONFIG_CHANGE = param.global_config_change_timelock;

        globalConfigHash = initGlobalConfig(
            param.synthetic_assets,
            param.funding_validity_period,
            param.price_validity_period,
            param.max_funding_rate,
            MAX_ASSETS_COUNT,
            MAX_NUMBER_ORACLES
            );
        resetGlobalConfigValidBlockNum();

        // system Token Config
        collateralToken = param.collateralToken;
        innerDecimal = param.innerDecimal;
        (bool success, bytes memory returndata) = address(collateralToken).call(abi.encodeWithSignature("decimals()"));
        require(success);
        systemTokenDecimal = abi.decode(returndata, (uint8));

        DEPOSIT_CANCEL_TIMELOCK = param.deposit_cancel_timelock;
        FORCED_ACTION_EXPIRE_TIME = param.forced_action_expire_time;

        // #if SOL_DEBUG
        console.info("sol DEPOSIT_CANCEL_TIMELOCK ", DEPOSIT_CANCEL_TIMELOCK);
        console.info("sol FORCED_ACTION_EXPIRE_TIME ", FORCED_ACTION_EXPIRE_TIME);
        // #endif
    }

    // function upgrade(bytes calldata args) onlyGovernor external {
    // }

    function registerAndDeposit(
        address ethAddr,
        uint256[] memory l2Keys,
        bytes calldata signature,
        uint32[] memory depositId,
        uint256[] memory amount
	) external payable {
        registerUser(ethAddr, l2Keys, signature);
        require(depositId.length == amount.length, "rad0");
        for (uint256 i = 0; i < depositId.length; ++i) {
            deposit(l2Keys[depositId[i]], amount[i]);
        }
    }

    event TokenRecovery(
        address token,
        uint256 amount
    );


    receive() external payable {
    }

    // allow to recovery wrong token sent to the contract
    function recoverWrongToken(address token, uint256 amount) external onlyGovernor nonReentrant {
        require(token != address(collateralToken), "cbrst");  // "Cannot be system token"
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20Upgradeable(token).safeTransfer(address(msg.sender), amount);
        }
        emit TokenRecovery(token, amount);
    }

	// #if PEPV2
    function escape(
        uint256 l2Key,
        uint24 accountId,       // part of security protocol
        uint64 amount,         // TODO : need user specify ? probably security check?
        CommitBlockInfo calldata b,
        uint256[] calldata proof
    ) external onlyFrozen {
        require(!escapesUsed[l2Key], "aae"); // account already escape

        bytes32 commitment = createBlockCommitment(accountRoot, orderStateHash, b.orderStateHash, b);
        //require(proof_commitments[i] & INPUT_MASK == uint256(commitment) & INPUT_MASK, "proof commitment invalid");

        // bool proofCorrect = escapeVerifier.verifyExitProof(_storedBlockInfo.stateHash, accountId, l2Key,  amount, proof);
        // require(proofCorrect, "x");

        // TODO
        uint256 innerAmount = (uint256(1 << 63) - uint256(amount));
        uint256 externalAmount = innerAmount * (10 ** (systemTokenDecimal - innerDecimal));
        pendingWithdrawals[l2Key] += externalAmount;
        emit LogWithdrawalAllowed(l2Key, externalAmount);

        escapesUsed[l2Key] = true;
    }
	// #endif
}
