"use client"

import { useEffect, useState } from "react"
import { BookOpen, TrendingUp, Award, Loader2, GraduationCap, Calendar, Clock } from "lucide-react"
import api from "../../../utils/axios"

interface EnrolledClass {
  id: number
  name: string
  subject_name: string
  teacher_name: string
  semester: string
  academic_year: string
  status: number
}

interface StudentProgress {
  total_classes: number
  completed_classes: number
  avg_score: number
  total_credits: number
}

export default function StudentInfo() {
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([])
  const [progress, setProgress] = useState<StudentProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudentData()
  }, [])

  const fetchStudentData = async () => {
    try {
      setLoading(true)
      const [classesRes, progressRes] = await Promise.all([
        api.get<{ results: EnrolledClass[] }>("/student/classes").catch(() => ({ data: { results: [] } })),
        api.get<StudentProgress>("/student/progress").catch(() => ({ data: null })),
      ])
      setEnrolledClasses(classesRes.data.results || [])
      setProgress(progressRes.data)
    } catch (error) {
      console.error("Error fetching student data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          Đang tải dữ liệu sinh viên...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-[#dd7323]" />
          Tiến độ học tập
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <BookOpen size={24} className="text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{progress?.total_classes || enrolledClasses.length}</p>
            <p className="text-xs text-blue-500 font-medium">Lớp đã đăng ký</p>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <GraduationCap size={24} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{progress?.completed_classes || 0}</p>
            <p className="text-xs text-emerald-500 font-medium">Lớp hoàn thành</p>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <Award size={24} className="text-[#dd7323] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#dd7323]">{progress?.avg_score?.toFixed(1) || "--"}</p>
            <p className="text-xs text-orange-500 font-medium">Điểm trung bình</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <Clock size={24} className="text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{progress?.total_credits || 0}</p>
            <p className="text-xs text-purple-500 font-medium">Tín chỉ tích lũy</p>
          </div>
        </div>
      </div>

      {/* Enrolled Classes */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen size={20} className="text-[#dd7323]" />
          Lớp học đã đăng ký
        </h3>

        {enrolledClasses.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <BookOpen size={40} className="mx-auto mb-3 text-slate-300" />
            <p>Bạn chưa đăng ký lớp học nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {enrolledClasses.slice(0, 5).map((cls) => (
              <div
                key={cls.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#dd7323]/10 rounded-lg flex items-center justify-center">
                    <BookOpen size={20} className="text-[#dd7323]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{cls.name}</h4>
                    <p className="text-sm text-slate-500">
                      {cls.subject_name} - {cls.teacher_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cls.status === 1 ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {cls.status === 1 ? "Đang học" : "Đã kết thúc"}
                  </span>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 justify-end">
                    <Calendar size={12} /> {cls.semester} - {cls.academic_year}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
