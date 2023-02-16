const router = require('express').Router();
const approvalController = require('../controllers/approve');

router.get('/get-nonce', async (req, res) => {
    const walletAddress = req.query.wa;
    const nonce = await approvalController.getNonce(walletAddress);
    return res.json({
        message: 'success',
        nonce,
    });
});

router.post('/send', async (req, res) => {
    const {r,s,v, functionSignature, userAddress} = req.body;
    console.log('RSV params for txn', req.body);
    const tx = await approvalController.sendTxn(r,s,v, functionSignature, userAddress);
    console.log(tx, 'Transaction from blockchain.....#########')
    res.json({
        message: 'success',
        data: JSON.stringify(tx)
    });

})

module.exports = router;