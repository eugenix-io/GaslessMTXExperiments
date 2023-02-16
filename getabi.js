const axios = require('axios');
const contract_address = "0x8E001FEB0B1971C465204098997634791Cbe7E24";
const fs = require('fs')

const callback = (resp) => {
  console.log(resp, 'resp');
}


// Get ABI for any contract
async function getAbiForContract(contractAddress) {
  try {
    const abiResp = await axios.get(`https://api.polygonscan.com/api?module=contract&action=getabi&address=${contractAddress}`);
    const abi = JSON.parse(abiResp.data.result);
    await fs.writeFileSync('./abis/FlintContract.json', JSON.stringify(abi), callback);
  } catch (error) {
   console.log(error, 'error in getAbi'); 
  }
}

getAbiForContract(contract_address);