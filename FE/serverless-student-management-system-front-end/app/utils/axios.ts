import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse, AxiosError } from 'axios'
import { fetchAuthSession } from '@aws-amplify/auth'
import { toaster } from '../components/ui/toaster'

// Cấu hình base URL - URL của API Gateway
const BASE_URL = import.meta.env.VITE_API_BASE_URL

// Tạo axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Flag để tránh multiple refresh requests
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })

  failedQueue = []
}

// Request interceptor - gửi CẢ HAI token trong header
// BE dùng idToken để xác thực user, accessToken cho một số API khác
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Lấy token từ Cognito session
      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken?.toString()
      const accessToken = session.tokens?.accessToken?.toString()

      console.log('=== TOKEN DEBUG ===')
      console.log('idToken exists:', !!idToken)
      console.log('accessToken exists:', !!accessToken)
      console.log('Request URL:', config.url)

      if (config.headers) {
        // BE yêu cầu:
        // - Authorization: Bearer accessToken
        // - user-idToken: idToken (để lấy email/user info)
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`
        }
        if (idToken) {
          config.headers['user-idToken'] = idToken
        }
      }

      return config
    } catch (error) {
      console.error('Error getting token:', error)
      return config
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - xử lý response và errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Xử lý lỗi từ WAF (403, 429)
    if (error.response) {
      const status = error.response.status

      // WAF Block (403 Forbidden)
      if (status === 403) {
        console.error('Request blocked by WAF or Access Denied')
        toaster.create({
          title: 'Truy cập bị từ chối',
          description: 'Yêu cầu của bạn bị chặn bởi tường lửa (WAF) hoặc bạn không có quyền truy cập.',
          type: 'error',
          duration: 5000
        })
      }

      // WAF Rate Limit (429 Too Many Requests)
      if (status === 429) {
        console.error('Rate limit exceeded')
        toaster.create({
          title: 'Quá nhiều yêu cầu',
          description: 'Bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
          type: 'warning',
          duration: 5000
        })
      }
    }

    // Xử lý lỗi 401 - Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh, đưa request vào queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            return api(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Refresh token thông qua Cognito
        const session = await fetchAuthSession({ forceRefresh: true })
        const newIdToken = session.tokens?.idToken?.toString()
        const newAccessToken = session.tokens?.accessToken?.toString()

        if (originalRequest.headers) {
          // BE yêu cầu:
          // - Authorization: Bearer accessToken
          // - user-idToken: idToken
          if (newAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          }
          if (newIdToken) {
            originalRequest.headers['user-idToken'] = newIdToken
          }
        }

        processQueue(null)
        isRefreshing = false

        // Retry request với token mới
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        isRefreshing = false

        // Không thể refresh token, redirect về login
        console.error('Token refresh failed, redirecting to login')

        // Clear auth state
        localStorage.removeItem('auth-storage')

        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      }
    }

    // Xử lý lỗi 403 - Forbidden
    if (error.response?.status === 403) {
      console.error('Access denied - insufficient permissions')
    }

    // Xử lý lỗi 500 - Server Error
    if (error.response?.status === 500) {
      console.error('Server error, please try again later')
    }

    // Hiển thị thông báo lỗi
    toaster.create({
      title: 'Lỗi',
      description: error.message || 'An error occurred',
      type: 'error',
      duration: 3000
    })

    return Promise.reject(error)
  }
)

export default api
