import {Builder, Browser, By, Key, until} from 'selenium-webdriver';
import WalletConnect from "@walletconnect/client";
import { sleep } from './utils/common';

//import clipboard from 'clipboardy'
// code from js/zkp-contract/node_modules/clipboardy/lib/macos.js
import execa from 'execa';
import { exit } from 'process';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Zkmoney } from '../typechain/Zkmoney';
import { ZkmoneyFactory } from '../typechain/ZkmoneyFactory';
const env = {
	LC_CTYPE: 'UTF-8',
};
const clipboard = {
	copy: async options => execa('pbcopy', {...options, env}),
	paste: async options => {
		const {stdout} = await execa('pbpaste', {...options, env});
		return stdout;
	},
	copySync: options => execa.sync('pbcopy', {...options, env}),
	pasteSync: options => execa.sync('pbpaste', {...options, env}).stdout,
};

// 连接钱包，签名
async function wc_monitor_sign(
    connector : WalletConnect,
    owner : SignerWithAddress,
    zc : Zkmoney,
    repeat
) {
    async function monitor() {
       
        connector.on("session_request", (error, payload) => {
            console.log("......on session_request......")
            if (error) {
            throw error;
            }
            console.log("payload ", payload)
            console.log("payload peerMeta ", payload.params[0].peerMeta)

            console.log("......approve session......")
            connector.approveSession({
                accounts: [                 // required
                    owner.address
                ],
                chainId: 1                  // required
            })

        });

        let res
        let txhash
        connector.on("call_request", async (error, payload) => {
            console.log("handle call_request payload ", payload)
            if (error) {
                throw error;
            }

            switch(payload.method) {
                case "personal_sign" :
                    // == await connector.signPersonalMessage([user_sig])
                    res = await owner.signMessage(payload.params[0])
                    console.log("personal_sign : ", res)
                    break
                case "eth_sendTransaction" :
                    const desc = zc.interface.parseTransaction({data : payload.params[0].data})
                    console.log("desc : ", desc)
                    if (txhash == undefined) {
                        let tx = await (await owner.sendTransaction(payload.params[0])).wait()
                        txhash = tx.transactionHash
                        console.log("eth_sendTransaction get hash : ", txhash)
                    } else {
                        console.log("using exist eth_sendTransaction hash : ", txhash)
                    }
                    res = txhash
                    break
                default :
                    console.log("not recognize method ", payload.method)
                    exit(0)
                    break
            }

            connector.approveRequest({
                id : payload.id,
                result : res
            })
        });

        connector.on("disconnect", (error, payload) => {
            console.log("on disconnect")
            if (error) {
              throw error;
            }
        });
    }


    while(repeat > 0) {
        await monitor()
        await sleep(5000)
        repeat -= 1
    }
}

async function enter_zk_money_wallet(
    driver
) {
    const signup_url = "https://zk.money/signup"
    await driver.get(signup_url);

    console.log("...... waiting  page render done ......")
    await sleep(10000)      // time to render

    console.log("...... click accept ......")
    //<div class="button_button__SnTng button_primary__10yYF"><div class="button_text__3T47f">Accept</div></div>
    const accept_e_className = 'button_button__SnTng button_primary__10yYF'
    await driver.findElement(By.className(accept_e_className)).click()


    console.log("...... click connect ......")
    // <div class="text__TextRoot-sc-qjmo0j-0 gAvKUt">Connect</div>
    const connect_e_className = 'text__TextRoot-sc-qjmo0j-0 gAvKUt'
    await driver.findElement(By.className(connect_e_className)).click()

    console.log("...... click copy ......")
    // <div class="walletconnect-modal__footer"><a>复制到剪贴板</a></div>
    const copy_e_className = 'walletconnect-modal__footer'
    await driver.findElement(By.className(copy_e_className)).click()
    const wc_url = await clipboard.paste("")
    console.log("wc_url : ", wc_url)

    //   await driver.wait(until.titleIs('webdriver - Google Search'), 1000);
    return wc_url
}

async function reg_account(
    driver,
    accountName
) {

    console.log("......enter account name ", accountName)
    // <input placeholder="@montzema50" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false" class="input__StyledInput-sc-u3ummw-0 ZWXOp" value="@">
    const account_name_class = "input__StyledInput-sc-u3ummw-0 ZWXOp"
    await driver.findElement(By.className(account_name_class)).sendKeys(accountName, Key.RETURN)

    await sleep(5000)
    console.log("......click register ......")

    // <div class="padded_block__PaddedBlock-sc-1t441ms-0 jaPVKd">
    //      <div class="link__LinkRoot-sc-14lelax-0 fHsfNy text_link__StyledLink-sc-5be2on-0 esdacv button__StyledButton-sc-1socfyr-0 dizlNk">
    //          <div class="text__TextRoot-sc-qjmo0j-0 hFJoHq" color="gradient">
    //              <div class="button__ContentRoot-sc-1socfyr-1">Register</div></div></div></div>
    //const register_class = "padded_block__PaddedBlock-sc-1t441ms-0 jaPVKd"
    //const register_class = "button__ContentRoot-sc-1socfyr-1"
    const register_class = "link__LinkRoot-sc-14lelax-0 fHsfNy text_link__StyledLink-sc-5be2on-0 esdacv button__StyledButton-sc-1socfyr-0 dizlNk"
    await driver.findElement(By.className(register_class)).click()
}


// 充值-->注册
async function deposit_for_reg(
    driver,
    depositNum)
{
    console.log("......enter deposit account ", depositNum)
    //<input autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false" class="input__StyledInput-sc-u3ummw-0 ZWXOp" value="0">
    const deposit_num_class = "input__StyledInput-sc-u3ummw-0 ZWXOp"
    await driver.findElement(By.className(deposit_num_class)).sendKeys(depositNum, Key.RETURN)

    sleep(1000)

    console.log("......fill checkbox I understand the risks ")
    // <div class="checkbox__StyledCheckbox-sc-vbghaz-1 hPLQLU"></div>
    const checkbox_class = "checkbox__StyledCheckbox-sc-vbghaz-1 hPLQLU"
    await driver.findElement(By.className(checkbox_class)).click()

    sleep(1000)

    console.log("......click Shield")
    // <div class="button__ContentRoot-sc-1socfyr-1">Shield</div>
    const shield_class = "button__ContentRoot-sc-1socfyr-1"
    await driver.findElement(By.className(shield_class)).click()
}

// 充值到zk

// 提现到L1


describe("Webdriver Unit Test", function() {
    this.timeout(6000000);
    
    let owner : SignerWithAddress
    let driver
    let wc_reg_uri
    let connector : WalletConnect
    let zc : Zkmoney
    before(async () => {
        const owners = await ethers.getSigners()
        owner = owners[0]
        console.log("owner : ", owner.address)

        const zkmoney_mainnet = "0xFF1F2B4ADb9dF6FC8eAFecDcbF96A2B351680455"
        zc = ZkmoneyFactory.connect(zkmoney_mainnet, owner)
        const calldata = "0x7ff48afb00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000025ced7b5b32000000000000000000000000000bb13e2852d79ba1c58d001ddd245893928b213a40000000000000000000000000000000000000000000000000000000000000000"
        const desc = zc.interface.parseTransaction({data : calldata})
        console.log("desc : ", desc)
    
        driver = await new Builder().forBrowser(Browser.CHROME).build();

    });

    it("reg and deposit zk money", async function() {
        wc_reg_uri = await enter_zk_money_wallet(driver)
    });

    it("wallet connect", async function() {
        //const wc_reg_uri = "wc:3c565c31-3d27-4348-89e2-6e47841a48df@1?bridge=https%3A%2F%2Fq.bridge.walletconnect.org&key=5d1658f14387495f81d6c7a81b20f0c2006c0d12858bab27271458db6480c5a1"
        connector = new WalletConnect(
            {
                // Required
                uri : wc_reg_uri,
                // Required
                clientMeta: {
                    description: "WalletConnect Developer App",
                    url: "https://walletconnect.org",
                    icons: ["https://walletconnect.org/walletconnect-logo.png"],
                    name: "WalletConnect",
                },
            }
        );

        await wc_monitor_sign(connector, owner, zc, 3)
    });


    it("random account name register", async function() {
        const accountName = "ppneiefbpp"
        await reg_account(driver, accountName)
    });


    it("wallet sign to Confirming account key and generating spending key", async function() {
        // TODO
        await wc_monitor_sign(connector, owner, zc, 3)
    });


    it("deposit for reg", async function() {
        await deposit_for_reg(driver, ".01")
    });

    it("wc_monitor_sign after deposit_for_reg", async function() {
        await wc_monitor_sign(connector, owner, zc, 100)
        // Create Shield Proof
        // Deposit ETH
        // Approve Shield Proof
        // Send Shield and Registration Transaction
        // Initialise Account
    });


    it("login", async function() {
        // sign
        // input account name
        // wait several minutes
    });

    it("deposit", async function() {
        // enter 0.01
        // sign transaction
        // wait serveral mins (transaction confirm)
        // sign again
    });

    it("withdrawal", async function() {     
        // https://zk.money/balance

        // click send
        // click Withdraw to L1
        // Enter L1 address
        // Enter Account
        // Click Next
        // Select I understand the risk
        // click Confirm Transaction
        // sign
        //
    });
});

// zk.money
// 