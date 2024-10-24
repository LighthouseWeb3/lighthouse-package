import uploadFile from './node'
import uploadFileBrowser from './browser'
import {
  IUploadProgressCallback,
  IFileUploadedResponse,
} from '../../../types'

async function uploadFiles(
  sourcePath: string | any,
  apiKey: string,
  uploadProgressCallback?: (data: IUploadProgressCallback) => void,
  useHttp?: boolean
): Promise<{ data: IFileUploadedResponse }>

async function uploadFiles(
  sourcePath: string | any,
  apiKey: string,
  uploadProgressCallback?: (data: IUploadProgressCallback) => void,
  useHttp?: boolean
): Promise<{ data: IFileUploadedResponse[] }>

async function uploadFiles(
  path: string | any,
  apiKey: string,
  uploadProgressCallback?: (data: IUploadProgressCallback) => void,
  useHttp?: boolean
) {
  // Upload File to IPFS
  //@ts-ignore
  if (typeof window === 'undefined') {
    return await uploadFile(path, apiKey, useHttp)
  } else {
    return await uploadFileBrowser(
      path,
      apiKey,
      uploadProgressCallback,
      useHttp
    )
  }
}

export default uploadFiles
