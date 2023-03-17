// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity >= 0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { SafeERC20Upgradeable, IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./verifier/I_Verifier.sol";
import "./libs/ReentrancyGuard.sol";

// #if SOL_DEBUG
import "./debug/console.sol";
// #endif

import "./Operations.sol";
import "./Governance.sol";


bytes32 constant EMPTY_STRING_KECCAK = keccak256("");
uint64 constant DEPOSIT_LOWER_BOUND = (1 << 63);

struct SyntheticAssetInfo {
    uint64 resolution;
    uint32 risk_factor;
    bytes12 asset_name;
    bytes oracle_price_signers_pubkey_hash;
}

/// @title Storage Contract
contract Storage is Governance, ReentrancyGuard {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    
    event LogNewGlobalConfigHash(bytes32 configHash);

    /* block chain root hash */
    bytes32 public accountRoot;
    bytes32 public orderStateHash;

    mapping(address => bool) public dacs;
    uint32 public dacNum;
    uint32 constant MIN_SIGNATURE_MEMBER = 3;
    uint256 public DacRegisterTime;
    address pendingDacMember;
    bool public DacRegisterActive;

    bytes32 public globalConfigHash;

    // Mapping from layer2 public key to the Ethereum public key of its owner.
    // 1. used to valid withdraw request
    // 2. allows registering many different l2keys to same eth address ?
    //     2.1 user might wanna both validum and rollup account.
    //     2.2 API user might wanna multiple account.
    address userAdmin;
    mapping(uint256 => address) public ethKeys;
    modifier onlyKeyOwner(uint256 ownerKey) {
        require(msg.sender == ethKeys[ownerKey], "Not ethKey Owner");
        _;
    }

    I_Verifier public verifier;

    IERC20Upgradeable public collateralToken;
    uint8 public innerDecimal;
    mapping(uint256 => uint256) public pendingDeposits;
    mapping(uint256 => uint256) public pendingWithdrawals;

    // map l2 key => timestamp.
    mapping(uint256 => uint256) public cancellationRequests;

    // map forced Action Request Hash => timestatmp
    mapping(bytes32 => uint256) forcedActionRequests;

    bool stateFrozen;
    I_Verifier public escapeVerifier;
    mapping(uint256 => bool) escapesUsed;

    function addForceRequest(bytes32 req) internal {
		require(forcedActionRequests[req] == 0, "rap0"); // REQUEST_ALREADY_PENDING
		forcedActionRequests[req] = block.timestamp;
    }

    function cancelForceRequest(bytes32 req) internal {
        delete forcedActionRequests[req];
    }

    function freeze(bytes32 req) public {
		require(forcedActionRequests[req] != 0 && forcedActionRequests[req] + FORCED_ACTION_EXPIRE_TIME > block.timestamp, "ftne0");  // "freeze timestamp not expired!"
		stateFrozen = true;
    }

    modifier onlyFrozen() {
        require(stateFrozen, "STATE_NOT_FROZEN");
        _;
    }

    modifier onlyActive() {
        require(!stateFrozen, "STATE_FROZEN");
        _;
    }

    mapping(address => bool) operators;

    // for conditional transfer
    mapping(bytes32 => bool) proofRegister;

    uint16 MAX_ASSETS_COUNT;
    
    bytes32 public newGlobalConfigHash;
    uint256 public newGlobalConfigValidBlockNum;
    function resetGlobalConfigValidBlockNum() internal {
        newGlobalConfigValidBlockNum = ~uint256(0);
    }
    function is_pending_global_config() internal view returns (bool) {
        return newGlobalConfigValidBlockNum != ~uint256(0);
    }

    // Mapping for timelocked actions.
    // A actionKey => activation time.
    mapping (bytes32 => uint256) actionsTimeLock;

    uint8 systemTokenDecimal;

    uint16 public MAX_NUMBER_ORACLES;
    uint32 TIMELOCK_GLOBAL_CONFIG_CHANGE;
    uint256 DEPOSIT_CANCEL_TIMELOCK;
    uint256 FORCED_ACTION_EXPIRE_TIME;

    uint32 public MIN_DAC_MEMBER;
    uint32 TIMELOCK_DAC_REG;
}
