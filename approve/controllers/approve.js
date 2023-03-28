let abi = require('../../abis/USDT.json');
let permitAbi = require('../../abis/ARB.json');
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

const credentialsPolygon = {
    apiKey: config.OPEN_ZEPPELIN_API_KEY,
    apiSecret: config.OPEN_ZEPPELIN_API_SECRET,
};

const credentialsArbitrum = {
    apiKey: config.ARB_RELAYER_API_KEY,
    apiSecret: config.ARB_RELAYER_SECRET_KEY,
};

const polygonRelayerProvider = new DefenderRelayProvider(credentialsPolygon);
const polygonRelayerSigner = new DefenderRelaySigner(
    credentialsPolygon,
    polygonRelayerProvider,
    {
        speed: 'average',
    }
);

const arbRelayerProvider = new DefenderRelayProvider(credentialsArbitrum);
const arbRelayerSigner = new DefenderRelaySigner(
    credentialsArbitrum,
    arbRelayerProvider,
    {
        speed: 'average',
    }
);

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
    try {
        console.log('INSIDE THE SEND TXN FUNCTION!');

        console.log('THIS IS THE FLINT ADDRESS - ', flintContractAddress);
        let isNewContract = isTokenOutNative != undefined ? true : false;
        let flintContractAbi;
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
        flintContractAbi = FlintContractAbi;
        let flintContract = new Contract(
            flintContractAddress,
            flintContractAbi,
            chainId === 137 ? polygonRelayerSigner : arbRelayerSigner
        );

        const t1 = new Date().getTime();
        let [toMaticPath, toMaticFees] = await getRoute(
            tokenIn,
            getNativeTokenAddress(chainId),
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
            sigR: r,
            sigS: s,
            sigV: v,
        };

        if (isTokenOutMatic == undefined) {
            params.toNativePath = toMaticPath.reverse();
            params.toNativeFees = toMaticFees.reverse();
            params.isTokenOutNative = isTokenOutNative;
        } else {
            params.toMaticPath = toMaticPath.reverse();
            params.toMaticFees = toMaticFees.reverse();
            params.isTokenOutMatic = isTokenOutMatic;
        }

        console.log('THESE ARE THE PARAMS - ', params);
        // console.log(wallet.address);
        let tx = await flintContract.swapWithoutFees(params, {
            gasLimit: 1000000,
            maxFeePerGas: ethers.parseUnits('3000', 'gwei'),
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

const getRoute = async (tokenIn, tokenOut, amountOut) => {
    console.log('getting route');
    let response = await axios.get(
        `https://api.uniswap.org/v1/quote?protocols=v2%2Cv3%2Cmixed&tokenInAddress=${tokenIn}&tokenInChainId=137&tokenOutAddress=${tokenOut}&tokenOutChainId=137&amount=${amountOut}&type=exactOut`,
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
};
