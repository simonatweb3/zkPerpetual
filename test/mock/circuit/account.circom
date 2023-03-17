
template Account() {
    signal input pubkey_hash;			// 160 bit
    signal input collateral_balance;	// 64 bit
	signal output account;				// struct ?

    account <== [pubkey_hash, collateral_balance];
}