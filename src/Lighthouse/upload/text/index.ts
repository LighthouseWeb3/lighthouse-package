import uploadTextServer from './node'
import uploadTextBrowser from './browser'

export default async (
  text: string,
  apiKey: string,
  name = 'text',
  useHttp?: boolean
) => {
  // Upload File to IPFS
  //@ts-ignore
  if (typeof window === 'undefined') {
    return await uploadTextServer(text, apiKey, name, useHttp)
  } else {
    return await uploadTextBrowser(text, apiKey, name, useHttp)
  }
}
