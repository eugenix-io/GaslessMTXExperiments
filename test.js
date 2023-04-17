const ethers = require('ethers');

async function contractMeta() {
    let GASLESS_SUSHISWAP_FLINT_TYPEHASH = ethers.solidityPackedKeccak256(
        ['string'],
        [
            'SwapGaslessSushiSwapFlint(address tokenIn,uint amountIn,address tokenOut,uint amountOutMin,address to, uint nonce)',
        ]
    );
    let abiCode = new ethers.AbiCoder();
    let values = [
        GASLESS_SUSHISWAP_FLINT_TYPEHASH,
        '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        500000,
        '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
        495470,
        '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        0,
    ];
    let types = [
        'bytes32',
        'address',
        'uint',
        'address',
        'uint',
        'address',
        'uint',
    ];
    let abiEncoded = abiCode.encode(types, values);
    console.log(abiEncoded);
}

async function main() {
    let EIP712_DOMAIN_TYPEHASH = ethers.solidityPackedKeccak256(
        ['string'],
        [
            'EIP712Domain(string name,string version,address verifyingContract,bytes32 salt)',
        ]
    );
    let abiCode = new ethers.AbiCoder();
    let values = [
        EIP712_DOMAIN_TYPEHASH,
        ethers.solidityPackedKeccak256(['string'], ['Flint Gasless']),
        ethers.solidityPackedKeccak256(['string'], ['1']),
        '0x0d6e43d4d7944408d9a5A10BC57B4348d61cD764',
        '0x0000000000000000000000000000000000000000000000000000000000000089',
    ];
    let types = ['bytes32', 'bytes32', 'bytes32', 'address', 'bytes32'];
    let abiEncoded = abiCode.encode(types, values);
    console.log(ethers.solidityPackedKeccak256(['bytes'], [abiEncoded]));
}

main();
