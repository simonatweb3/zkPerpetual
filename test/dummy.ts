import "@nomiclabs/hardhat-ethers";
import env, { ethers, upgrades } from "hardhat" 
import { zeroPad } from "@ethersproject/bytes";
import { expect } from "chai"


import { Bytes, concat } from "@ethersproject/bytes";
import { keccak256 } from "@ethersproject/keccak256";
import { toUtf8Bytes } from "@ethersproject/strings";

import * as utils from './utils'

const hre = require('hardhat');

import {
  MainFactory,
  Main,
  LoopFactory,
  FriFactory,
  MerkleFactory,
  CallerFactory,
  MagicNumFactory,

  Caller,
  Merkle,
  UsdcExchangeProxyFactory,
  ExchangeFactory
} from "../typechain"
import { TrustForwarderFactory } from "../typechain/TrustForwarderFactory";
import { MetaTxFactory } from "../typechain/MetaTxFactory";
import { AbiCoder, solidityKeccak256 } from "ethers/lib/utils";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { UsersFactory } from "../typechain/UsersFactory";
import { TypedDataDomain } from "@ethersproject/abstract-signer";
import { PepFactory } from "../typechain/PepFactory";
import { VerFactory } from "../typechain/VerFactory";
import { exit } from "process";
import { Pep } from "../typechain/Pep";
import { GasFactory } from "../typechain/GasFactory";
import { CallgasFactory } from "../typechain/CallgasFactory";


const GOV_PRIVATE_KEY = "0xb00106e9ec51878d6052f3a02bd26c7506016cb332c24f66d49f0c5b33412038";


// import { BN } from 'ethereumjs-util'
// import Common, { Chain, Hardfork } from '@ethereumjs/common'
// import VM from '@ethereumjs/vm'

describe("Dummy Contract Test", function() {
  this.timeout(6000000);

  let mc // main contract
  let cc // caller contract
  let ec

  let owner : SignerWithAddress
  let owners

  before(async () => {
    //console.log('default provider : ', ethers.getDefaultProvider())
    console.log('network : ', await ethers.provider.getNetwork())
    // console.log('GasPrice : ', await ethers.provider.getGasPrice())
    // console.log('getFeeData : ', await ethers.provider.getFeeData())
    // console.log('resolveName : ', await ethers.provider.resolveName('geeksam.eth'))

    owners = await ethers.getSigners()
    owner = owners[0]
    console.log('signer : ', owner.address)
  });

  it("gas profile", async function() {
    const gf = new GasFactory(owner)
    const g = await gf.deploy()

    const cgf = new CallgasFactory(owner)
    const cg = await cgf.deploy(g.address)
    // console.log("\n\n\n ++++++ call encode1 +++++ \n\n\n")
    // const e1 = await g.e(0x11223344, 0x55667788)
    // console.log("\n\n\n ++++++ call encode2 +++++ \n\n\n")
    // const e2 = await g.e(0x55667788, 0x11223344)
    // console.log("\n\n\n ++++++ call encode1+2 +++++ \n\n\n")
    // const e = await g.es(e1, e1)

    let data = "0x"                    // gas 981
    for (let i = 0; i < (5500 / 4); ++i) {
      data += "11223344"
    }
    // abi.encodePacked
    // byte : gas(include in/out overhead)
    // 4    : 1173
    // 8    : 1173
    // 16   : 1152
    // 24   : 1258
    // 32   : 1237    byte+16, gas+85
    // 40   : 1349
    // 48   : 1328    byte+16, gas+91
    // 64   : 1413    byte+16, gas+85
    // 80   : 1504    byte+16, gas+91
    // 96   : 1589    byte+16, gas+89
    const e = await g.es(data, data)
    //console.log("data ", data)
    //console.log("e = ", e)

    await g.test("0x9e6f3708b3cd290fb0c02ceb708535c49d9cea5ab372cc1ceb0f9ea565ccf66647e2284c363cbc6aade6af2db904771ecb946f596eaf9d555a2680b9becf36811c")
    // 0x56daa89a07eaef4112bf0c7c2f7fcc6ba89100f1

    // sha256
    // byte : gas(include in/out overhead)
    // 4    : 981
    // 8    : 981
    // 16   : 981
    // 32   : 981
    // 48   : 999     
    // 64   : 999     byte+32 gas+18
    // 96   : 1017    byte+32 gas+18
    // 108  : 1035    byte+32 gas+18

    // console.log("\n\n\n ####### call hash ######## \n\n\n")
    // const h = await g.s(data)
    // console.log("h = ", h)

    // len gas_mem gas_calldata gas_staticcall
    // 1  993  782  6361
    // 4  1956  1505
    let udata = []
    for (let i = 1; i < 1 + 1; i++) {
      //udata.push(i)
      udata.push(0x11223344)
    }
    console.log("\n\n\n ++++++ call run +++++ \n\n\n")
    await g.encodePack([1, 2, 3, 4])


    //const gas_concat = await g.concat(1, 2, [0x12, 0x23])
    //const res = await g.mem_run(udata)
    //const res = await g.calldata_run(udata)
    // const res = await (await cg.call_run(udata)).wait()
    // console.log("res : ", res)
    // let calldata = (await g.populateTransaction.mem_run(udata)).data
    // console.log("mem calldata ", calldata)
    // calldata = (await g.populateTransaction.calldata_run(udata)).data
    // console.log("calldata calldata ", calldata)


     // 256  byte pad 1    byte 2510 --> 1968
     // 256  byte pad 16   byte 2510 --> 1968
     // 256  byte pad 128  byte 2955 --> 2779
     // 4096 byte pad 128  byte 13659 --> 5021
     // 5500 byte pad 1    byte 17101 --> 4971

    const PAD_MAX = 0x1
    for (let padLen = 0x1; padLen <= PAD_MAX; padLen++) {
      //const res = await g.padHash(data, padLen)
      // const res = await (await g.padHash(data, padLen)).wait()
      // console.log("res : ", res)
      // let events = await g.queryFilter({})
      // console.log("events : ", events)
      //const resAsm = await g.padHashAsm(data, padLen)

      //const gas = await g.estimateGas.padHash(data, padLen)
      // console.log("estimateGas gas : ", gas)
      //const gasAsm = await g.estimateGas.padHashAsm(data, padLen)
      // console.log("estimate gas ", gas, " gasAsm : ", gasAsm, "progress ", gas.toNumber() - gasAsm.toNumber())
      // console.log("resAsm : ", resAsm)
      // expect(res.toLowerCase()).eq(resAsm.toLowerCase())
    }

    // console.log("\n\n\n ///////// call nothing //////// \n\n\n")
    // await g.nothing()

    //console.log("data : ", data)
    const b1 = keccak256("0x1")
    const b2 = keccak256("0x2")
    //const gas_encode = await g.estimateGas.encodePack(1, 2)
    //console.log("estimate gas_encode ", gas_encode, " gas_concat : ", gas_concat, "progress ", gas_encode.toNumber() - gas_concat.toNumber())

    exit(0)
  });

  it("deploy", async function() {
    exit(0)
    const m = new MainFactory(owner)
    mc = await m.deploy()
    console.log('main contract : ', mc.address)

    const cf = new CallerFactory(owner)
    cc = await cf.deploy();
    console.log('caller contract : ', cc.address)


    const ef = new CallerFactory(owner)
    ec = await ef.deploy();
    console.log('empty contract : ', ec.address)

    const lf = new LoopFactory(owner)
    let lc = await lf.deploy();
    console.log('loop contract : ', lc.address)

    // console.log("Storage 0x40 : ", await ethers.provider.getStorageAt(cc.address, 0x40))
  });

   // it("vm Run", async function() {
   //   const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.London })
   //   const vm = new VM({ common })
 
   //   const STOP = '00'
   //   const ADD = '01'
   //   const PUSH1 = '60'
   //   const MSTORE = '52'
 
   //   // Note that numbers added are hex values, so '20' would be '32' as decimal e.g.
   //   //const code = [PUSH1, '03', PUSH1, '05', ADD, STOP]
   //   const code = [PUSH1, '03', PUSH1, '05', ADD, PUSH1, '80', MSTORE , STOP]
 
   //   async function vmRun() {
 
   //     console.log("vm run start ...")
       
   //     vm.on('step', function (data) {
   //       console.log(`Opcode: ${data.opcode.name}\tStack: ${data.stack}`)
   //       //console.log("data ", data)
   //     })
 
   //     let res = await vm.runCode({
   //       code: Buffer.from(code.join(''), 'hex'),
   //       gasLimit: new BN(0xffff),
   //     })
   //     console.log("res ", res)
   //     console.log("res.runState.memory ", res.runState.memory._store.toString("hex"))
 
   //       // .then((results) => {
   //       //   console.log(`Returned: ${results.returnValue.toString('hex')}`)
   //       //   console.log(`gasUsed : ${results.gasUsed.toString()}`)
   //       // })
   //       // .catch(console.error)
 
   //     console.log("vm run end ...")
   //   }
 
 
   //   // await vmRun()
   //   // exit(0)
   // });


  // it("test pep/ver", async function() {
  //   const v = await (new VerFactory(owner)).deploy()
  //   const p = await (new PepFactory(owner)).deploy(v.address)
  //   await p.callV([21])
  // });


  it("test pep/ver proxy", async function() {
	  const v = await upgrades.deployProxy(new VerFactory(owner))
	  //console.log("vf.bytecode : ", vf.bytecode)
	  await v.deployed()

    const pf = new PepFactory(owner)
	  const p  = await upgrades.deployProxy(pf, [v.address])
    await p.deployed()
    //await p.callV([21])
    await p.callV([BigNumber.from("0x1c4dbe4cc1dde74346fbf6ee6a9bd832fcc4e311a30a3fa4dd1dde57bbf9c")])
  });


  // it("verify etherscan", async function() {
  //   // let url = "https://api-rinkeby.etherscan.io/api?module=account&action=balance&address=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae&tag=latest&apikey=YourApiKeyToken"

  //   // wait deploy contract ready on chain
  //   while(1) {
  //     const code = await ethers.provider.getCode(mc.address)
  //     console.log("code : ", code)
  //     if (code.length > 2) {
  //       break
  //     } else {
  //       console.log("waiting ")
  //     }
  //   }

	// 	if (typeof hre.hardhatArguments.network != "undefined") {
  //     try {
  //       await hre.run('verify', {address : mc.address});
  //     } catch (e) {
  //       console.error(e);
  //     }
  //   }

  // });

//   it("test EIP712 Forwarder", async function() {
//     let user : SignerWithAddress = owners[0]
//     let system = owners[1]
//     const fc = await (new TrustForwarderFactory(system)).deploy()
//     console.log('forwarder contract : ', fc.address)

//     // MetaTx trust forwarder
//     const mtc = await (new MetaTxFactory(user)).deploy(fc.address)
//     console.log('metaTX contract : ', mtc.address)

//     // user own token 100, approve to MetaTx
//     const token = await (new XmTokenFactory(user)).deploy(100)
//     token.approve(mtc.address, 50)

//     // user signature to fowarder execute
//     let rawTx = await mtc.populateTransaction.deposit(token.address, 50)
//     let req = {
//       from : rawTx.from,
//       to : rawTx.to,
//       value : 0, //rawTx.value,
//       gas : 100000, // rawTx.gasLimit,
//       nonce : await fc.getNonce(user.address),
//       data : rawTx.data
//     }
//     console.log(req)

//     const domain : TypedDataDomain = {
//       name : "MinimalForwarder",
//       version : "0.0.1",
//       chainId : await owner.getChainId(),
//       verifyingContract : fc.address
//       // salt
//     }

//     const type = {
//       ForwardRequest : [
//         { name : "from", type : "address"},
//         { name : "to", type : "address"},
//         { name : "value", type : "uint256"},
//         { name : "gas", type : "uint256"},
//         { name : "nonce", type : "uint256"},
//         { name : "data", type : "bytes"}
//       ]
//     }

//     let sig = await user._signTypedData(domain, type, req)
//     expect(ethers.utils.verifyTypedData(domain, type, req, sig)).eq(user.address)
//     expect(await token.balanceOf(user.address)).eq(100)
//     expect(await token.balanceOf(mtc.address)).eq(0)
//     await fc.execute(req, sig)
//     expect(await token.balanceOf(user.address)).eq(50)
//     expect(await token.balanceOf(mtc.address)).eq(50)

//   });

//   it("test CurrencyConvertor", async function() {
//     const token = await (new XmTokenFactory(owner)).deploy(100)
//     const uep = await (new UsdcExchangeProxyFactory(owner)).deploy(token.address)

//     let cc = await (new CurrencyConvertorFactory(owner)).deploy(
//       owner.address,
//       token.address,
//       0,
//       owner.address
//     )
//     // https://etherscan.io/tx/0x46ca213444fd4e149c81b434d01a3b1f34fe08f5b297e8e6acb99ddb7361691f
//     let calldata = "0xe1e1a91a060d1f7be1201db9342ab50410ec994d14e7c3b16ff4cafcaf760ee62f57b1fa000000000000000000000000000000000000000000000000000000000002d22b000000000000000000000000032b17633c956c10845643f0bf9ea7c16a3cfb6200000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003c1b4e13000000000000000000000000def1c0ded9bec7f1a1670819833240f027b25eff00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000001083598d8ab0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000003c1b4e140000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002bc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000869584cd000000000000000000000000100000000000000000000000000000000000001100000000000000000000000000000000000000000000006b2e4eb6cf6269f45b00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000414638486a7d39c7c8aa2fa00a4c03c52c4c3a2af7b7cb4ef629e025b3056c318b2e8a7e560a5baab1f0f69ff46e05bb9540275a3e7726c95579e4398b082ac7ff1c00000000000000000000000000000000000000000000000000000000000000"
//     const decode_data = cc.interface.decodeFunctionData("depositEth", calldata)
//     console.log("decode_data : ", decode_data)

//     let uep_data = ethers.utils.defaultAbiCoder.decode(
//       ["address", "address", "uint256", "address", "bytes"], decode_data.exchangeProxyData)
//     console.log(uep_data)
//     let exchange = uep_data[3]
//     let exchangeData = uep_data[4]

//     let ex = await (new ExchangeFactory(owner)).deploy()
//     let uniswap_data = ex.interface.decodeFunctionData("sellEthForTokenToUniswapV3", exchangeData)
//     console.log("uniswap_data : ", uniswap_data)

//     console.log("balance ", await owner.getBalance())
//   });

if (0) {

  it("get == set", async function() {
    const exepct_data = 123;
    await mc.set(exepct_data)
  });

it ("send eth to main", async function() {
    let tx = {
      gasPrice : ethers.utils.parseUnits("150.0", "gwei"),
      value : ethers.utils.parseEther("5"),
      // nonce : 0 // nonce has already been used
      to   : mc.address
    }
    console.log("mc balance before ", await owner.provider.getBalance(mc.address))
    let receipt = await owner.sendTransaction(tx)
    console.log("mc balance after ", await owner.provider.getBalance(mc.address))
});

it ("Reentry Attack", async function() {
    console.log("cc balance before ", await owner.provider.getBalance(cc.address))
    mc.sendViaTransfer(cc.address, ethers.utils.parseEther("1"))
    console.log("cc balance after ", await owner.provider.getBalance(cc.address))
});

// it("test fallback", async function() {
//   await cc.callMain(mc.address)
// });

// it ("send selfDestruct eth to empty", async function() {
//   console.log("ec balance before ", await owner.provider.getBalance(ec.address))
//   await mc.kill(ec.address)
//   console.log("ec balance after ", await owner.provider.getBalance(ec.address))
// });


it ("test hashMessage", async function() {
  const messagePrefix = "\x19Ethereum Signed Message:\n";
  let message = toUtf8Bytes("BeHappyJustForFun")
  console.log("message : ", message)
    console.log(keccak256(concat([
        toUtf8Bytes(messagePrefix),
        toUtf8Bytes(String(message.length)),
        message
    ])))
});


it ("test merkle proof", async function() {
    const mf = new MerkleFactory(owner)
    let mc = await mf.deploy();
    
    const leaf1 = ethers.utils.keccak256("0x")
    const leaf2 = ethers.utils.keccak256(leaf1)
    const leaf3 = ethers.utils.keccak256(leaf2)
    const leaf4 = ethers.utils.keccak256(leaf3)

    const mid1 = ethers.utils.keccak256(
		ethers.utils.defaultAbiCoder.encode(
			["bytes32", "bytes32"],
			[
				leaf1 < leaf2 ? leaf1 : leaf2,
				leaf1 < leaf2 ? leaf2 : leaf1
			]
		)
	)

    const mid2 = ethers.utils.keccak256(
		ethers.utils.defaultAbiCoder.encode(
			["bytes32", "bytes32"],
			[
				leaf3 < leaf4 ? leaf3 : leaf4,
				leaf3 < leaf4 ? leaf4 : leaf3
			]
		)
	)

    const root = ethers.utils.keccak256(
		ethers.utils.defaultAbiCoder.encode(
			["bytes32", "bytes32"],
			[
				mid1 < mid2 ? mid1 : mid2,
				mid1 < mid2 ? mid2 : mid1
			]
		)
	)

	console.log("root is root ? ", await mc.verify([leaf2, mid2], root, leaf1))
	console.log("root is root ? ", await mc.verify([leaf2, leaf3], root, leaf1))
	console.log("root is mid1 ? ", await mc.verify([leaf2, mid2], mid1, leaf1))
});

async function tx_calldata(
    contract_addr:string,
    call_data:string,
    owner)
{
    let tx = {
       to   : contract_addr,
       data : call_data
    }
    await owner.sendTransaction(tx)
}


it ("test fri with calldata", async function() {
  const ff = new FriFactory(owner)
  let fc = await ff.deploy();

  let calldata = "0xe85a6a2800000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000dc00712cae3dc554177ed2c581b809fa9c975e05c395dff33110dc37358f30da81b00000000000000000000000000000000000000000000000000000000000000022225ab0dd6f05d14de7619800dc0f042ff9a423b000000000000000000000000000000000000000000000000000000000000000000000000000000000000006805d52432019ff8408c85be06634708321018032eec21ec2f8059e311eb913ebd045b797c44c0434ecb0ba5b809644fa386a8e26bd821e641557e1e3eceab1ca305338f2044ca521dba31aa4c511f9b1b5e081177137943a9a40648c458383f7501dfc636ea232525a482bddf38241ecab912c0fc8e5f62eb3c75df7692b08802000c9e27567c9cfcd93017b6a2a0d79fa2d1f82f1c951b3de4c5b2e0ff2318a407643f632a69b6d1f7f05b6da99fabfa43ed55b027ff30340d7adca4b20244a40583409c4d7c33a6ecc3022578f372fb46e0ae36fa8fd6534f57548811f7c76b0069bd36688c034d51fa3be36d515c68125e7e6cdedb12b3d3e7c5f9cf6a49f1041f4b3be1fef0ea7b570663714f95885371e2b24d56c06f30b30a594af84aae061838d31b3fa5ca2800abe320d007a02057b11829a18fe11e338a0d9f6856c9048832019045e064fef9464d308c2718b14e64242a0e1b19e2c1d2de13de3f42004d570ccf7e2d89976a1dccebe14198061171ece6fb3eeafc296a75cdb3e06e03ce034a613bfb4fbff008d6622734bf8627473c7a556770848f2f4301ed4c780101d2f18bcf9401c9886e975a6f3f4a6da69588e477d48bc7eb4c16c1d4561a031ca596f05e065d99adaadfe393afbd198689df742a1c73506e8821994ce29f04542114b09880215d38e3d9b42c747657fa1bc9090a3debcd2e6536f4e4798404c10c8af6afba0f44c1782a20d752c6d4df5fe136744a5fa411e3ed3fbe033704f6fe14f16b884d743502778b76b67cee5d7944a1eee85058bce69228765c1004638d354dedbaddbd645b27b8e1971bd10c34f54711025e20df006d37fc9fb303680bbde129a1b4a58baf0777bae877d993af8c69cccb3c9d1a0fbd4402c6a80310ad7ef9ffd4395320075037a396400fa10b7352a11c05dba016870cb460930660f31a26270951f7cb245594f6755b13ebabfc977752340e3fa39ec9f9e6b700aa619c9c97965be251486fab0f45f4b4b92e285dcdc40b03a3c941123e132500f5e702f6cb54f7ca9bb248b28e29e4234f3ba0bd251c78d3e670c720348cea041ff4a7cbb038030e1b0bf891c36a986004497af228106b0a6c86e1c9589a21072b140be6cc45bf64fde1e2762e5b183ec37ed7c605f00122952e06beb0909f06c343b7804b6ad9da0f1cc32ae07bdda76506e4d995439896a6a84f61c43d1b01c47ec0feab1c0cd94ec8d104d276d25f87360c4faaa9b632d3f7f43bc5fff404666b88d3b424668ab827babe4f0b0c463954d8231ee61588e1a270f20e986d02a53ec8a8d2ddd00105414de21b44559cdb610566cca943635811545652e77f02b9a115024b1ce8b60b879b8af54a0ede739a6735daa3634ce16f9e6ad36d610788da68a95685f0530f8aab8dbff6f03198a34da6ca5dc637165078304c1e700639d79c6890472dabb4abd823027d3e5ee9dbb9b6f7772963cb16fec8ef863204d5da29e31e3945034854bdb1c963393a44b2250a55a46074dae0b95ab9cd360642bf8cb49963163bea56696a5e24d1a3c3e0af5a6120aa5fbe230e491cbd41035dfd869af2a61d00f7a168409bc16eccfcb075b472a4e059a0a8ebb66f2aec8c028ccb95b4ddc42424f8a5c1bfddfd117594ed0000000000000000000000008fe4b0eaf539dfd18e280f6f9e8fd0213454eaa900000000000000000000000082d09738466bba77adec3ab0df42a12a4398d7f2000000000000000000000000a6a775cb0e8105edfe585ca70c9745d8297a8a8f0000000000000000000000007cb3d0eea7a99f272ab2d60b4300a437cbb55236000000000000000000000000e73250d8061e801934da7c7ecabac24f0696b0b2000000000000000000000000fedd28d462e497799c9a05e6011032ed49ca95e000000000000000000000000095d2a75638948411e7a1753915c7a13b9a4251bf0000000000000000000000006067ca8bc51c015c02296681edbdf4a652ae1b2000000000000000000000000020ece24c1a1cbd2462b25d193be490ae2934aabd00000000000000000000000015ac89cd4c434a50d32aca2381a1d40b3c56e7e1000000000000000000000000423b5b0caed3dd9a79d1b0dffc17de01ec916d54000000000000000000000000a6b9b748e58fa465605b67b397f19243a548553b000000000000000000000000560d1738489700f02cb34e6a95a55d128fee63290000000000000000000000003629d6625e30a3e29059f6559418fa81ca49855a00000000000000000000000006bad17c29f0b80efb222958180badcc6ddfeab800000000000000000000000039f27c63044ee1f3a16890694bd198e8119f80aa0000000000000000000000001f4355c1c4e29b4995ffa613ed997bf4138cff0a0000000000000000000000001a3cb96d4e4d38d82a17a5cc29e5fa8fad85b73f000000000000000000000000bc00e8b3fdb6b7519f5a3adad595e4030103843d000000000000000000000000ebd97142617dcd2fd3f97f1ebc4f5d0ca9b9cbf7000000000000000000000000043f0934a10d53a55d68985b2561ce87d646886800000000000000000000000019e6785b088199b5b00ad7043980af0358afba7f0000000000000000000000007af8fab24a1149175be474b25250ce01c5ddb33400000000000000000000000073c5bcc14beb640c4c13834039727bad1a6eeca40000000000000000000000002214cb03003757a80aa320a474f23781d2c649010000000000000000000000008bb728c6df72f33ccde248358e560e55fbeb26260000000000000000000000003ccbbf70964ef40040ccba8145f660a24f6a44750000000000000000000000004a57f6a128c97f5183a22d846fdcf16698b9b6dd000000000000000000000000e59d089efadaf3425333b0f13ec8ffa1cac8a2f200000000000000000000000080ce56ca66294fa5cd56825f96eb25f01616a22f000000000000000000000000235aca7281f19050761012f671fb4effcc2fd316000000000000000000000000b36ee8421b0614d2dde7a9cde1a0479476110c8a000000000000000000000000757ee910d62f2cda29a692d8f19e1beddf34a76400000000000000000000000003edc0ce2b68a109a63104db028f62a22b660e1e000000000000000000000000a8df803358a654993ba93ac95b0a3be395268b16000000000000000000000000c8193802b86edacc297a771f28e412564af17f2400000000000000000000000079de2e99bf440cf7fa1d09648332a2f459a1cd8a0000000000000000000000000548092ad7329878c041421640a929c35e04b29e0000000000000000000000002bbf012509184dc20de4d6c4f45183cec99887350000000000000000000000001540bda62b826f9c8ecc331ad189601070dfc2c80000000000000000000000007c97701a2062c6dec3db0b1a7393938fb02be77100000000000000000000000031ec24657444faeb36b073b62892b00ce24ba47b0000000000000000000000002b8e898641b678998ce7dd31594f6e78026fe1e4000000000000000000000000c7af4efb8af9335fd6bdf00d2f8aa71f3887f7550000000000000000000000007b5b5d81c1995b9f6da87930f4af854a839ec4320000000000000000000000005fb7a04662126d502a75e0861190b17bb9f985bd000000000000000000000000164e92f4fdce2b270975dfe556baf432390c6b8f000000000000000000000000bc81e12c992b4f125a40bb3212c20abf0e3c418400000000000000000000000014b9a955e1fcde105263cebc05fa2e326b3d28b6000000000000000000000000d36093acb7b700617b72e8d2f95ebe1e1dab28e200000000000000000000000064e1c39f096fa3dbe55fce9f31043d57b634e7200000000000000000000000008d92d9aa3a61031915dde45e4ae83ac83d84460b00000000000000000000000033d3eb58560d1de449047d833f143cd210402b4a000000000000000000000000771005bca451adc106e38bd07d2d73aadb91dab0000000000000000000000000438777965713345b9d6faa8d85285d6715501515000000000000000000000000d36acdabbac152f76eb9ac72f6ffd0adc4097aa700000000000000000000000072a003a0599f9dac3badae4d041c27ab311d2522000000000000000000000000d64652be0f9417f84e9c2fdf2cfb526dabfb9b9f00000000000000000000000029a271ed93d927543640a4b88f6adaffa58fe67400000000000000000000000064c8e575147cbb7d5302e7bb24611627fda8a9fb0000000000000000000000005ecd1071ee6e6505d3129a6068eb6e1d72ad9346000000000000000000000000a9ae04d2621b8d3c80d3c8faf4d7995735783b9d000000000000000000000000465fca4b0ca9f655d7ab02734e786c9cec80e3a5000000000000000000000000d8cdd366ace30cc99f885be42f146eea4f00e99e000000000000000000000000e8a73c36e806174e944bb0cf92f07f01b373fe35000000000000000000000000a7199dba0b5537f1ca5d4ec487740d48b66d92a90000000000000000000000009b726de534ff2a8159865070958757c460bd42af0000000000000000000000000000000000000000000000000000000000000000000000000000000000000025000000000000000000000000000000000000000000000000000000000000103806c0c76ef8d814f54e90d1ab5ed875fb8376909f2d4b6647ec917b7357c33cc90419898bfdda134b3bed6dbacf81d12844a871aebaeca761e669b1713843e7d7000000000000000000000000000000000000000000000000000000000000117b031226470194f9f6ae337711603da421bf0035be25f868dcc88300c26d837dfc00ae77cb7d456452b25410d5805ab462eebb8a4c6769f1b3c0182e7e724d53dc00000000000000000000000000000000000000000000000000000000000012b1040e67a3fb7c2d7db7b9b1936aaac9fdca5b5fc8dd2f0be2cce9f8c8a80bfaba00125b86c4853ae5e9b201eabc5511f30abf06b40f05f00e7421f950df12a1a8000000000000000000000000000000000000000000000000000000000000145c02d8d17cacfb97822f9340a8eb597d8c72b5a9c6ae3831f212dfe40fdd747d5704724a3ca43d76c9596e13452bc290b90d293cbf337a704aba6881e22c3adbb300000000000000000000000000000000000000000000000000000000000014e601bfbd6b7211365c02738ba61bc0334331a3e5b0e48cbcc992bd28ec91e1ca9803b020650ebf11e6cfa618585f3a1de6da107c969598d16199191deffb697f570000000000000000000000000000000000000000000000000000000000001552025f387a02f2201599306716209e4bb99cac698d0c9471375d8d472e7774a10c02ef79ab5832c7d3f94497968741dd76a1f5b193eae88d747ddf0650f98555c80000000000000000000000000000000000000000000000000000000000001603024de6ba5bbe6f08615492c77db0cfb9298962b28bef68c8ff42521db31ddb7d035986a1db162a4c936b09dc5e008ec8c967e61d14495cd6bf7f2ff022f41a7a0000000000000000000000000000000000000000000000000000000000001612028553942dbcd6db8a630b91b70cf2887b742250129facc39221f23ad01bf15502ff637eb2f757607e272ec6241cca4cdf13da9f2f25dd36255239e516d0837700000000000000000000000000000000000000000000000000000000000018ae0390cfecebf39932f7dda41ed906ef5c95a9f44f87f85395462ae25707acf062063bcf122ac004e1fbbc0a1513244ba2956b151686903b786b66d134b598046400000000000000000000000000000000000000000000000000000000000018d404c87c02ddc9afbc5f1afdb7bbc16300fc1eac439da4d64604fc7ba2e78c77d006f920f675761ea4b96fd259d73e7e013207b6de3a00f795c2045f50f33f01540000000000000000000000000000000000000000000000000000000000001c9a000be496edffb006eb80f68586b14e80b9dadca6984965bee83579a91b98c01e0541e3c5aeba131d78b253053951c1ec2688fdd1e37c1eb0aa758f5ebd2327070000000000000000000000000000000000000000000000000000000000001faa06052a9212b1ff3485ead9c9129d858a9da5f190e76e16de9191533523d9ef9c07a9d4c878440df1d09f7dc7eafc577e5d14a408cbde3813e582b06d22c305ae0000000000000000000000000000000000000000000000000000000000000000"
  // await fc.verifyFRI([], [], 0, 1, 2)
  await tx_calldata(fc.address, calldata, owner)

  // console.log("200 + 100 = ", await fc.first(100, 200))
  // console.log("add(200,100) = ", await fc.add(200, 100))
});

it ("test opcode", async function() {
	// core/vm/opcodes.go
	// 0x
	// 60 0a : PUSH1 0a      			STACK : [0a]
	// 60 0c : PUSH1 0c		 			STACK : [0c, 0a]
	// 60 00 : PUSH1 00		 			STACK : [00, 0c, 0a]
	// 39	 : CODECOPY (mem_offset 0x00, code_offset 0x0c, length 0x0a)	STACK : []
				// MEMORY[0x00] [602A60805260206080f3]
	// 60 00 : PUSH1 00 				STACK : [00]
	// f3	 : RETURN
	let resp = await owner.sendTransaction({data:"0x600a600c600039600a6000f3602A60805260206080f3"});
	// 602A60805260206080f3
	// 60 2A : PUSH1 2A					STACK : [2a]
	// 60 80 : PUSH1 80					STACK : [80, 2a]
	// 52	 : MSTORE[0x80] = 0x2a		
				// MEMORY[0x00] [602A60805260206080f3]
				// MEMORY[0x20] [...]		// scratch space for hash
				// MEMORY[0x40] [...]		// current allocated memory size
				// MEMORY[0x60] [...]		// zero slot
				// MEMORY[0x80] [2a]		// free memory pointer start
	// 60 20 : PUSH1 20
	// 60 80 : PUSH1 80
	// f3    : RETURN[MEMORY[0x80~0x100]]
	let receipt = await resp.wait()
	console.log(receipt.contractAddress)
	
	let mnc = MagicNumFactory.connect(receipt.contractAddress, owner)
	receipt = await (await mnc.setSolver(owner.address)).wait()
	console.log(receipt)

	console.log("now solver is ", await mnc.solver())
});

  it("test util", async function() {
		let accountId = Math.pow(2, 23)
		let collateral_balance = 100
		let collateralBalancePubData = utils.common.packPubData(
				[accountId, collateral_balance],
				[3, 8]
			)
    console.log("collateralBalancePubData : ", collateralBalancePubData)
    console.log("collateralBalancePubData.length : ", collateralBalancePubData.length)
  });

  it ("test revert", async function() {
    let REVERT_REASON_HEADER = "Error: VM Exception while processing transaction: reverted with reason string "
    let REVERT_REASON = REVERT_REASON_HEADER + "\'" + "test revert" + "\'"
    try {
      await mc.revert_test()
    } catch (error) {
      expect(error.toString().includes(REVERT_REASON)).equal(true)
    }
  });

//   it("test abi_encode_decode", async function() {
//     await mc.abi_encode_decode()
//   });

//   it("test default_value", async function() {
//     await mc.default_value()
//   });
    
//   it("test overload", async function() {
//     //await mc.overload(256)
//     await mc.overload('hello world')
//   });

 
//   it("test etherjs signer", async function() {
//     console.log('signer signature message(hello world) : ', await owner.signMessage("Hello World"))
//     let hash_msg = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
//     await owner.signMessage(ethers.utils.arrayify(hash_msg))

//     console.log('Signer getBalance : ', await owner.getBalance())
//     console.log('Signer getTransactionCount : ', await owner.getTransactionCount())
//     console.log('Signer estimateGas : ', await owner.estimateGas(mc.set(10)))
//     console.log('Signer call : ', await owner.call(mc.set(10)))
//     //console.log('Signer sendTransaction : ', await(await owner.sendTransaction(mc.set(20))))

//     //console.log('Signer privateKey : ', await owner.privateKey())
//   });

//   it("typescript/javascript basic test", async function() {
//     // Basic Type : any/number(float, no int)/string/boolean
//     console.log('typeof(0.1) = ', typeof(0.1))

//     // Array
//     let arr:  number[] = [1, 2]
//     let arr2: Array<number> = [1, 2]

//     // Tuple
//     let t: [string, number] = ["str", 1]

//     // enum/void/null/undefined
//   });

//   it("test inline_asm", async function() {
//     await mc.test_inline_asm(mc.address)
//     console.log(mc.interface.fragments[1])
//     let encode_data = mc.interface.encodeFunctionData('set', [10])
//     console.log('encode_data ', encode_data)
//     let decode_data = mc.interface.decodeFunctionData('set', encode_data)
//     console.log('decode_data ', decode_data)

//     console.log(mc.interface.format(ethers.utils.FormatTypes.full))
//     console.log(mc.interface.getFunction("set"))
//     // mc.interface.parseTransaction()/parseLog/parseError
//   });



//   it("test etherjs utils", async function() {
//     const balance = "0.1"
//     let bn = ethers.utils.parseEther(balance) // ethers.BigNumber
//     expect(ethers.utils.formatEther(bn)).equal(balance);
//     console.log(ethers.utils.parseUnits("1.0", 8))

//     let types = ["uint", "string"]
//     let data = [1234, "hello world"]
//     let encode_data = ethers.utils.defaultAbiCoder.encode(types, data)
//     console.log("encode_data", encode_data)
//     let decode_data = ethers.utils.defaultAbiCoder.decode(types, encode_data)
//     console.log("decode_data", decode_data)
//     expect(decode_data[1]).equal(data[1]);

//     console.log("computeAddress : ", ethers.utils.computeAddress(GOV_PRIVATE_KEY))
//     // ethers.utils.recoverAddress(digest, signature)
//     // ethers.utils.getCreate2Address()

//     console.log(ethers.BigNumber.from("42").add("8").eq(50))
//     let hexStr = ethers.BigNumber.from([0x1, 0x1]).toHexString()
//     let uint8Arr = ethers.utils.arrayify(hexStr)
//     console.log(uint8Arr)
//     console.log(ethers.utils.keccak256(uint8Arr))
//     console.log(ethers.utils.sha256(uint8Arr))

    

//   });
 
// describe("Test in external network", function() {

//   let owner
//   before(async () => {
//     const owners = await ethers.getSigners()
//     owner = owners[0]
//   });

//   it ("send eth", async function() {
//       let tx = {
//         to   : '0x5D61C124A8028AEe2706e8fecf18F563E2C86bc0',
//         gasPrice : ethers.utils.parseUnits("150.0", "gwei"),
//         value : 0,
//         nonce : 0 // nonce has already been used
//       }
//       let receipt = await owner.sendTransaction(tx)
//       //console.log(receipt)
//   });


// });

}



});