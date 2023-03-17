
template Add() {
    signal input lhs;
    signal input rhs;
    signal output res;

    res <== lhs + rhs;
}

component main = Add();