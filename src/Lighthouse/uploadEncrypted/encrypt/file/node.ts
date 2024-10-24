import { lighthouseConfig } from '../../../../lighthouse.config'
import { generate, saveShards } from '@lighthouse-web3/kavach'
import { encryptFile } from '../../encryptionNode'
import { walk } from '../../../upload/files/node'
import { IFileUploadedResponse } from '../../../../types'
import { adjustUrlProtocol, fetchWithTimeout } from '../../../utils/util'

export default async (
  sourcePath: any,
  apiKey: string,
  publicKey: string,
  auth_token: string,
  useHttp = false
): Promise<{ data: IFileUploadedResponse[] }> => {
  const fs = eval('require')('fs-extra')
  const token = 'Bearer ' + apiKey

  const endpoint = adjustUrlProtocol(
    `${lighthouseConfig.lighthouseUploadGateway}/api/v0/add?wrap-with-directory=false`,
    useHttp
  )

  const stats = fs.lstatSync(sourcePath)

  if (stats.isFile()) {
    try {
      const formData = new FormData()

      const { masterKey: fileEncryptionKey, keyShards } = await generate()

      const fileData = fs.readFileSync(sourcePath)
      const encryptedData = await encryptFile(fileData, fileEncryptionKey)
      const blob = new Blob([Buffer.from(encryptedData)])
      formData.append('file', blob, sourcePath.replace(/^.*[\\/]/, ''))

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: formData,
        timeout: 7200000,
        headers: {
          Encryption: 'true',
          Authorization: token,
        },
      })

      if (!response.ok) {
        throw new Error(`Request failed with status code ${response.status}`)
      }

      const responseData = (await response.json()) as any

      const { error } = await saveShards(
        publicKey,
        responseData[0].Hash,
        auth_token,
        keyShards
      )
      if (error) {
        throw new Error('Error encrypting file')
      }

      return { data: responseData }
    } catch (error: any) {
      throw new Error(error.message)
    }
  } else {
    const files = await walk(sourcePath)
    const formData = new FormData()

    if (files.length > 1 && auth_token.startsWith('0x')) {
      throw new Error(JSON.stringify(`auth_token must be a JWT`))
    }

    let keyMap = {} as any

    await Promise.all(
      files.map(async (file: any) => {
        const { masterKey: fileEncryptionKey, keyShards } = await generate()

        const fileData = fs.readFileSync(file)
        const encryptedData = await encryptFile(fileData, fileEncryptionKey)
        const filename = file.slice(sourcePath.length + 1).replaceAll('/', '-')
        formData.append('file', new Blob([encryptedData]), filename)
        keyMap = { ...keyMap, [filename]: keyShards }
        return [filename, keyShards]
      })
    )

    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      body: formData,
      timeout: 7200000,
      headers: {
        Encryption: 'true',
        Authorization: token,
      },
    })

    if (!response.ok) {
      throw new Error(`Request failed with status code ${response.status}`)
    }

    const responseText = await response.text()
    const jsondata = JSON.parse(responseText) as IFileUploadedResponse[]

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
  }
}
