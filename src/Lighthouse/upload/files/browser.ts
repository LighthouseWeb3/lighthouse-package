/* istanbul ignore file */
import { lighthouseConfig } from '../../../lighthouse.config'
import {
  IUploadProgressCallback,
  UploadFileReturnType,
  DealParameters,
} from '../../../types'
import { fetchWithTimeout, adjustUrlProtocol } from '../../utils/util'

// eslint-disable-next-line @typescript-eslint/no-empty-function
export default async <T extends boolean>(
  files: any,
  accessToken: string,
  dealParameters: DealParameters | undefined,
  uploadProgressCallback?: (data: IUploadProgressCallback) => void,
  useHttp = false
): Promise<{ data: UploadFileReturnType<T> }> => {
  try {
    const isDirectory = [...files].some((file) => file.webkitRelativePath)
    const wrapWithDirectory =
      !isDirectory && files.length > 1 ? 'true' : 'false'

    const endpoint = adjustUrlProtocol(
      `${lighthouseConfig.lighthouseUploadGateway}/api/v0/add?wrap-with-directory=${wrapWithDirectory}`,
      useHttp
    )

    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i])
    }

    const token = 'Bearer ' + accessToken

    const headers = new Headers({
      Authorization: token,
      'X-Deal-Parameter': dealParameters
        ? JSON.stringify(dealParameters)
        : 'null',
    })

    const response = uploadProgressCallback
      ? await fetchWithTimeout(endpoint, {
          method: 'POST',
          body: formData,
          headers: headers,
          timeout: 7200000,
          onProgress: (progress) => {
            uploadProgressCallback({
              progress: progress,
            })
          },
        })
      : await fetchWithTimeout(endpoint, {
          method: 'POST',
          body: formData,
          headers: headers,
          timeout: 7200000,
        })

    if (!response.ok) {
      throw new Error(`Request failed with status code ${response.status}`)
    }

    const responseText = await response.text()
    return { data: JSON.parse(responseText) }
  } catch (error: any) {
    throw new Error(error?.message)
  }
}
