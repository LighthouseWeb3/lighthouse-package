/* istanbul ignore file */
import { generate, saveShards } from '@lighthouse-web3/kavach'
import {
  IFileUploadedResponse,
  IUploadProgressCallback,
} from '../../../../types'
import { encryptFile } from '../../encryptionBrowser'
import { lighthouseConfig } from '../../../../lighthouse.config'
import {
  adjustUrlProtocol,
  checkDuplicateFileNames,
  fetchWithTimeout,
} from '../../../utils/util'

declare const FileReader: any

const readFileAsync = (file: any) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      reader.result && resolve(reader.result)
    }

    reader.onerror = reject

    reader.readAsArrayBuffer(file)
  })
}

export default async (
  files: any,
  apiKey: string,
  publicKey: string,
  auth_token: string,
  uploadProgressCallback?: (data: IUploadProgressCallback) => void,
  useHttp = false
): Promise<{ data: IFileUploadedResponse[] }> => {
  try {
    let keyMap = {} as any
    let mimeType = null
    if (files.length === 1) {
      mimeType = files[0].type
    }

    const endpoint = adjustUrlProtocol(
      `${lighthouseConfig.lighthouseUploadGateway}/api/v0/add?wrap-with-directory=false`,
      useHttp
    )

    const token = 'Bearer ' + apiKey

    const fileArr = []
    for (let i = 0; i < files.length; i++) {
      fileArr.push(files[i])
    }
    checkDuplicateFileNames(fileArr)

    if (files.length > 1 && auth_token.startsWith('0x')) {
      throw new Error(JSON.stringify(`auth_token must be a JWT`))
    }

    const formData = new FormData()
    const filesParam = await Promise.all(
      fileArr.map(async (f) => {
        const { masterKey: fileEncryptionKey, keyShards } = await generate()
        const fileData = await readFileAsync(f)
        const encryptedData = await encryptFile(fileData, fileEncryptionKey)
        keyMap = { ...keyMap, [f.name]: keyShards }
        return {
          data: new Blob([encryptedData], { type: f.type }),
          fileName: f.name,
          keyShards,
        }
      })
    )
    filesParam.forEach(function (item_) {
      return formData.append(
        'file',
        item_.data,
        item_.fileName ? item_.fileName : 'file'
      )
    })

    const response = uploadProgressCallback
      ? await fetchWithTimeout(endpoint, {
          method: 'POST',
          body: formData,
          timeout: 7200000,
          headers: {
            Encryption: `${true}`,
            Authorization: token,
          },
          onProgress: (progress) => {
            uploadProgressCallback({
              progress: progress,
            })
          },
        })
      : await fetchWithTimeout(endpoint, {
          method: 'POST',
          body: formData,
          timeout: 7200000,
          headers: {
            Encryption: `${true}`,
            Authorization: token,
          },
        })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const responseText = await response.text()
    let data = responseText.split('\n')
    data = data.splice(0, data.length - 1)
    const jsondata = data.map((data) => JSON.parse(data))

    const savedKey = await Promise.all(
      jsondata.map(async (data) => {
        return saveShards(publicKey, data.Hash, auth_token, keyMap[data.Name])
      })
    )
    savedKey.forEach((_savedKey) => {
      if (!_savedKey.isSuccess) {
        throw new Error(JSON.stringify(_savedKey))
      }
    })
    return { data: jsondata }

    // return response
    /*
      {
        data: [{
          Name: 'flow1.png',
          Hash: 'QmUHDKv3NNL1mrg4NTW4WwJqetzwZbGNitdjr2G6Z5Xe6s',
          Size: '31735'
        }]
      }
    */
  } catch (error: any) {
    return error.message
  }
}
