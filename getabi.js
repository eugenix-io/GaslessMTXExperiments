const axios = require('axios');
const contract_address = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const fs = require('fs')

const callback = (resp) => {
  console.log(resp, 'resp');
}


// Get ABI for any contract
async function getAbiForContract(contractAddress) {
  try {
    const abiResp = await axios.get(`https://api.polygonscan.com/api?module=contract&action=getabi&address=${contractAddress}`);
    const abi = JSON.parse(abiResp.data.result);
    await fs.writeFileSync('./abis/WETH.json', JSON.stringify(abi), callback);
  } catch (error) {
   console.log(error, 'error in getAbi'); 
  }
}

getAbiForContract(contract_address);