import { red, yellow, cyan, green, magenta } from 'kleur'
import { ethers } from 'ethers'
import { resolve } from 'path'
import { Spinner } from 'cli-spinner'

import readInput from './utils/readInput'
import bytesToSize from './utils/byteToSize'
import { config } from './utils/getNetwork'
import lighthouse from '../Lighthouse'

const getQuote = async (path: string, apiKey: string, Spinner: any) => {
  const spinner = new Spinner('Getting Quote...')
  spinner.start()

  const quoteResponse: any = (await lighthouse.getQuote(path, apiKey)).data
  spinner.stop()
  process.stdout.clearLine(-1)
  process.stdout.cursorTo(0)

  if (!quoteResponse) {
    console.log(red('Error getting quote!'))
    console.log(yellow('Check if the wallet is imported!'))
    process.exit()
  }

  console.log(
    cyan('Name') +
      Array(30).fill('\xa0').join('') +
      cyan('Size') +
      Array(8).fill('\xa0').join('') +
      cyan('Type') +
      Array(20).fill('\xa0').join('')
  )

  for (let i = 0; i < quoteResponse.metaData.length; i++) {
    const fileName = quoteResponse.metaData[i].fileName
      .split(/\\/g)
      .slice(-1)[0]
      .substring(0, 20)
    console.log(
      fileName +
        Array(34 - (fileName ?? '').length)
          .fill('\xa0')
          .join('') +
        bytesToSize(quoteResponse.metaData[i].fileSize) +
        Array(
          12 - bytesToSize(quoteResponse.metaData[i].fileSize).toString().length
        )
          .fill('\xa0')
          .join('') +
        quoteResponse.metaData[i].mimeType
    )
  }

  console.log(
    '\r\n' +
      cyan('Summary') +
      '\r\nTotal Size: ' +
      bytesToSize(quoteResponse.totalSize)
  )

  console.log(
    'Data Limit: ' +
      bytesToSize(parseInt(quoteResponse.dataLimit)) +
      '\r\nData Used : ' +
      bytesToSize(parseInt(quoteResponse.dataUsed)) +
      '\r\nAfter Upload: ' +
      bytesToSize(
        parseInt(quoteResponse.dataLimit) -
          (parseInt(quoteResponse.dataUsed) + quoteResponse.totalSize)
      )
  )

  const remainingAfterUpload =
    parseInt(quoteResponse.dataLimit) -
    (parseInt(quoteResponse.dataUsed) + quoteResponse.totalSize)

  return {
    fileName: quoteResponse.metaData[0].fileName,
    fileSize: quoteResponse.metaData[0].fileSize,
    cost: quoteResponse?.totalCost,
    type: quoteResponse?.type,
    remainingAfterUpload: remainingAfterUpload,
  }
}

const uploadFile = async (
  path: string,
  signer: any,
  apiKey: string,
  useHttp?: boolean
) => {
  const spinner = new Spinner('Uploading...')
  spinner.start()

  const messageRequested = (
    await lighthouse.getAuthMessage(
      config.get('LIGHTHOUSE_GLOBAL_PUBLICKEY') as string
    )
  ).data.message
  const signedMessage = await signer.signMessage(messageRequested)
  const uploadResponse = (
    await lighthouse.uploadEncrypted(
      path,
      apiKey,
      config.get('LIGHTHOUSE_GLOBAL_PUBLICKEY') as string,
      signedMessage,
      undefined,
      useHttp
    )
  ).data

  spinner.stop()
  process.stdout.clearLine(-1)
  process.stdout.cursorTo(0)

  if (!uploadResponse[0].Hash) {
    console.log(red('Upload failed!'))
    console.log(yellow('Check if api key is correct or create a new key!'))
    process.exit()
  }

  uploadResponse.forEach((fileResponse) => {
    console.log(
      green('File Uploaded, visit following url to view content!\r\n') +
        cyan(
          'Visit: ' +
            'https://files.lighthouse.storage/viewFile/' +
            fileResponse.Hash
        )
    )

    console.log('CID: ' + fileResponse.Hash)
  })
  return
}

export default async function (_path: string, _options: any) {
  if (!_path) {
    console.log(
      'lighthouse-web3 upload-encrypted <path>\r\n\r\n' +
        green('Description: ') +
        'Upload a file\r\n\r\n' +
        cyan('Options:\r\n') +
        Array(3).fill('\xa0').join('') +
        '--path: Required, path to file\r\n\r\n' +
        magenta('Example:') +
        Array(3).fill('\xa0').join('') +
        'lighthouse-web3 upload-encrypted /home/cosmos/Desktop/ILoveAnime.jpg\r\n'
    )
  } else {
    try {
      // Import nodejs specific library
      const path = resolve(process.cwd(), _path)

      // Display Quote
      const quoteResponse = await getQuote(
        path,
        config.get('LIGHTHOUSE_GLOBAL_API_KEY') as string,
        Spinner
      )

      // Upload
      console.log(
        green(
          'Carefully check the above details are correct, then confirm to complete this upload'
        ) + ' Y/n'
      )

      let options = {
        prompt: '',
        silent: false,
      }

      const selected: any = await readInput(options)

      // Check if valid input (Y/n) is not provided
      if (
        selected.trim() !== 'y' &&
        selected.trim() !== 'Y' &&
        selected.trim() !== 'n' &&
        selected.trim() !== 'N' &&
        selected.trim() !== 'no'
      ) {
        throw new Error('Invalid choice. Please choose Y or n.')
      }

      if (
        selected.trim() === 'n' ||
        selected.trim() === 'N' ||
        selected.trim() === 'no'
      ) {
        throw new Error('Canceled Upload')
      }

      if (!config.get('LIGHTHOUSE_GLOBAL_API_KEY')) {
        throw new Error('Please create api-key first: use api-key command')
      }

      if (quoteResponse.remainingAfterUpload < 0) {
        throw new Error(
          'File size larger than allowed limit. Please Recharge!!!'
        )
      }

      options = {
        prompt: 'Enter your password: ',
        silent: true,
      }
      const password: any = await readInput(options)

      // Check if password is empty or not provided
      if (!password || password.trim() === '') {
        throw new Error('Password not provided!')
      }

      const decryptedWallet = ethers.Wallet.fromEncryptedJsonSync(
        config.get('LIGHTHOUSE_GLOBAL_WALLET') as string,
        password.trim()
      )
      if (!decryptedWallet) {
        throw new Error('Incorrect password!')
      }

      const signer = new ethers.Wallet(decryptedWallet.privateKey)
      const apiKey = config.get('LIGHTHOUSE_GLOBAL_API_KEY') as string
      await uploadFile(path, signer, apiKey, _options.http || _options.h)
    } catch (error: any) {
      console.log(red(error.message))
      process.exit(0)
    }
  }
}
