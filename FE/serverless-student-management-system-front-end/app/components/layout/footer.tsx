import { Link } from 'react-router'
import { Globe, Phone, Mail, HelpCircle, LifeBuoy } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { toaster } from '../ui/toaster'

export default function Footer() {
  const { user, logoutFromCognito } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logoutFromCognito()

      toaster.create({
        title: 'Đăng xuất thành công',
        type: 'success',
        duration: 2000
      })

      // Use window.location.href for full page reload to clear all state
      setTimeout(() => {
        window.location.href = '/login'
      }, 500)
    } catch (error: any) {
      toaster.create({
        title: 'Đăng xuất thất bại',
        description: error.message || 'Có lỗi xảy ra',
        type: 'error',
        duration: 3000
      })
    }
  }

  return (
    <footer className='bg-[linear-gradient(135deg,#293548_0%,#1e2633_100%)] text-white py-8 relative font-sans text-sm'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {/* Left Column: Contact & Follow */}
          <div className='flex flex-col space-y-6'>
            <div>
              <h3 className='font-bold text-lg mb-4 text-white'>Contact us</h3>
              <div className='flex items-center space-x-6'>
                <a href='#' className='hover:text-[#e38214] transition-colors text-white'>
                  <Globe className='w-6 h-6' />
                </a>
                <a
                  href='https://wa.me/84333982942'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hover:text-[#e38214] transition-colors text-white'
                >
                  <Phone className='w-6 h-6' />
                </a>
                <a
                  href='mailto:ngannnkse182088@fpt.edu.vn'
                  className='hover:text-[#e38214] transition-colors text-white'
                >
                  <Mail className='w-6 h-6' />
                </a>
              </div>
            </div>
          </div>

          {/* Middle Column: User Info & Support Actions */}
          <div className='flex flex-col items-center text-center space-y-4'>
            <button className='flex items-center space-x-2 border border-white rounded px-4 py-2 hover:border-[#e38214] hover:text-[#e38214] transition-colors uppercase font-medium text-sm mb-2 text-white bg-transparent'>
              <LifeBuoy className='w-4 h-4' />
              <span>Contact site support</span>
            </button>

            {user && (
              <div className='space-y-1'>
                <p className='text-sm leading-relaxed text-white'>
                  You are logged in as{' '}
                  <span className='font-medium'>
                    {user.email} - {user.fullName} - {user.role}
                  </span>{' '}
                  (
                  <button
                    onClick={handleLogout}
                    className='underline hover:text-[#e38214] text-white bg-transparent border-0 p-0 cursor-pointer'
                  >
                    Log out
                  </button>
                  )
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Mobile App Badges */}
          <div className='flex flex-col items-end md:items-end sm:items-center space-y-4'>
            <h3 className='font-bold text-lg hidden md:block text-white'>Get the mobile app</h3>

            <div className='flex flex-col space-y-3 w-40'>
              {/* Google Play Store Badge Simulation */}
              <a
                href='#'
                className='block w-full border border-white rounded-lg p-2 flex items-center bg-black/10 hover:bg-black/20 hover:border-[#e38214] transition-all text-left text-white group'
              >
                <div className='mr-2 group-hover:text-[#e38214] transition-colors'>
                  <svg className='w-6 h-6' viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z' />
                  </svg>
                </div>
                <div>
                  <div className='text-[10px] uppercase leading-none group-hover:text-[#e38214] transition-colors'>
                    Get it on
                  </div>
                  <div className='text-sm font-bold leading-tight group-hover:text-[#e38214] transition-colors'>
                    Google Play
                  </div>
                </div>
              </a>

              {/* App Store Badge Simulation */}
              <a
                href='#'
                className='block w-full border border-white rounded-lg p-2 flex items-center bg-black/10 hover:bg-black/20 hover:border-[#e38214] transition-all text-left text-white group'
              >
                <div className='mr-2 group-hover:text-[#e38214] transition-colors'>
                  <svg className='w-6 h-6' viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.96,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.37 12.36,4.26 13,3.5Z' />
                  </svg>
                </div>
                <div>
                  <div className='text-[10px] uppercase leading-none group-hover:text-[#e38214] transition-colors'>
                    Download on the
                  </div>
                  <div className='text-sm font-bold leading-tight group-hover:text-[#e38214] transition-colors'>
                    App Store
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button (Question Mark) */}
      <button
        className='fixed bottom-6 right-6 w-12 h-12 bg-[#cbd5e1] hover:bg-white text-gray-800 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
        aria-label='Help'
      >
        <HelpCircle className='w-8 h-8 opacity-75' />
      </button>
    </footer>
  )
}
