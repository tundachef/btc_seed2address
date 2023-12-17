const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');
const wordlist = require('./wordlist');

// Load all the possible words from BIP39

let BITCOIN_API_URL = 'https://blockstream.info/api/address/';

async function generateRandomMnemonic() {
  const mnemonic = [];
  const wordCount = 12;

  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * wordlist.length);
    mnemonic.push(wordlist[randomIndex]);
  }

  return mnemonic.join(' ');
}

async function checkBalanceAndPrint(address) {
  try {
    console.log(`Checking balance for address ${address}`);
    const response = await axios.get(BITCOIN_API_URL + address);
    const balance = response.data.chain_stats.funded_txo_sum / 100000000; // Convert satoshis to BTC
    console.log(`Address: ${address}, Balance: ${balance} BTC`);
  } catch (error) {
    console.error(`Error checking balance for address ${address}: ${error.message}`);
  }
}

async function main() {
  while (true) {
    const randomMnemonic = await generateRandomMnemonic();
    // console.log(randomMnemonic);
    const address = addressFromMnemonic(randomMnemonic);
    await checkBalanceAndPrint(address);
    // Adjust the delay as needed
    // await new Promise(resolve => setTimeout(resolve, 2)); // Delay for 5 seconds
  }
}

function addressFromMnemonic(mnemonic) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const node = bitcoin.bip32.fromSeed(seed);
  const keyPair = bitcoin.ECPair.fromWIF(node.toWIF());

  return bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey }).address;
}

// Start the program
main();
