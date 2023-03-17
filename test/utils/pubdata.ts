

export async function get_deposit_onchain_pubdata() {
}


export async function get_withdraw_onchain_pubdata() {
}

export async function get_onchain_pubdata() {
	// refer to lib/circuit/src/pubdata.rs OnchainPubdata

	// amount > 2^63 --> depoist

	// amount < 2^63 --> withdraw
}

export async function get_pubdata_commitment() {
	//	lib/circuit/src/witness/utils.rs calculate_pubdata_commitment
}