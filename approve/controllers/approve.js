let abi = require("../../abis/USDT.json");
const Promise = require("bluebird");
const { ethers, Contract } = require("ethers");
const config = require("../../config");
const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("defender-relay-client/lib/ethers");

const FlintContractAbi = require("../../abis/FlintContract.json");
let flintContractAddress = "0x65a6b9613550de688b75e12B50f28b33c07580bc";

const getNonce = async (walletAddress, contractAddress) => {
  try {
    console.log(walletAddress, contractAddress, "Nicnenccec $$$$");
    const credentials = {
      apiKey: config.OPEN_ZEPPELIN_API_KEY,
      apiSecret: config.OPEN_ZEPPELIN_API_SECRET,
    };
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {
      speed: "fast",
    });

    // let contractAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
    const contract = new ethers.Contract(contractAddress, abi, signer);

    let nonce = await contract.getNonce(walletAddress);

    console.log(parseInt(nonce), "Nocne");

    return Promise.resolve(parseInt(nonce));
  } catch (error) {
    return Promise.reject(error);
  }
};

const getAllowance = async (tokenAddress, walletAddress) => {
  try {
    console.log(walletAddress, tokenAddress, "getAllowance $$$$");
    const owner = walletAddress, spender = flintContractAddress;
    const credentials = {
      apiKey: config.OPEN_ZEPPELIN_API_KEY,
      apiSecret: config.OPEN_ZEPPELIN_API_SECRET,
    };

    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {
      speed: "fast",
    });

    // let contractAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
    const contract = new ethers.Contract(tokenAddress, abi, provider);

    let allowance = await contract.allowance(owner, spender);

    console.log(parseInt(allowance), "Allowance for user");

    return Promise.resolve(parseInt(allowance));
  } catch (error) {
    return Promise.reject(error);
  }
}

const sendTxn = async (
  r,
  s,
  v,
  functionSignature,
  userAddress,
  fromToken,
  toToken,
  uniswapPathData,
  amountIn
) => {
  try {
    const credentials = {
      apiKey: config.OPEN_ZEPPELIN_API_KEY,
      apiSecret: config.OPEN_ZEPPELIN_API_SECRET,
    };
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {
      speed: "average",
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
    const tokenAddress = fromToken;

    // WETH token address
    const toTokenAddress = toToken;

    let flintContract = new Contract(
      flintContractAddress,
      FlintContractAbi,
      signer
    );

    // let data = {
    //   path: ["0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", "0x831753DD7087CaC61aB5644b308642cc1c33Dc13"],
    //   fees: [500,3000]
    // };

    let params = {
      amountIn: parseInt(amountIn),
      tokenIn: tokenAddress,
      tokenOut: toTokenAddress,
      userAddress,
      approvalFunctionSignature: functionSignature,
      sigR: r,
      sigS: s,
      sigV: v,
      path:
        uniswapPathData.path && uniswapPathData.path.length > 0
          ? uniswapPathData.path
          : [],
      fees:
        uniswapPathData.fees && uniswapPathData.fees.length > 0
          ? uniswapPathData.fees
          : [],
    };

    console.log("THESE ARE THE PARAMS - ", params);
    // console.log(wallet.address);
    let tx = await flintContract.swapWithoutFeesEMT(params);

    return Promise.resolve(tx);
  } catch (error) {
    return Promise.reject(error);
  }
};

const approveTranasaction = async (
  r,
  s,
  v,
  functionSignature,
  userAddress,
  approvalContractAddress
) => {
  try {
    const credentials = {
      apiKey: config.OPEN_ZEPPELIN_API_KEY,
      apiSecret: config.OPEN_ZEPPELIN_API_SECRET,
    };
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {
      speed: "average",
    });

    const contractInstance = new Contract(approvalContractAddress, abi, signer);

    let tx = await contractInstance.executeMetaTransaction(
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

module.exports = { getNonce, sendTxn, approveTranasaction, getAllowance };
