pragma circom 2.0.0;

// better to use circomlib temlates
// https://github.com/iden3/circomlib/tree/master/circuits

// AND/NAND/OR/XOR/NOR/NOT/MultiAND
include "../node_modules/circomlib/circuits/gates.circom";

// Num2Bits/Bits2Num/sqrt
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/pointbits.circom";

// IsZero/IsEqual/LessThan/GreaterThan
include "../node_modules/circomlib/circuits/comparators.circom";

// Pedersen/Poseidon/Sha256
include "../node_modules/circomlib/circuits/pedersen.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/sha256/sha256.circom";

template mul () {  
	// Declaration of signals.  
	signal input in[2];
    signal output out;

   // Constraints.  
    out <== in[0] * in[1];
}


template deposit () {
}

template withdraw () {
    component sha256Hash = Sha256(512);
    // verify signature
}

template loop () {
}

//component main = mul();
component main = withdraw();