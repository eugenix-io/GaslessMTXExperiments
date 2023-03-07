let abi = require('../../abis/USDT.json');
const Promise = require('bluebird');
const { ethers, Contract } = require('ethers');
const config = require('../../config');
const {
    DefenderRelaySigner,
    DefenderRelayProvider,
} = require('defender-relay-client/lib/ethers');
const {
    AlphaRouter,
    ChainId,
    SwapType,
    SwapOptionsSwapRouter02,
} = require('@uniswap/smart-order-router');
const {
    TradeType,
    CurrencyAmount,
    Percent,
    Token,
    SupportedChainId,
} = require('@uniswap/sdk-core');
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

        let gasFees = await axios.get(
            `https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice&apikey=${config.POLYGON_SCAN_API_KEY}`
        );

        let tokenContract = new Contract(
            tokenIn,
            require('../../abis/USDT.json'),
            signer
        );

        let [decimals, symbol, name, uniswapGas] = await Promise.all([
            tokenContract.decimals(),
            tokenContract.symbol(),
            tokenContract.name(),
            flintContract.gasForSwap(),
        ]);

        console.log('GOT THE VALUES', decimals, symbol, name, uniswapGas);
        let [toMaticPath, toMaticFees] = await getRoute(
            ethers.toBigInt(Number(gasFees.data.result)) *
                ethers.toBigInt(uniswapGas),
            new Token(
                SupportedChainId.POLYGON,
                tokenIn,
                Number(decimals),
                symbol,
                name
            ),
            new Token(
                SupportedChainId.POLYGON,
                '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', //WMATIC
                18,
                'WMATIC',
                'Wrapped Matic'
            ),
            provider
        );

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

async function getRoute(amountOut, tokenIn, tokenOut, provider) {
    console.log('INSIDE GET ROUTE!!');
    const router = new AlphaRouter({
        chainId: ChainId.POLYGON,
        provider: provider,
    });

    const options = {
        recipient: config.GASLESS_CONTRACT_ADDRESS,
        slippageTolerance: new Percent(5, 100),
        deadline: Math.floor(Date.now() / 1000 + 1800),
        type: SwapType.SWAP_ROUTER_02,
    };

    const route = await router.route(
        CurrencyAmount.fromRawAmount(tokenOut, String(amountOut)),
        tokenIn,
        TradeType.EXACT_OUTPUT,
        options
    );

    let tokenPath = route.route[0].route.tokenPath.map((path) => path.address);
    let feePath = route.route[0].route.pools.map((pool) => pool.fee);
    console.log('THIS IS TOKEN PATH - ', tokenPath, ' fee path - ', feePath);
    return [tokenPath, feePath];
}

module.exports = { getNonce, sendTxn, approveTranasaction, getAllowance };
