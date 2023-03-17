import "@nomiclabs/hardhat-ethers";
import env, { ethers } from "hardhat" 
const hre = require('hardhat');
const fs = require("fs");
import assert from "assert";

const Scalar = require("ffjavascript").Scalar;

const WitnessCalculatorBuilder = require("circom_runtime").WitnessCalculatorBuilder;
import * as snarkjs from "snarkjs"
import * as circom from "circom"
// import { getCurveFromName } from "snarkjs/src/curves.js";

describe("Circuit/SnarkJs/Circom Test", function() {
	this.timeout(6000000);

    let curve;
    const ptau_0 = {type: "mem"};
    const ptau_1 = {type: "mem"};
    const ptau_2 = {type: "mem"};
    const ptau_beacon = {type: "mem"};
    const ptau_final = {type: "mem"};
    const ptau_challenge2 = {type: "mem"};
    const ptau_response2 = {type: "mem"};
    const zkey_0 = {type: "mem"};
    const zkey_1 = {type: "mem"};
    const zkey_2 = {type: "mem"};
    const zkey_final = {type: "mem"};
    const zkey_plonk = {type: "mem"};
    const bellman_1 = {type: "mem"};
    const bellman_2 = {type: "mem"};
    let vKey;
    let vKeyPlonk;
    const wtns = {type: "mem"};
    let proof;
    let publicSignals;

	before(async () => {
	});



	let witness
	let r1csFileName = "test/mock/circuit/add.r1cs"
	let wasmFileName = "test/mock/circuit/add.wasm"
	const input_json = {"lhs": 2, "rhs": 3, "res": 5}
	// it("circom test", async function() {
	// 	// refer to 
	// 	// 1. node_modules/circom/test/basiccases.js
	// 	// 2. node_modules/circom/ports/wasm/tester.js
	// 	// 3. node_modules/circom/cli.js
	// 	// 

    // 	let options = {
	// 		prime : Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617"),
	// 		r1csFileName : r1csFileName,
	// 		dataFileName : "test/mock/circuit/add.data",
	// 		wasmFileName : wasmFileName,
	// 		verbose : false,
	// 		reduceConstraints : false,
	// 		symWriteStream : fs.createWriteStream("test/mock/circuit/add.sym"),

	// 		//cSourceFileName : "test/mock/circuit/add.cpp",
	// 	}
	// 	let result = await circom.compiler("test/mock/circuit/add.circom", options)
	// 	console.log("compiler result : ", result)
	// 	console.log(circom)

	// 	const wasm = await fs.promises.readFile("test/mock/circuit/add.wasm");
	// 	const wc = await WitnessCalculatorBuilder(wasm);
	// 	console.log("witness caculator : ", wc)

	// 	//const w = await wc.calculateWitness("test/mock/circuit/add_input.json")
	// 	witness = await wc.calculateWitness(input_json)
	// 	console.log("witness : ", witness)
	// });


	it("snarkjs export some utils to get curve", async function() {
		// add below code in tail node_modules/snarkjs/build/main.cjs

		// var simon_export_util = /*#__PURE__*/Object.freeze({
		// 	__proto__: null,
		// 	getCurveFromName: getCurveFromName
		// });
		// exports.simon_export_util = simon_export_util;
		curve = await snarkjs.simon_export_util.getCurveFromName("bn128")
	});

	it("snarkjs general phase-1(long time)", async function() {
		// node_modules/snarkjs/test/fullprocess.js
		await snarkjs.powersOfTau.newAccumulator(curve, 11, ptau_0);
		await snarkjs.powersOfTau.contribute(ptau_0, ptau_1, "C1", "Entropy1");
		await snarkjs.powersOfTau.exportChallenge(ptau_1, ptau_challenge2);
		await snarkjs.powersOfTau.challengeContribute(curve, ptau_challenge2, ptau_response2, "Entropy2");
		await snarkjs.powersOfTau.importResponse(ptau_1, ptau_response2, ptau_2, "C2", true);
		await snarkjs.powersOfTau.beacon(ptau_2, ptau_beacon, "B3", "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20", 10);
		await snarkjs.powersOfTau.preparePhase2(ptau_beacon, ptau_final);
		const res = await snarkjs.powersOfTau.verify(ptau_final);
        assert(res);
	});

	it("snarkjs general phase-1 using exist ptau_final", async function() {
	});

	it("snarkjs growth16 setup circuit-specific phase-2", async function() {
        await snarkjs.zKey.newZKey(r1csFileName, ptau_final, zkey_0);
        await snarkjs.zKey.contribute(zkey_0, zkey_1, "p2_C1", "pa_Entropy1");
        await snarkjs.zKey.exportBellman(zkey_1, bellman_1);
        await snarkjs.zKey.bellmanContribute(curve, bellman_1, bellman_2, "pa_Entropy2");
        await snarkjs.zKey.importBellman(zkey_1, bellman_2, zkey_2, "C2");
        await snarkjs.zKey.beacon(zkey_2, zkey_final, "B3", "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20", 10);
        const res = await snarkjs.zKey.verifyFromInit(zkey_0, ptau_final, zkey_final);
        assert(res);
	});

	// Scalar size does not match
	// it("snarkjs growth16 test", async function() {
    //     vKey = await snarkjs.zKey.exportVerificationKey(zkey_final);
    //     await snarkjs.wtns.calculate(input_json, wasmFileName, wtns);

	// 	const res = await snarkjs.groth16.prove(zkey_final, wtns);
    //     proof = res.proof;
    //     publicSignals = res.publicSignals;

	// 	const verified = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    //     assert(verified == true);
	// });

	// TypeError : Cannot read property 'byteLength
	// it("snarkjs plonk test", async function() {
    //     await snarkjs.plonk.setup(r1csFileName, ptau_final, zkey_plonk)
	// 	vKey = await snarkjs.zKey.exportVerificationKey(zkey_plonk)
	
	// 	const res = await snarkjs.plonk.prove(zkey_plonk, wtns);
    //     proof = res.proof;
    //     publicSignals = res.publicSignals;

	// 	const verified = await snarkjs.plonk.verify(vKey, publicSignals, proof);
    //     assert(verified == true);
	// });

});
