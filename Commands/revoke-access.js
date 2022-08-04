const Conf = require("conf");
const chalk = require("chalk");

const fs = require("fs");
const ethers = require("ethers");
const { default: axios } = require("axios");

const config = new Conf();
const lighthouse = require("../Lighthouse");
const readInput = require("../Utils/readInput");
const lighthouseConfig = require("../lighthouse.config");

const sign_auth_message = async (publicKey, privateKey) => {
  const provider = new ethers.providers.JsonRpcProvider();
  const signer = new ethers.Wallet(privateKey, provider);
  const messageRequested = await lighthouse.getAuthMessage(publicKey);
  const signedMessage = await signer.signMessage(messageRequested);
  return signedMessage;
};

module.exports = {
  command: "revoke-access <cid> <address>",
  desc: "Revoke Access on a file",
  handler: async function (argv) {
    if (argv.help) {
      console.log(
        "\nlighthouse-web3 revoke-access <cid> <address>\n" +
          chalk.green("Description: ") +
          "Revoke Access on a file\n"
      );
    } else {
      try {
        if (!config.get("LIGHTHOUSE_GLOBAL_PUBLICKEY")) {
          throw new Error("Please import wallet first!");
        }

        // get file details
        const fileDetails = (
          await axios.get(
            lighthouseConfig.lighthouseAPI +
              "/api/lighthouse/file_info?cid=" +
              argv.cid
          )
        ).data;
        if (!fileDetails) {
          throw new Error("Unable to get CID details.");
        }

        if (!ethers.utils.isAddress(argv.address)) {
          throw new Error("Kindly Provide a valid address");
        }

        // Get key
        options = {
          prompt: "Enter your password: ",
          silent: true,
          default: "",
        };
        const password = await readInput(options);
        const decryptedWallet = ethers.Wallet.fromEncryptedJsonSync(
          config.get("LIGHTHOUSE_GLOBAL_WALLET"),
          password.trim()
        );

        if (!decryptedWallet) {
          throw new Error("Incorrect password!");
        }

        const signedMessage = await sign_auth_message(
          config.get("LIGHTHOUSE_GLOBAL_PUBLICKEY"),
          decryptedWallet.privateKey
        );

        const data = await lighthouse.revokeFileAccess(
          config.get("LIGHTHOUSE_GLOBAL_PUBLICKEY"),
          argv.address,
          argv.cid,
          signedMessage
        );
        console.log(chalk.white(data));
      } catch (error) {
        console.log(chalk.red(error.message));
      }
    }
  },
};