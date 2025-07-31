import Web3 from "web3";
import { Transaction } from "@ethereumjs/tx";
import { Common } from "@ethereumjs/common";

const web3 = new Web3("https://eth-holesky.g.alchemy.com/v2/zcZyGbMMLQ9AIfaWPqTZg");

const contractAddress = "0x735dFBE876388F220F2eD38E637763b243A9a5B7";

// USDT ABI (minimal)
const usdtAbi = [{ "inputs": [{ "internalType": "uint256", "name": "initialSupply", "type": "uint256" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "allowance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" }], "name": "ERC20InsufficientAllowance", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "uint256", "name": "balance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" }], "name": "ERC20InsufficientBalance", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "approver", "type": "address" }], "name": "ERC20InvalidApprover", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "receiver", "type": "address" }], "name": "ERC20InvalidReceiver", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }], "name": "ERC20InvalidSender", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }], "name": "ERC20InvalidSpender", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Only POST requests allowed" });
  }

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
    const amount = web3.utils.toBN(value).mul(web3.utils.toBN(10).pow(web3.utils.toBN(6)));

    const balance = web3.utils.toBN(await contract.methods.balanceOf(from_address).call());
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
      { name: 'holesky', chainId: 17000, networkId: 17000 },
      { baseChain: 'mainnet', hardfork: 'shanghai' }
    );

    const tx = Transaction.fromTxData(txData, { common });
    const signed = tx.sign(Buffer.from(from_private_key.replace(/^0x/, ""), "hex"));
    const serialized = "0x" + signed.serialize().toString("hex");

    const receipt = await web3.eth.sendSignedTransaction(serialized);

    res.status(200).json({
      msg: "Transaction successful",
      hash: receipt.transactionHash,
      receipt
    });
  } catch (err) {
    res.status(500).json({ msg: "Transaction failed", error: err.message });
  }
}
