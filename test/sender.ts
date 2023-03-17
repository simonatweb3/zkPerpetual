
// 1. wrap transaction in block
// 2. compute block state diff
// 3. updateBlock

import { expect } from "chai"
import { BigNumber } from "ethers"
import { hexConcat, hexZeroPad, sha256 } from "ethers/lib/utils"
import { ethers } from "hardhat"
import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, DataSource } from "typeorm"
import { Perpetual } from "../typechain"
import { Block } from "./block"
import { curAccountRoot, curOrderStateHash, globalConfig, setAccountRoot, setOrderStateHash } from "./config"
import { prover } from "./prover/prover"
import { MAX_ASSETS_COUNT } from "./utils/common"
import { logger } from "./utils/log"

function getPadLen(
    realSize,
    alignSize
)  {
    let padLen = ((realSize - 2) / 2) % alignSize;
    if (padLen != 0) {
        padLen = alignSize - padLen;
    } else {
            padLen = alignSize;
    }
    return padLen
}

const ACCOUNT_COLLATERAL_BALANCE_PUBDATA_BYTES = 11 ;
const ACCOUNT_POSITION_PUBDATA_BYTES = 13 ;
const DEPOSIT_WITHDRAW_PUBDATA_BYTES = 31 ;

function encodePackU64Array(
    a, start, padLen, padValue)
{
    let data = "0x"
    for(let i = start; i< start + padLen; i++){
        if (i < a.length) {
            data = hexConcat([data, hexZeroPad(a[i], 8)])
        } else {
			if (padValue == 0) {
            	data = hexConcat([data, hexZeroPad(padValue, 8)])
			} else {
				// TODO : hack
            	data = hexConcat([data, "0x8000000000000000"])
			}
        }
    }
    return data
}

function getOrderStateHash(
    b,
    oracle_price
) {
    if (oracle_price.length == 0 && b.globalFunding.index.length == 0) {
        return b.orderStateHash;
    }

    let oraclePriceHash = b.oraclePriceHash;
    if (oracle_price.length != 0) {
        let encode_data = encodePackU64Array(oracle_price, 0, MAX_ASSETS_COUNT, 0);
		logger.debug("js oracle_price encode_data : ", encode_data)
        oraclePriceHash = sha256(encode_data);
    }

	let globalFundingIndexHash
    
	if (b.globalFunding.index.length != 0) {
		let timestamp = b.globalFunding.indexHashOrTimeStamp
		let encode_data = 
			hexConcat([
				hexZeroPad(timestamp, 4),
				//encodePackU64Array(b.globalFundingIndex, 1, MAX_ASSETS_COUNT, BigNumber.from(Math.abs(1 << 63)))
				//encodePackU64Array(b.globalFundingIndex, 1, MAX_ASSETS_COUNT, BigNumber.from(Math.pow(2, 63)))
				encodePackU64Array(b.globalFunding.index, 0, MAX_ASSETS_COUNT, 1)
			])
		logger.debug("js globalFundingIndex encode_data : ", encode_data)
		globalFundingIndexHash = sha256(encode_data)
	} else {
		globalFundingIndexHash = b.globalFunding.indexHashOrTimeStamp
    }

    let global_state_hash = sha256(
		hexConcat([
			hexZeroPad(b.timestamp, 4),
			globalFundingIndexHash,
			oraclePriceHash
		]))
    let newOrderStateHash = sha256(
		hexConcat([
			hexZeroPad(b.orderRoot, 32),
			global_state_hash
		]))

	logger.debug("js globalFundingIndexHash : ", globalFundingIndexHash)
	logger.debug("js oraclePriceHash : ", oraclePriceHash)
	logger.debug("js global_state_hash : ", global_state_hash)
	logger.debug("js newOrderStateHash : ", newOrderStateHash)
	return newOrderStateHash
}


async function createBlockCommitment(
    oldAccountRoot,
    oldOrderStateHash,
	newOrderStateHash,
    globalConfigHash,
    commitBlock
) : Promise<string>{

    let commitment  = ethers.utils.sha256(
        ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes32"],
            [commitBlock.blockNumber, oldAccountRoot]
        )
    )

    logger.debug("h1 : ", commitment)
    commitment  = ethers.utils.sha256(
        ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "bytes32"],
            [commitment, commitBlock.accountRoot]
        )
    )
    logger.debug("h2 : ", commitment)
    logger.debug("oldOrderStateHash : ", oldOrderStateHash)

    commitment  = ethers.utils.sha256(
        ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "bytes32"],
            [commitment, oldOrderStateHash]
        )
    )
    logger.debug("h3 : ", commitment)


    commitment  = ethers.utils.sha256(
        ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "bytes32"],
            [commitment, newOrderStateHash]
        )
    )

    logger.debug("h4 : ", commitment)
    commitment  = ethers.utils.sha256(
        ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "bytes32"],
            [commitment, globalConfigHash]
        )
    )

    logger.debug("h5 : ", commitment)
    commitment  = ethers.utils.sha256(
        ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "bytes32"],
            [commitment, commitBlock.validiumAccountRoot]
        )
    )

    logger.debug("h6 : ", commitment)
    let padLen = getPadLen(
        commitBlock.collateralBalancePubData.length,
        commitBlock.blockChunkSize * ACCOUNT_COLLATERAL_BALANCE_PUBDATA_BYTES
    );

    let rollup_col_full_data  =
        ethers.utils.hexConcat(
            [    
                ethers.utils.hexlify(commitBlock.collateralBalancePubData),
                ethers.utils.hexZeroPad("0x", padLen)
            ])
    let rollup_col_commitment  = ethers.utils.sha256(rollup_col_full_data)
	//logger.debug("js rollup_col_full_data : ", rollup_col_full_data)
	logger.debug("js rollup_col_commitment ", rollup_col_commitment)

    padLen = getPadLen(
        commitBlock.positonPubData.length,
        commitBlock.blockChunkSize * ACCOUNT_POSITION_PUBDATA_BYTES
    );
    let rollup_assets_commitment  = ethers.utils.sha256(
        ethers.utils.hexConcat(
            [    
                ethers.utils.hexlify(commitBlock.positonPubData),
                ethers.utils.hexZeroPad("0x", padLen)
            ]
    ))
	logger.debug("js rollup_assets_commitment ", rollup_assets_commitment)

    let rollup_data_commitment  = ethers.utils.sha256(
        ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "bytes32"],
            [rollup_col_commitment, rollup_assets_commitment]
        )
    )

    let account_data_commitment  = ethers.utils.sha256(
        ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "bytes32"],
            [rollup_data_commitment, commitBlock.all_data_commitment]
        )
    )

    commitment  = ethers.utils.sha256(
        ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "bytes32"],
            [commitment, account_data_commitment]
        )
    )

    logger.debug("h6_2 : ", commitment)
    padLen = getPadLen(
        commitBlock.onchainPubData.length,
        commitBlock.blockChunkSize * DEPOSIT_WITHDRAW_PUBDATA_BYTES
    );
    let onchain_commitment  = ethers.utils.sha256(
        ethers.utils.hexConcat(
            [    
                ethers.utils.hexlify(commitBlock.onchainPubData),
                ethers.utils.hexZeroPad("0x", padLen)
            ]
    ))

    commitment  = ethers.utils.sha256(
        ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "bytes32"],
            [commitment, onchain_commitment]
        )
    )

    logger.debug("h7 : ", commitment)
    return commitment
}


@Entity()
export class Sender {
	db : DataSource
	p : Perpetual
	owner
	owners

	constructor(
		db : DataSource,
		p : Perpetual,
		owner,
		owners
		) {
		this.db = db
		this.p = p
		this.owner = owner
		this.owners = owners
	}

	async prepareBlocks() {
		// strategy :
		// 1(default). as much under gas limit
		// 2. send 1 by 1

		let blocks = await this.db.manager.find(Block)
		logger.debug("blocks : ", blocks)

		let newBlocks = []
		for await (const b of blocks) {
			newBlocks.push(b.normalize())
		}
		return newBlocks
	}

	async sendBlocks(newOriBlocks : Block[]) {
		let latestOracePrices = [ 100, 200 ]
		let witness = []
		let newBlocks = []
		newOriBlocks.forEach(b => {
			newBlocks.push(b.normalize())
			witness.push(b.witness)
		});
		
		let commitments = []
		// TODO : global config
		let concatAllDataCommitment = ethers.utils.keccak256("0x")

		for (let i = 0; i < newBlocks.length; i++) {
			const b = newBlocks[i];
			
			concatAllDataCommitment = ethers.utils.keccak256(
				ethers.utils.defaultAbiCoder.encode(
					["bytes32", "bytes32"],
					[
						concatAllDataCommitment, b.all_data_commitment
					]
				)
			)
			

    		let newOrderStateHash = getOrderStateHash(b, i == newBlocks.length-1 ? latestOracePrices : []);
			let commitment = await createBlockCommitment(
				curAccountRoot,
				curOrderStateHash,
				newOrderStateHash,
				globalConfig.hash(),
				b)
			commitments.push(commitment)
			setAccountRoot(b.accountRoot)
			setOrderStateHash(newOrderStateHash)
		}

		logger.debug("++++ DUMP START FOR SENDER V2 ++++++++++")
		logger.debug("newBlocks : ", newBlocks)
		let sig0 = await this.owner.signMessage(concatAllDataCommitment)
		expect(ethers.utils.verifyMessage(concatAllDataCommitment, sig0)).equal(await this.owner.getAddress())

		let sig1 = await this.owners[1].signMessage(concatAllDataCommitment)
		let sig2 = await this.owners[2].signMessage(concatAllDataCommitment)

		let sigs = [sig0, sig1, sig2]
		logger.debug("sigs : ", sigs)
		

		// [TODO] proof = prover(witness)
		let real_proof = prover(witness)
		let proof = [
			[], // recursiveInput
			[],	// proof
			commitments,
			[], // vkIndexes
			[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]	// subproofsLimbs
		]
		logger.debug("proof : ", proof)
		logger.debug("latestOracePrices : ", latestOracePrices)

		let receipt = await this.p.updateBlocks(newBlocks, sigs, proof, latestOracePrices)
		logger.debug("curAccountRoot : ", curAccountRoot)
		logger.debug("curOrderStateHash : ", curOrderStateHash)
		logger.debug("receipt.data : ", receipt.data)
		logger.debug("++++ DUMP END FOR SENDER V2 ++++++++++")
	}
}

if(process.env.SENDER_UNIT_TEST) {
describe("Block Tree Test", function() {

	before(async () => {
		at = new utils.account.AccountTree("1111", "1111")
		ot = new utils.order.OrderTree()

		await DB.initialize()
	});

});
}