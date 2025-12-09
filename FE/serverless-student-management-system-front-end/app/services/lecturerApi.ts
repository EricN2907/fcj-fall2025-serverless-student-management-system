import api from '../utils/axios'
import { fetchAuthSession } from '@aws-amplify/auth'
import type {
  ClassDTO,
  CreateClassRequest,
  UpdateClassRequest,
  StudentDTO,
  MaterialDTO,
  CreateMaterialRequest,
  GradeColumnDTO,
  CreateGradeColumnRequest,
  UpdateGradeColumnRequest,
  GradeDTO,
  CreateGradeRequest,
  UpdateGradeRequest,
  MessageDTO,
  CreateMessageRequest,
  UpdateReactionRequest,
  RankingDTO,
  SendNotificationRequest,
  NotificationDTO,
  SubjectAssignment,
  ProfileDTO,
  UpdateProfileRequest,
  // New types for refactored schema
  AssignmentDTO,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignmentSubmissionDTO,
  GradeSubmissionRequest,
  PostDTO,
  CreatePostRequest,
  UpdatePostRequest,
  PostCommentDTO,
  CreateCommentRequest,
  ClassDetailDTO,
  AssignmentType
} from '../types'

// Weight constants for auto-calculation
const ASSIGNMENT_WEIGHTS: Record<AssignmentType, number> = {
  homework: 0.2,
  project: 0.3,
  midterm: 0.25,
  final: 0.25
}

// ============================================
// CLASS MANAGEMENT
// ============================================

export const lecturerClassApi = {
  /**
   * GET /api/lecturer/classes
   * Lấy danh sách lớp học của GV (optional filter, search)
   * Query params: keyword, status (integer), semester
   *
   * NOTE: API này yêu cầu cả Authorization và user-idToken đều dùng idToken
   * (BE không fix được nên FE phải xử lý riêng)
   */
  getClasses: async (params?: { keyword?: string; status?: number; semester?: string }) => {
    // Lấy idToken từ Cognito session
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) {
      throw new Error('Không tìm thấy token xác thực')
    }

    // Build query string
    const queryParams = new URLSearchParams()
    if (params?.keyword) queryParams.append('keyword', params.keyword)
    if (params?.status !== undefined) queryParams.append('status', params.status.toString())
    if (params?.semester) queryParams.append('semester', params.semester)

    const queryString = queryParams.toString()
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const url = `${baseUrl}/api/lecturer/classes${queryString ? `?${queryString}` : ''}`

    // Gọi API với cả 2 header đều dùng idToken
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
      throw new Error(errorData.message || 'Lỗi khi lấy danh sách lớp học')
    }

    // BE trả về { data: [...], count, message, status }
    return response.json()
  },

  // Get class by ID
  getClassById: async (id: number) => {
    const response = await api.get<ClassDTO>(`/lecturer/classes/${id}`)
    return response.data
  },

  // Create class
  createClass: async (data: CreateClassRequest) => {
    const response = await api.post<ClassDTO>('/lecturer/classes', data)
    return response.data
  },

  /**
   * PUT /api/lecturer/classes/{id}
   * Cập nhật thông tin lớp học
   * Body: { name, password, semester, academicYear, description, teacherId, status }
   *
   * NOTE: API này yêu cầu cả Authorization và user-idToken đều dùng idToken
   */
  updateClass: async (
    id: string,
    data: {
      name?: string
      password?: string
      semester?: string
      academicYear?: string
      description?: string
      teacherId?: string
      status?: number
    }
  ) => {
    // Lấy idToken từ Cognito session
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) {
      throw new Error('Không tìm thấy token xác thực')
    }

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/api/lecturer/classes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
        'user-idToken': idToken
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Lỗi khi cập nhật lớp học')
    }

    return response.json()
  },

  // Deactivate class (soft delete) - DELETE /api/lecturer/classes/{id}
  // Chỉ thay đổi status từ 1 thành 0
  deactivateClass: async (id: string) => {
    const response = await api.delete(`/api/lecturer/classes/${id}`)
    return response.data
  },

  // Get assigned subjects
  getAssignedSubjects: async () => {
    const response = await api.get<{ results: SubjectAssignment[] }>('/lecturer/subjects')
    return response.data
  }
}

// ============================================
// STUDENT MANAGEMENT
// ============================================

export const lecturerStudentApi = {
  // List students in class - GET /api/lecturer/students/{class_id}
  getStudentsInClass: async (classId: string, params?: { keyword?: string; status?: string }) => {
    const response = await api.get(`/api/lecturer/students/${classId}`, { params })
    // BE trả về { data: [...], count, message, status }
    return response.data
  },

  // Get student details
  getStudentById: async (studentId: number) => {
    const response = await api.get<StudentDTO>(`/lecturer/students/detail/${studentId}`)
    return response.data
  }
}

// ============================================
// ASSIGNMENT/MATERIAL MANAGEMENT
// ============================================

export const lecturerMaterialApi = {
  // List materials/assignments
  getMaterials: async (classId: number, params?: { keyword?: string }) => {
    const response = await api.get<{ results: MaterialDTO[] }>(`/lecturer/assignments/${classId}`, { params })
    return response.data
  },

  // Create material/assignment
  createMaterial: async (data: CreateMaterialRequest) => {
    const formData = new FormData()
    formData.append('class_id', data.class_id.toString())
    formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    if (data.file) formData.append('file', data.file)

    const response = await api.post<MaterialDTO>('/lecturer/assignments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  // Delete material
  deleteMaterial: async (id: number) => {
    const response = await api.delete<{ message: string }>(`/lecturer/assignments/${id}`)
    return response.data
  }
}

// ============================================
// GRADE COLUMN MANAGEMENT
// ============================================

export const lecturerGradeColumnApi = {
  // List grade columns
  getGradeColumns: async (classId: number, params?: { is_active?: boolean }) => {
    const response = await api.get<{ results: GradeColumnDTO[] }>(`/lecturer/grade-columns/${classId}`, { params })
    return response.data
  },

  // Create grade column
  createGradeColumn: async (data: CreateGradeColumnRequest) => {
    const response = await api.post<GradeColumnDTO>('/lecturer/grade-columns', data)
    return response.data
  },

  // Update grade column
  updateGradeColumn: async (id: number, data: UpdateGradeColumnRequest) => {
    const response = await api.put<GradeColumnDTO>(`/lecturer/grade-columns/${id}`, data)
    return response.data
  },

  // Delete grade column (soft delete)
  deleteGradeColumn: async (id: number) => {
    const response = await api.delete<{ message: string }>(`/lecturer/grade-columns/${id}`)
    return response.data
  }
}

// ============================================
// GRADE MANAGEMENT
// ============================================

export const lecturerGradeApi = {
  // Get grades for class
  getGrades: async (classId: number) => {
    const response = await api.get<{ results: GradeDTO[] }>(`/lecturer/grades/${classId}`)
    return response.data
  },

  // Create grade
  createGrade: async (data: CreateGradeRequest) => {
    const response = await api.post<GradeDTO>('/lecturer/grades', data)
    return response.data
  },

  // Update grade
  updateGrade: async (id: number, data: UpdateGradeRequest) => {
    const response = await api.put<GradeDTO>(`/lecturer/grades/${id}`, data)
    return response.data
  },

  // Bulk create/update grades
  bulkUpdateGrades: async (grades: CreateGradeRequest[]) => {
    const response = await api.post<{ results: GradeDTO[] }>('/lecturer/grades/bulk', { grades })
    return response.data
  }
}

// ============================================
// CHAT/MESSAGE MANAGEMENT
// ============================================

export const chatApi = {
  // Get messages for class
  getMessages: async (classId: number, params?: { parent_id?: number | null }) => {
    const response = await api.get<{ results: MessageDTO[] }>(`/chat/messages/${classId}`, { params })
    return response.data
  },

  // Create message/post
  createMessage: async (data: CreateMessageRequest) => {
    const formData = new FormData()
    formData.append('class_id', data.class_id.toString())
    formData.append('type', data.type)
    if (data.content) formData.append('content', data.content)
    if (data.parent_id !== undefined && data.parent_id !== null) {
      formData.append('parent_id', data.parent_id.toString())
    }
    if (data.attachment) formData.append('attachment', data.attachment)

    const response = await api.post<MessageDTO>('/chat/messages', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  // Delete message
  deleteMessage: async (id: number) => {
    const response = await api.delete<{ message: string }>(`/chat/messages/${id}`)
    return response.data
  },

  // Update reactions
  updateReaction: async (id: number, data: UpdateReactionRequest) => {
    const response = await api.put<{ message: string; updatedReactions: Record<string, string> }>(
      `/chat/messages/${id}/reactions`,
      data
    )
    return response.data
  }
}

// ============================================
// RANKING
// ============================================

export const lecturerRankingApi = {
  // Get ranking for class
  getRanking: async (classId: number) => {
    const response = await api.get<{ results: RankingDTO[] }>(`/lecturer/ranking/${classId}`)
    return response.data
  }
}

// ============================================
// NOTIFICATIONS
// ============================================

export const lecturerNotificationApi = {
  // Send notification
  sendNotification: async (data: SendNotificationRequest) => {
    const response = await api.post<{ message: string }>('/lecturer/notifications/email', data)
    return response.data
  },

  // Get sent notifications
  getSentNotifications: async () => {
    const response = await api.get<{ results: NotificationDTO[] }>('/lecturer/notifications/sent')
    return response.data
  },

  /**
   * GET /api/notifications
   * Lấy danh sách thông báo đã nhận (system + class notifications)
   *
   * API này yêu cầu header đặc biệt:
   * - Authorization: Bearer <idToken>
   * - user-idToken: <idToken>
   */
  getReceivedNotifications: async () => {
    // Lấy idToken từ Cognito session
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) {
      throw new Error('Không tìm thấy token xác thực')
    }

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
        'user-idToken': idToken
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Lỗi khi lấy thông báo')
    }

    const data = await response.json()
    // BE trả về { data: [...], count, message, status }
    return data.data || data.results || []
  },

  // Mark notification as read
  markAsRead: async (id: number) => {
    const response = await api.patch<{ message: string }>(`/notifications/${id}/read`)
    return response.data
  }
}

// ============================================
// ASSIGNMENT MANAGEMENT (New Schema)
// ============================================

export const lecturerAssignmentApi = {
  /**
   * POST /api/lecturer/assignments
   * Tạo bài tập mới per class
   * Body: { classId, title, description, type, maxScore, weight, deadline, isPublished }
   */
  createAssignment: async (data: CreateAssignmentRequest) => {
    // Dùng weight từ form data, nếu không có thì fallback về default theo type
    const weight = data.weight ?? ASSIGNMENT_WEIGHTS[data.type]

    const response = await api.post('/api/lecturer/assignments', {
      classId: data.class_id.toString(),
      title: data.title,
      description: data.description || '',
      type: data.type,
      maxScore: data.max_score || 10,
      weight: weight,
      deadline: data.deadline,
      isPublished: data.is_published ?? true
    })

    return response.data
  },

  /**
   * GET /api/lecturer/classes/{class_id}/assignments
   * Lấy list bài tập per class (từ assignments, include materials nếu có)
   */
  getAssignments: async (classId: string, params?: { keyword?: string; type?: string }) => {
    const response = await api.get(`/api/lecturer/classes/${classId}/assignments`, { params })
    // BE trả về { data: [...], count, message, status }
    return response.data
  },

  /**
   * GET /lecturer/classes/{class_id}/assignments/{assignment_id}
   * Get assignment by ID
   */
  getAssignmentById: async (classId: number, assignmentId: number) => {
    const response = await api.get<AssignmentDTO>(`/lecturer/classes/${classId}/assignments/${assignmentId}`)
    return response.data
  },

  /**
   * PUT /api/lecturer/assignments/{id}?classId={classId}
   * Sửa bài tập/cột điểm của bài tập
   * Body: { title, description, type, maxScore, weight, deadline, isPublished }
   */
  updateAssignment: async (
    assignmentId: string,
    classId: string,
    data: {
      title?: string
      description?: string
      type?: string
      maxScore?: number
      weight?: number
      deadline?: string
      isPublished?: boolean
    }
  ) => {
    const response = await api.put(`/api/lecturer/assignments/${assignmentId}`, data, {
      params: { classId }
    })
    return response.data
  },

  /**
   * DELETE /api/lecturer/assignments/{id}?classId={classId}
   * Xóa bài tập (kiểm tra submissions trước)
   */
  deleteAssignment: async (assignmentId: string, classId: string) => {
    const response = await api.delete<{ message: string }>(`/api/lecturer/assignments/${assignmentId}`, {
      params: { classId }
    })
    return response.data
  },

  /**
   * GET /api/lecturer/assignments/get-submisstions
   * Lấy assignment_submissions của all học sinh cho một assignment cụ thể
   *
   * NOTE: Endpoint có typo "submisstions" (2 chữ 's') theo Swagger
   *
   * API này yêu cầu header đặc biệt:
   * - Authorization: Bearer <idToken>
   * - user-idToken: <idToken>
   *
   * Query params:
   * - classId: ID của lớp học
   * - assignmentId: ID của bài tập (ASS_xxx)
   */
  getSubmissions: async (classId: string, assignmentId: string) => {
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
    // NOTE: endpoint có typo "submisstions" theo Swagger
    const url = `${baseUrl}/api/lecturer/assignments/get-submisstions?classId=${encodeURIComponent(classId)}&assignmentId=${encodeURIComponent(normalizedAssignmentId)}`

    console.log('=== GET LECTURER SUBMISSIONS DEBUG ===')
    console.log('URL:', url)
    console.log('classId:', classId)
    console.log('assignmentId:', normalizedAssignmentId)

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
      throw new Error(errorData.message || 'Lỗi khi lấy danh sách bài nộp')
    }

    const data = await response.json()
    console.log('Submissions data:', data)
    // BE trả về { data: [...], count, message, status }
    return data.data || data.results || []
  },

  /**
   * POST /api/lecturer/assignments/{assignment_id}/update-grades?classId={classId}
   * Chấm điểm hoặc sửa điểm (Hợp nhất)
   * Body: { assignmentId, studentId, score, feedback }
   */
  updateGrade: async (
    assignmentId: string,
    classId: string,
    data: {
      assignmentId: string
      studentId: string
      score: number
      feedback?: string
    }
  ) => {
    const response = await api.post(`/api/lecturer/assignments/${assignmentId}/update-grades`, data, {
      params: { classId }
    })
    return response.data
  },

  /**
   * Grade a single student (convenience method)
   */
  gradeStudent: async (assignmentId: string, classId: string, studentId: string, score: number, feedback?: string) => {
    const response = await api.post(
      `/api/lecturer/assignments/${assignmentId}/update-grades`,
      {
        assignmentId,
        studentId,
        score,
        feedback: feedback || ''
      },
      { params: { classId } }
    )
    return response.data
  },

  // Publish/unpublish assignment (convenience method)
  togglePublish: async (assignmentId: string, classId: string, isPublished: boolean) => {
    const response = await api.put<AssignmentDTO>(
      `/api/lecturer/assignments/${assignmentId}`,
      { isPublished },
      { params: { classId } }
    )
    return response.data
  }
}

// ============================================
// POST MANAGEMENT (Discussion Posts - Only Lecturer creates)
// ============================================

export const lecturerPostApi = {
  /**
   * POST /api/lecturer/classes/{class_id}/posts
   * Tạo post gốc (chỉ dành cho GV)
   *
   * Sử dụng S3 Presigned URL flow cho file attachment:
   * 1. Upload file lên S3 trước
   * Dùng axios để có headers tự động (Authorization + user-idToken)
   */
  createPost: async (classId: string, data: CreatePostRequest) => {
    // Upload file to S3 first if any (dùng axios)
    let fileKey: string | undefined
    if (data.attachment) {
      // Step 1: Get presigned URL (dùng axios)
      const { data: presignedData } = await api.get('/api/upload/presigned-url', {
        params: { fileName: data.attachment.name }
      })

      // Step 2: Upload to S3 (không dùng Authorization header)
      const uploadResponse = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: data.attachment
      })

      if (!uploadResponse.ok) {
        throw new Error('Lỗi khi upload file lên S3')
      }

      fileKey = presignedData.fileKey
    }

    // Step 3: Call API with fileKey (dùng axios)
    const response = await api.post(`/api/lecturer/classes/${classId}/posts`, {
      title: data.title,
      content: data.content,
      classId: classId,
      pinned: data.is_pinned ?? false,
      fileKey: fileKey
    })

    return response.data
  },

  /**
   * GET /api/lecturer/classes/{class_id}/posts
   * Lấy danh sách posts của một lớp
   */
  getPosts: async (classId: string, params?: { keyword?: string }) => {
    const response = await api.get(`/api/lecturer/classes/${classId}/posts`, { params })
    // BE trả về { data: [...], count, message, status }
    return response.data
  },

  /**
   * GET /classes/{class_id}/posts/{post_id}
   * Lấy chi tiết một post
   */
  getPostById: async (classId: number, postId: number) => {
    const response = await api.get<PostDTO>(`/classes/${classId}/posts/${postId}`)
    return response.data
  },

  /**
   * PUT /classes/{class_id}/posts/{post_id}
   * Cập nhật post
   */
  updatePost: async (classId: number, postId: number, data: UpdatePostRequest) => {
    const response = await api.put<PostDTO>(`/classes/${classId}/posts/${postId}`, data)
    return response.data
  },

  /**
   * DELETE /api/lecturer/posts/{id}?classId={classId}
   * Xóa bài viết
   */
  deletePost: async (postId: string, classId: string) => {
    const response = await api.delete<{ message: string }>(`/api/lecturer/posts/${postId}`, {
      params: { classId }
    })
    return response.data
  },

  /**
   * POST /api/lecturer/posts/{post_id}/comments
   * GV bình luận (Gửi link ảnh từ S3)
   * Body: { content, parentId, attachmentUrl, postId }
   *
   * API này yêu cầu header đặc biệt:
   * - Authorization: Bearer <idToken>
   * - user-idToken: <idToken>
   */
  createComment: async (
    postId: string,
    data: { content: string; parentId?: string; attachment?: File }
  ): Promise<PostCommentDTO> => {
    // Lấy idToken từ Cognito session
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) {
      throw new Error('Không tìm thấy token xác thực')
    }

    // Upload file to S3 first if any
    let attachmentUrl: string | undefined
    if (data.attachment) {
      const { data: presignedData } = await api.get('/api/upload/presigned-url', {
        params: { fileName: data.attachment.name }
      })

      const uploadResponse = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: data.attachment
      })

      if (!uploadResponse.ok) {
        throw new Error('Lỗi khi upload file lên S3')
      }

      attachmentUrl = presignedData.fileKey
    }

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/api/lecturer/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
        'user-idToken': idToken
      },
      body: JSON.stringify({
        content: data.content,
        parentId: data.parentId || null,
        attachmentUrl: attachmentUrl || null,
        postId: postId
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Lỗi khi tạo bình luận')
    }

    const result = await response.json()
    return result.data || result
  },

  /**
   * GET /api/lecturer/posts/{post_id}/comments
   * Lấy danh sách bình luận của bài viết
   *
   * API này yêu cầu header đặc biệt:
   * - Authorization: Bearer <idToken>
   * - user-idToken: <idToken>
   */
  getComments: async (postId: string): Promise<PostCommentDTO[]> => {
    // Lấy idToken từ Cognito session
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) {
      throw new Error('Không tìm thấy token xác thực')
    }

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/api/lecturer/posts/${postId}/comments`, {
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
    // BE trả về { data: [...], count, message, status }
    return data.data || data.results || (Array.isArray(data) ? data : [])
  },

  /**
   * GET /posts/{post_id}/comments (legacy)
   * Lấy danh sách comments của một post
   */
  getCommentsLegacy: async (postId: number) => {
    const response = await api.get<{ results: PostCommentDTO[] }>(`/posts/${postId}/comments`)
    return response.data
  },

  // Toggle pin status (convenience method)
  togglePin: async (classId: number, postId: number, is_pinned: boolean) => {
    const response = await api.put<PostDTO>(`/classes/${classId}/posts/${postId}`, { is_pinned })
    return response.data
  },

  // Like/unlike post
  toggleLike: async (classId: number, postId: number) => {
    const response = await api.post<{ message: string; like_count: number }>(`/classes/${classId}/posts/${postId}/like`)
    return response.data
  },

  /**
   * DELETE /api/lecturer/comments/{id}?postId={postId}
   * Xóa bình luận
   *
   * API này yêu cầu header đặc biệt:
   * - Authorization: Bearer <idToken>
   * - user-idToken: <idToken>
   */
  deleteComment: async (commentId: string, postId: string): Promise<void> => {
    // Lấy idToken từ Cognito session
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) {
      throw new Error('Không tìm thấy token xác thực')
    }

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/api/lecturer/comments/${commentId}?postId=${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
        'user-idToken': idToken
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Lỗi khi xóa bình luận')
    }
  }
}

// ============================================
// PROFILE
// ============================================

export const profileApi = {
  // Get profile - Authorization header được tự động thêm bởi axios interceptor
  getProfile: async () => {
    const response = await api.get<{ data: ProfileDTO }>('/api/users/profile')
    return response.data.data
  },

  /**
   * PATCH /api/users/profile
   * Update profile - dùng axios để có headers tự động
   */
  updateProfile: async (data: UpdateProfileRequest & { avatarFile?: File }) => {
    // Upload avatar to S3 first if any (dùng axios)
    let avatarKey: string | undefined
    if (data.avatarFile) {
      // Step 1: Get presigned URL (dùng axios)
      const { data: presignedData } = await api.get('/api/upload/presigned-url', {
        params: { fileName: data.avatarFile.name }
      })

      // Step 2: Upload to S3 (không dùng Authorization header)
      const uploadResponse = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: data.avatarFile
      })

      if (!uploadResponse.ok) {
        throw new Error('Lỗi khi upload avatar lên S3')
      }

      avatarKey = presignedData.fileKey
    }

    // Step 3: Call API with avatarKey (dùng axios)
    const response = await api.patch('/api/users/profile', {
      name: data.name,
      dateOfBirth: data.dateOfBirth,
      avatarKey: avatarKey
    })

    return response.data?.data || response.data
  },

  // Change password - POST /api/auth/change-password
  changePassword: async (data: { old_password: string; new_password: string; confirm_password: string }) => {
    const response = await api.post<{ message: string }>('/api/auth/change-password', {
      oldPassword: data.old_password,
      newPassword: data.new_password
    })
    return response.data
  }
}

export default {
  classes: lecturerClassApi,
  students: lecturerStudentApi,
  materials: lecturerMaterialApi,
  gradeColumns: lecturerGradeColumnApi,
  grades: lecturerGradeApi,
  chat: chatApi,
  ranking: lecturerRankingApi,
  notifications: lecturerNotificationApi,
  profile: profileApi,
  assignments: lecturerAssignmentApi,
  posts: lecturerPostApi
}
