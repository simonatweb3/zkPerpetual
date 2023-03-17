import * as fs from "fs";
import * as snarkjs from "snarkjs"
// circomlib for witness
import path from "path";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
const hre = require('hardhat');

import * as circomlib from "circomlib"
import * as circomlibjs from "circomlibjs"
import { execSync } from "child_process";
import { sha256 } from "ethers/lib/utils";
import { getOrderStateHash } from "../utils/order";
import { exit } from "process";
import { Groth16Verifier, Groth16VerifierFactory } from "../../typechain";
console.log(circomlibjs)
console.log(circomlib)

let curve

const ptau_final = {type: "mem"};

    const zkey_final = {type: "mem"};
    const zkey_plonk = {type: "mem"};
    let vKey;
    let vKeyPlonk;
    const wtns = {type: "mem"};

interface PROOF {
	pi_a : BigNumber[],
	pi_b : any[],
	pi_c : BigNumber[],
	protocol : string,
	curve : string
}

    let proof : PROOF;
    let publicSignals;

//let FILE_PTAU_FINAL = "./circuits/build/ptau_final.data"
//let FILE_ZKEY_FINAL = "./circuits/build/zkey_final.data"
let FILE_PTAU_FINAL = "/tmp/ptau_final.data"
let FILE_ZKEY_FINAL = "/tmp/zkey_final.data"

const CIRCUIT_DIR = "test/prover/circuits/"
let FILE_R1CS = CIRCUIT_DIR + "circuit.r1cs"
let FILE_WASM = CIRCUIT_DIR + "circuit_js/circuit.wasm"

// node_modules/circom_tester/wasm/tester.js
async function compile_circom (fileName, options) {    
    var flags = "--wasm ";
    if (options.sym) flags += "--sym ";
    if (options.r1cs) flags += "--r1cs ";
    if (options.json) flags += "--json ";
    if (options.output) flags += "--output " + options.output + " ";
    if (options.O === 0) flags += "--O0 "
    if (options.O === 1) flags += "--O1 "

    await execSync("circom " + flags + fileName);
}


// node_modules/snarkjs/test/fullprocess.js
describe("Full process", function ()  {
    this.timeout(1000000000);
	let owner
	let v : Groth16Verifier

    before( async () => {
		const owners = await ethers.getSigners()
		owner = owners[0]
		console.log("snarkjs : ", snarkjs)
        curve = await snarkjs.simon_export_util.getCurveFromName("bn128");
    });

	it ("compile circom circuit", async () => {
		// circom rewrite to rust, so js is deprecated
		// https://github.com/iden3/circom

		// circom circuit.circom --r1cs --wasm --sym --O1
		execSync("rm -rf circuits/circuit_js circuits/*.r1cs  circuits/*.sym")
		await compile_circom("./circuits/circuit.circom", {
			sym : true,
			r1cs : true,
			O : 1,
			output : "./circuits"
		})
    });

if (process.env.NEW_PTAU_FINAL_KEY) {
    it ("generate ptau_final", async () => {
		const ptau_0 = {type: "mem"};
    	const ptau_1 = {type: "mem"};
    	const ptau_2 = {type: "mem"};
    	const ptau_beacon = {type: "mem"};
    	const ptau_challenge2 = {type: "mem"};
    	const ptau_response2 = {type: "mem"};
        await snarkjs.powersOfTau.newAccumulator(curve, 11, ptau_0);
        await snarkjs.powersOfTau.contribute(ptau_0, ptau_1, "C1", "Entropy1");
        await snarkjs.powersOfTau.exportChallenge(ptau_1, ptau_challenge2);
        await snarkjs.powersOfTau.challengeContribute(curve, ptau_challenge2, ptau_response2, "Entropy2");
		//console.log(ptau_response2)
        await snarkjs.powersOfTau.importResponse(ptau_1, ptau_response2, ptau_2, "C2", true);
        await snarkjs.powersOfTau.beacon(ptau_2, ptau_beacon, "B3", "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20", 10);
		//console.log(ptau_beacon)
        await snarkjs.powersOfTau.preparePhase2(ptau_beacon, ptau_final);
		console.log("ptau_final : ", ptau_final)
		fs.writeFileSync(FILE_PTAU_FINAL, Buffer.from(ptau_final.data))
	});
}
		
    it ("using previous generated ptau_final", async () => {
		let data = Buffer.from(fs.readFileSync(FILE_PTAU_FINAL))
		ptau_final.data = new Uint8Array(data)
	});

if (process.env.NEW_ZKEY_FINAL_KEY) {
    it ("generate zkey_final", async () => {
		try {
			
		const zkey_0 = {type: "mem"};
		const zkey_1 = {type: "mem"};
		const zkey_2 = {type: "mem"};
    	const bellman_1 = {type: "mem"};
    	const bellman_2 = {type: "mem"};
        await snarkjs.zKey.newZKey(FILE_R1CS, ptau_final, zkey_0);
		console.log("zkey_0 : ", zkey_0)
        await snarkjs.zKey.contribute(zkey_0, zkey_1, "p2_C1", "pa_Entropy1");
        await snarkjs.zKey.exportBellman(zkey_1, bellman_1);
		console.log("bellman_1 : ", bellman_1)
        await snarkjs.zKey.bellmanContribute(curve, bellman_1, bellman_2, "pa_Entropy2");
        await snarkjs.zKey.importBellman(zkey_1, bellman_2, zkey_2, "C2");
        await snarkjs.zKey.beacon(zkey_2, zkey_final, "B3", "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20", 10);
        let res = await snarkjs.zKey.verifyFromR1cs(FILE_R1CS, ptau_final, zkey_final);
		expect(res).eq(true)
        res = await snarkjs.zKey.verifyFromInit(zkey_0, ptau_final, zkey_final);
		expect(res).eq(true)
		fs.writeFileSync(FILE_ZKEY_FINAL, Buffer.from(zkey_final.data))
		} catch (error) {
			console.log(error)
			exit(-1)
		}
	});
}

	it ("using previous generated zkey_final", async () => {
		let data = Buffer.from(fs.readFileSync(FILE_ZKEY_FINAL))
		zkey_final.data = new Uint8Array(data)
	});

	it ("zkey export verificationkey", async () => {
        vKey = await snarkjs.zKey.exportVerificationKey(zkey_final);
		//console.log("vKey : ", vKey)

		// node_modules/snarkjs/build/cli.cjs
		const templates = {}
        templates.groth16 = await fs.promises.readFile("node_modules/snarkjs/templates/verifier_groth16.sol.ejs", "utf8");
		let verifierCode : string = await snarkjs.zKey.exportSolidityVerifier(zkey_final, templates)
		verifierCode = verifierCode.replace("0.6.11", "0.8.0")
		verifierCode = verifierCode.replace("Verifier", "Groth16Verifier")
		verifierCode = verifierCode.replace(new RegExp("switch success", "g"), "// switch success")
		console.log("type of verifierCode : ", typeof verifierCode)
    	fs.writeFileSync("./contracts/dummy/groth16_verifier.sol", verifierCode, "utf-8");

    });

	it ("deploy verifier", async () => {
		// TODO : npx hardhat compile
		v = await (new Groth16VerifierFactory(owner)).deploy()
    });


	function buffer2bitArray(b) {
		const res = [];
		for (let i=0; i<b.length; i++) {
			for (let j=0; j<8; j++) {
				res.push((b[i] >> (7-j) &1));
			}
		}
		return res;
	}
	
	it ("witness calculate", async () => {
        const testStr = "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq";
        const b = Buffer.from(testStr, "utf8");
		const hash = sha256(b)
		console.log("hash ", hash)
        const arrIn = buffer2bitArray(b);
		const INPUT_JSON = {in : arrIn}

		//const INPUT_JSON = {in : [2, 3]}
        await snarkjs.wtns.calculate(INPUT_JSON, FILE_WASM, wtns);
		console.log("wtns : ", wtns)
    });

	it ("groth16 proof", async () => {
        const res = await snarkjs.groth16.prove(zkey_final, wtns);
		console.log("proof res : ", res)
        proof = res.proof;
		console.log("proof.pi_b : ", proof.pi_b)
        publicSignals = res.publicSignals;
    });


	it ("groth16 verify", async () => {
        const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
		expect(res).eq(true)

		v.verifyProof(
			[proof.pi_a[0], proof.pi_a[1]],
			[proof.pi_b[0], proof.pi_b[1]],
			[proof.pi_c[0], proof.pi_c[1]],
			[6])
    });

});