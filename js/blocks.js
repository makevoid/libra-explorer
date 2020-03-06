const { sign } = require("tweetnacl")
const { libra } = require("gopherjs-libra")

const intArrToStr = (uintArray) => (
  uintArray.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')
)

const strToIntArr = hexString => (
  new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
)

const extractProgramNameLabel = (programName) => {
  switch (programName) {
    case "peer_to_peer_transfer": return "transfer";
    case "create_account": return "create account";
    case "mint": return "mint";
    case "rotate_authentication_key": return "rotate key";
  }
  return "unknown";
}

// const defaultHost = require('./config').defaultHost

const waypoint = "0:bf7e1eef81af68cc6b4801c3739da6029c778a72e67118a8adf0dd759f188908"

const defaultHost = "http://hk2.wutj.info:38080"
const lib = libra.client(defaultHost, waypoint)

const txRangeStart = 10701329

const logChainInfo = async () => {
  const info = await lib.queryLedgerInfo()
  // console.log(info)
  const txAccumHash = await info.getTransactionAccumulatorHash()
  const epochNum = await info.getTimestampUsec()
  const timestamp = new Date(epochNum / 1000)
  console.log("Ledger tip:")
  console.log('- tx accumulator ID:', intArrToStr(txAccumHash))
  console.log("- timestamp:", timestamp)
}

;(async () => {
  // chain info
  await logChainInfo()
  console.log("\n")

  // query "blocks" (transaction accumulator) / transactions
  let txRange
  try {
    txRange = await lib.queryTransactionRange(txRangeStart, 2, true)
  } catch (err) {
    console.error("ERROR:", err)
  }
  if (!txRange) return

  const txs = txRange.getTransactions()
  txs.forEach(txn => {
    let signedTx = txn.getSignedTxn()
    console.log(signedTx)
    if (!signedTx) return
    signedTx = signedTx.RawTxn
    const gasUsed = txn.getGasUsed()

    // if (signedTx.Payload) {
    const amount = signedTx.Payload.Args[1] / 1000000.0
    const programName = libra.inferProgramName(signedTx.Payload.Code);
    const programNameLabel = extractProgramNameLabel(programName)
    const receiver = signedTx.Payload.Args[0]

    console.log("Txn #", txn.getVersion())
    // console.log("    Major status: ", txn.getMajorStatus())
    console.log("  - sender: ", `0${intArrToStr(signedTx.Sender).replace(/^0+/, '')}`)

    // if (signedTx.Payload) {
    console.log("   - amount: ", amount, "libra")
    console.log("   - script type: ", programNameLabel)
    console.log("   - receiver: ", programNameLabel)
    console.log("   - gas used: ", gasUsed, "(microLibra)")
  })
  console.log("\n")

  // query account
  let address = "6200650f43fd70774d6d80f6f4d516845e2b349192a241058b9dcc9c23d4db00"
  address = strToIntArr(address)

  //
  let account
  try {
    account = await lib.queryAccountState(address)
  } catch (err) {
    console.error("Error querying the account state for address:", intArrToStr(address))
    console.error(err)
  }
  account = account.getAccountBlob()
  account = await account.getResource(libra.accountResourcePath())
  const balance = account.getBalance()
  let sentEvents = account.getSentEvents()
  sentEvents = sentEvents.Count
  let receivedEvents = account.getReceivedEvents()
  receivedEvents = receivedEvents.Count
  console.log("address: ", intArrToStr(address))
  console.log("  - balance: ", balance)
  console.log("  - events: { sent: ", sentEvents, ", received: ", receivedEvents, " }")

})()
