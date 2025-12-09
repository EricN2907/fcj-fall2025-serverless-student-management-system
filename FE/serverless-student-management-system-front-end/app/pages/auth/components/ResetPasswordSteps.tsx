import { Eye, EyeOff, Mail, KeyRound, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  PinInput,
} from '@chakra-ui/react'
import StepIndicator from './StepIndicator'

type Step = 'email' | 'verify' | 'newPassword' | 'success'

interface ResetPasswordStepsProps {
  step: Step
  email: string
  setEmail: (email: string) => void
  pinValue: string[]
  newPassword: string
  setNewPassword: (password: string) => void
  confirmPassword: string
  setConfirmPassword: (password: string) => void
  showPassword: boolean
  setShowPassword: (show: boolean) => void
  showConfirmPassword: boolean
  setShowConfirmPassword: (show: boolean) => void
  localError: string | null
  isLoading: boolean
  onSendCode: (e: React.FormEvent) => void
  onPinChange: (value: string[]) => void
  onResetPassword: (e: React.FormEvent) => void
  onResendCode: () => void
  onBack: () => void
  onNavigateToLogin: () => void
}

export default function ResetPasswordSteps({
  step,
  email,
  setEmail,
  pinValue,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  localError,
  isLoading,
  onSendCode,
  onPinChange,
  onResetPassword,
  onResendCode,
  onBack,
  onNavigateToLogin,
}: ResetPasswordStepsProps) {
  
  // Step 1: Enter Email
  if (step === 'email') {
    return (
      <form onSubmit={onSendCode} className="login-form">
        <StepIndicator currentStep={step} />
        
        <Box textAlign="center" mb={4}>
          <Box
            w="60px"
            h="60px"
            borderRadius="full"
            bg="orange.100"
            display="flex"
            alignItems="center"
            justifyContent="center"
            mx="auto"
            mb={3}
          >
            <Mail size={28} color="#dd7323" />
          </Box>
          <h2 style={{ margin: 0 }}>Quên mật khẩu?</h2>
          <p className="form-subtitle">Nhập email của bạn để nhận mã xác nhận</p>
        </Box>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {localError && (
          <Box
            color="red.500"
            fontSize="14px"
            mb={3}
            p={2}
            bg="red.50"
            borderRadius="md"
            border="1px solid"
            borderColor="red.200"
          >
            {localError}
          </Box>
        )}

        <button 
          type="submit" 
          className="btn-submit"
          disabled={isLoading}
        >
          {isLoading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
        </button>

        <button 
          type="button"
          className="btn-back"
          onClick={onNavigateToLogin}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Quay lại đăng nhập
        </button>
      </form>
    )
  }

  // Step 2: Verify PIN Code
  if (step === 'verify') {
    return (
      <div className="login-form">
        <StepIndicator currentStep={step} />
        
        <Box textAlign="center" mb={4}>
          <Box
            w="60px"
            h="60px"
            borderRadius="full"
            bg="orange.100"
            display="flex"
            alignItems="center"
            justifyContent="center"
            mx="auto"
            mb={3}
          >
            <KeyRound size={28} color="#dd7323" />
          </Box>
          <h2 style={{ margin: 0 }}>Nhập mã xác nhận</h2>
          <p className="form-subtitle">
            Chúng tôi đã gửi mã 6 số đến<br />
            <strong style={{ color: '#dd7323' }}>{email}</strong>
          </p>
        </Box>

        <VStack gap={6}>
          <PinInput.Root
            size="lg"
            otp
            value={pinValue}
            onValueChange={(e) => onPinChange(e.value)}
            disabled={isLoading}
          >
            <PinInput.HiddenInput />
            <PinInput.Control>
              <HStack gap={2} justify="center">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <PinInput.Input
                    key={index}
                    index={index}
                    style={{
                      width: '48px',
                      height: '56px',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      borderRadius: '12px',
                      border: '2px solid #e2e8f0',
                    }}
                  />
                ))}
              </HStack>
            </PinInput.Control>
          </PinInput.Root>

          {localError && (
            <Box
              color="red.500"
              fontSize="14px"
              p={2}
              bg="red.50"
              borderRadius="md"
              border="1px solid"
              borderColor="red.200"
              w="full"
              textAlign="center"
            >
              {localError}
            </Box>
          )}

          <Text fontSize="sm" color="gray.500" textAlign="center">
            Không nhận được mã?{' '}
            <Button
              variant="plain"
              size="sm"
              color="#dd7323"
              fontWeight="600"
              onClick={onResendCode}
              disabled={isLoading}
              p={0}
              h="auto"
            >
              <RefreshCw size={14} style={{ marginRight: '4px' }} />
              Gửi lại
            </Button>
          </Text>

          <Button
            variant="outline"
            w="full"
            onClick={onBack}
            disabled={isLoading}
          >
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Quay lại
          </Button>
        </VStack>
      </div>
    )
  }

  // Step 3: Set New Password
  if (step === 'newPassword') {
    return (
      <form onSubmit={onResetPassword} className="login-form">
        <StepIndicator currentStep={step} />
        
        <Box textAlign="center" mb={4}>
          <Box
            w="60px"
            h="60px"
            borderRadius="full"
            bg="orange.100"
            display="flex"
            alignItems="center"
            justifyContent="center"
            mx="auto"
            mb={3}
          >
            <KeyRound size={28} color="#dd7323" />
          </Box>
          <h2 style={{ margin: 0 }}>Tạo mật khẩu mới</h2>
          <p className="form-subtitle">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </Box>

        <div className="form-group">
          <label htmlFor="newPassword">Mật khẩu mới</label>
          <div className="password-input">
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <small style={{ color: '#6b7280', fontSize: '12px' }}>
            Ít nhất 8 ký tự, chữ hoa, chữ thường và ký tự đặc biệt
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
          <div className="password-input">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {localError && (
          <Box
            color="red.500"
            fontSize="14px"
            mb={3}
            p={2}
            bg="red.50"
            borderRadius="md"
            border="1px solid"
            borderColor="red.200"
          >
            {localError}
          </Box>
        )}

        <button 
          type="submit" 
          className="btn-submit"
          disabled={isLoading}
        >
          {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
        </button>

        <button 
          type="button"
          className="btn-back"
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Quay lại
        </button>
      </form>
    )
  }

  // Step 4: Success
  return (
    <div className="login-form" style={{ textAlign: 'center' }}>
      <Box
        w="80px"
        h="80px"
        borderRadius="full"
        bg="green.100"
        display="flex"
        alignItems="center"
        justifyContent="center"
        mx="auto"
        mb={4}
      >
        <CheckCircle size={40} color="#10b981" />
      </Box>
      
      <h2 style={{ margin: '0 0 8px 0', color: '#10b981' }}>Thành công!</h2>
      <p className="form-subtitle">
        Mật khẩu của bạn đã được đặt lại thành công.
        <br />
        Đang chuyển đến trang đăng nhập...
      </p>

      <Box mt={4}>
        <Button
          bg="#dd7323"
          color="white"
          w="full"
          size="lg"
          onClick={onNavigateToLogin}
          _hover={{ bg: '#c2621a' }}
        >
          Đăng nhập ngay
        </Button>
      </Box>
    </div>
  )
}
