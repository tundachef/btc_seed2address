const bip39 = require("bip39");
const bitcoin = require("bitcoinjs-lib");
const HDKey = require("hdkey");
const CoinKey = require("coinkey");
const axios = require("axios");

// Load all the possible words from BIP39
const wordlist = bip39.wordlists.english;

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
    try {
      const randomMnemonic = await generateRandomMnemonic();
      console.log('Generated Mnemonic:', randomMnemonic);
      
      const seed = bip39.mnemonicToSeedSync(randomMnemonic);
      const hdKey = HDKey.fromMasterSeed(Buffer.from(seed, "hex"));
      const path = "m/44'/0'/0'/0/0";
      const child = hdKey.derive(path);
      const coinKey = new CoinKey(child.privateKey, bitcoin.networks.bitcoin);
      const address = coinKey.publicAddress;

      await checkBalanceAndPrint(address);

      // Adjust the delay as needed
      await new Promise(resolve => setTimeout(resolve, 0)); // Delay for 5 seconds
    } catch (error) {
      console.error('Error generating or processing mnemonic:', error.message);
    }
  }
}

// Start the program
main();
