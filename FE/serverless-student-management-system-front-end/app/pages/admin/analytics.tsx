import React, { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import {
  Users,
  BookOpen,
  GraduationCap,
  Loader2,
  RefreshCw,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle
} from 'lucide-react'
import api from '../../utils/axios'
import { toaster } from '../../components/ui/toaster'

interface StatsData {
  totalUsers: number
  totalStudents: number
  totalLecturers: number
  totalAdmins: number
  activeUsers: number
  inactiveUsers: number
  totalClasses: number
  activeClasses: number
  inactiveClasses: number
  totalSubjects: number
  activeSubjects: number
  inactiveSubjects: number
}

interface SubjectClassCount {
  name: string
  count: number
}

const COLORS = {
  student: '#3b82f6',
  lecturer: '#8b5cf6',
  admin: '#ef4444',
  active: '#10b981',
  inactive: '#6b7280',
  orange: '#dd7323',
  green: '#22c55e'
}

const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalStudents: 0,
    totalLecturers: 0,
    totalAdmins: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalClasses: 0,
    activeClasses: 0,
    inactiveClasses: 0,
    totalSubjects: 0,
    activeSubjects: 0,
    inactiveSubjects: 0
  })
  const [subjectClassCounts, setSubjectClassCounts] = useState<SubjectClassCount[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [usersRes, classesRes, subjectsRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/classes'),
        api.get('/api/admin/subjects')
      ])

      // Parse users data
      const users = usersRes.data?.data || usersRes.data?.results || []
      const students = users.filter((u: any) => u.role === 'Student' || u.role_id === 3)
      const lecturers = users.filter((u: any) => u.role === 'Lecturer' || u.role_id === 2)
      const admins = users.filter((u: any) => u.role === 'Admin' || u.role_id === 1)
      const activeUsers = users.filter((u: any) => u.status === 1)
      const inactiveUsers = users.filter((u: any) => u.status === 0)

      // Parse classes data
      const classes = classesRes.data?.data || classesRes.data?.results || []
      const activeClasses = classes.filter((c: any) => c.status === 1)
      const inactiveClasses = classes.filter((c: any) => c.status === 0)

      // Parse subjects data
      const subjects = subjectsRes.data?.data || subjectsRes.data?.results || []
      const activeSubjects = subjects.filter((s: any) => s.status === 1)
      const inactiveSubjects = subjects.filter((s: any) => s.status === 0)

      // Count classes per subject
      const subjectMap = new Map<string, { name: string; count: number }>()
      subjects.forEach((s: any) => {
        const subjectId = s.id || s.codeSubject
        subjectMap.set(subjectId, { name: s.name || subjectId, count: 0 })
      })
      classes.forEach((c: any) => {
        const subjectId = c.subjectId || c.subject_id
        if (subjectMap.has(subjectId)) {
          const current = subjectMap.get(subjectId)!
          subjectMap.set(subjectId, { ...current, count: current.count + 1 })
        }
      })
      // Get top 6 subjects by class count
      const sortedSubjects = Array.from(subjectMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
      setSubjectClassCounts(sortedSubjects)

      setStats({
        totalUsers: users.length,
        totalStudents: students.length,
        totalLecturers: lecturers.length,
        totalAdmins: admins.length,
        activeUsers: activeUsers.length,
        inactiveUsers: inactiveUsers.length,
        totalClasses: classes.length,
        activeClasses: activeClasses.length,
        inactiveClasses: inactiveClasses.length,
        totalSubjects: subjects.length,
        activeSubjects: activeSubjects.length,
        inactiveSubjects: inactiveSubjects.length
      })
    } catch (error: any) {
      console.error('Error fetching stats:', error)
      toaster.create({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu thống kê',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // Prepare chart data
  const userRoleData = [
    { name: 'Sinh viên', value: stats.totalStudents, color: COLORS.student },
    { name: 'Giảng viên', value: stats.totalLecturers, color: COLORS.lecturer },
    { name: 'Admin', value: stats.totalAdmins, color: COLORS.admin }
  ].filter((d) => d.value > 0)

  const statusComparisonData = [
    {
      name: 'Người dùng',
      active: stats.activeUsers,
      inactive: stats.inactiveUsers
    },
    {
      name: 'Lớp học',
      active: stats.activeClasses,
      inactive: stats.inactiveClasses
    },
    {
      name: 'Môn học',
      active: stats.activeSubjects,
      inactive: stats.inactiveSubjects
    }
  ]

  const classStatusData = [
    { name: 'Hoạt động', value: stats.activeClasses, color: COLORS.active },
    { name: 'Đã đóng', value: stats.inactiveClasses, color: COLORS.inactive }
  ].filter((d) => d.value > 0)

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 size={40} className='text-[#dd7323] animate-spin mx-auto mb-3' />
          <p className='text-slate-600'>Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto space-y-8 pb-10'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-slate-800'>Thống kê & Báo cáo</h1>
          <p className='text-slate-500 mt-1'>Tổng quan dữ liệu hệ thống quản lý sinh viên.</p>
        </div>
        <button
          onClick={fetchStats}
          className='flex items-center gap-2 px-4 py-2 bg-[#dd7323] text-white rounded-xl hover:bg-[#c2621a] font-medium transition-all shadow-lg shadow-orange-200 text-sm'
        >
          <RefreshCw size={16} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-blue-100 text-sm font-medium'>Tổng người dùng</p>
              <p className='text-4xl font-bold mt-2'>{stats.totalUsers}</p>
            </div>
            <div className='p-4 bg-white/20 rounded-xl'>
              <Users size={32} />
            </div>
          </div>
          <div className='mt-4 pt-4 border-t border-white/20'>
            <p className='text-sm text-blue-100'>
              {stats.totalStudents} SV • {stats.totalLecturers} GV • {stats.totalAdmins} Admin
            </p>
          </div>
        </div>

        <div className='bg-gradient-to-br from-[#dd7323] to-orange-600 p-6 rounded-2xl text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-orange-100 text-sm font-medium'>Tổng lớp học</p>
              <p className='text-4xl font-bold mt-2'>{stats.totalClasses}</p>
            </div>
            <div className='p-4 bg-white/20 rounded-xl'>
              <GraduationCap size={32} />
            </div>
          </div>
          <div className='mt-4 pt-4 border-t border-white/20'>
            <p className='text-sm text-orange-100'>
              {stats.activeClasses} đang hoạt động • {stats.inactiveClasses} đã đóng
            </p>
          </div>
        </div>

        <div className='bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-green-100 text-sm font-medium'>Tổng môn học</p>
              <p className='text-4xl font-bold mt-2'>{stats.totalSubjects}</p>
            </div>
            <div className='p-4 bg-white/20 rounded-xl'>
              <BookOpen size={32} />
            </div>
          </div>
          <div className='mt-4 pt-4 border-t border-white/20'>
            <p className='text-sm text-green-100'>
              {stats.activeSubjects} đang hoạt động • {stats.inactiveSubjects} đã ẩn
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* User Role Distribution - Pie Chart */}
        <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-2 bg-blue-50 rounded-lg'>
              <Users size={20} className='text-blue-600' />
            </div>
            <div>
              <h3 className='text-lg font-bold text-slate-800'>Phân bố người dùng theo vai trò</h3>
              <p className='text-sm text-slate-500'>Tỷ lệ sinh viên, giảng viên, admin</p>
            </div>
          </div>
          <div className='h-72'>
            {userRoleData.length > 0 ? (
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={userRoleData}
                    cx='50%'
                    cy='50%'
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey='value'
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {userRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} người`, 'Số lượng']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-full flex items-center justify-center text-slate-400'>Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Status Comparison - Bar Chart */}
        <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-2 bg-emerald-50 rounded-lg'>
              <CheckCircle size={20} className='text-emerald-600' />
            </div>
            <div>
              <h3 className='text-lg font-bold text-slate-800'>So sánh trạng thái</h3>
              <p className='text-sm text-slate-500'>Hoạt động vs Không hoạt động</p>
            </div>
          </div>
          <div className='h-72'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={statusComparisonData} layout='vertical'>
                <CartesianGrid strokeDasharray='3 3' horizontal={true} vertical={false} />
                <XAxis type='number' />
                <YAxis dataKey='name' type='category' width={80} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey='active' name='Hoạt động' fill={COLORS.active} radius={[0, 4, 4, 0]} />
                <Bar dataKey='inactive' name='Không hoạt động' fill={COLORS.inactive} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Class Status - Pie Chart */}
        <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-2 bg-orange-50 rounded-lg'>
              <GraduationCap size={20} className='text-[#dd7323]' />
            </div>
            <div>
              <h3 className='text-lg font-bold text-slate-800'>Trạng thái lớp học</h3>
              <p className='text-sm text-slate-500'>Tỷ lệ lớp đang hoạt động và đã đóng</p>
            </div>
          </div>
          <div className='h-72'>
            {classStatusData.length > 0 ? (
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={classStatusData}
                    cx='50%'
                    cy='50%'
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey='value'
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {classStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} lớp`, 'Số lượng']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-full flex items-center justify-center text-slate-400'>Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Classes per Subject - Bar Chart */}
        <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-2 bg-green-50 rounded-lg'>
              <BookOpen size={20} className='text-green-600' />
            </div>
            <div>
              <h3 className='text-lg font-bold text-slate-800'>Số lớp theo môn học</h3>
              <p className='text-sm text-slate-500'>Top môn học có nhiều lớp nhất</p>
            </div>
          </div>
          <div className='h-72'>
            {subjectClassCounts.length > 0 ? (
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={subjectClassCounts}>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} />
                  <XAxis dataKey='name' tick={{ fontSize: 11 }} angle={-20} textAnchor='end' height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value} lớp`, 'Số lớp']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey='count' name='Số lớp' fill={COLORS.orange} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-full flex items-center justify-center text-slate-400'>Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-slate-100 rounded-lg'>
            <Users size={20} className='text-slate-600' />
          </div>
          <div>
            <h3 className='text-lg font-bold text-slate-800'>Chi tiết người dùng</h3>
            <p className='text-sm text-slate-500'>Thống kê chi tiết theo vai trò và trạng thái</p>
          </div>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
          <div className='bg-slate-50 rounded-xl p-4 text-center'>
            <p className='text-3xl font-bold text-slate-800'>{stats.totalUsers}</p>
            <p className='text-sm text-slate-500 mt-1'>Tổng số</p>
          </div>
          <div className='bg-blue-50 rounded-xl p-4 text-center'>
            <p className='text-3xl font-bold text-blue-600'>{stats.totalStudents}</p>
            <p className='text-sm text-slate-500 mt-1'>Sinh viên</p>
          </div>
          <div className='bg-purple-50 rounded-xl p-4 text-center'>
            <p className='text-3xl font-bold text-purple-600'>{stats.totalLecturers}</p>
            <p className='text-sm text-slate-500 mt-1'>Giảng viên</p>
          </div>
          <div className='bg-red-50 rounded-xl p-4 text-center'>
            <p className='text-3xl font-bold text-red-600'>{stats.totalAdmins}</p>
            <p className='text-sm text-slate-500 mt-1'>Admin</p>
          </div>
          <div className='bg-emerald-50 rounded-xl p-4 text-center'>
            <div className='flex items-center justify-center gap-1'>
              <UserCheck size={20} className='text-emerald-600' />
              <p className='text-3xl font-bold text-emerald-600'>{stats.activeUsers}</p>
            </div>
            <p className='text-sm text-slate-500 mt-1'>Hoạt động</p>
          </div>
          <div className='bg-gray-100 rounded-xl p-4 text-center'>
            <div className='flex items-center justify-center gap-1'>
              <UserX size={20} className='text-gray-500' />
              <p className='text-3xl font-bold text-gray-500'>{stats.inactiveUsers}</p>
            </div>
            <p className='text-sm text-slate-500 mt-1'>Đã khóa</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
