import { ethers } from 'ethers'

interface FetchOptions extends RequestInit {
  timeout?: number
  onProgress?: (progress: number) => void
}

const isCID = (cid: string) => {
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|B[A-Z2-7]{58}|z[1-9A-HJ-NP-Za-km-z]{48}|F[0-9A-F]{50})*$/.test(
    cid
  )
}

const isPrivateKey = (key: string) => {
  return /^([0-9a-f]{64})$/i.test(key)
}

const addressValidator = (value: string) => {
  if (ethers.isAddress(value?.toLowerCase())) {
    return value.toLowerCase()
  } else if (/^[A-HJ-NP-Za-km-z1-9]*$/.test(value) && value.length == 44) {
    return value
  }
  return ''
}

function checkDuplicateFileNames(files: any[]) {
  const fileNames = new Set()

  for (let i = 0; i < files.length; i++) {
    const fileName = files[i].name

    if (fileNames.has(fileName)) {
      throw new Error(`Duplicate file name found: ${fileName}`)
    }

    fileNames.add(fileName)
  }
}

async function fetchWithTimeout(
  endpointURL: string,
  options: FetchOptions
): Promise<Response> {
  const { timeout = 8000, onProgress, ...rest } = options

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    if (onProgress && rest.body instanceof FormData) {
      return new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open(rest.method || 'GET', endpointURL)

        if (rest.headers) {
          if (rest.headers instanceof Headers) {
            rest.headers.forEach((value, key) => {
              xhr.setRequestHeader(key, value)
            })
          } else if (typeof rest.headers === 'object') {
            for (const [key, value] of Object.entries(rest.headers)) {
              xhr.setRequestHeader(key, value as string)
            }
          }
        }

        xhr.timeout = timeout
        xhr.onload = () => {
          const headers = new Headers()
          xhr
            .getAllResponseHeaders()
            .trim()
            .split(/[\r\n]+/)
            .forEach((line) => {
              const parts = line.split(': ')
              const header = parts.shift()
              const value = parts.join(': ')
              if (header) headers.set(header, value)
            })

          resolve(
            new Response(xhr.response, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: headers,
            })
          )
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.ontimeout = () => reject(new Error('Request timed out'))
        xhr.upload.onprogress = (event: ProgressEvent) => {
          if (event.lengthComputable) {
            onProgress(event.loaded / event.total)
          }
        }

        // Handle different body types
        if (rest.body instanceof FormData) {
          xhr.send(rest.body)
        } else if (rest.body instanceof ReadableStream) {
          // Convert ReadableStream to Blob and then send
          new Response(rest.body).blob().then((blob) => xhr.send(blob))
        } else if (
          typeof rest.body === 'string' ||
          rest.body instanceof Blob ||
          rest.body instanceof ArrayBuffer
        ) {
          xhr.send(rest.body)
        } else if (rest.body == null) {
          xhr.send()
        } else {
          reject(new Error('Unsupported body type'))
        }
      })
    } else {
      const response = await fetch(endpointURL, {
        ...rest,
        signal: controller.signal,
      })
      clearTimeout(id)
      return response
    }
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

/**
 * Adjusts the URL's protocol to 'http' or 'https' based on the ssl parameter.
 *
 * @param url - The URL to be adjusted.
 * @param useHttp - A boolean that determines whether to use 'http' (true) or 'https' (false).
 * @returns The adjusted URL as a string.
 */
function adjustUrlProtocol(url: string, useHttp: boolean): string {
  try {
    const parsedUrl = new URL(url)
    parsedUrl.protocol = useHttp ? 'http:' : 'https:'
    return parsedUrl.toString()
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`)
  }
}

export {
  isCID,
  isPrivateKey,
  addressValidator,
  checkDuplicateFileNames,
  fetchWithTimeout,
  adjustUrlProtocol,
}
