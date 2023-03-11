const router = require('express').Router();
const approvalController = require('../controllers/approve');
const config = require('../../config');

router.get('/get-nonce', async (req, res) => {
    const walletAddress = req.query.wa;
    const contractAddress = req.query.contract;

    console.log(walletAddress, contractAddress, '&&&&& thisishs sishsh');

    const nonce = await approvalController.getNonce(
        walletAddress,
        contractAddress
    );
    return res.json({
        message: 'success',
        nonce,
    });
});

router.post('/send', async (req, res) => {
    console.log('RSV + data params for sending txn', req.body);
    const tx = await approvalController.sendTxn(req.body);
    console.log(tx, 'Transaction from blockchain.....#########');
    res.json({
        message: 'success',
        data: JSON.stringify(tx),
    });
});

router.post('/approve', async (req, res) => {
    const { r, s, v, functionSignature, userAddress, approvalContractAddress } =
        req.body;
    console.log('RSV + data params for Approving txn', req.body);

    const tx = await approvalController.approveTranasaction(
        r,
        s,
        v,
        functionSignature,
        userAddress,
        approvalContractAddress
    );
    console.log(tx, 'Transaction for approval response');

    res.json({
        message: 'success',
        data: JSON.stringify(tx),
    });
});

router.get('/get-gasless-address', async (req, res) => {
    res.json({
        message: 'success',
        address: config.GASLESS_CONTRACT_ADDRESS,
    });
});

router.get('/get-allowance', async (req, res) => {
    const walletAddress = req.query.wa;
    const tokenAddress = req.query.ta;

    console.log({ walletAddress, tokenAddress }, 'Query...');

    const resp = await approvalController.getAllowance(
        tokenAddress,
        walletAddress
    );

    res.json({
        message: 'success',
        allowance: parseInt(resp),
    });
});

router.get('/instructions', (req, res) => {
    res.status(200).send([
        `1. Go to <a href="https://app.uniswap.org/#/swap" target="_blank">Uniswap</a>`,
        '2. Switch to the Polygon network. The beta version only works on Polygon.',
        '3. Choose your "from" and "to" token on Uniswap. Make sure you are swapping at least $0.25 worth of the "from" token or your transaction might fail.',
        '4. Select your from token as the gas token in the option',
        '5. If you are asked to approve the token, click on the button and sign the message on Metamask. This will approve your token for the swap without you needing to pay any MATIC',
        '6. Now click on Swap and confirm. You will need to sign the message on Metamask. Once again, no MATIC will be deducted from your wallet.',
        "7. Congratulations! You've successfully swapped on Uniswap by paying gas fees in an ERC20 token.",
    ]);
});

router.get('/v2/instructions', (req, res) => {
    res.status(200).send([
        {
            asset: 'https://dnj9s9rkg1f49.cloudfront.net/first_step.webm',
            title: 'Go to Uniswap ',
            text: 'Select Polygon as the network. The GasPay Beta only supports Polygon network',
        },
        {
            asset: 'https://dnj9s9rkg1f49.cloudfront.net/token.webm',
            title: 'Select the swap tokens ',
            text: 'Select the swap tokens and ensure you are swapping at least $0.25 worth of tokens ',
        },
        {
            asset: 'https://dnj9s9rkg1f49.cloudfront.net/approve.webm',
            title: 'Select your gas fees token',
            text: "Gaspay allows you to pay gas in the 'from' token or the native token (MATIC)",
        },
        {
            asset: 'https://dnj9s9rkg1f49.cloudfront.net/approve.webm',
            title: 'Approve the swap',
            text: 'Approve the token by signing the message on Metamask gaslessly',
        },
        {
            asset: 'https://dnj9s9rkg1f49.cloudfront.net/swap_initiate.webm',
            title: 'Confirm the swap',
            text: 'Sign the message to confirm the swap and deduct fees in the selected token.',
        },
        {
            asset: 'https://dnj9s9rkg1f49.cloudfront.net/swap_confirm.webm',
            title: 'Congratulations 🎉',
            text: "You've successfully swapped on Uniswap, paying gas fees in your desired token",
        },
    ]);
});

module.exports = router;
