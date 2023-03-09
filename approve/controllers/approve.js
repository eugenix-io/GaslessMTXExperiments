let abi = require('../../abis/USDT.json');
const Promise = require('bluebird');
const { ethers, Contract } = require('ethers');
const config = require('../../config');
const {
    DefenderRelaySigner,
    DefenderRelayProvider,
} = require('defender-relay-client/lib/ethers');
const axios = require('axios');

const FlintContractAbi = require('../../abis/FlintContract.json');
const FlintContractAbiOld = require('../../abis/FlintContractOld.json');
let flintContractAddress = config.GASLESS_CONTRACT_ADDRESS;

const getNonce = async (walletAddress, contractAddress) => {
    try {
        console.log(walletAddress, contractAddress, 'Nicnenccec $$$$');
        const credentials = {
            apiKey: config.OPEN_ZEPPELIN_API_KEY,
            apiSecret: config.OPEN_ZEPPELIN_API_SECRET,
        };
        const provider = new DefenderRelayProvider(credentials);
        const signer = new DefenderRelaySigner(credentials, provider, {
            speed: 'fast',
        });

        // let contractAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
        const contract = new ethers.Contract(contractAddress, abi, signer);

        let nonce = await contract.getNonce(walletAddress);

        console.log(parseInt(nonce), 'Nocne');

        return Promise.resolve(parseInt(nonce));
    } catch (error) {
        return Promise.reject(error);
    }
};

const getAllowance = async (tokenAddress, walletAddress) => {
    try {
        console.log(walletAddress, tokenAddress, 'getAllowance $$$$');
        const owner = walletAddress,
            spender = flintContractAddress;
        const credentials = {
            apiKey: config.OPEN_ZEPPELIN_API_KEY,
            apiSecret: config.OPEN_ZEPPELIN_API_SECRET,
        };

        const provider = new DefenderRelayProvider(credentials);
        const signer = new DefenderRelaySigner(credentials, provider, {
            speed: 'fast',
        });

        // let contractAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
        const contract = new ethers.Contract(tokenAddress, abi, provider);

        let allowance = await contract.allowance(owner, spender);

        console.log(parseInt(allowance), 'Allowance for user');

        return Promise.resolve(parseInt(allowance));
    } catch (error) {
        return Promise.reject(error);
    }
};

const sendTxn = async ({
    amountIn,
    tokenIn,
    tokenOut,
    userAddress,
    path,
    fees,
    nonce,
    isTokenOutMatic,
    r,
    s,
    v,
}) => {
    try {
        console.log('INSIDE THE SEND TXN FUNCTION!');
        const credentials = {
            apiKey: config.OPEN_ZEPPELIN_API_KEY,
            apiSecret: config.OPEN_ZEPPELIN_API_SECRET,
        };
        const provider = new DefenderRelayProvider(credentials);
        const signer = new DefenderRelaySigner(credentials, provider, {
            speed: 'average',
        });

        console.log('THIS IS THE FLINT ADDRESS - ', flintContractAddress);
        let flintContractAbi;
        flintContractAddress = config.GASLESS_CONTRACT_ADDRESS;
        flintContractAbi = FlintContractAbi;
        let flintContract = new Contract(
            flintContractAddress,
            flintContractAbi,
            signer
        );

        const t1 = new Date().getTime();
        let [toMaticPath, toMaticFees] = await getRoute(
            tokenIn,
            ethers.parseUnits('1000', 'gwei') * ethers.toBigInt(130000)
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
            isTokenOutMatic,
            sigR: r,
            sigS: s,
            sigV: v,
            toMaticPath: toMaticPath.reverse(),
            toMaticFees: toMaticFees.reverse(),
        };

        console.log('THESE ARE THE PARAMS - ', params);
        // console.log(wallet.address);
        let tx = await flintContract.swapWithoutFees(params, {
            gasLimit: 1000000,
            maxFeePerGas: ethers.parseUnits('1000', 'gwei'),
        });
        const t3 = new Date().getTime();
        console.log(`time to publish txn - ${(t3 - t2) / 1000}`);

        console.log('THIS IS THE TX - ', tx);

        return Promise.resolve(tx);
    } catch (error) {
        console.error('SEND TX FAILED - ', error);
        // return Promise.reject(error);
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
            speed: 'average',
        });

        const contractInstance = new Contract(
            approvalContractAddress,
            abi,
            signer
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

const getRoute = async (tokenIn, amountOut) => {
    console.log('getting route');
    const WMATIC = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
    let response = await axios.get(
        `https://api.uniswap.org/v1/quote?protocols=v2%2Cv3%2Cmixed&tokenInAddress=${tokenIn}&tokenInChainId=137&tokenOutAddress=${WMATIC}&tokenOutChainId=137&amount=${amountOut}&type=exactOut`,
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
    toMaticPath.push(WMATIC);
    console.log('returning result');
    return [toMaticPath, toMaticFees];
};

module.exports = { getNonce, sendTxn, approveTranasaction, getAllowance };
