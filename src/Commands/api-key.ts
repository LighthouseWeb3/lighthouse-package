import axios from 'axios';
import chalk from 'chalk';
import { ethers } from 'ethers';
import lighthouse from '../Lighthouse';
import Read from 'read';
import { config } from '../Utils/getNetwork';
import { lighthouseConfig } from '../lighthouse.config';

export default async (data: any, options: any) => {
  if (JSON.stringify(data) === '{}') {
    console.log(chalk.yellow('Select an option:'));
    options.help();
  } else {
    if (data.import) {
      config.set('LIGHTHOUSE_GLOBAL_API_KEY', data.import);
      console.log(chalk.green('\r\nApi Key imported!!'));
    } else {
      try {
        if (config.get('LIGHTHOUSE_GLOBAL_API_KEY') && !data.new) {
          console.log(chalk.yellow('\r\nApi Key: ') + config.get('LIGHTHOUSE_GLOBAL_API_KEY'));
        } else {
          if (!config.get('LIGHTHOUSE_GLOBAL_WALLET')) {
            throw new Error('Create/Import wallet first!!!');
          }

          const options = {
            prompt: 'Enter your password: ',
            silent: true,
            default: '',
          };

          const password: any = await Read(options, (err, res) => console.log(err, res));
          const decryptedWallet = ethers.Wallet.fromEncryptedJsonSync(
            config.get('LIGHTHOUSE_GLOBAL_WALLET') as string,
            password.trim(),
          );

          const verificationMessage = (
            await axios.get(
              lighthouseConfig.lighthouseAPI + `/api/auth/get_message?publicKey=${decryptedWallet.address}`,
            )
          ).data;
          const signedMessage = await decryptedWallet.signMessage(verificationMessage);

          const response = await lighthouse.getApiKey(decryptedWallet.address, signedMessage);

          config.set('LIGHTHOUSE_GLOBAL_API_KEY', response.data.apiKey);
          console.log(chalk.yellow('\r\nApi Key: ') + response.data.apiKey);
        }
      } catch (error: any) {
        console.log(chalk.red(error.message));
      }
    }
  }
};
