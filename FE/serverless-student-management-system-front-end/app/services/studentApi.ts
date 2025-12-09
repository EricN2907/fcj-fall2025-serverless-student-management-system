import api from '../utils/axios'
import { fetchAuthSession } from '@aws-amplify/auth'
import type {
  CalendarAssignment,
  StudentEnrolledClassDTO,
  EnrolledClassesResponse,
  EnrollUnenrollRequest,
  EnrollUnenrollResponse,
  StudentAssignmentDTO,
  StudentSubmissionDTO,
  StudentSubmitAssignmentRequest,
  PostDTO,
  PostCommentDTO,
  CreatePostCommentRequest
} from '../types'

// ============================================
// STUDENT CLASS API
// ============================================

export const studentClassApi = {
  /**
   * GET /api/student/classes/enrolled
   * Lấy danh sách các lớp đã đăng ký của student
   * Query params: class_id (optional) - filter theo class_id cụ thể
   *
   * Sử dụng axios interceptor với header:
   * - Authorization: Bearer <accessToken>
   * - user-idToken: <idToken>
   */
  getEnrolledClasses: async (classId?: string): Promise<StudentEnrolledClassDTO[]> => {
    // Lấy tokens từ Cognito session
    const session = await fetchAuthSession()
    const accessToken = session.tokens?.accessToken?.toString()
    const idToken = session.tokens?.idToken?.toString()

    if (!accessToken || !idToken) {
      throw new Error('Không tìm thấy token xác thực')
    }

    // Build query string - gửi cả class_id và classId để đảm bảo BE nhận được
    const queryParams = new URLSearchParams()
    if (classId) {
      // Normalize classId - remove CLASS# prefix if present
      const normalizedClassId = classId.replace('CLASS#', '')
      queryParams.append('class_id', normalizedClassId)
      queryParams.append('classId', normalizedClassId)
    }

    const queryString = queryParams.toString()
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const url = `${baseUrl}/api/student/classes/enrolled${queryString ? `?${queryString}` : ''}`

    // Gọi API với header giống axios interceptor
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'user-idToken': idToken
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Lỗi khi lấy danh sách lớp đã đăng ký')
    }

    const data = await response.json()
    // BE trả về { data: [...], count, message, status }
    return data.data || data.results || []
  },

  /**
   * POST /api/student/enroll
   * Enroll hoặc Unenroll một lớp học
   * Body: { classId, password, action }
   * Headers: Authorization + user-idToken
   */
  enrollOrUnenroll: async (request: {
    classId: string
    password?: string
    action: 'enroll' | 'unenroll'
  }): Promise<EnrollUnenrollResponse> => {
    // Lấy tokens từ Cognito session
    const session = await fetchAuthSession()
    const accessToken = session.tokens?.accessToken?.toString()
    const idToken = session.tokens?.idToken?.toString()

    if (!accessToken || !idToken) {
      throw new Error('Không tìm thấy token xác thực')
    }

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/api/student/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'user-idToken': idToken
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Lỗi khi đăng ký lớp học')
    }

    const data = await response.json()
    return data
  },

  /**
   * Enroll vào một lớp học (cần password)
   */
  enroll: async (classId: string, password: string): Promise<EnrollUnenrollResponse> => {
    return studentClassApi.enrollOrUnenroll({
      classId,
      password,
      action: 'enroll'
    })
  },

  /**
   * Unenroll khỏi một lớp học
   */
  unenroll: async (classId: string): Promise<EnrollUnenrollResponse> => {
    return studentClassApi.enrollOrUnenroll({
      classId,
      action: 'unenroll'
    })
  }
}

// ============================================
// STUDENT ASSIGNMENT API
// ============================================

export interface StudentClassAssignmentDTO {
  id: string | number
  title: string
  type: 'homework' | 'project' | 'midterm' | 'final'
  deadline: string
  is_submitted: boolean
  score: number | null
  max_score: number
  description?: string
  class_id?: string
  created_at?: string
  updated_at?: string
}

export const studentAssignmentApi = {
  /**
   * GET /api/student/assignments?classId=xxx
   * Lấy danh sách bài tập của một lớp (chỉ lấy bài đã Publish)
   * @param classId - ID của lớp học (required)
   */
  getAssignmentsByClass: async (classId: string): Promise<StudentClassAssignmentDTO[]> => {
    const { data } = await api.get('/api/student/assignments', {
      params: { classId }
    })
    // BE trả về { data: [...], count, message, status } hoặc array trực tiếp
    return (data as any).data || data.results || (Array.isArray(data) ? data : [])
  },

  /**
   * GET /student/assignments (legacy)
   * Lấy danh sách tất cả assignments của student
   */
  getAssignments: async (params?: { class_id?: number }): Promise<StudentAssignmentDTO[]> => {
    const { data } = await api.get<{ results: StudentAssignmentDTO[] }>('/student/assignments', { params })
    return data.results || []
  },

  /**
   * GET /student/assignments/:id
   * Lấy chi tiết một assignment
   */
  getAssignmentById: async (assignmentId: number): Promise<StudentAssignmentDTO> => {
    const { data } = await api.get<StudentAssignmentDTO>(`/student/assignments/${assignmentId}`)
    return data
  },

  /**
   * Helper function để upload file lên S3 và trả về fileKey
   */
  _uploadFileToS3: async (file: File): Promise<{ fileKey: string }> => {
    // Lấy presigned URL
    const { data: presignedData } = await api.get('/api/upload/presigned-url', {
      params: { fileName: file.name }
    })
    console.log('Presigned URL response:', presignedData)

    const { uploadUrl, fileKey } = presignedData
    if (!uploadUrl || !fileKey) {
      throw new Error('Không nhận được link upload từ server')
    }

    // Upload file lên S3
    console.log('Uploading to S3:', uploadUrl)
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: file
    })

    if (!uploadResponse.ok) {
      throw new Error('Lỗi khi upload file lên S3')
    }
    console.log('Upload to S3 SUCCESS, fileKey:', fileKey)

    return { fileKey }
  },

  /**
   * POST /api/student/submit
   * Tạo submission mới (lần đầu nộp bài)
   * Body: { class_id, assignmentId, content, fileUrl, fileName }
   *
   * API này yêu cầu header đặc biệt:
   * - Authorization: Bearer <idToken>
   * - user-idToken: <idToken>
   */
  createSubmission: async (request: {
    classId: string
    assignmentId: string
    file: File
    content?: string
  }): Promise<StudentSubmissionDTO> => {
    // Lấy idToken từ Cognito session
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) {
      throw new Error('Không tìm thấy token xác thực')
    }

    // Normalize IDs
    const normalizedClassId = request.classId.replace('CLASS#', '')
    let normalizedAssignmentId = request.assignmentId
    if (!normalizedAssignmentId.startsWith('ASS_') && !normalizedAssignmentId.includes('#')) {
      normalizedAssignmentId = `ASS_${normalizedAssignmentId}`
    }
    normalizedAssignmentId = normalizedAssignmentId.replace('ASSIGNMENT#', 'ASS_')

    // Upload file to S3
    console.log('=== CREATE SUBMISSION: Upload file ===')
    const { fileKey } = await studentAssignmentApi._uploadFileToS3(request.file)

    // Call POST API với header đặc biệt (dùng idToken cho cả Authorization)
    console.log('=== CREATE SUBMISSION: POST to Backend ===')
    const requestBody = {
      class_id: normalizedClassId,
      assignmentId: normalizedAssignmentId,
      content: request.content || '',
      fileUrl: fileKey,
      fileName: request.file.name
    }
    console.log('Request body:', JSON.stringify(requestBody, null, 2))

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/api/student/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
        'user-idToken': idToken
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log('Error response:', errorData)
      throw new Error(errorData.message || 'Lỗi khi nộp bài')
    }

    const data = await response.json()
    return data.data || data
  },

  /**
   * PUT /api/student/assignments/{assignment_id}/submit
   * Cập nhật submission (nộp lại bài)
   * Body: { class_id, content, fileUrl, fileName }
   *
   * API này yêu cầu header đặc biệt:
   * - Authorization: Bearer <idToken>
   * - user-idToken: <idToken>
   */
  updateSubmission: async (request: {
    classId: string
    assignmentId: string
    file: File
    content?: string
  }): Promise<StudentSubmissionDTO> => {
    // Lấy idToken từ Cognito session
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) {
      throw new Error('Không tìm thấy token xác thực')
    }

    // Normalize IDs
    const normalizedClassId = request.classId.replace('CLASS#', '')
    let normalizedAssignmentId = request.assignmentId
    if (!normalizedAssignmentId.startsWith('ASS_') && !normalizedAssignmentId.includes('#')) {
      normalizedAssignmentId = `ASS_${normalizedAssignmentId}`
    }
    normalizedAssignmentId = normalizedAssignmentId.replace('ASSIGNMENT#', 'ASS_')

    // Upload file to S3
    console.log('=== UPDATE SUBMISSION: Upload file ===')
    const { fileKey } = await studentAssignmentApi._uploadFileToS3(request.file)

    // Call PUT API với header đặc biệt (dùng idToken cho cả Authorization)
    console.log('=== UPDATE SUBMISSION: PUT to Backend ===')
    const requestBody = {
      class_id: normalizedClassId,
      content: request.content || '',
      fileUrl: fileKey,
      fileName: request.file.name
    }
    console.log('URL:', `/api/student/assignments/${normalizedAssignmentId}/submit`)
    console.log('Request body:', JSON.stringify(requestBody, null, 2))

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/api/student/assignments/${normalizedAssignmentId}/submit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
        'user-idToken': idToken
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log('Error response:', errorData)
      throw new Error(errorData.message || 'Lỗi khi cập nhật bài nộp')
    }

    const data = await response.json()
    return data.data || data
  },

  /**
   * submitAssignment - wrapper function để tự động chọn POST hoặc PUT
   * @param isResubmit - true nếu đang nộp lại (dùng PUT), false nếu nộp mới (dùng POST)
   */
  submitAssignment: async (
    request: {
      classId: string
      assignmentId: string
      file: File
      content?: string
    },
    isResubmit: boolean = false
  ): Promise<StudentSubmissionDTO> => {
    if (isResubmit) {
      return studentAssignmentApi.updateSubmission(request)
    } else {
      return studentAssignmentApi.createSubmission(request)
    }
  },

  /**
   * GET /api/student/assignments/get-submisstions?assignmentId=xxx
   * Lấy submission của student theo assignment
   *
   * NOTE: Endpoint có typo "submisstions" (2 chữ 's') theo Swagger
   *
   * API này yêu cầu header đặc biệt:
   * - Authorization: Bearer <idToken> (idToken, không phải accessToken)
   * - user-idToken: <idToken>
   *
   * Query params:
   * - assignmentId: ID của bài tập (ASS_xxx)
   */
  getMySubmission: async (assignmentId: string): Promise<StudentSubmissionDTO | null> => {
    // Lấy idToken từ Cognito session
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) {
      throw new Error('Không tìm thấy token xác thực')
    }

    // Normalize assignmentId - ensure it has ASS_ prefix
    let normalizedAssignmentId = assignmentId
    if (!normalizedAssignmentId.startsWith('ASS_') && !normalizedAssignmentId.includes('#')) {
      normalizedAssignmentId = `ASS_${normalizedAssignmentId}`
    }
    normalizedAssignmentId = normalizedAssignmentId.replace('ASSIGNMENT#', 'ASS_')

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    // Gọi với query param assignmentId theo Swagger - NOTE: endpoint có typo "submisstions"
    const url = `${baseUrl}/api/student/assignments/get-submisstions?assignmentId=${encodeURIComponent(normalizedAssignmentId)}`

    console.log('=== GET SUBMISSION DEBUG ===')
    console.log('URL:', url)
    console.log('Method: GET')
    console.log('assignmentId:', normalizedAssignmentId)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
        'user-idToken': idToken
      }
    })

    console.log('Response status:', response.status)

    if (!response.ok) {
      // Nếu 404 hoặc không có submission thì return null (chưa nộp bài)
      if (response.status === 404) {
        console.log('No submission found (404)')
        return null
      }
      const errorData = await response.json().catch(() => ({}))
      console.log('Error response:', errorData)
      throw new Error(errorData.message || 'Lỗi khi lấy thông tin bài nộp')
    }

    const data = await response.json()
    console.log('Submission data:', data)
    // BE trả về { data: {...} } hoặc trực tiếp object hoặc array
    const result = data.data || data
    // Nếu là array, filter theo assignmentId
    if (Array.isArray(result)) {
      const found = result.find(
        (s: any) => s.assignment_id === normalizedAssignmentId || s.assignmentId === normalizedAssignmentId
      )
      return found || null
    }
    return result || null
  },

  /**
   * GET /student/assignments/calendar
   * Lấy danh sách bài tập cho calendar
   */
  getCalendarAssignments: async (month?: number, year?: number): Promise<CalendarAssignment[]> => {
    const params: Record<string, number> = {}
    if (month) params.month = month
    if (year) params.year = year

    const { data } = await api.get('/student/assignments/calendar', { params })
    return data.assignments || data || []
  }
}

// ============================================
// STUDENT POST/COMMENT API
// ============================================

export interface StudentPostDTO {
  id: string
  class_id: string
  title?: string
  content: string
  author_id: string
  author_name?: string
  created_at: string
  updated_at?: string
  attachments?: string[]
  comments_count?: number
  likes_count?: number
}

export const studentPostApi = {
  /**
   * GET /api/student/classes/{class_id}/posts
   * Lấy danh sách posts của một lớp (student view)
   * @param classId - ID của lớp học
   * @param postId - (optional) filter theo post_id cụ thể
   *
   * API này yêu cầu header đặc biệt:
   * - Authorization: Bearer <idToken>
   * - user-idToken: <idToken>
   */
  getPosts: async (classId: string, postId?: string): Promise<StudentPostDTO[]> => {
    // Lấy idToken từ Cognito session
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) {
      throw new Error('Không tìm thấy token xác thực')
    }

    // Build query string
    const queryParams = new URLSearchParams()
    if (postId) {
      queryParams.append('post_id', postId)
    }

    const queryString = queryParams.toString()
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const url = `${baseUrl}/api/student/classes/${classId}/posts${queryString ? `?${queryString}` : ''}`

    // Gọi API với header đặc biệt: cả Authorization và user-idToken đều dùng idToken
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
        'user-idToken': idToken
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Lỗi khi lấy danh sách bài viết')
    }

    const data = await response.json()
    // BE trả về { data: [...], count, message, status } hoặc array trực tiếp
    return data.data || data.results || (Array.isArray(data) ? data : [])
  },

  /**
   * GET /api/student/classes/{class_id}/posts với post_id
   * Lấy chi tiết một post
   */
  getPostById: async (classId: string, postId: string): Promise<StudentPostDTO | null> => {
    const posts = await studentPostApi.getPosts(classId, postId)
    return posts.length > 0 ? posts[0] : null
  },

  /**
   * POST /api/student/classes/{class_id}/posts
   * Tạo post mới trong lớp học (nếu student được phép)
   *
   * Sử dụng S3 Presigned URL flow cho file attachments:
   * 1. Upload files lên S3 trước
   * 2. Gửi fileKeys trong JSON body
   */
  createPost: async (
    classId: string,
    request: { title?: string; content: string; attachments?: File[] }
  ): Promise<StudentPostDTO> => {
    // Upload files to S3 first if any (dùng axios để có headers tự động)
    let fileKeys: string[] = []
    if (request.attachments && request.attachments.length > 0) {
      for (const file of request.attachments) {
        // Step 1: Get presigned URL (dùng axios)
        const { data: presignedData } = await api.get('/api/upload/presigned-url', {
          params: { fileName: file.name }
        })

        const { uploadUrl, fileKey } = presignedData

        // Step 2: Upload to S3 (không dùng Authorization header)
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: file
        })

        if (!uploadResponse.ok) {
          throw new Error('Lỗi khi upload file lên S3')
        }

        fileKeys.push(fileKey)
      }
    }

    // Step 3: Call API with fileKeys (dùng axios)
    const { data } = await api.post(`/api/student/classes/${classId}/posts`, {
      title: request.title || '',
      content: request.content,
      classId: classId,
      fileKeys: fileKeys.length > 0 ? fileKeys : undefined
    })

    return data.data || data
  },

  /**
   * POST /api/student/posts/{post_id}/comments
   * Tạo comment cho một post
   *
   * API này yêu cầu header đặc biệt:
   * - Authorization: Bearer <idToken>
   * - user-idToken: <idToken>
   *
   * Body: { content, parentId, attachmentUrl, postId }
   */
  createComment: async (
    postId: string,
    request: { content: string; parentId?: string; attachment?: File }
  ): Promise<PostCommentDTO> => {
    // Lấy idToken từ Cognito session
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) {
      throw new Error('Không tìm thấy token xác thực')
    }

    // Upload file to S3 first if any
    let attachmentUrl: string | undefined
    if (request.attachment) {
      const { data: presignedData } = await api.get('/api/upload/presigned-url', {
        params: { fileName: request.attachment.name }
      })

      const uploadResponse = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: request.attachment
      })

      if (!uploadResponse.ok) {
        throw new Error('Lỗi khi upload file lên S3')
      }

      attachmentUrl = presignedData.fileKey
    }

    // Call API with special headers
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    // URL encode postId vì có thể chứa ký tự đặc biệt (timestamp format)
    const encodedPostId = encodeURIComponent(postId)
    const url = `${baseUrl}/api/student/posts/${encodedPostId}/comments`

    const requestBody = {
      content: request.content,
      parentId: request.parentId || null,
      attachmentUrl: attachmentUrl || null,
      postId: postId // Giữ nguyên postId trong body (không encode)
    }

    // Debug logging
    console.log('=== STUDENT CREATE COMMENT DEBUG ===')
    console.log('Original postId:', postId)
    console.log('Encoded postId:', encodedPostId)
    console.log('URL:', url)
    console.log('Method: POST')
    console.log('Headers:', {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken.substring(0, 50)}...`,
      'user-idToken': `${idToken.substring(0, 50)}...`
    })
    console.log('Body:', JSON.stringify(requestBody, null, 2))
    console.log('=== END DEBUG ===')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
        'user-idToken': idToken
      },
      body: JSON.stringify(requestBody)
    })

    console.log('Response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log('Error response:', errorData)
      throw new Error(errorData.message || 'Lỗi khi tạo bình luận')
    }

    const data = await response.json()
    return data.data || data
  },

  /**
   * GET /api/student/posts/{post_id}/comments
   * Lấy danh sách comments của một post
   *
   * API này yêu cầu header đặc biệt
   */
  getComments: async (postId: string): Promise<PostCommentDTO[]> => {
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) {
      throw new Error('Không tìm thấy token xác thực')
    }

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    // URL encode postId vì có thể chứa ký tự đặc biệt (timestamp format)
    const encodedPostId = encodeURIComponent(postId)
    console.log('=== GET COMMENTS DEBUG ===')
    console.log('Original postId:', postId)
    console.log('Encoded postId:', encodedPostId)

    const response = await fetch(`${baseUrl}/api/student/posts/${encodedPostId}/comments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
        'user-idToken': idToken
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Lỗi khi lấy bình luận')
    }

    const data = await response.json()
    return data.data || data.results || (Array.isArray(data) ? data : [])
  },

  /**
   * DELETE /api/student/comments/{id}
   * Xóa comment
   *
   * API này yêu cầu header đặc biệt
   */
  deleteComment: async (commentId: string): Promise<void> => {
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) {
      throw new Error('Không tìm thấy token xác thực')
    }

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/api/student/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'user-idToken': idToken
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Lỗi khi xóa bình luận')
    }
  },

  /**
   * POST /classes/:class_id/posts/:post_id/like
   * Like/unlike một post
   */
  toggleLike: async (classId: string, postId: string): Promise<{ message: string; like_count: number }> => {
    const { data } = await api.post<{ message: string; like_count: number }>(
      `/api/student/classes/${classId}/posts/${postId}/like`
    )
    return data
  }
}

// ============================================
// STUDENT NOTIFICATION API
// ============================================

export interface StudentNotificationDTO {
  id: string
  title: string
  content: string
  type: string // "SYSTEM_ALERT", "INFO", "CLASS", "SYSTEM", etc.
  isRead: boolean
  createdAt: string
  className?: string
  classId?: string
}

export const studentNotificationApi = {
  /**
   * GET /api/student/notifications
   * Lấy danh sách notifications của student
   * @param type - 'system' hoặc 'class'
   * @param classId - (optional) filter theo classId khi type='class'
   */
  getNotifications: async (type: 'system' | 'class', classId?: string): Promise<StudentNotificationDTO[]> => {
    const params: Record<string, string> = { type }
    if (type === 'class' && classId) {
      params.class_id = classId
    }

    const { data } = await api.get('/api/student/notifications', { params })
    // BE trả về { data: [...], count, message, status }
    return (data as any).data || data.results || []
  },

  /**
   * Lấy tất cả notifications (system + class)
   */
  getAllNotifications: async (): Promise<StudentNotificationDTO[]> => {
    const [systemNotis, classNotis] = await Promise.all([
      studentNotificationApi.getNotifications('system'),
      studentNotificationApi.getNotifications('class')
    ])
    return [...systemNotis, ...classNotis]
  },

  /**
   * Lấy notifications của một class cụ thể
   */
  getClassNotifications: async (classId: string): Promise<StudentNotificationDTO[]> => {
    return studentNotificationApi.getNotifications('class', classId)
  },

  /**
   * Lấy system notifications
   */
  getSystemNotifications: async (): Promise<StudentNotificationDTO[]> => {
    return studentNotificationApi.getNotifications('system')
  }
}

// ============================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================

// Keep old function names for backward compatibility
export const fetchEnrolledClasses = studentClassApi.getEnrolledClasses
export const enrollOrUnenrollClass = studentClassApi.enrollOrUnenroll
export const enrollClass = studentClassApi.enroll
export const unenrollClass = studentClassApi.unenroll
export const fetchCalendarAssignments = studentAssignmentApi.getCalendarAssignments

export default {
  classes: studentClassApi,
  assignments: studentAssignmentApi,
  posts: studentPostApi,
  notifications: studentNotificationApi
}
