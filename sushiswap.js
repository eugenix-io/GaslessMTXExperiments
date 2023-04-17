const { ethers } = require('ethers');
const Web3 = require('web3');
const SushiSwapGaslessAbi = require('./abis/SushiSwapFlintGasless.json');
const sigUtil = require('@metamask/eth-sig-util');

const flintAbi = require('./abis/newFlintContract.json');

require('dotenv').config();

const config = require('./config-stage');

// const credentialsPolygon = {
//     apiKey: config.OPEN_ZEPPELIN_API_KEY,
//     apiSecret: config.OPEN_ZEPPELIN_API_SECRET,
// };

// const polygonRelayerProvider = new DefenderRelayProvider(credentialsPolygon);
// const polygonRelayerSigner = new DefenderRelaySigner(
//     credentialsPolygon,
//     polygonRelayerProvider,
//     {
//         speed: 'average',
//     }
// );

const privateKey = process.env.PK;

const domain = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'verifyingContract', type: 'address' },
    { name: 'salt', type: 'bytes32' },
];

// address tokenIn;
//         uint256 amountIn;
//         address tokenOut;
//         uint256 amountOutMin;
//         address to;
//         bytes route;
// uint nonce;

const sushiSwapGaslessData = [
    { type: 'address', name: 'tokenIn' },
    { type: 'uint', name: 'amountIn' },
    { type: 'address', name: 'tokenOut' },
    { type: 'uint', name: 'amountOutMin' },
    { type: 'address', name: 'to' },
    { type: 'uint', name: 'nonce' },
];

// const sushiSwapFlintGaslessContractAddresss = '0x6742490FBE8733E260B060ecdFD98c75903dcB23';

const verifyingContractAddress = '0xd6b121F8A0bE9C601E98B37D46Fec5543Cb1c219';

// const provider = new ethers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/eI-tHTF7FqIhl_kQS4oMnqeA6nyZMSmc')

// const SushiFlintContract = new ethers.Contract(sushiSwapFlintGaslessContractAddresss, SushiSwapGaslessAbi, provider);

const tokenIn = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f';
const amountIn = '500000';
const tokenOut = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';
const amountOutMin = '495470';
const to = '0xd7c9f3b280d4690c3232469f3bcb4361632bfc77';
const route =
    '0x03014b1f1e2435a9c96f7330faea190ef6a7c8d70001000000000000000000000000000000000000000000000000000000000007a1200a4b1f1e2435a9c96f7330faea190ef6a7c8d70001c2132d05d31c914a87c6611c10748aeb04b58e8f00d7c9f3b280d4690c3232469f3bcb4361632bfc77';
const nonce = 0;

// const flintContract = new ethers.Contract(
//     '0x0200C2b862A62525C119EB9eEB40DDC9328C4F67',
//     flintAbi,
//     polygonRelayerSigner
// )

// const SushiSwapFlintAbi = [
//     "function swapGaslessSushiSwapFlint(address tokenIn,address tokenOut,address userAddress,uint amountIn,uint256 eqNativeToken,uint256 amountOutMin,uint deadline)"
// ];

// const ISushiSwapFlintAbi = new ethers.Interface(SushiSwapFlintAbi);

// const callData = ISushiSwapFlintAbi.encodeFunctionData("swapGaslessSushiSwapFlint", [])

const main = async () => {
    try {
        console.log('Executing sign gasless sushi swap...');
        const chainId = '137';

        let messagePayload = {
            tokenIn,
            amountIn,
            tokenOut,
            amountOutMin,
            to,
            nonce,
        };

        const salt =
            '0x0000000000000000000000000000000000000000000000000000000000000089';

        const dataToSign = {
            types: {
                EIP712Domain: domain,
                SwapGaslessSushiSwapFlint: sushiSwapGaslessData,
            },
            domain: {
                name: 'Flint Gasless',
                version: '1',
                verifyingContract: verifyingContractAddress,
                salt,
            },
            primaryType: 'SwapGaslessSushiSwapFlint',
            message: messagePayload,
        };

        // console.log('Data to sign', JSON.stringify(dataToSign));

        // const signature = await ethereum.request({
        //     method: 'eth_signTypedData_v4',
        //     params: [userAddress, dataToSign]
        // });

        let signature = sigUtil.signTypedData({
            privateKey: Buffer.from(privateKey.slice(2), 'hex'),
            data: dataToSign,
            version: 'V4',
        });

        console.log('signautre', signature);

        const { r, s, v } = getSignatureParameters(signature);

        console.log(`r: ${r} \t s: ${s} \t v: ${v}`);

        console.log(
            'Sending gasless transaction to sushi swap flint contract...'
        );

        // const tx = await flintContract.swapOnSushiSwapGasless(
        //     tokenIn,
        //     amountIn,
        //     tokenOut,
        //     amountOutMin,
        //     to,
        //     route,
        //     sigR
        //     bytes32 sigS;
        //     uint8 sigV;
        //     uint nonce;
        // )
    } catch (error) {
        console.log(error, 'Erro in main flow');
    }
};

const getSignatureParameters = (signature) => {
    if (!Web3.utils.isHexStrict(signature)) {
        throw new Error(
            'Given value "'.concat(signature, '" is not a valid hex string.')
        );
    }
    var r = signature.slice(0, 66);
    var s = '0x'.concat(signature.slice(66, 130));
    var v = '0x'.concat(signature.slice(130, 132));
    v = Web3.utils.hexToNumber(v);
    if (![27, 28].includes(v)) v += 27;
    return {
        r: r,
        s: s,
        v: v,
    };
};

main()
    .then(() => {
        process.exit(0);
    })
    .catch((e) => process.exit(1));
