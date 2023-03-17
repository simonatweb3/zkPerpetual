// SPDX-License-Identifier: MIT OR Apache-2.0

pragma solidity >= 0.8.0;

interface I_Verifier {

    function verifyAggregatedBlockProof(
        uint256[16] memory _subproofs_limbs,
        uint256[] memory _recursiveInput,
        uint256[] memory _proof,
        uint8[] memory _vkIndexes,
        uint256[] memory _individual_vks_inputs
    ) external view returns (bool);
}
