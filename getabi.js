const axios = require('axios');
const contract_address = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
const fs = require('fs')

const callback = (resp) => {
  console.log(resp, 'resp');
}


// Get ABI for any contract
async function getAbiForContract(contractAddress) {
  try {
    const abiResp = await axios.get(`https://api.polygonscan.com/api?module=contract&action=getabi&address=${contractAddress}`);
    const abi = JSON.parse(abiResp.data.result);
    await fs.writeFileSync('./abis/USDT.json', JSON.stringify(abi), callback);
  } catch (error) {
   console.log(error, 'error in getAbi'); 
  }
}

getAbiForContract(contract_address);