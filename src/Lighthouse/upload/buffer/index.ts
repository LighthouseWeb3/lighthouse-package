import uploadBuffer from './node'
import uploadTypedArray from './browser'

export default async (
  buffer: any,
  apiKey: string,
  mimeType?: string,
  useHttp?: boolean
) => {
  // Upload File to IPFS
  //@ts-ignore
  if (typeof window === 'undefined') {
    return await uploadBuffer(buffer, apiKey, mimeType, useHttp)
  } else {
    return await uploadTypedArray(buffer, apiKey, mimeType, useHttp)
  }
}
