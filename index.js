const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');
const yargs = require('yargs');

// Load all the possible words from BIP39
const wordlist = bip39.wordlists.english;

let BITCOIN_API_URL = 'https://blockstream.info/api/address/';

async function bruteforceMnemonic(mnemonic) {
  // Split mnemonic into its words
  let mnemonicParts = mnemonic.split(" ");

  // Find all occurrences of 'XXX'
  let wordsToBrute = identifyBruteforcePositions(mnemonic);

  for (let wordIndex = 0; wordIndex < wordsToBrute.length; wordIndex++) {
    let wordPosition = wordsToBrute[wordIndex];
    for (let i = 0; i < wordlist.length; i++) {
      mnemonicParts[wordPosition] = wordlist[i];
      let mnemonicTest = mnemonicParts.join(" ");

      if (bip39.validateMnemonic(mnemonicTest)) {
        // Generate address to test if exists
        let address = addressFromMnemonic(mnemonicTest);

        // Test if address exists
        if (await checkExists(address)) {
          console.log("Found!");
          console.log('Address: ', address);
          console.log('Mnemonic: ', mnemonicTest);
          return;
        }
      }
    }
  }

  console.log("Checked all possibilities.");

  return;
}

async function checkExists(address) {
  try {
    console.log("Checking address", address);
    await axios.get(BITCOIN_API_URL + address);
  } catch (error) {
    return false;
  }

  return true;
}

function addressFromMnemonic(mnemonic) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const node = bitcoin.bip32.fromSeed(seed);
  const keyPair = bitcoin.ECPair.fromWIF(node.toWIF());

  return bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey }).address;
}

async function main(mnemonic) {
  console.log('Start bruteforce...');
  await bruteforceMnemonic(mnemonic);

  return;
}

function showHelp() {
  console.log("Bruteforce an incorrect mnemonic for Bitcoin.");
  console.log("Provide a mnemonic to brute force:");
  console.log('$ npm run brute -- --mnemonic="word1 word2 XXX word4 word5"');
  console.log("The word XXX will be replaced and brute-forced at all positions.");
}

function identifyBruteforcePositions(mnemonic) {
  let mnemonicParts = mnemonic.split(" ");
  let positions = [];

  for (let i = 0; i < mnemonicParts.length; i++) {
    if (mnemonicParts[i] === 'XXX') {
      positions.push(i);
    }
  }

  if (positions.length === 0) {
    console.log('Could not find the word "XXX" in the provided mnemonic');
    console.log('Example:');
    console.log('$ npm run brute -- --mnemonic="word1 word2 XXX word4 word5"');
    process.exit();
  }

  return positions;
}

// HACK: Add a timeout because sometimes cryptoWaitReady() fails.
setTimeout(
  async () => {
    let mnemonic = yargs.argv.mnemonic;

    if (mnemonic === undefined) {
      showHelp();
      process.exit();
    }

    await main(mnemonic);
    console.log('Finished.');
  },
  1000
);
