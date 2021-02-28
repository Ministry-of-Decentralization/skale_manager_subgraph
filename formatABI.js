const fs = require("fs")

function getABI (path) {
  const abi = require(path)
  return abi
}

function capitalizeFirst (toCap) {
  return toCap[0].toUpperCase() + toCap.slice(1)
}

function snakeToCap (snake) {
  return snake.split('_')
    .map(capitalizeFirst)
    .join('')
}

function writeSingleABI (network, abiType, abis) {
  const abiKey = `${abiType}_abi`
  const addressKey = `${abiType}_address`
  const abi = {
    name: snakeToCap(abiType),
    address: abis[addressKey],
    abi: abis[abiKey]
  }

  fs.writeFile(
    `abis/${network}/${snakeToCap(abiType)}.json`,
    JSON.stringify(abi, null, 2),
    err => { 
     
    // Checking for errors 
      if (err) throw err;  
   
      console.log(`Done writing ${snakeToCap(abiType)}`) 
    }
  )
}

function index () {
  const abi = getABI(process.argv[2])
  const abiKeys = Object.keys(abi)
  const abiTypes = abiKeys.filter(k => /_abi$/.test(k))
    .map(k => k.replace('_abi', '') )
  console.log(abiTypes)

  abiTypes.forEach(abiType => writeSingleABI(process.argv[3], abiType, abi ))
}

index()
