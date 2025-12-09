import api from '../utils/axios'

/**
 * Presigned URL Response từ BE
 */
interface PresignedUrlResponse {
  uploadUrl: string // URL để upload file lên S3
  fileKey: string // Key để gửi lại cho BE (VD: assignments/uuid_bai_tap.pdf)
}

/**
 * Upload file qua S3 Presigned URL
 *
 * Quy trình 3 bước:
 * 1. Gọi GET /api/upload/presigned-url để lấy uploadUrl và fileKey (dùng axios với headers tự động)
 * 2. Upload file trực tiếp lên S3 bằng PUT uploadUrl (không dùng Authorization)
 * 3. Return fileKey để gọi API nghiệp vụ
 *
 * @param file - File cần upload
 * @param folder - (optional) Folder trên S3 (VD: assignments, posts, avatars)
 * @returns fileKey - Đường dẫn file trên S3 để gửi cho BE
 */
export async function uploadFileToS3(file: File, folder?: string): Promise<string> {
  // === BƯỚC 1: Xin link upload (Get Presigned URL) - dùng axios ===
  console.log('=== UPLOAD STEP 1: Get Presigned URL ===')
  console.log('fileName:', file.name)
  console.log('folder:', folder)

  const { data: presignedData } = await api.get<PresignedUrlResponse>('/api/upload/presigned-url', {
    params: { fileName: file.name }
  })
  console.log('Presigned URL response:', presignedData)

  const { uploadUrl, fileKey } = presignedData

  if (!uploadUrl || !fileKey) {
    throw new Error('Không nhận được link upload từ server')
  }

  // === BƯỚC 2: Upload file lên S3 (Direct Upload) ===
  console.log('=== UPLOAD STEP 2: Upload to S3 ===')
  console.log('uploadUrl:', uploadUrl)
  console.log('fileKey:', fileKey)
  console.log('file size:', file.size)

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream'
      // KHÔNG gửi Authorization header - S3 không hiểu Token của App
    },
    body: file
  })

  if (!uploadResponse.ok) {
    throw new Error('Lỗi khi upload file lên S3')
  }

  console.log('=== UPLOAD STEP 2: SUCCESS ===')
  console.log('fileKey to use in API:', fileKey)

  // === BƯỚC 3: Return fileKey để gọi API nghiệp vụ ===
  return fileKey
}

/**
 * Helper function để upload nhiều file
 */
export async function uploadMultipleFilesToS3(files: File[], folder?: string): Promise<string[]> {
  const fileKeys = await Promise.all(files.map((file) => uploadFileToS3(file, folder)))
  return fileKeys
}

export default {
  uploadFileToS3,
  uploadMultipleFilesToS3
}
