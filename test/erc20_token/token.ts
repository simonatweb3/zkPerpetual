import { BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat"
import { expect } from "chai"
import * as utils from "../utils"

import {
	ETokenFactory,
	TokenVestingFactory,
	TokenVesting
} from "../../typechain"
import { is_hardhat_local_network } from "../utils/common";

const hre = require('hardhat');

const reduce_ratio = [3000, 2000, 2000, 2000, 2000] // * 1/10000
const TOTAL_SUPPLY = Math.pow(10, 9)
const RATIO_BASE = Math.pow(10, 4)
const MONTH = 12

class vestor {
    name
    beneficiary
    ratio
    init_ratio = 0
    initReleaseMonth = 0
    peroidStartMonth = 1
    peroid1Factor = RATIO_BASE
    peroid = 1
    peroidReleaseTimes = 0

    peroid1Amount = 0

    constructor(name, beneficiary, ratio) {
        this.name = name
        this.ratio = ratio
        this.beneficiary = beneficiary
    }

    computePeroid1Amount() {
        let peroid_total_amount = TOTAL_SUPPLY * (this.ratio - this.init_ratio) / RATIO_BASE;

        let factor = this.peroid1Factor;
        let base_factor = RATIO_BASE;
        for (let p = 1; p < this.peroidReleaseTimes; ++p) {
            let m = this.peroidStartMonth + p * this.peroid;

            if (m > MONTH && m % MONTH == 1) {
                base_factor = base_factor * (RATIO_BASE - reduce_ratio[Math.floor(m / MONTH) - 1]) / RATIO_BASE;
            }

            factor += base_factor;
        }

        let startAmount = peroid_total_amount * RATIO_BASE / factor;
        this.peroid1Amount = startAmount * this.peroid1Factor / RATIO_BASE
        return this.peroid1Amount
    }

    normalize() {
        return {
            beneficiary : this.beneficiary,
            ratio : this.ratio,
            init_ratio : this.init_ratio,
            initReleaseMonth : this.initReleaseMonth,
            peroidStartMonth : this.peroidStartMonth,
            peroid1Factor : this.peroid1Factor,
            peroid : this.peroid,
            peroidReleaseTimes : this.peroidReleaseTimes
        }
    }

    amountPerMonth(month) {
        this.computePeroid1Amount()

        let amount = 0
        if (month >= this.initReleaseMonth && this.init_ratio != 0) {
            amount += this.init_ratio * TOTAL_SUPPLY / RATIO_BASE;
        }

        if (this.peroidReleaseTimes > 0) {

            // release all remain token
            if (month >= this.peroidStartMonth + (this.peroidReleaseTimes - 1) * this.peroid) {
                return this.ratio * TOTAL_SUPPLY / RATIO_BASE;
            }

            if (month >= this.peroidStartMonth) {
                amount += this.peroid1Amount;

                let base_amount = this.peroid1Amount * RATIO_BASE / this.peroid1Factor;
                // peroid reduce released amount
                for (let m = this.peroidStartMonth + this.peroid; m <= month; m += this.peroid) {
                    if (m > MONTH && m % MONTH == 1) {
                        base_amount = base_amount * (RATIO_BASE - reduce_ratio[Math.floor(m / MONTH) - 1]) / RATIO_BASE;
                    }
                    amount += base_amount;
                }
            }
        }

        return amount
    }
}

class vestorList {

    vestors : vestor[]

    constructor(beneficiarys) {

        let lm = new vestor("liquidity_minting", beneficiarys[0], 1800)
        lm.peroidReleaseTimes = 60
        lm.peroid1Factor = 15000

        let sr = new vestor("staking_rewards", beneficiarys[1], 1500)
        sr.peroidReleaseTimes = 60
        sr.peroid1Factor = 15000

        let airdrop = new vestor("airdrop", beneficiarys[2], 100)
        airdrop.init_ratio = 100
        airdrop.initReleaseMonth = 1

        let market = new vestor("market", beneficiarys[3], 800)
        market.init_ratio = 17
        market.peroidReleaseTimes = 12

        let network = new vestor("network", beneficiarys[4], 1340)
        network.init_ratio = 50
        network.peroidReleaseTimes = 60

        let reserve = new vestor("reserve", beneficiarys[5], 1660)
        reserve.init_ratio = 1660
        reserve.initReleaseMonth = 6

        let team = new vestor("team", beneficiarys[6], 1800)
        team.peroidStartMonth = 6
        team.peroidReleaseTimes = 55

        let investor = new vestor("investor", beneficiarys[7], 500)
        investor.init_ratio = 50
        investor.initReleaseMonth = 1
        investor.peroidStartMonth = 3
        investor.peroidReleaseTimes = 4
        investor.peroid = 3

        let liquidity_mgmt = new vestor("liquidity_mgmt", beneficiarys[8], 450)
        liquidity_mgmt.init_ratio = 450

        let public_sale = new vestor("public_sale", beneficiarys[9], 50)
        public_sale.init_ratio = 50

        this.vestors = [lm, sr, airdrop, market, network, reserve, team, investor, liquidity_mgmt, public_sale]
    }

    normalize() {
        let l = []
        this.vestors.forEach(v => {
            l.push(v.normalize())
        });
        return l
    }
}

describe("TokenVesting Test", function() {
	this.timeout(6000000);

    let vestors : vestorList
    let owner
    let token

    let signer

    let decimals
    let beneficiarys = []

	before(async () => {
        signer = await ethers.getSigners()
        owner = signer[0]


		if (is_hardhat_local_network()) {
            signer.forEach(o => {
                beneficiarys.push(o.address)
                console.log(o.address)
            });

        } else if (hre.hardhatArguments.network == "rinkeby") {
            // test multi-sig on rinkeby

            beneficiarys = [
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
                "0x6950ad4f3B97C58aF50eF66338496e23698A45B7",
                "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
                "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
                "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
                "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
                "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f"
            ]
        } else {
            // TODO : 10 multi-sig mainnet address
            beneficiarys = [
            ]
        }

        expect(beneficiarys.length).gte(10)

        vestors = new vestorList(beneficiarys)
	});

	it("Check", async function() {
        let ratio = 0
        vestors.vestors.forEach(v => {
            ratio += v.ratio
        });
        expect(ratio).equal(RATIO_BASE)
	});

    async function waitEtherscan(addr: string) {

		// wait deploy contract ready on chain
		while(1) {
		  const code = await ethers.provider.getCode(addr)
		  //console.log("code : ", code)
		  if (code.length > 2) {
			break
		  } else {
			console.log("waiting ")
			await utils.common.sleep(10000)
		  }
		}
	}

    async function verify2(addr: string, args) {
		if (typeof hre.hardhatArguments.network != "undefined") {
			await waitEtherscan(addr)
			try {
				await hre.run('verify:verify', {
                    // contract: "contracts/dummy/dummy.sol:EToken",
                    address : addr,
                    constructorArguments : args
                });
				//await hre.run('verify', {address : addr, constructorArguments : args});
			} catch (e) {
				console.error(e);
			}
		}
	}

	// it("Deploy Rinkeby", async function() {
    //     let amount = ethers.utils.parseEther("1000000000.0")
    //     // let tok = await(new ETokenFactory(owner)).deploy(amount)
    //     //await verify2(tok.address, [amount])
    //     await verify2("0x0E455c0F87637cFF03dE32c60E535EC6bC2815E6", [amount])
	// });

	it("Deploy & Verify", async function() {

        const nowData = new Date()
        const launchData = new Date('2022-4-20')
        let launchTimeStampDist = Math.floor((launchData.getTime() - nowData.getTime()) / 1000) // s

        launchTimeStampDist = 100000
        console.log(" launchTimeStampDist ", launchTimeStampDist)
        let args = [
            "EdgeSwap",
            "EGS",
            ethers.utils.parseEther(TOTAL_SUPPLY.toString()),
            1318874,
            reduce_ratio,
            vestors.normalize()
        ]
        console.log(args)

		token = await(new TokenVestingFactory(owner)).deploy(
            "EdgeSwap", "EGS",
            ethers.utils.parseEther(TOTAL_SUPPLY.toString()),
            launchTimeStampDist,
            reduce_ratio,
            vestors.normalize()
        )
        decimals = await token.decimals()

        //await verify2("0xB009BFaAF85e53F55d8657781Eb69feAaed83672", args)

	});

    function normalize(
        value : BigNumber,
        decimals,
        is_div
    ) {
        while (decimals != 0) {
            if (decimals <= 9) {
                if (is_div) {
                    return value.div(Math.pow(10, decimals))
                } else {
                    return value.mul(Math.pow(10, decimals))
                }
            } else {
                if (is_div) {
                    value = value.div(Math.pow(10, 9))
                } else {
                    value = value.mul(Math.pow(10, 9))
                }
                decimals -= 9
            }
        }
    }

	// it("Compare Per Month Relase Amount", async function() {
    //     for await (const v of vestors.vestors) {
    //         let right = v.computePeroid1Amount()
    //         let real = await token.callStatic.peroid1Amount(v.beneficiary)
    //         expect(Math.floor(normalize(real, decimals, true))).equal(Math.floor(right))

    //         for (let m = 0; m <=60; m++) {
    //             right = v.amountPerMonth(m)
    //             real = await token.callStatic.amountPerMonth(v.beneficiary, m)
    //             expect(Math.floor(normalize(real, decimals, true))).equal(Math.floor(right))
    //         }

    //     }
	// });

	it("Claim", async function() {
	// 	let REVERT_REASON_HEADER = "Error: VM Exception while processing transaction: reverted with reason string "
	// 	let REVERT_REASON_EXCEED_RELEASE_AMOUNT = REVERT_REASON_HEADER + "\'" + "exceed releasedAmount" + "\'"

            let raw_amount = 1032689
            let target = "0x56bC749221086c6C0329cCfD822bfd530b888587"

            let market = TokenVestingFactory.connect(token.address, signer[3])
            let total_amount = await token.callStatic.amountPerMonth(beneficiarys[3], 0)
            let market0_amount = normalize(BigNumber.from(raw_amount), decimals, false)
            console.log("market0_amount : ", market0_amount)
            let tx = await market.populateTransaction.claim(market0_amount)
            console.log("审领: ", tx.data)
            // await (await market.claim(market0_amount)).wait()
            // expect(await market.balanceOf(beneficiarys[3])).equal(market0_amount)

            let amount = normalize(BigNumber.from(raw_amount), decimals, false)
            // expect(await market.balanceOf(target)).equal(0)
            tx = await market.populateTransaction.transfer(target, amount)
            console.log("转账: ", tx.data)
            // await (await market.transfer(target, amount)).wait()
            // expect(await market.balanceOf(target)).equal(amount)

	// // 	if (hre.hardhatArguments.network != undefined) {
    // //         let network = TokenVestingFactory.connect(beneficiarys[4], owner)
    // //         let tx = await network.populateTransaction.claim(100)
    // //         console.log(tx.data)
    // //     } else {

    // //         let lm = TokenVestingFactory.connect(token.address, owner)
    // //         try {
    // //             await (await lm.claim(10)).wait()
    // //         } catch (error) {
    // //         expect(error.toString().includes(REVERT_REASON_EXCEED_RELEASE_AMOUNT)).equal(true)
    // //         }

    // //         console.log("singer[4] : ", signer[4])
    // //         let network = TokenVestingFactory.connect(token.address, signer[4])
    // //         await (await network.claim(100)).wait()
    // //         expect(await network.balanceOf(vestors.vestors[4].beneficiary)).equal(100)
    // //         try {
    // //             await (await network.claim(normalize(BigNumber.from(vestors.vestors[4].amountPerMonth(0)).add(100), decimals, false))).wait()
    // //         } catch (error) {
    // //             console.log(error)
    // //             expect(error.toString().includes(REVERT_REASON_EXCEED_RELEASE_AMOUNT)).equal(true)
    // //         }
    // //     }
    });

});