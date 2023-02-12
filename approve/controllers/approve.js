let abi = require("../../abis/USDT.json");
const Promise = require("bluebird");
const { ethers, Contract } = require("ethers");
require("dotenv").config();
const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("defender-relay-client/lib/ethers");
const getNonce = async (walletAddress) => {
  try {
    const credentials = {
      apiKey: process.env.OPEN_ZEPPELIN_API_KEY,
      apiSecret: process.env.OPEN_ZEPPELIN_API_SECRET,
    };
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {
      speed: "fast",
    });

    let contractAddress = "0x7FFB3d637014488b63fb9858E279385685AFc1e2";
    const contract = new ethers.Contract(contractAddress, abi, signer);

    let nonce = await contract.getNonce(walletAddress);

    console.log(parseInt(nonce), "Nocne");

    return Promise.resolve(parseInt(nonce));
  } catch (error) {
    return Promise.reject(error);
  }
};

const sendTxn = async (r,s,v, functionSignature, userAddress) => {
  try {
    const credentials = {
      apiKey: process.env.OPEN_ZEPPELIN_API_KEY,
      apiSecret: process.env.OPEN_ZEPPELIN_API_SECRET,
    };
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {
      speed: "fast",
    });

    let contractAddress = "0x7FFB3d637014488b63fb9858E279385685AFc1e2";
    const contract = new ethers.Contract(contractAddress, abi, signer);
    let tx = await contract.executeMetaTransaction(
      userAddress,
      functionSignature,
      r,
      s,
      v,
      {
        gasLimit: 200000,
        gasPrice: ethers.parseUnits("1000", "gwei"),
      }
    );

    return Promise.resolve(tx);
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports = { getNonce, sendTxn };
