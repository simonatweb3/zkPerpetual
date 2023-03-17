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
	it("circom test", async function() {
		// refer to 
		// 1. node_modules/circom/test/basiccases.js
		// 2. node_modules/circom/ports/wasm/tester.js
		// 3. node_modules/circom/cli.js
		// 

    	let options = {
			prime : Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617"),
			r1csFileName : r1csFileName,
			dataFileName : "test/mock/circuit/add.data",
			wasmFileName : wasmFileName,
			verbose : false,
			reduceConstraints : false,
			symWriteStream : fs.createWriteStream("test/mock/circuit/add.sym"),

			//cSourceFileName : "test/mock/circuit/add.cpp",
		}
		let result = await circom.compiler("test/mock/circuit/add.circom", options)
		console.log("compiler result : ", result)
		console.log(circom)

		const wasm = await fs.promises.readFile("test/mock/circuit/add.wasm");
		const wc = await WitnessCalculatorBuilder(wasm);
		console.log("witness caculator : ", wc)

		//const w = await wc.calculateWitness("test/mock/circuit/add_input.json")
		witness = await wc.calculateWitness(input_json)
		console.log("witness : ", witness)
	});


	it("snarkjs export some utils to get curve", async function() {
		// add below code in tail node_modules/snarkjs/build/main.cjs

		// var simon_export_util = /*#__PURE__*/Object.freeze({
		// 	__proto__: null,
		// 	getCurveFromName: getCurveFromName
		// });
		// exports.simon_export_util = simon_export_util;
		curve = await snarkjs.simon_export_util.getCurveFromName("bn128")
	});

});
