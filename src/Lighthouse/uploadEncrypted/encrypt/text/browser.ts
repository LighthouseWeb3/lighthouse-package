/* istanbul ignore file */
import { encryptFile } from '../../encryptionBrowser'
import { generate, saveShards } from '@lighthouse-web3/kavach'
import { lighthouseConfig } from '../../../../lighthouse.config'
import { adjustUrlProtocol, fetchWithTimeout } from '../../../utils/util'

export default async (
  text: string,
  apiKey: string,
  publicKey: string,
  signedMessage: string,
  name: string,
  useHttp = false
) => {
  try {
    const token = 'Bearer ' + apiKey
    const endpoint = adjustUrlProtocol(
      `${lighthouseConfig.lighthouseUploadGateway}/api/v0/add`,
      useHttp
    )

    // Upload file
    const formData = new FormData()

    const { masterKey: fileEncryptionKey, keyShards } = await generate()

    const encoder = new TextEncoder()
    const encryptedData = await encryptFile(
      encoder.encode(text).buffer,
      fileEncryptionKey
    )

    formData.append(
      'file',
      new Blob([encryptedData], { type: 'text/plain' }),
      name
    )

    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      body: formData,
      timeout: 7200000,
      headers: {
        Encryption: 'true',
        'Mime-Type': 'text/plain',
        Authorization: token,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const responseData = (await response.json()) as any

    const { error } = await saveShards(
      publicKey,
      responseData.Hash,
      signedMessage,
      keyShards
    )

    if (error) {
      throw new Error('Error encrypting file')
    }
    return { data: responseData }
  } catch (error: any) {
    throw new Error(error.message)
  }
}
