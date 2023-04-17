const { ethers } = require('ethers');
require('dotenv').config();
const {
    DefenderRelaySigner,
    DefenderRelayProvider,
} = require('defender-relay-client/lib/ethers');
const abi = require('./abis/usdtPolygonAbi.json');

const pk = process.env.PK;

const provider = new ethers.JsonRpcProvider(
    'https://blissful-orbital-darkness.matic.discover.quiknode.pro/fb6baf546bf183ffad25096328d0213e70f7ca6e/'
);

const signer = new ethers.Wallet(pk, provider);

const config = require('./config-stage');

const credentialsPolygon = {
    apiKey: config.OPEN_ZEPPELIN_API_KEY,
    apiSecret: config.OPEN_ZEPPELIN_API_SECRET,
};

const polygonRelayerProvider = new DefenderRelayProvider(credentialsPolygon);
const polygonRelayerSigner = new DefenderRelaySigner(
    credentialsPolygon,
    polygonRelayerProvider,
    {
        speed: 'average',
    }
);

const usdtContract = new ethers.Contract(
    '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    abi,
    signer
);

const main = async () => {
    // const provider = new ethers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/eI-tHTF7FqIhl_kQS4oMnqeA6nyZMSmc');

    // const signer = new ethers.Wallet(process.env.PK, provider);

    // const options = {
    //     to: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    //     value: 0,
    //     data: callData
    // }

    // console.log(options, 'Options');

    const tx = await usdtContract.approve(
        '0xae294F66775eDd9C81f4540eAdA41Bc1E4eE22AD',
        '100000000',
        {
            gasLimit: '500000',
            gasPrice: ethers.parseUnits('200', 'gwei'),
        }
    );

    console.log(tx, 'Transxs');
};

main()
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.log(err, 'Error in main');
        process.exit(1);
    });
