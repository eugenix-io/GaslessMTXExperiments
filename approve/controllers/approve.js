let abi = require("../../abis/USDT.json");
const Promise = require("bluebird");
const { ethers, Contract } = require("ethers");
const config = require('../../config');
const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("defender-relay-client/lib/ethers");
const FlintContractAbi = require('../../abis/FlintContract.json');

const getNonce = async (walletAddress) => {
  try {
    const credentials = {
      apiKey: config.OPEN_ZEPPELIN_API_KEY,
      apiSecret: config.OPEN_ZEPPELIN_API_SECRET,
    };
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {
      speed: "fast",
    });

    let contractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
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
      apiKey: config.OPEN_ZEPPELIN_API_KEY,
      apiSecret: config.OPEN_ZEPPELIN_API_SECRET,
    };
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {
      speed: "fast",
    });

    // let contractAddress = "0x7FFB3d637014488b63fb9858E279385685AFc1e2";
    // const contract = new ethers.Contract(contractAddress, abi, signer);
    // let tx = await contract.executeMetaTransaction(
    //   userAddress,
    //   functionSignature,
    //   r,
    //   s,
    //   v,
    //   {
    //     gasLimit: 200000,
    //     gasPrice: ethers.parseUnits("1000", "gwei"),
    //   }
    // );

    let flintContractAddress = '0x8E001FEB0B1971C465204098997634791Cbe7E24';
    let flintContract = new Contract(flintContractAddress, FlintContractAbi, signer);


    // console.log(wallet.address);
    let tx = await flintContract.swapWithoutFeesSingle(
        300000,
        "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
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
