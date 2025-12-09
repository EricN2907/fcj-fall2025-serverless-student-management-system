import { type RouteConfig, route, index, layout } from '@react-router/dev/routes'

export default [
  // Root layout
  layout('./root.tsx', { id: 'app-root' }, [
    // Index page
    index('./page.tsx'),

    // Authentication routes (no nested layout)
    route('login', './pages/auth/login.tsx', { id: 'login-shortcut' }),
    route('auth/login', './pages/auth/login.tsx', { id: 'auth-login' }),
    route('auth/reset-password', './pages/auth/reset-password.tsx'),

    // Admin routes with AdminLayout
    layout('./components/layout/AdminLayout.tsx', [
      route('admin/dashboard', './pages/admin/dashboard.tsx'),
      route('admin/settings', './pages/admin/settings.tsx'),
      route('admin/audit-logs', './pages/admin/audit-logs.tsx'),
      route('admin/analytics', './pages/admin/analytics.tsx'),
      route('admin/notifications-send', './pages/admin/notifications/send.tsx'),
      route('admin/users-management/list', './pages/admin/users-management/list.tsx'),
      route('admin/users-management/create', './pages/admin/users-management/create.tsx'),
      route('admin/users-management/edit/:userId', './pages/admin/users-management/edit.tsx'),
      route('admin/subjects-management/list', './pages/admin/subjects-management/list.tsx'),
      route('admin/subjects-management/create', './pages/admin/subjects-management/create.tsx'),
      route('admin/subjects-management/edit/:subjectId', './pages/admin/subjects-management/edit.tsx'),
      route('admin/classes-management/list', './pages/admin/classes-management/list.tsx'),
      route('admin/classes-management/create', './pages/admin/classes-management/create.tsx'),
      route('admin/classes-management/edit/:classId', './pages/admin/classes-management/edit.tsx')
    ]),

    // User routes with UserLayout (Student, Lecturer, Common)
    layout('./components/layout/UserLayout.tsx', [
      route('profile', './pages/common/profile/index.tsx'),
      route('home', './pages/home.tsx'),
      route('lecturer/dashboard', './pages/lecturer/dashboard.tsx'),
      route('lecturer', './pages/lecturer/index.tsx'),
      route('lecturer/my-courses', './pages/lecturer/my-courses.tsx'),
      route('lecturer/notifications-send', './pages/lecturer/notifications-send.tsx'),
      route('lecturer/classes/:classId', './pages/lecturer/classes/[classId]/index.tsx'),
      route(
        'lecturer/classes/:classId/assignments/:assignmentId',
        './pages/lecturer/classes/[classId]/assignment-detail.tsx'
      ),
      route('student/my-courses', './pages/student/my-courses.tsx'),
      route('student/all-courses', './pages/student/all-courses.tsx'),
      route('student/calendar', './pages/student/calendar.tsx'),
      route('student/ranking', './pages/student/ranking.tsx'),
      route('student/notifications-receive', './pages/student/notifications-receive.tsx'),
      route('student/search', './pages/student/search-results.tsx'),
      route('student/course-details/:classId', './pages/student/course-details.tsx'),
      route('student/course-details/:classId/assignment/:assignmentId', './pages/student/assignment-detail.tsx')
    ])
  ])
] satisfies RouteConfig
