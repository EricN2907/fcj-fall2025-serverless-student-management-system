import api from '../utils/axios'

// ============================================
// AUTH API TYPES
// ============================================

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface CompletePasswordRequest {
  email: string
  newPassword: string
  session: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ConfirmForgotPasswordRequest {
  email: string
  confirmationCode: string
  newPassword: string
}

export interface AuthResponse {
  message: string
}

// ============================================
// AUTH API FUNCTIONS
// ============================================

/**
 * POST /api/auth/change-password
 * Đổi mật khẩu (yêu cầu đăng nhập)
 */
export const changePassword = async (data: ChangePasswordRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/change-password', data)
  return response.data
}

/**
 * POST /api/auth/complete-password
 * Hoàn tất đổi mật khẩu lần đầu (khi Cognito yêu cầu)
 */
export const completePassword = async (data: CompletePasswordRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/complete-password', data)
  return response.data
}

/**
 * POST /api/auth/forgot-password
 * Gửi yêu cầu quên mật khẩu (gửi mã xác nhận qua email)
 */
export const forgotPassword = async (data: ForgotPasswordRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/forgot-password', data)
  return response.data
}

/**
 * POST /api/auth/confirm-forgot-password
 * Xác nhận reset mật khẩu với mã xác nhận
 */
export const confirmForgotPassword = async (data: ConfirmForgotPasswordRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/confirm-forgot-password', data)
  return response.data
}

export default {
  changePassword,
  completePassword,
  forgotPassword,
  confirmForgotPassword
}
