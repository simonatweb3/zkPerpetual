import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-solpp";
import "@openzeppelin/hardhat-upgrades"
import "hardhat-docgen"
// import "hardhat-circom"
import "hardhat-typechain"
import '@nomiclabs/hardhat-etherscan'
import "@nomiclabs/hardhat-solhint"
import "@nomiclabs/hardhat-web3"
//import "@nomiclabs/hardhat-ganache"
import "hardhat-contract-sizer"


require('dotenv').config()

import { extendConfig, task, subtask } from "hardhat/config";
import {TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS} from "hardhat/builtin-tasks/task-names"
import { logger } from "./test/utils/log";

task("print-hre", "Print hre info").setAction(
  async (taskArgs, hre) => {
    console.log("hre.config : ", hre.config)
    console.log("hre.hardhatArguments : ", hre.hardhatArguments)
    await hre.run("print", { message: "print hre done"});
  }
);

subtask("print", "Prints a message")
  .addParam("message", "The message to print")
  .setAction(async (taskArgs) => {
    console.log(taskArgs.message);
  });

export function is_local_network(hre) {
	return hre.hardhatArguments.network == undefined ||
		   hre.hardhatArguments.network == "localhost" ||
		   hre.hardhatArguments.network == "ganache" ||
		   hre.hardhatArguments.network == "hardhat"

}

task("log", "Set log level")
  .addParam("level", "log level")
  .setAction(
  async (taskArgs, hre) => {
    logger.level = taskArgs.level;
    console.log("set log level to ", taskArgs.level)
  }
);

// overide get-source-path task in below solpp/compile-internal , whom works before compile DSL :
// node_modules/@nomiclabs/hardhat-solpp/dist/src/index.js
// node_modules/hardhat/builtin-tasks/compile.js
subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS).setAction(
  async (taskArgs, hre, runSuper) => {
    if (is_local_network(hre)) {
        hre.config.solpp.defs = testConfig
        if (process.env.LOG_LEVEL_DEBUG) {
          hre.config.solpp.defs.LOG_LEVEL_DEBUG = true
        }

        if (process.env.DUMMY_VERIFIER) {
          hre.config.solpp.defs.DUMMY_VERIFIER = process.env.DUMMY_VERIFIER
        }
    } else {
        hre.config.solpp.defs = contractDefs[hre.hardhatArguments.network]
    }
    return await runSuper();
  }
);

let testConfig = {
  SOL_DEBUG: true,
  ONCHAIN_CUSTOM_DEBUG: true,
  LOG_LEVEL_DEBUG: false,
  PEPV2: true,
  DUMMY_VERIFIER: true
};

let rinkebyConfig = {
  SOL_DEBUG: false,
  ONCHAIN_CUSTOM_DEBUG: false,
  LOG_LEVEL_DEBUG: false,
  PEPV2: false,
  DUMMY_VERIFIER: false
};

let mainnetConfig = {
  SOL_DEBUG: false,
  ONCHAIN_CUSTOM_DEBUG: false,
  LOG_LEVEL_DEBUG: false,
  PEPV2: false,
  DUMMY_VERIFIER: false
};

let contractDefs = {
  mainnet: mainnetConfig,
  rinkeby: rinkebyConfig,
  test: testConfig,
  localhost: testConfig
};

const customAccounts = [
    `0x${process.env.GOV_PRIVATE_KEY}`,
    `0x${process.env.OTHER_PRIVATE_KEY}`,
    `0x${process.env.SIG3_PRIVATE_KEY}`
]

let hardhatAccounts = []
customAccounts.forEach(a => {
    hardhatAccounts.push(
        {
            privateKey : a,
            balance : "10000000000000000000000"
        }
  )
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: '0.8.12',
    settings: {
        optimizer: {
            enabled: true,
            runs: 200
        }
    }
    // {
    //   version: "0.5.5",
    // },
  },
  solpp: {
    defs: ((hre) => {
      return rinkebyConfig
        //return contractDefs[process.env.CHAIN_ETH_NETWORK];
    })()
  },
  networks: {
    localhost: {
      accounts: customAccounts
    },
    hardhat: {
      accounts: hardhatAccounts,
      // forking: {
      //   url: "https://eth-rinkeby.alchemyapi.io/v2/C1F9VylhxGKYVDg6NQ4aH5OPoI_oQ_xH",
      //   blockNumber: 10930171
      // }
    },
    ganache: {
      gasLimit: 6000000000,
      defaultBalanceEther: 10000,
      url: "http://127.0.0.1:8545",
      accounts: customAccounts
    },
    hecoTestnet: {
      url: `https://http-testnet.hecochain.com`,
      accounts: customAccounts
    },
    rinkeby: {
      gasPrice : `auto`,
      gas : 6000000,
      //url: `https://rinkeby-light.eth.linkpool.io/`,  // no suitable peer, maybe offline
      url: `https://eth-rinkeby.alchemyapi.io/v2/ZmcigLlVI7dckhbxFSTmg5LOuC1rjUbw`,
      //url: `https://speedy-nodes-nyc.moralis.io/8100653f72652c890ccaccb6/eth/rinkeby`,
      //url: `https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`,
      accounts: customAccounts
    },
    mainnet: {
      gasPrice : `auto`,
      gas : 6000000,
      url : `https://speedy-nodes-nyc.moralis.io/8100653f72652c890ccaccb6/eth/mainnet`,
      //url: `https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`,
      accounts: [`0x${process.env.GOV_PRIVATE_KEY}`, `0x${process.env.OTHER_PRIVATE_KEY}`, `0x${process.env.SIG3_PRIVATE_KEY}`]
    }
  },
  etherscan: {
    // https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html
    // npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1"
    apiKey: "PET6CJHW44RUBYAJ97MKMKTXS7JCWKS2B2"
    // apiKey: {
    //     hecoTestnet: "N9S5KWGD46TT2YZ1ZNPS62AKZE8Y26CU5I",
    //     rinkeby: "G6X8PHU218UJZ1F3D2Q16VXTYTMDKWI5F7",
    //     mainnet: "G6X8PHU218UJZ1F3D2Q16VXTYTMDKWI5F7"
    // }
  },
  mocha: {
    // retries : 2,
    //timeout : 600000
  },
  // solpp: {
  //   defs: (() => {
  //       if (process.env.CONTRACT_TESTS) {
  //           return contractDefs.test;
  //       }
  //       return contractDefs[process.env.CHAIN_ETH_NETWORK];
  //   })()
  // },
  docgen: {
    path: './docs',
    clear: true,
    //runOnCompile: true,   // have bugs, not enable default
    runOnCompile: false,
  },
  contractSizer: {
    runOnCompile: true
  },
  // circom: {
  //   // (optional) Base path for input files, defaults to `./circuits/`
  //   inputBasePath: "./circuits",
  //   // (required) The final ptau file, relative to inputBasePath, from a Phase 1 ceremony
  //   ptau: "powersOfTau28_hez_final_10.ptau",
  //   // (required) Each object in this array refers to a separate circuit
  //   circuits: [
  //     { name: "mul",
  //       beacon: "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
  //     }
  //   ],
  // },
};
