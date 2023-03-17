# Config
	1. init parameters 
		(1) genesis account root/order state hash :
		(2) governor :
		(3) sender/DAC :
		(4) userAdmin : 
		(5) globalConfig :
			max_funding_rate : 8948(0.75%),
			funding_validity_period : 
    		public price_validity_period :
			assets :
			MAX_ASSETS_COUNT :  31 ?
            MAX_NUMBER_ORACLES : 6 ?
			timelock : 0 day?
		(6) Security :
			deposit cancel timelock : 3 day ?
			forced action timelock : 14 day ?
			dac: 3/6 ?
			dac timelock : 0 day?
			governor/userAdmin 
			master : 

# Deploy
	1. git@github.com:starslabhq/zk-perpetual-contracts.git;
	2. cd zk-perpetual-contracts
	3. customize you config in ./.env (see rinkeby.env as a template)
	5. TS_NODE_TRANSPILE_ONLY=1 DEPLOY_ONLY=1 npx hardhat test test/deploy.ts --network rinkeby
	6. check "perpetual address" in the log
