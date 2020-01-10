const { sign } = require("tweetnacl")
const { libra } = require("gopherjs-libra")

const intArrToStr = (uintArray) => (
  // node
  Buffer.from(uintArray).toString('hex')

  // browser
  // uintArray ? uintArray.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '') : 'N/A';
)

const strToIntArr = hexString => (
  // node
  // ?

  // browser
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

// wallet - key generation
// const keyPair = sign.keyPair()
// const pvtKey  = keyPair.secretKey
// const pubKey  = keyPair.publicKey
// const address = libra.pubkeyToAddress(keyPair.publicKey)
//
// console.log("private key:", intArrToStr(pvtKey)) // SECRET! don't console log on production
// console.log("pub key:", intArrToStr(pubKey))
// console.log("address:", intArrToStr(address))
// const msg = Buffer.from("test")

// message signing and verification
// const signedMsg = sign(msg, keyPair.secretKey)
// console.log("signed message:", signedMsg)
// const verified = sign.open(signedMsg, pubKey)
// console.log("msg. signature verified:", !!verified)


const defaultServer = "http://hk2.wutj.info:38080"
const lib = libra.client(defaultServer, libra.trustedPeersFile)

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
  txs.map(txn => {
    let signedTx = txn.getSignedTxn()
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
  let address = "d43e0b6386a12ddee8188468a803a419de11e7e706be1489fa240c2e60f8ef90"
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



// notes:
// 
// ### Client.submitP2PTransaction(rawTxn)
//
// Arguments:
//  - rawTxn (Object): the raw transaction object, with following keys
//    - senderAddr (Uint8Array): sender address
//    - recvAddr (Uint8Array): receiver address
//    - senderPrivateKey (Uint8Array): sender ed25519 secret key (64 bytes)
//    - senderSeq (integer): current sender account sequence number
//    - amountMicro (integer): amount to transfer in micro libra
//    - maxGasAmount (integer): max gas amount in micro libra
//    - gasUnitPrice (integer): micro libra per gas
//    - expirationTimestamp (integer): transaction expiration unix timestamp
//
// Returns a promise that resolves to the expected sequence number of this transaction. Use `pollSequenceUntil` afterward to make sure the transaction is included in the ledger.


// notes:
//
// const validateAddress = () => {
//   // checking address lenght
//   if (address.length != 32) {
//     console.error("Address is invalid.")
//     return
//   }
//
//   // check valid hex
//   // TODO
//
//   return valid
// }
