import { Transaction } from "../transaction";
import { Account, AccountTree } from "../utils/account";

interface transaction_witness {
	transaction : Transaction,
	accountBefore : Account,
	accountAfter : Account,
	accountTreeBefore : AccountTree,
	accountTreeAfter : AccountTree
	// TODO : order/orderTree
}

export async function prover(blocks_witness : transaction_witness[][]) {
	blocks_witness.forEach(bw => {
		bw.forEach(tw => {
			// prove trancation change account/accountTree correctly

		});
	});
	return []
}