import React, { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Library,
  BarChart2,
  Settings,
  Menu,
  MessageSquarePlus,
  ShieldAlert,
  ChevronLeft
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import UserMenu from './UserMenu'
import NotificationBell from '../notifications/NotificationBell'

const SidebarItem: React.FC<{
  to: string
  icon: React.ReactNode
  label: string
  isCollapsed: boolean
  onClick?: () => void
}> = ({ to, icon, label, isCollapsed, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={isCollapsed ? label : ''}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-3 mx-2 rounded-lg transition-all duration-200 font-medium whitespace-nowrap overflow-hidden ${
          isActive
            ? 'bg-[#3a4b66] text-white border-l-4 border-[#dd7323] shadow-lg'
            : 'text-slate-300 hover:bg-[#324057] hover:text-[#dd7323]'
        } ${isCollapsed ? 'justify-center' : ''}`
      }
    >
      <div className='shrink-0'>{icon}</div>
      <span className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
        {label}
      </span>
    </NavLink>
  )
}

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Mobile state
  const [isCollapsed, setIsCollapsed] = useState(false) // Desktop state
  const location = useLocation()
  const { user } = useAuthStore()

  const toggleSidebarMobile = () => setIsSidebarOpen(!isSidebarOpen)
  const toggleSidebarDesktop = () => setIsCollapsed(!isCollapsed)

  return (
    <div className='admin-layout flex h-screen w-full overflow-hidden bg-slate-50 font-sans'>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className='fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm'
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 bg-[#293548] border-r border-slate-700 transform transition-all duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none
          ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        {/* Sidebar Header with Integrated Toggle */}
        <div
          className={`flex items-center gap-3 border-b border-slate-700/50 bg-[#293548] h-20 transition-all px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}
        >
          {/* Logo & Text - Visible when Expanded */}
          <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'hidden' : 'flex'}`}>
            <div className='w-15 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0'>
              <img src='/Logo_AWS.png' alt='Logo' className='w-full h-full object-contain' />
            </div>
            <div className='min-w-[140px]'>
              <h1 className='text-lg font-bold text-white leading-tight whitespace-nowrap'>Uni LMS</h1>
              <span className='text-xs text-slate-400 font-medium tracking-wide whitespace-nowrap'>
                Admin Dashboard
              </span>
            </div>
          </div>

          {/* Toggle Button Logic */}
          {isCollapsed ? (
            // Collapsed: Show Logo as a button to Expand
            <button
              onClick={toggleSidebarDesktop}
              className='w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform group'
              title='Mở rộng'
            >
              <img
                src='/Logo_AWS.png'
                alt='Logo'
                className='w-full h-full object-contain group-hover:rotate-12 transition-transform'
              />
            </button>
          ) : (
            // Expanded: Show Chevron to Collapse
            <button
              onClick={toggleSidebarDesktop}
              className='text-slate-400 hover:text-white hover:bg-slate-700/50 p-1.5 rounded-lg transition-colors hidden lg:block'
              title='Thu gọn'
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        <div className='flex-1 overflow-y-auto overflow-x-hidden py-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700'>
          <div>
            {!isCollapsed && (
              <p className='px-6 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 transition-opacity duration-300'>
                Quản lý chung
              </p>
            )}
            <div className='space-y-1'>
              <SidebarItem
                to='/admin/settings'
                icon={<Settings size={20} />}
                label='Cấu hình'
                isCollapsed={isCollapsed}
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarItem
                to='/admin/analytics'
                icon={<BarChart2 size={20} />}
                label='Thống kê & Báo cáo'
                isCollapsed={isCollapsed}
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarItem
                to='/admin/notifications-send'
                icon={<MessageSquarePlus size={20} />}
                label='Gửi thông báo'
                isCollapsed={isCollapsed}
                onClick={() => setIsSidebarOpen(false)}
              />
            </div>
          </div>

          <div>
            {!isCollapsed && (
              <p className='px-6 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 transition-opacity duration-300'>
                Đào tạo & Người dùng
              </p>
            )}
            <div className='space-y-1'>
              <SidebarItem
                to='/admin/classes-management/list'
                icon={<BookOpen size={20} />}
                label='Quản lý Lớp học'
                isCollapsed={isCollapsed}
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarItem
                to='/admin/subjects-management/list'
                icon={<Library size={20} />}
                label='Quản lý Học phần'
                isCollapsed={isCollapsed}
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarItem
                to='/admin/users-management/list'
                icon={<Users size={20} />}
                label='Quản lý Người dùng'
                isCollapsed={isCollapsed}
                onClick={() => setIsSidebarOpen(false)}
              />
            </div>
          </div>

          <div>
            {!isCollapsed && (
              <p className='px-6 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 transition-opacity duration-300'>
                Hệ thống
              </p>
            )}
            <div className='space-y-1'>
              <SidebarItem
                to='/admin/audit-logs'
                icon={<ShieldAlert size={20} />}
                label='Nhật ký hệ thống'
                isCollapsed={isCollapsed}
                onClick={() => setIsSidebarOpen(false)}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className='flex-1 flex flex-col h-full overflow-hidden relative'>
        {/* Top Navbar */}
        <header className='bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-10'>
          <div className='flex items-center gap-4'>
            <button
              onClick={toggleSidebarMobile}
              className='p-2 hover:bg-slate-100 rounded-lg lg:hidden transition-colors'
            >
              <Menu size={24} className='text-slate-600' />
            </button>
          </div>

          <div className='flex items-center gap-4'>
            <NotificationBell />
            <div className='pl-4 border-l border-slate-200'>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className='flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth bg-slate-50'>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
