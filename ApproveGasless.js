const { ethers, Contract } = require('ethers');
require('dotenv').config();
const web3 = require('web3')
const sigUtil = require("@metamask/eth-sig-util");
const { DefenderRelaySigner, DefenderRelayProvider } = require('defender-relay-client/lib/ethers');

const domainType = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "verifyingContract", type: "address" },
    { name: "salt", type: "bytes32" }
];

const metaTransactionType = [
    { name: "nonce", type: "uint256" },
    { name: "from", type: "address" },
    { name: "functionSignature", type: "bytes" }
];

const domainData = {
    name: "Tether USD",
    version: "1",
    verifyingContract: "0x7FFB3d637014488b63fb9858E279385685AFc1e2",
    salt: "0x0000000000000000000000000000000000000000000000000000000000000089",
};

async function main() {
    let abi = require('./abis/USDT.json');

    // let provider = new ethers.JsonRpcProvider('https://rpc-mainnet.maticvigil.com/v1/07dd2bc161d12dd58aedb7d215054996d540c4b0');
    // let provider = new ethers.JsonRpcProvider('https://thrilling-greatest-mansion.matic.discover.quiknode.pro/548cad00b00a5d861e033495255165a017febce0/');

    // let privateKeyRelayer = '<PRIVATE_KEY_RELAYER>';
    // let signerRelayer = new ethers.Wallet(privateKeyRelayer, provider);

    const credentials = {apiKey: process.env.OPEN_ZEPPELIN_API_KEY, apiSecret: process.env.OPEN_ZEPPELIN_API_SECRET};

    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, { speed: 'fast'});

    let contractAddress = '0x7FFB3d637014488b63fb9858E279385685AFc1e2';
    const contract = new ethers.Contract(contractAddress, abi, signer);

    // let contract = new Contract(contractAddress, abi, provider);

    let functionSignature = generateFunctionSignature(abi);

    console.log(functionSignature, 'Function signature...');

    executeMetaTransaction(functionSignature, contract, domainData);

}

const executeMetaTransaction = async (
    functionSignature,
    contract,
    domainData
) => {
    // Owner's wallet that has to approve gaslessly with signature
    let privateKey = process.env.OWNER_PRIVATE_KEY;
    let wallet = new ethers.Wallet(privateKey);

    console.log(contract, 'Contactt tttres');

    let nonce = await contract.getNonce(wallet.address);
    let userAddress = wallet.address;

    console.log(userAddress, 'userAddress in this...');

    let message = {
        nonce: parseInt(nonce),
        from: userAddress,
        functionSignature: functionSignature
    };

    const dataToSign = {
        types: {
            EIP712Domain: domainType,
            MetaTransaction: metaTransactionType,
        },
        domain: domainData,
        primaryType: "MetaTransaction",
        message: message,
    };

    let signature = sigUtil.signTypedData({
        privateKey: Buffer.from(privateKey.slice(2), "hex"),
        data: dataToSign,
        version: "V4",
        primaryType: "MetaTransaction"
    })
    let { r, s, v } = getSignatureParameters(signature);

    // logging output
    console.log("Domain Data", domainData);
    console.log("Message", message);
    console.log("Sign params", getSignatureParameters(signature));
    console.log("Signature", signature);


    const recovered = sigUtil.recoverTypedSignature({
        data: dataToSign,
        signature: signature,
        version: "V4"
    });
    console.log(`Recovered ${recovered}`);

    let tx = await contract.executeMetaTransaction(
        userAddress,
        functionSignature,
        r,
        s,
        v,
        {
            gasLimit: 200000,
            gasPrice: ethers.parseUnits('1000', 'gwei')
        }
    );
    console.log(tx, 'Transaction in this');
};

const getSignatureParameters = (signature) => {
    if (!web3.utils.isHexStrict(signature)) {
        throw new Error(
            'Given value "'.concat(signature, '" is not a valid hex string.')
        );
    }
    var r = signature.slice(0, 66);
    var s = "0x".concat(signature.slice(66, 130));
    var v = "0x".concat(signature.slice(130, 132));
    v = web3.utils.hexToNumber(v);
    if (![27, 28].includes(v)) v += 27;
    return {
        r: r,
        s: s,
        v: v,
    };
};

const generateFunctionSignature = (abi) => {
    let iface = new ethers.Interface(abi);
    // Approve amount for spender 1 matic
    return iface.encodeFunctionData("approve", [process.env.RELAYER_PUBLIC_ADDRESS, 1]);
}

main();