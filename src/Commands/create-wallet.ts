import chalk from 'chalk';
import { ethers } from 'ethers';
import fs from 'fs';
import lighthouse from '../Lighthouse';
import readInput from '../Utils/readInput';
import { config } from '../Utils/getNetwork';
import Read from 'read';

export default async (_: any, _options: any) => {

  try {
    const options = {
      prompt: 'Set a password for your wallet:',
      silent: true,
      timeout: 30000,
    };

    const password: any = await Read(options, (err, res) => console.log(err, res));

    const encryptedWallet = (await lighthouse.createWallet(password.trim())).data.encryptedWallet;
    const decryptedWallet = ethers.Wallet.fromEncryptedJsonSync(encryptedWallet, password.trim());

    const publicKey = decryptedWallet.address;
    const privateKey = decryptedWallet.privateKey;

    if (!encryptedWallet) {
      throw new Error('Creating Wallet Failed!');
    }
    const saveWallet = {
      publicKey: publicKey,
      privateKey: privateKey,
    };

    fs.writeFile('wallet.json', JSON.stringify(saveWallet, null, 4), (err) => {
      if (err) {
        throw new Error('Saving Wallet Failed!');
      } else {
        config.set('LIGHTHOUSE_GLOBAL_WALLET', encryptedWallet);
        config.set('LIGHTHOUSE_GLOBAL_PUBLICKEY', publicKey);

        console.log(chalk.cyan('Public Key: ' + publicKey) + chalk.green('\r\nWallet Created!'));
      }
    });
  } catch (error: any) {
    console.log(chalk.red(error.message));
  }
};
