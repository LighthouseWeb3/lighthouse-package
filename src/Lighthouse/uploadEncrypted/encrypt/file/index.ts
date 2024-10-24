import browser from './browser'
import uploadFile from './node'

export default async (
  path: string | any,
  apiKey: string,
  publicKey: string,
  signedMessage: string,
  uploadProgressCallback?: (data: any) => void,
  useHttp = false
) => {
  // Upload File to IPFS
  //@ts-ignore
  if (typeof window === 'undefined') {
    return await uploadFile(path, apiKey, publicKey, signedMessage, useHttp)
  } else {
    return await browser(
      path,
      apiKey,
      publicKey,
      signedMessage,
      uploadProgressCallback ||
        (() => {
          return
        }),
      useHttp
    )
  }
}
