import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { forgotPassword, confirmForgotPassword } from '../../services/authApi'
import { toaster } from '../../components/ui/toaster'
import '../../style/login.css'

export default function ResetPasswordRoute() {
  const navigate = useNavigate()
  const { setLoading, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [step, setStep] = useState<'request' | 'confirm'>('request')
  const [localError, setLocalError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setLocalError(null)
      setSuccessMessage(null)

      // Gọi API forgot-password
      await forgotPassword({ email })

      setSuccessMessage('Mã xác nhận đã được gửi đến email của bạn!')
      setStep('confirm')

      toaster.create({
        title: 'Gửi mã thành công',
        description: 'Vui lòng kiểm tra email để lấy mã xác nhận',
        type: 'success',
        duration: 4000
      })
    } catch (error: any) {
      console.error('Reset password request failed:', error)
      const errorMessage =
        error.response?.data?.message || error.message || 'Không thể gửi mã xác nhận. Vui lòng thử lại.'
      setLocalError(errorMessage)

      toaster.create({
        title: 'Gửi mã thất bại',
        description: errorMessage,
        type: 'error',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp!')
      return
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      setLocalError('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và ký tự đặc biệt!')
      return
    }

    try {
      setLoading(true)
      setLocalError(null)

      // Gọi API confirm-forgot-password
      await confirmForgotPassword({
        email,
        confirmationCode: code,
        newPassword
      })

      setSuccessMessage('Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...')

      toaster.create({
        title: 'Đặt lại mật khẩu thành công',
        description: 'Bạn có thể đăng nhập với mật khẩu mới',
        type: 'success',
        duration: 3000
      })

      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error: any) {
      console.error('Reset password confirmation failed:', error)
      const errorMessage =
        error.response?.data?.message || error.message || 'Không thể đặt lại mật khẩu. Vui lòng kiểm tra mã xác nhận.'
      setLocalError(errorMessage)

      toaster.create({
        title: 'Đặt lại mật khẩu thất bại',
        description: errorMessage,
        type: 'error',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='login-container'>
      <div className='login-wrapper'>
        <div className='login-header'>
          <div className='login-brand'>
            <img src='/Logo_AWS_FCJ.png' alt='LMS FCJ Logo' className='login-logo' />
          </div>
        </div>

        <div className='login-body'>
          {step === 'request' ? (
            <form onSubmit={handleRequestReset} className='login-form'>
              <h2>Quên mật khẩu?</h2>
              <p className='form-subtitle'>Nhập email của bạn để nhận mã xác nhận</p>

              <div className='form-group'>
                <label htmlFor='email'>Email</label>
                <input
                  id='email'
                  type='email'
                  placeholder='your@email.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {localError && (
                <div
                  className='error-message'
                  style={{
                    color: '#ef4444',
                    fontSize: '14px',
                    marginBottom: '12px',
                    padding: '8px',
                    backgroundColor: '#fee2e2',
                    borderRadius: '4px'
                  }}
                >
                  {localError}
                </div>
              )}

              {successMessage && (
                <div
                  className='success-message'
                  style={{
                    color: '#10b981',
                    fontSize: '14px',
                    marginBottom: '12px',
                    padding: '8px',
                    backgroundColor: '#d1fae5',
                    borderRadius: '4px'
                  }}
                >
                  {successMessage}
                </div>
              )}

              <button type='submit' className='btn-submit' disabled={isLoading}>
                {isLoading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
              </button>

              <button type='button' className='btn-back' onClick={() => navigate('/login')}>
                Quay lại đăng nhập
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className='login-form'>
              <h2>Đặt lại mật khẩu</h2>
              <p className='form-subtitle'>Nhập mã xác nhận và mật khẩu mới</p>

              <div className='form-group'>
                <label htmlFor='code'>Mã xác nhận</label>
                <input
                  id='code'
                  type='text'
                  placeholder='Nhập mã 6 số từ email'
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  maxLength={6}
                />
              </div>

              <div className='form-group'>
                <label htmlFor='newPassword'>Mật khẩu mới</label>
                <div className='password-input'>
                  <input
                    id='newPassword'
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder='Mật khẩu mới (8+ ký tự)'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type='button'
                    className='password-toggle'
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <small style={{ color: '#6b7280', fontSize: '12px' }}>
                  Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và ký tự đặc biệt
                </small>
              </div>

              <div className='form-group'>
                <label htmlFor='confirmPassword'>Xác nhận mật khẩu</label>
                <div className='password-input'>
                  <input
                    id='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder='Nhập lại mật khẩu mới'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type='button'
                    className='password-toggle'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {localError && (
                <div
                  className='error-message'
                  style={{
                    color: '#ef4444',
                    fontSize: '14px',
                    marginBottom: '12px',
                    padding: '8px',
                    backgroundColor: '#fee2e2',
                    borderRadius: '4px'
                  }}
                >
                  {localError}
                </div>
              )}

              {successMessage && (
                <div
                  className='success-message'
                  style={{
                    color: '#10b981',
                    fontSize: '14px',
                    marginBottom: '12px',
                    padding: '8px',
                    backgroundColor: '#d1fae5',
                    borderRadius: '4px'
                  }}
                >
                  {successMessage}
                </div>
              )}

              <button type='submit' className='btn-submit' disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>

              <button
                type='button'
                className='btn-back'
                onClick={() => {
                  setStep('request')
                  setCode('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setLocalError(null)
                }}
              >
                Gửi lại mã
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
