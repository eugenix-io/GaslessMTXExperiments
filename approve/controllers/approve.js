let abi = require("../../abis/USDT.json");
const Promise = require("bluebird");
const { ethers, Contract } = require("ethers");
const config = require("../../config");
const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("defender-relay-client/lib/ethers");
const FlintContractAbi = require("../../abis/FlintContract.json");

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

const sendTxn = async (r, s, v, functionSignature, userAddress) => {
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

    // USDT token address
    const tokenAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";

    // WETH token address
    const toTokenAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";

    let flintContractAddress = "0x65a6b9613550de688b75e12B50f28b33c07580bc";
    let flintContract = new Contract(
      flintContractAddress,
      FlintContractAbi,
      signer
    );

    let data = {};

    let params = {
      amountIn: 500000,
      tokenIn: tokenAddress,
      tokenOut: toTokenAddress,
      userAddress,
      approvalFunctionSignature: functionSignature,
      sigR: r,
      sigS: s,
      sigV: v,
      path: data.path && data.path.length > 0 ? data.path : [],
      fees: data.fees && data.fees.length > 0 ? data.fees : [],
    };

    // console.log(wallet.address);
    let tx = await flintContract.swapWithoutFeesEMT(params);

    return Promise.resolve(tx);
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports = { getNonce, sendTxn };
