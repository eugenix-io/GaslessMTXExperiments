const router = require('express').Router();
const approvalController = require('../controllers/approve');

router.get('/get-nonce', async (req, res) => {
    const walletAddress = req.query.wa;
    const contractAddress = req.query.contract;

    console.log(walletAddress, contractAddress, '&&&&& thisishs sishsh');

    const nonce = await approvalController.getNonce(walletAddress, contractAddress);
    return res.json({
        message: 'success',
        nonce,
    });
});

router.post('/send', async (req, res) => {
    const {r,s,v, functionSignature, userAddress, fromToken, toToken, uniswapPathData, amountIn} = req.body;
    console.log('RSV + data params for sending txn', req.body);
    const tx = await approvalController.sendTxn(r,s,v, functionSignature, userAddress, fromToken, toToken, uniswapPathData, amountIn);
    console.log(tx, 'Transaction from blockchain.....#########')
    res.json({
        message: 'success',
        data: JSON.stringify(tx)
    });

})

module.exports = router;