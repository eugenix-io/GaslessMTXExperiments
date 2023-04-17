let abi = require('../../abis/USDT.json');
let permitAbi = require('../../abis/ARB.json');
const sushiSwapAbi = require('../../abis/SushiSwapFlintGasless.json');
const Promise = require('bluebird');
const { ethers, Contract } = require('ethers');
const config = require('../../config');
const {
    DefenderRelaySigner,
    DefenderRelayProvider,
} = require('defender-relay-client/lib/ethers');
const axios = require('axios');

const FlintContractAbi = require('../../abis/FlintContract.json');
const FlintContractAbiV4 = require('../../abis/FlintContractV4.json');
const { reject } = require('bluebird');

let flintContractAddress = config.GASLESS_CONTRACT_ADDRESS;

const credentialsPolygon = {
    apiKey: config.OPEN_ZEPPELIN_API_KEY,
    apiSecret: config.OPEN_ZEPPELIN_API_SECRET,
};

// const credentialsArbitrum = {
//     apiKey: config.ARB_RELAYER_API_KEY,
//     apiSecret: config.ARB_RELAYER_SECRET_KEY,
// };

const polygonRelayerProvider = new DefenderRelayProvider(credentialsPolygon);
const polygonRelayerSigner = new DefenderRelaySigner(
    credentialsPolygon,
    polygonRelayerProvider,
    {
        speed: 'fastest',
    }
);

// const arbRelayerProvider = new DefenderRelayProvider(credentialsArbitrum);
// const arbRelayerSigner = new DefenderRelaySigner(
//     credentialsArbitrum,
//     arbRelayerProvider,
//     {
//         speed: 'average',
//     }
// );

const sendTxn = async ({
    amountIn,
    tokenIn,
    tokenOut,
    userAddress,
    path,
    fees,
    nonce,
    isTokenOutMatic,
    isTokenOutNative,
    r,
    s,
    v,
    chainId,
}) => {
    if (!chainId) {
        chainId = 137;
    }
    try {
        console.log('INSIDE THE SEND TXN FUNCTION!', tokenIn, tokenOut);

        console.log('THIS IS THE FLINT ADDRESS - ', flintContractAddress);
        let isNewContract = isTokenOutNative != undefined ? true : false;
        switch (chainId) {
            case 137:
                flintContractAddress = config.GASLESS_CONTRACT_ADDRESS_POLYGON;
                break;
            case 42161:
                flintContractAddress = config.GASLESS_CONTRACT_ADDRESS_ARBITRUM;
                break;
        }
        if (!isNewContract) {
            flintContractAddress = config.GASLESS_CONTRACT_ADDRESS;
        }

        const t1 = new Date().getTime();
        let [toMaticPath, toMaticFees] = await getRoute(
            tokenIn,
            getNativeTokenAddress(chainId),
            ethers.parseUnits('1000', 'gwei') * ethers.toBigInt(130000),
            chainId || 137
        );
        const t2 = new Date().getTime();
        console.log(`time to get route - ${(t2 - t1) / 1000}`);

        let params = {
            amountIn: ethers.toBigInt(amountIn),
            tokenIn,
            tokenOut,
            userAddress,
            path,
            fees,
            nonce: parseInt(nonce),
            sigR: r,
            sigS: s,
            sigV: v,
        };

        let flintContractAbi;

        if (isNewContract) {
            params.toNativePath = toMaticPath.reverse();
            params.toNativeFees = toMaticFees.reverse();
            params.isTokenOutNative = isTokenOutNative;
            flintContractAbi = FlintContractAbiV4;
        } else {
            params.toMaticPath = toMaticPath.reverse();
            params.toMaticFees = toMaticFees.reverse();
            params.isTokenOutMatic = Boolean(isTokenOutMatic);
            flintContractAbi = FlintContractAbi;
        }

        let flintContract = new Contract(
            flintContractAddress,
            flintContractAbi,
            chainId == 137 ? polygonRelayerSigner : arbRelayerSigner
        );

        console.log(flintContract);

        console.log('THESE ARE THE PARAMS - ', params);
        // console.log(wallet.address);
        let tx;
        let gasParams = {
            // gasLimit: chainId == 137 ? 500000 : 2000000,
            // maxFeePerGas: ethers.parseUnits('3000', 'gwei'),
        };
        if (chainId == 42161) {
            gasParams.gasPrice = await getGasFees(chainId); //ideally we could just specify maxFeePerGas but the contract takes 1000 gwei as the fees if not present, so estimate gas functon fails
            // gasParams.maxFeePerGas = ethers.parseUnits('1', 'gwei');
            ethers.parseUnits;
        } else if (chainId == 137) {
            gasParams.maxFeePerGas = ethers.parseUnits('3000', 'gwei');
            gasParams.gasLimit = 1000000;
        }
        console.log('these are gas params - ', gasParams);
        try {
            tx = await flintContract.swapWithoutFees(params, gasParams);
        } catch (error) {
            console.log('ERROR IN OUR CONTRACT', error);
        }
        const t3 = new Date().getTime();
        console.log(`time to publish txn - ${(t3 - t2) / 1000}`);

        console.log('THIS IS THE TX - ', tx);

        return Promise.resolve(tx);
    } catch (error) {
        console.error('SEND TX FAILED - ', error);
        // return Promise.reject(error);
    }
};

const getGasFees = async (chainId) => {
    let result;
    switch (chainId) {
        case 137:
            result = await axios.get(
                `https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice`
            );
            break;
        case 42161:
            result = await axios.get(
                `https://api.arbiscan.io/api?module=proxy&action=eth_gasPrice`
            );
            break;
    }
    ethers.to;
    return Number(result.data.result);
};

const approveTransaction = async (
    r,
    s,
    v,
    functionSignature,
    userAddress,
    approvalContractAddress,
    chainId
) => {
    try {
        const contractInstance = new Contract(
            approvalContractAddress,
            abi,
            chainId === 137 ? polygonRelayerSigner : arbRelayerSigner
        );

        let tx = await contractInstance.executeMetaTransaction(
            userAddress,
            functionSignature,
            r,
            s,
            v
        );

        return Promise.resolve(tx);
    } catch (error) {
        console.log('APPROVAL FAILED - ', error);
        // return Promise.reject(error);
    }
};

const permit = async (
    contractAddress,
    owner,
    spender,
    value,
    deadline,
    v,
    r,
    s,
    chainId
) => {
    try {
        const contractInstance = new Contract(
            contractAddress,
            permitAbi,
            chainId === 137 ? polygonRelayerSigner : arbRelayerSigner
        );

        let tx = await contractInstance.permit(
            owner,
            spender,
            value,
            deadline,
            v,
            r,
            s
        );

        return Promise.resolve(tx);
    } catch (error) {
        console.log('PERMIT FAILED - ', error);
        // return Promise.reject(error);
    }
};

const getNativeTokenAddress = (chainId) => {
    switch (chainId) {
        case 137:
            return '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
        case 42161:
            return '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';
    }
};

/**
 * 
 * ContractTransactionResponse {
  provider: DefenderRelayProvider {
    _isProvider: true,
    _events: [],
    _emitted: { block: -2 },
    disableCcipRead: false,
    formatter: Formatter { formats: [Object] },
    anyNetwork: false,
    _networkPromise: Promise { [Object] },
    _maxInternalBlockNumber: -1024,
    _lastBlockNumber: -2,
    _maxFilterBlockRange: 10,
    _pollingInterval: 4000,
    _fastQueryDate: 0,
    connection: { url: 'https://api.defender.openzeppelin.com/' },
    _nextId: 42,
    credentials: {
      apiKey: '4cNtKYYwGnhrEbG4bzUuBUBWZMFgz7of',
      apiSecret: 'Nz2YYHNBTttkXXRfjBagwxB5m5MUWt1R9WEa52JLDky4Q3cm6UhxqdJcVoUZ5uHS'
    },
    relayer: Relayer { relayer: [ApiRelayer] },
    _network: {
      name: 'matic',
      chainId: 137,
      ensAddress: null,
      _defaultProvider: [Function]
    }
  },
  blockNumber: null,
  blockHash: null,
  index: undefined,
  hash: '0xd36fb65243af5f8c392f4c2177eead0712613d67e54f198b534568528a26cd2d',
  type: undefined,
  to: '0xae294F66775eDd9C81f4540eAdA41Bc1E4eE22AD',
  from: '0x391a0be61342bf8e7e9d8238121faad61d62f829',
  nonce: 4074,
  gasLimit: BigNumber { _hex: '0x037686', _isBigNumber: true },
  gasPrice: undefined,
  maxPriorityFeePerGas: BigNumber { _hex: '0x0df8c2d99f', _isBigNumber: true },
  maxFeePerGas: BigNumber { _hex: '0x01414ee4699f', _isBigNumber: true },
  data: '0x365d230b0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000c2132d05d31c914a87c6611c10748aeb04b58e8f00000000000000000000000000000000000000000000000000000000000f42400000000000000000000000002791bca1f2de4661ed88a30c99a7a9449aa8417400000000000000000000000000000000000000000000000000000000000f1b15000000000000000000000000f1f73c677dbfff4147e57c2db22997998d282138000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000160c6a7bfe6712f1f85f0bc627513c2aabeb3fcf2653122a6d9a456edcc353fabce02241fd1cf6986a6c47e617b846eda953493067df7fa5e79b377f6fe096f59eb000000000000000000000000000000000000000000000000000000000000001b000000000000000000000000000000000000000000000000000000000000007403014b1f1e2435a9c96f7330faea190ef6a7c8d7000100000000000000000000000000000000000000000000000000000000000f42400a4b1f1e2435a9c96f7330faea190ef6a7c8d70001c2132d05d31c914a87c6611c10748aeb04b58e8f00f1f73c677dbfff4147e57c2db22997998d282138000000000000000000000000',
  value: BigNumber { _hex: '0x00', _isBigNumber: true },
  chainId: 137,
  signature: undefined,
  accessList: null
}
 */

const swapSushi = async (params) => {
    try {
        const contract = new Contract(
            '0xae294F66775eDd9C81f4540eAdA41Bc1E4eE22AD',
            sushiSwapAbi,
            polygonRelayerSigner
        );
    
        const tx = await contract.swapGaslessSushiSwapFlint(params);
    
        console.log(tx, 'Transaction response');

        const txHash = tx.hash;

        return Promise.resolve(txHash);
    } catch (error) {
        console.log(error, 'Error in swapSushi');
        return Promise.reject(error);
    }
    
}

const getRoute = async (tokenIn, tokenOut, amountOut, chainId) => {
    console.log('getting route');
    let response = await axios.get(
        `https://api.uniswap.org/v1/quote?protocols=v2%2Cv3%2Cmixed&tokenInAddress=${tokenIn}&tokenInChainId=${chainId}&tokenOutAddress=${tokenOut}&tokenOutChainId=${chainId}&amount=${amountOut}&type=exactOut`,
        {
            headers: {
                origin: 'https://app.uniswap.org',
            },
        }
    );
    console.log('got route');

    let toMaticPath = [];
    let toMaticFees = [];
    response.data.route[0].map((obj) => {
        toMaticPath.push(obj.tokenIn.address);
        toMaticFees.push(obj.fee);
    });
    toMaticPath.push(tokenOut);
    console.log('returning result');
    return [toMaticPath, toMaticFees];
};

module.exports = {
    sendTxn,
    approveTransaction,
    permit,
    swapSushi
};
