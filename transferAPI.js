const express = require("express");
const router = express.Router();
const Web3 = require("web3");
const axios = require("axios");
const { Transaction } = require("@ethereumjs/tx");
const { Common } = require('@ethereumjs/common');

const web3 = new Web3("https://eth-holesky.g.alchemy.com/v2/zcZyGbMMLQ9AIfaWPqTZg");

// USDT ABI (minimal)
const usdtAbi = [{ "inputs": [{ "internalType": "uint256", "name": "initialSupply", "type": "uint256" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "allowance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" }], "name": "ERC20InsufficientAllowance", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "uint256", "name": "balance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" }], "name": "ERC20InsufficientBalance", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "approver", "type": "address" }], "name": "ERC20InvalidApprover", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "receiver", "type": "address" }], "name": "ERC20InvalidReceiver", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }], "name": "ERC20InvalidSender", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }], "name": "ERC20InvalidSpender", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }];


const contractAddress = "0x735dFBE876388F220F2eD38E637763b243A9a5B7";
console.log(contractAddress, "contract")

router.post("/transfer", async (req, res) => {
    try {
        const { from_address, to_address, from_private_key, value } = req.body;

        if (!web3.utils.isAddress(from_address) || !web3.utils.isAddress(to_address)) {
            return res.status(400).json({ msg: "Invalid wallet address" });
        }
        if (!value || isNaN(value)) {
            return res.status(400).json({ msg: "Invalid value" });
        }
        if (!from_private_key) {
            return res.status(400).json({ msg: "Private key is required" });
        }

        const contract = new web3.eth.Contract(usdtAbi, contractAddress);
        const amount = web3.utils
            .toBN(value)
            .mul(web3.utils.toBN(10).pow(web3.utils.toBN(6)));

        const balance = web3.utils.toBN(await contract.methods.balanceOf(from_address).call());
        console.log("Token balance:", balance.toString());

        if (balance.lt(amount)) {
            return res.status(400).json({ msg: "Insufficient token balance" });

        }


        const data = contract.methods.transfer(to_address, amount).encodeABI();
        const nonce = await web3.eth.getTransactionCount(from_address, "latest");
        const gasPrice = await web3.eth.getGasPrice();

        const txData = {
            from: from_address,
            to: contractAddress,
            nonce: web3.utils.toHex(nonce),
            gasPrice: web3.utils.toHex(gasPrice),
            gasLimit: web3.utils.toHex(100000),
            data: data,
            value: "0x0"
        };


        const common = Common.custom(
  {
    name: 'holesky',
    chainId: 17000,
    networkId: 17000,
  },
  {
    baseChain: 'mainnet',
    hardfork: 'shanghai', // or 'petersburg' if your node supports only older forks
  }
);

        const tx = Transaction.fromTxData(txData, { common });
        const signed = tx.sign(Buffer.from(from_private_key.replace(/^0x/, ""), "hex"));
        const serialized = "0x" + signed.serialize().toString("hex");

        const receipt = await web3.eth.sendSignedTransaction(serialized);

        res.json({
            msg: "Transaction successful",
            hash: receipt.transactionHash,
            receipt
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Transaction failed", error: err.message });
    }
});


router.get("/getBalance/:walletAddress", async (req, res) => {
    const { walletAddress } = req.params;

    if (!walletAddress) {
        return res.status(400).json({
            code: 400,
            msg: "Wallet address is missing",
            data: null,
        });
    }

    try {
        const contract = new web3.eth.Contract(usdtAbi, contractAddress);
        const rawBalance = await contract.methods.balanceOf(walletAddress).call();
        const balance = rawBalance / 10 ** 6; // USDT has 6 decimals

        return res.status(200).json({
            code: 200,
            msg: "Balance fetched successfully",
            data: {
                wallet: {
                    balance,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            code: 500,
            msg: "Error fetching balance",
            error: error.message,
        });
    }
});



module.exports = router;
