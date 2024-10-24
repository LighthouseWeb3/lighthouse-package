import uploadBuffer from './node'
import uploadTypedArray from './browser'

export default async (buffer: any, apiKey: string, useHttp?: boolean) => {
  // Upload File to IPFS
  //@ts-ignore
  if (typeof window === 'undefined') {
    return await uploadBuffer(buffer, apiKey, useHttp)
  } else {
    return await uploadTypedArray(buffer, apiKey, useHttp)
  }
}
