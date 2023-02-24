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
    console.log('RSV + data params for sending txn', req.body);
    const tx = await approvalController.sendTxn(req.body);
    console.log(tx, 'Transaction from blockchain.....#########')
    res.json({
        message: 'success',
        data: JSON.stringify(tx)
    });

});

router.post('/approve', async (req, res) => {
    const { r, s, v, functionSignature, userAddress, approvalContractAddress } = req.body;
    console.log('RSV + data params for Approving txn', req.body);

    const tx = await approvalController.approveTranasaction(r, s, v, functionSignature, userAddress, approvalContractAddress);
    console.log(tx, 'Transaction for approval response');

    res.json({
        message: 'success',
        data: JSON.stringify(tx)
    })
});

router.get('/get-allowance', async (req, res) => {
    const walletAddress = req.query.wa;
    const tokenAddress = req.query.ta;

    console.log({ walletAddress, tokenAddress }, 'Query...');

    const resp = await approvalController.getAllowance(tokenAddress, walletAddress);

    res.json({
        message: 'success',
        allowance: parseInt(resp)
    });
})

module.exports = router;