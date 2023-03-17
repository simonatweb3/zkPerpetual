const { MerkleTree } = require('merkletreejs')
const SHA256 = require('crypto-js/sha256')

describe("Merkle Test", function() {
	before(async () => {

	});

	it("merkle test", async function() {
		const leaves = ['a', 'b', 'c'].map(x => SHA256(x))
		const tree = new MerkleTree(leaves, SHA256)

		const root = tree.getRoot().toString('hex')
		const leaf = SHA256('a')
		const proof = tree.getProof(leaf)
		console.log(tree.verify(proof, leaf, root)) // true
		
		console.log(tree.toString())
	});

});