const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors())
const bodyParser = require('body-parser');
// const { mainFunc } = require('./ApproveGasless');
app.use(bodyParser.json());
const approvalRouters = require('./approve/router/approveRouter');

app.use('/mtx', approvalRouters);

app.listen(5001, () => {
    console.log('Server listening on port 5001..')
})