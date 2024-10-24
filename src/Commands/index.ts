#!/usr/bin/env node
import { Command } from 'commander'
import { yellow, gray, dim, green } from 'kleur'

import ipns from './ipns'
import wallet from './wallet'
import upload from './upload'
import apiKey from './api-key'
import balance from './balance'
import shareFile from './share-file'
import getUploads from './get-uploads'
import dealStatus from './deal-status'
import decryptFile from './decrypt-file'
import createWallet from './create-wallet'
import walletForget from './wallet-forget'
import importWallet from './import-wallet'
import revokeAccess from './revoke-access'
import resetPassword from './reset-password'
import uploadEncrypted from './upload-encrypted'
import podsi from './podsi'

const widgets = new Command('lighthouse-web3')

Command.prototype.helpInformation = function (context: any) {
  let desc: string[] = []
  let options: string[] = []

  if (context.command.commands.length) {
    desc = desc.concat([green('Commands') + '\r\t\t\t\t' + gray('Description')])

    desc = desc.concat(
      context.command.commands.map((cmd: any) => {
        const name = cmd._name.trimEnd().trimStart()
        return (
          '  ' +
          name.padEnd(28 - name.length, ' ') +
          '\r\t\t\t\t' +
          cmd._description
        )
      })
    )
  }
  if (context.command.options.length) {
    options = options.concat([yellow('Options:')])
    options = options.concat(
      context.command.options.map((cmd: any) => {
        const name = cmd.flags.trimEnd().trimStart()
        return (
          '  ' +
          name.padEnd(28 - name.length, ' ') +
          '\r\t\t\t\t' +
          cmd.description
        )
      })
    )
  }

  const cmdName =
    context.command?.parent?._name ?? '' + ' ' + context.command._name

  const usage = [
    yellow('Usage: ') + cmdName + ' ' + dim(this.usage()),
    this.description(),
  ]

  return ['']
    .concat(usage)
    .concat(desc.concat(['\n']))
    .concat(options)
    .concat('')
    .join('\n')
}

widgets.addHelpText('before', 'Welcome to lighthouse-web3')
widgets.version('0.3.7')

widgets
  .command('wallet')
  .description('Returns wallet public address')
  .action(wallet)
widgets
  .command('import-wallet')
  .description('Import an existing wallet')
  .option('--key , --privateKey <key>', 'Private key to wallet')
  .action(importWallet)
widgets
  .command('create-wallet')
  .description('Creates a new wallet')
  .action(createWallet)
widgets
  .command('reset-password')
  .description('Change password of your wallet')
  .action(resetPassword)
widgets
  .command('wallet-forget')
  .description('Remove previously saved wallet')
  .action(walletForget)

widgets
  .command('api-key')
  .description('Manage API key')
  .option('-n, --new', 'new API Key')
  .option('-i, --import <key>', 'To import existing api-key')
  .action(apiKey)

widgets.command('balance').description('Get your data usage').action(balance)

widgets
  .command('ipns')
  .option('-gen, --generate-key', 'Generate IPNS Key')
  .option('-pub, --publish', 'Publish CID')
  .option('-l, --list', 'List all keys')
  .option('-r, --remove <key>', 'Remove Key')
  .option('-k, --key <key>', 'Publish Key argument')
  .option('-c, --cid <cid>', 'Publish CID argument')
  .description('IPNS service')
  .action(ipns)

widgets
  .command('podsi')
  .description('Show Proof of data segment inclusion')
  .argument('<cid>', 'CID of the file previously uploaded')
  .action(podsi)

widgets
  .command('upload')
  .option('-h, --http', 'Use HTTP instead of HTTPS')
  .description('Upload a file')
  .argument('<path>', 'Path to file')
  .action(upload)

widgets
  .command('upload-encrypted')
  .option('-h, --http', 'Use HTTP instead of HTTPS')
  .description('Upload a file encrypted')
  .argument('<path>', 'Path')
  .action(uploadEncrypted)

widgets
  .command('decrypt-file')
  .argument('<cid>', 'File Cid')
  .description('Decrypt and download a file')
  .action(decryptFile)

widgets
  .command('share-file')
  .description('Share access to other user')
  .argument('<cid>', 'File Cid')
  .argument('<address>', "access reciever's address")
  .action(shareFile)

widgets
  .command('revoke-access')
  .description('Revoke Access on a file')
  .argument('<cid>', 'File Cid')
  .argument('<address>', "access reciever's address")
  .action(revokeAccess)

widgets
  .command('deal-status')
  .argument('<cid>', 'File Cid')
  .description('Get filecoin deal status of a CID')
  .action(dealStatus)

widgets
  .command('get-uploads')
  .description('Get details of file uploaded')
  .action(getUploads)

widgets.addHelpText(
  'after',
  '\r\nExample:' +
    '\r\n  New api-key' +
    Array(17).fill('\xa0').join('') +
    '  lighthouse-web3 api-key --new' +
    '\r\n  Create wallet' +
    Array(17).fill('\xa0').join('') +
    'lighthouse-web3 create-wallet' +
    '\r\n  Import wallet' +
    Array(17).fill('\xa0').join('') +
    'lighthouse-web3 import-wallet --key 0x7e9fd9a....a8600\r\n'
)

widgets.parse(process.argv)
