import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  signIn,
  signOut,
  fetchAuthSession,
  getCurrentUser,
  fetchUserAttributes,
  confirmSignIn
} from '@aws-amplify/auth'
import type { User } from '../types'

// Profile data from API
interface ProfileData {
  id?: string
  name?: string
  email?: string
  role?: string
  codeUser?: string
  avatar?: string
  phone?: string
  dateOfBirth?: string
}

// Helper function để normalize role (API có thể trả về lowercase)
const normalizeRole = (role?: string | null): 'Student' | 'Lecturer' | 'Admin' | null => {
  if (!role) return null
  const lowerRole = role.toLowerCase()
  switch (lowerRole) {
    case 'admin':
      return 'Admin'
    case 'lecturer':
      return 'Lecturer'
    case 'student':
      return 'Student'
    default:
      return null
  }
}

// Helper function để lấy profile từ API
// BE yêu cầu: Authorization = Bearer accessToken, user-idToken = idToken
const fetchUserProfile = async (accessToken: string, idToken?: string): Promise<ProfileData | null> => {
  try {
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
    if (idToken) {
      headers['user-idToken'] = idToken
    }

    const response = await fetch(`${apiBaseUrl}/api/users/profile`, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      console.error('Failed to fetch user profile from API')
      return null
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.error('Error fetching profile from API:', error)
    return null
  }
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  idToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  pendingSignIn: boolean

  // Actions
  loginWithCognito: (email: string, password: string) => Promise<{ requireNewPassword?: boolean }>
  loginWithGoogle: (credential: string) => Promise<void>
  confirmNewPassword: (newPassword: string) => Promise<void>
  logoutFromCognito: () => Promise<void>
  refreshSession: () => Promise<string | null>
  checkAuthStatus: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      idToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      pendingSignIn: false,

      // Login with Cognito
      loginWithCognito: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null })

          // Sign in với Cognito
          const signInResult = await signIn({
            username: email,
            password: password
          })
          console.log('res login: ', signInResult)
          // Kiểm tra xem có cần bước bổ sung không
          if (!signInResult.isSignedIn && signInResult.nextStep) {
            const nextStep = signInResult.nextStep.signInStep

            // Xử lý các trường hợp đặc biệt
            switch (nextStep) {
              case 'CONFIRM_SIGN_UP':
                throw new Error('Tài khoản chưa được xác nhận. Vui lòng kiểm tra email để xác nhận tài khoản.')
              case 'RESET_PASSWORD':
                throw new Error('Bạn cần reset mật khẩu. Vui lòng sử dụng chức năng quên mật khẩu.')
              case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
                // Trả về flag để UI biết cần đổi mật khẩu
                set({ pendingSignIn: true, isLoading: false })
                return { requireNewPassword: true }
              case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
              case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
                throw new Error('Tài khoản yêu cầu xác thực 2 lớp (MFA). Chức năng này chưa được hỗ trợ.')
              case 'CONTINUE_SIGN_IN_WITH_MFA_SELECTION':
                throw new Error('Vui lòng chọn phương thức xác thực MFA.')
              case 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE':
                throw new Error('Tài khoản yêu cầu xác thực đặc biệt.')
              default:
                throw new Error(`Yêu cầu bước xác thực: ${nextStep}. Vui lòng liên hệ quản trị viên.`)
            }
          }

          if (signInResult.isSignedIn) {
            // Đợi một chút để đảm bảo session được tạo
            await new Promise((resolve) => setTimeout(resolve, 100))

            // Lấy tokens từ session
            const session = await fetchAuthSession({ forceRefresh: true })
            const tokens = session.tokens

            if (!tokens || !tokens.accessToken) {
              throw new Error('Không nhận được token từ Cognito. Vui lòng thử lại.')
            }

            // Lấy thông tin user
            const currentUser = await getCurrentUser()
            const userAttributes = await fetchUserAttributes()

            // Lấy cả 2 token từ Cognito
            const accessTokenStr = tokens.accessToken.toString()
            const idTokenStr = tokens.idToken?.toString() || ''

            // Debug: Log all tokens
            console.log('=== DEBUG TOKENS ===')
            console.log('accessToken:', accessTokenStr.substring(0, 50) + '...')
            console.log('idToken:', idTokenStr.substring(0, 50) + '...')
            console.log('=== END DEBUG TOKENS ===')

            // Fetch profile from API với cả 2 token
            // BE yêu cầu: Authorization = accessToken, user-idToken = idToken
            let profileData: ProfileData | null = null
            try {
              profileData = await fetchUserProfile(accessTokenStr, idTokenStr)
              console.log('Profile data from API:', profileData)
            } catch (error) {
              console.error('Error fetching profile:', error)
            }

            // Lấy role từ profile API trước, nếu không có thì fallback về Cognito attributes
            // Normalize role since API may return lowercase (e.g., "lecturer" instead of "Lecturer")
            const idTokenRole = tokens.idToken?.payload['custom:role']
            const attrRole = userAttributes['custom:role'] || userAttributes['custom:Role'] || userAttributes.role
            const roleValue =
              normalizeRole(profileData?.role) ||
              normalizeRole(idTokenRole as string) ||
              normalizeRole(attrRole as string) ||
              'Student'
            console.log('Final role from profile API:', roleValue)

            const userData: User = {
              id: profileData?.id || currentUser.userId,
              username: profileData?.codeUser || currentUser.username,
              email: profileData?.email || userAttributes.email || email,
              fullName: profileData?.name || userAttributes.name || userAttributes.email || '',
              role: roleValue,
              token: accessTokenStr, // Lưu accessToken
              avatar: profileData?.avatar || userAttributes.picture || '',
              phone: profileData?.phone || userAttributes.phone_number || '',
              isEmailVerified: userAttributes.email_verified === 'true',
              lastLogin: new Date().toISOString(),
              loginMethod: 'cognito',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            // Store tokens và user info
            // BE yêu cầu: Authorization = accessToken, user-idToken = idToken
            set({
              user: userData,
              accessToken: accessTokenStr, // accessToken từ Cognito
              refreshToken: null, // AWS Amplify v6 manages refresh token internally
              idToken: idTokenStr, // idToken từ Cognito
              isAuthenticated: true,
              isLoading: false,
              error: null
            })

            return {}
          } else {
            throw new Error('Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.')
          }
        } catch (error: any) {
          const errorMessage = error.message || 'Đăng nhập thất bại'
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            pendingSignIn: false
          })
          throw error
        }
      },

      // Confirm new password when required
      confirmNewPassword: async (newPassword: string) => {
        try {
          set({ isLoading: true, error: null })

          // Confirm sign in với mật khẩu mới
          const confirmResult = await confirmSignIn({
            challengeResponse: newPassword
          })

          if (confirmResult.isSignedIn) {
            // Đợi một chút để đảm bảo session được tạo
            await new Promise((resolve) => setTimeout(resolve, 100))

            // Lấy tokens từ session
            const session = await fetchAuthSession({ forceRefresh: true })
            const tokens = session.tokens

            if (!tokens || !tokens.accessToken) {
              throw new Error('Không nhận được token sau khi đổi mật khẩu.')
            }

            // Lấy thông tin user
            const currentUser = await getCurrentUser()
            const userAttributes = await fetchUserAttributes()

            // Debug: Log
            console.log('=== DEBUG CONFIRM PASSWORD ===')
            console.log('User Attributes:', userAttributes)
            console.log('ID Token Payload:', tokens.idToken?.payload)

            // Lấy role từ ID Token hoặc attributes
            const idTokenRole = tokens.idToken?.payload['custom:role']
            const attrRole = userAttributes['custom:role'] || userAttributes['custom:Role'] || userAttributes.role
            const finalRole = idTokenRole || attrRole

            // Lấy cả 2 token
            const accessTokenStr = tokens.accessToken.toString()
            const idTokenStr = tokens.idToken?.toString() || ''
            console.log('Cả 2 token nè: ' + ' ' + accessTokenStr + ' ' + idTokenStr)

            // Fetch profile from API với cả 2 token
            let profileData: ProfileData | null = null
            try {
              profileData = await fetchUserProfile(accessTokenStr, idTokenStr)
              console.log('Profile data from API (confirm password):', profileData)
            } catch (error) {
              console.error('Error fetching profile:', error)
            }

            // Normalize role since API may return lowercase
            const roleValue = normalizeRole(profileData?.role) || normalizeRole(finalRole as string) || 'Student'
            console.log('Final Role:', roleValue)
            console.log('=== END DEBUG ===')

            const userData: User = {
              id: profileData?.id || currentUser.userId,
              username: profileData?.codeUser || currentUser.username,
              email: profileData?.email || userAttributes.email || '',
              fullName: profileData?.name || userAttributes.name || userAttributes.email || '',
              role: roleValue,
              token: accessTokenStr,
              avatar: profileData?.avatar || userAttributes.picture || '',
              phone: profileData?.phone || userAttributes.phone_number || '',
              isEmailVerified: userAttributes.email_verified === 'true',
              lastLogin: new Date().toISOString(),
              loginMethod: 'cognito',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            set({
              user: userData,
              accessToken: accessTokenStr,
              refreshToken: null,
              idToken: idTokenStr,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              pendingSignIn: false
            })
          } else {
            throw new Error('Xác nhận mật khẩu thất bại.')
          }
        } catch (error: any) {
          const errorMessage = error.message || 'Đổi mật khẩu thất bại'
          set({
            error: errorMessage,
            isLoading: false
          })
          throw error
        }
      },

      // Login with Google
      loginWithGoogle: async (credential: string) => {
        try {
          set({ isLoading: true, error: null })

          // Decode JWT token từ Google để lấy email
          const payload = JSON.parse(atob(credential.split('.')[1]))
          const googleEmail = payload.email

          console.log('Google Login - Email:', googleEmail)

          // Gọi API backend để xác thực Google token và lấy thông tin user
          const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

          const response = await fetch(`${apiBaseUrl}/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              credential: credential,
              email: googleEmail
            })
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(
              errorData.message || errorData.error || 'Đăng nhập thất bại. Email này chưa được đăng ký trong hệ thống.'
            )
          }

          const data = await response.json()

          // Kiểm tra response data
          if (!data.user) {
            throw new Error('Không tìm thấy thông tin người dùng')
          }

          // Map response data to User object
          const userData: User = {
            id: data.user.id || data.user.userId || payload.sub,
            username: data.user.username || googleEmail.split('@')[0],
            email: data.user.email || googleEmail,
            fullName: data.user.fullName || data.user.fullname || payload.name || googleEmail,
            role: (data.user.role as 'Student' | 'Lecturer' | 'Admin') || 'Student',
            token: data.accessToken || data.token || credential,
            avatar: data.user.avatar || payload.picture || '',
            phone: data.user.phone || '',
            isEmailVerified: data.user.isEmailVerified ?? payload.email_verified ?? true,
            lastLogin: new Date().toISOString(),
            loginMethod: 'google',
            createdAt: data.user.createdAt || new Date().toISOString(),
            updatedAt: data.user.updatedAt || new Date().toISOString()
          }

          console.log('Google Login Success - User:', userData)

          // Lưu vào store
          set({
            user: userData,
            accessToken: data.accessToken || data.token || credential,
            refreshToken: data.refreshToken || null,
            idToken: credential,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            pendingSignIn: false
          })
        } catch (error: any) {
          console.error('Google Login Error:', error)
          const errorMessage = error.message || 'Đăng nhập Google thất bại'
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false
          })
          throw error
        }
      },

      // Logout from Cognito
      logoutFromCognito: async () => {
        try {
          set({ isLoading: true })

          // Set flag để ngăn checkAuthStatus chạy lại sau khi redirect
          sessionStorage.setItem('logging-out', 'true')

          // Sign out từ Cognito với global: true để clear tất cả sessions
          await signOut({ global: true })

          // Clear localStorage để đảm bảo không còn data persist
          localStorage.removeItem('auth-storage')

          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            pendingSignIn: false
          })
        } catch (error: any) {
          // Vẫn clear state ngay cả khi signOut fail
          localStorage.removeItem('auth-storage')
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message,
            pendingSignIn: false
          })
          throw error
        }
      },

      // Refresh session và lấy token mới
      refreshSession: async () => {
        try {
          const session = await fetchAuthSession({ forceRefresh: true })
          const tokens = session.tokens

          if (tokens?.accessToken) {
            const accessTokenStr = tokens.accessToken.toString()
            const idTokenStr = tokens.idToken?.toString() || ''

            set({
              accessToken: accessTokenStr,
              refreshToken: null,
              idToken: idTokenStr
            })

            return accessTokenStr
          }

          return null
        } catch (error) {
          console.error('Refresh session error:', error)
          return null
        }
      },

      // Check auth status khi app khởi động
      checkAuthStatus: async () => {
        try {
          // Nếu đang trong quá trình logout, skip check và redirect về login
          if (sessionStorage.getItem('logging-out') === 'true') {
            sessionStorage.removeItem('logging-out')
            set({ isAuthenticated: false, isLoading: false })
            return
          }

          set({ isLoading: true })

          const currentUser = await getCurrentUser()
          const session = await fetchAuthSession()
          const tokens = session.tokens

          if (currentUser && tokens?.accessToken) {
            const userAttributes = await fetchUserAttributes()

            // Debug: Log
            console.log('=== DEBUG CHECK AUTH ===')
            console.log('User Attributes:', userAttributes)
            console.log('ID Token Payload:', tokens.idToken?.payload)

            // Lấy role từ ID Token hoặc attributes
            const idTokenRole = tokens.idToken?.payload['custom:role']
            const attrRole = userAttributes['custom:role'] || userAttributes['custom:Role'] || userAttributes.role
            const finalRole = idTokenRole || attrRole

            // Lấy cả 2 token
            const accessTokenStr = tokens.accessToken.toString()
            const idTokenStr = tokens.idToken?.toString() || ''

            // Fetch profile from API với cả 2 token
            let profileData: ProfileData | null = null
            try {
              profileData = await fetchUserProfile(accessTokenStr, idTokenStr)
              console.log('Profile data from API (check auth):', profileData)
            } catch (error) {
              console.error('Error fetching profile:', error)
            }

            // Normalize role since API may return lowercase
            const roleValue = normalizeRole(profileData?.role) || normalizeRole(finalRole as string) || 'Student'
            console.log('Final Role:', roleValue)
            console.log('=== END DEBUG ===')

            const userData: User = {
              id: profileData?.id || currentUser.userId,
              username: profileData?.codeUser || currentUser.username,
              email: profileData?.email || userAttributes.email || '',
              fullName: profileData?.name || userAttributes.name || userAttributes.email || '',
              role: roleValue,
              token: accessTokenStr,
              avatar: profileData?.avatar || userAttributes.picture || '',
              phone: profileData?.phone || userAttributes.phone_number || '',
              isEmailVerified: userAttributes.email_verified === 'true',
              lastLogin: new Date().toISOString(),
              loginMethod: 'cognito',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            set({
              user: userData,
              accessToken: accessTokenStr,
              refreshToken: null,
              idToken: idTokenStr,
              isAuthenticated: true
            })
          } else {
            set({ isAuthenticated: false })
          }
        } catch (error) {
          console.log('Not authenticated')
          set({ isAuthenticated: false })
        } finally {
          set({ isLoading: false })
        }
      },

      // Update user action
      updateUser: (userData: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        })),

      // Set loading state
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // Set error
      setError: (error: string | null) => set({ error }),

      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        idToken: state.idToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
