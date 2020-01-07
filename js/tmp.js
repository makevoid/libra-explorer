const { sign } = require("tweetnacl")
const { libra } = require("gopherjs-libra")

const intArrToStr = (uintArray) => (
  Buffer.from(uintArray).toString('hex')
)
//
// const keyPair = sign.keyPair()
// const pvtKey  = keyPair.secretKey
// const pubKey  = keyPair.publicKey
// const address = libra.pubkeyToAddress(keyPair.publicKey)
//
// console.log("private key:", intArrToStr(pvtKey)) // SECRET! don't console log on production
// console.log("pub key:", intArrToStr(pubKey))
// console.log("address:", intArrToStr(address))

const defaultServer = "http://hk2.wutj.info:38080"
const lib = libra.client(defaultServer, libra.trustedPeersFile)

const txRangeStart = 9300000

const logChainInfo = async () => {
  const info = await lib.queryLedgerInfo()
  // console.log(info)
  const blockHash = await info.getTransactionAccumulatorHash()
  const epochNum = await info.getTimestampUsec()
  const timestamp = new Date(epochNum / 1000)
  console.log("ledger tip:")
  console.log('- "block" ID:', intArrToStr(blockHash))
  console.log("- timestamp:", timestamp)
}

;(async () => {


  await logChainInfo()
  await logChainInfo()


  return

  let txRange
  try {
    txRange = await lib.queryTransactionRange(txRangeStart, 2, true)
  } catch (err) {
    console.error("ERROR:", err)
  }
  if (!txRange) return

  const txs = txRange.getTransactions()
  txs.map(txn => {
    console.log(">>>", txn)
    console.log(">>>", txn.getMajorStatus())
    console.log("Txn #", txn.getVersion())
    console.log("    Gas used (microLibra): ", txn.getGasUsed())
    console.log("    Major status: ", txn.getMajorStatus())
  })
})()
