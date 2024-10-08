import uploadFile from './node'
import uploadFileBrowser from './browser'
import {
  IUploadProgressCallback,
  IFileUploadedResponse,
  DealParameters,
} from '../../../types'

async function uploadFiles(
  sourcePath: string | any,
  apiKey: string,
  dealParameters?: DealParameters,
  uploadProgressCallback?: (data: IUploadProgressCallback) => void,
  useHttp?: boolean
): Promise<{ data: IFileUploadedResponse }>

async function uploadFiles(
  sourcePath: string | any,
  apiKey: string,
  dealParameters?: DealParameters,
  uploadProgressCallback?: (data: IUploadProgressCallback) => void,
  useHttp?: boolean
): Promise<{ data: IFileUploadedResponse[] }>

async function uploadFiles(
  path: string | any,
  apiKey: string,
  dealParameters?: DealParameters,
  uploadProgressCallback?: (data: IUploadProgressCallback) => void,
  useHttp?: boolean
) {
  // Upload File to IPFS
  //@ts-ignore
  if (typeof window === 'undefined') {
    return await uploadFile(path, apiKey, dealParameters, useHttp)
  } else {
    return await uploadFileBrowser(
      path,
      apiKey,
      dealParameters,
      uploadProgressCallback,
      useHttp
    )
  }
}

export default uploadFiles
