import serverSide from './node'
import browser from './browser'

export default async (
  text: string,
  apiKey: string,
  publicKey: string,
  signedMessage: string,
  name = 'text',
  useHttp = false
) => {
  //@ts-ignore
  if (typeof window === 'undefined') {
    return await serverSide(
      text,
      apiKey,
      publicKey,
      signedMessage,
      name,
      useHttp
    )
  } else {
    return await browser(text, apiKey, publicKey, signedMessage, name, useHttp)
  }
}
