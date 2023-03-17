// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../debug/console.sol";

// https://etherscan.io/address/0xff1f2b4adb9df6fc8eafecdcbf96a2b351680455
contract zkmoney {
    function depositPendingFunds(uint256 assetId, uint256 amount, address owner, bytes32 proofHash) public {}
}

contract dydx {
    bytes32 public globalConfigurationHash;        // NOLINT: constable-states uninitialized-state.
    event LogGlobalConfigurationRegistered(bytes32 configHash);
    event LogGlobalConfigurationApplied(bytes32 configHash);
    event LogGlobalConfigurationRemoved(bytes32 configHash);
    event LogAssetConfigurationRegistered(uint256 assetId, bytes32 configHash);
    event LogAssetConfigurationApplied(uint256 assetId, bytes32 configHash);
    event LogAssetConfigurationRemoved(uint256 assetId, bytes32 configHash);

    function addImplementation(address newImplementation, bytes calldata data, bool finalize) public {}
    function upgradeTo(address newImplementation, bytes calldata data, bool finalize) public {}
    function registerAvailabilityVerifier(address verifier, string calldata identifier) public {}
    function registerVerifier(address verifier, string calldata identifier) public {}
    function registerTokenAdmin(address newAdmin) public {}
    function unregisterTokenAdmin(address oldAdmin) public {}
    function registerUserAdmin(address newAdmin) public {}
    function registerOperator(address newOperator) public {}
    function unregisterOperator(address removedOperator) public {}
    function registerSystemAssetType(uint256 assetType, bytes calldata assetInfo) public {}
    function registerGlobalConfigurationChange(bytes32 configHash) public {}
    function registerAssetConfigurationChange(uint256 assetId, bytes32 configHash) public {}
    function applyGlobalConfigurationChange(bytes32 configHash) public {}
    function deposit(uint256 vault, uint256 amt, uint256 getId, uint256 setId) public {}
    function deposit(uint256 depositAmount, uint256 starkKey, uint256 positionId, bytes calldata signature) public {}
    function depositCancel(uint256 starkKey, uint256 assetId, uint256 vaultId) public {}
    function depositReclaim(uint256 starkKey, uint256 assetId, uint256 vaultId) public {}
    function applyAssetConfigurationChange(uint256 assetId, bytes32 configHash) public {}
    function updateState(uint256[] calldata publicInput, uint256[] calldata applicationData) public {}
    function mainNominateNewGovernor(address newGovernor) public {}
    function proxyNominateNewGovernor(address newGovernor) public {}
    function withdraw(uint256 _eth, uint256 _wei) public {}
    function withdrawTo(uint256 starkKey, uint256 assetType, address recipient) public {}
    function forcedWithdrawalRequest(uint256 starkKey, uint256 vaultId, uint256 quantizedAmount, bool premiumCost) public {}
    //function forcedTradeRequest(uint256 starkKeyA, uint256 starkKeyB, uint256 vaultIdA, uint256 vaultIdB, uint256 collateralAssetId, uint256 syntheticAssetId, uint256 amountCollateral, uint256 amountSynthetic, bool aIsBuyingSynthetic, uint256 submissionExpirationTime, uint256 nonce, bytes calldata signature, bool premiumCost) public {}
    function proxyAcceptGovernance() public {}
    function proxyRemoveGovernor(address governorForRemoval) public {}
    function mainAcceptGovernance() public {}
    function mainRemoveGovernor(address governorForRemoval) public {}
    function mainRemoveGovernor(uint256 i) public {}
    function proxyRemoveGovernor(uint256 i) public {}
    // function * public {}
    // function * public {}
    function depositERC20(address tokenFrom, uint256 tokenFromAmount, uint256 starkKey, uint256 positionId, address exchangeProxy, bytes calldata exchangeProxyData, bytes calldata signature) public {}
    function depositEth(uint256 starkKey, uint256 positionId, address exchangeProxy, bytes calldata exchangeProxyData, bytes calldata signature) public {}
    function execute(address _target, bytes calldata _data) public {}
    function withdrawFromExchange(uint256 starkKey, uint256 assetType) public {}
    function depositERC20(address tokenFrom, uint256 tokenFromAmount, uint256 minUsdcAmount, uint256 starkKey, uint256 positionId, address exchange, bytes calldata data, bytes calldata signature) public {}
    function approveSwapAndDepositERC20(address tokenFrom, uint256 tokenFromAmount, uint256 minUsdcAmount, uint256 starkKey, uint256 positionId, address exchange, address allowanceTarget, bytes calldata data, bytes calldata signature) public {}
    function depositEth(uint256 minUsdcAmount, uint256 starkKey, uint256 positionId, address exchange, bytes calldata data, bytes calldata signature) public {}
    function depositToExchange(uint256 starkKey, uint256 assetType, uint256 vaultId, uint256 quantizedAmount) public {}
    function execTransaction(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes calldata signatures) public {}
    function registerAndDepositERC20(address ethKey, uint256 starkKey, bytes calldata signature, uint256 assetType, uint256 vaultId, uint256 quantizedAmount) public {}
    function registerUser(address ethKey, uint256 starkKey, bytes calldata signature) public {}
}

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
contract gas {
    function nothing() external pure {
    
    }

    function test(bytes calldata s) external view {
        uint256 data = 0x123;
        console.info("toString : ", Strings.toString(data));
        console.info("toHexString : ", Strings.toHexString(data));
        console.info("toHexString length : ", Strings.toHexString(data, 32));

        bytes32 h = 0xe4bd1c782c7410015ad45a0a7ea1a51a11d2476af8e3892b88ceff951d96d4c2;
        address a = ECDSA.recover(h, s);
        console.info("address ", a);
    }

    function decimals() public pure returns (uint8) {
        return 6;
    }

    function encodePack(
        uint8[] calldata data
    ) public view {
        console.info("encodePacked : ", abi.encodePacked(data));
        console.info("encode : ", abi.encode(data));
        // 0x0000000000000000000000000000000000000000000000000000000000000001
        //   0000000000000000000000000000000000000000000000000000000000000002
        //   0000000000000000000000000000000000000000000000000000000000000003
        //   0000000000000000000000000000000000000000000000000000000000000004
    }

    function concat(
        // bytes calldata b1,
        // bytes calldata b2
        uint256 b1,
        uint256 b2,
        uint32[] calldata arr
    ) public view returns (bytes memory) {
        console.info("encode : ", abi.encodePacked(arr));
        return bytes.concat(bytes32(b1), bytes32(b2));
    }


    function e(
        uint32 e1,
        uint32 e2
    ) external pure returns (bytes memory b) {
        b = abi.encodePacked(e1, e2);
    }

    function es(
        bytes calldata e1,
        bytes calldata e2
    ) external pure returns (bytes memory b) {
        b = abi.encodePacked(e1, e2);
    }

    function s(
        bytes calldata b
    ) external pure returns (bytes32) {
        //bytes32 s1 = sha256(b1);
        return sha256(b);
    }



    function calldata_run(
        uint256[] calldata data
    ) external pure returns (uint256 res) {
        // CALLDATALOAD
        for (uint256 i = 0; i < data.length; ++i) {
            res += data[i];
        }
    }

    function mem_run(
        uint256[] memory data
        // 0x80 : 0
        // 0xa0 : 0x20
        // 
    ) external pure returns (uint256 res) {
        // MLOAD
        for (uint256 i = 0; i < data.length; ++i) {
            res += data[i];
        }
    }

    event et(
        address indexed a,
        uint256 indexed b,
        uint32 c
    );

    function padHash(
        bytes calldata b,
        uint32 padLen
    ) external returns (bytes32) {
        bytes memory padZero = new bytes(padLen);
        emit et(msg.sender, 1, 2);
        return sha256(abi.encodePacked(b, padZero));
    }

    function padHashAsm(
        bytes memory data,
        uint32 padLen
    ) external view returns (bytes32 commitment) {
        bool success = true;
        bytes32 restore_data;

        uint32 padByteLen = (padLen / 0x20) * 0x20;
        if (padLen % 0x20 != 0) {
            padByteLen += 0x20;
        }

        assembly {
            // alloc memory for hash resut(0x20 bytes) and restore data(padByteLen)
            let freeMemPtr := mload(0x40)
            let allocSize := add(0x20, padByteLen)
            mstore(0x40, add(freeMemPtr, add(allocSize, padByteLen)))    // in case data tail == freememPtr, reserve more padByteLen
            let hashResult := add(freeMemPtr, padByteLen)
            let restorePtr := add(hashResult, 0x20)

            let dataLen := mload(data)
            let dataTailPtr := add(data, add(dataLen, 0x20))
            //mstore(dataTailPtr, 0x87654321)

            // save tail after data, and set to pad zero
            // mstore8 could save gas ? seems no
            for { let i := 0 } lt(i, padByteLen) { i := add(i, 0x20) } {
                let offset := mul(i, 0x20)
                let dataTailOffset := add(dataTailPtr, offset)
                mstore(add(restorePtr, offset), mload(dataTailOffset))
                mstore(dataTailOffset, 0x0)
            }

            // staticcall to the sha256 precompile at address 0x2
            success := staticcall(gas(), 0x2, add(data, 0x20), add(dataLen, padLen), hashResult, 0x20)

            // is it possible, sha256 precompile itself need using origin data after tail? probably not.

            // restore tail after data
            for { let i := 0 } lt(i, padByteLen) { i := add(i, 0x20) } {
                let offset := mul(i, 0x20)
                mstore(add(dataTailPtr, offset), mload(add(restorePtr, offset)))
            }

            // Use "invalid" to make gas estimation work
            switch success
            case 0 {
                invalid()
            }

            commitment := mload(hashResult)
            restore_data := mload(dataTailPtr)
            mstore(0x40, freeMemPtr)
        }
        // console.logBytes32("sol commitment : ", commitment);
        // console.logBytes32("sol restore_data : ", restore_data);
    }

}
contract callgas {
    gas public g;
    constructor(gas _g) {
        g = _g;
    }
    function call_run(
        uint256[] calldata data
    ) external returns (uint256 res) {
        (bool success, bytes memory returndata)  = address(g).call(abi.encodeWithSignature("decimals()"));
        console.info("success : ", success == true ? 1 : 0);
        console.info("returndata : ", returndata);
        console.info("return data : ", abi.decode(returndata, (uint256)));
        res = g.calldata_run(data);
    }
}

contract ver {
    function v(
        uint256[] memory p1,
        uint256[] memory p2
    ) external view returns (bool) {
        console.log("p1.length : ", p1.length);
        console.log("p2.length : ", p2.length);
        console.log("p2 : ", p2[0]);
        return true;
    }
}

contract pep {

    ver public v;
    function initialize(
        ver _v
    ) external {
        v = _v;
    }



    function callV(
        uint256[] calldata p1
    ) public view {
        require(v.v(p1, p1), "p");
    }
}


import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";
contract TrustForwarder is MinimalForwarder {
    constructor() MinimalForwarder() {

    }
}

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
contract MetaTx is ERC2771Context {
    constructor(address forwarder) ERC2771Context(forwarder) {

    }

    function deposit(
        IERC20 token,
        uint256 amount
    ) public {
        token.transferFrom(_msgSender(), address(this), amount);
    }
}


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// contract USDC is ERC20 {
//     constructor(uint256 initialSupply) ERC20("USD Coin", "USDC") {
//         _mint(msg.sender, initialSupply);
//     }

//     function decimals() public pure override returns (uint8) {
//         return 6;
//     }

// }

contract USDC is ERC20 {
    constructor(uint256 initialSupply) ERC20("USD Coin", "USDC") {
        _mint(msg.sender, initialSupply);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function approveOther(address from, address spender, uint256 amount) public returns (bool) {
        _approve(from, spender, amount);
        return true;
    }
}

contract EToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("EdgeSwap", "EGS") {
        _mint(msg.sender, initialSupply);
    }


}

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
contract merkle {
    function verify(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) public pure returns (bool) {
        return MerkleProof.verify(proof, root, leaf);
    }

    function lt(
        bytes32 l,
        bytes32 r
    ) public pure returns (bool) {
        return l < r;
    }

}

// import "../../third-party/d-Fri-Statement/FriStatementContract.sol";
// contract fri is FriStatementContract {
//     function add(uint8 a, uint8 b) public pure returns (uint8) {
//         return a + b;
//     }

//     function first(uint8 a, uint8 b) public pure returns (uint8) {
//         uint8 c = a + b - 150;
//         return c;
//     }
// }

contract MagicNum {

  address public solver;

  function setSolver(address _solver) public {
    console.log("setSolver ", _solver);
    solver = _solver;
  }
}

contract empty {

}

contract loop {
    uint256 public data_;
    function set(uint256 data) public view {
        for (uint256 i = 0; i < 21129; i++) {}
        data = data_;
    }
}

contract main {
    uint256 public data_;

    function get() public view returns (uint256) {
	    return data_ + 2;
    }

    function set(uint256 data) public {
        data;
        console.log("sol set ", data);
        console.log("tx.origin ",tx.origin);
        console.log("msg.sender ",msg.sender);
        console.log("msg.data ");
        console.logBytes(msg.data);
        data_ = data;
    }

    receive() external payable {
        console.log('call receive()');
        console.logBytes32(blockhash(block.number));
    }

    fallback() external payable {
        console.log('call fallback()');
        console.log("msg.data ");
        console.logBytes(msg.data);
    }

    function sendViaTransfer(address payable to, uint256 amount) public {
        console.log("contract balance before ", address(this).balance);
        to.transfer(amount);
        console.log("contract balance after ", address(this).balance);
    }

    function kill(address payable beneficary) public {
        selfdestruct(beneficary);
    }

    function revert_test() public view {
        console.log("revert test begin!!");
        require(false, "test revert");
        console.log("revert test end!!");
    }

}

contract caller {
     function callMain(main m) public payable {
    }

    fallback() external payable {
        console.log("address(msg.sender).balance : ", address(msg.sender).balance);
        (bool success,) = address(msg.sender).delegatecall(abi.encodeWithSignature("sendViaTransfer(address, uint256)", address(this), msg.sender.balance - msg.value));
        require(success);
    }

 }