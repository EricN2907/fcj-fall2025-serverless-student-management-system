'use client'

import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Loader2 } from 'lucide-react'

/**
 * Redirect page: /lecturer → /lecturer/my-courses
 * This page auto-redirects lecturers to their main courses page
 */
export default function LecturerIndexRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/lecturer/dashboard', { replace: true })
  }, [navigate])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={40} className="text-orange-500 animate-spin mx-auto mb-3" />
        <p className="text-slate-600">Đang chuyển hướng...</p>
      </div>
    </div>
  )
}
