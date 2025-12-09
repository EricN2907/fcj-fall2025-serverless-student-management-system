"use client"

import { useEffect, useState } from "react"
import { BookOpen, Users, Award, Loader2, GraduationCap, Layers } from "lucide-react"
import { lecturerClassApi } from "../../../services/lecturerApi"
import type { ClassDTO, SubjectAssignment } from "../../../types"

export default function LecturerInfo() {
  const [classes, setClasses] = useState<ClassDTO[]>([])
  const [subjects, setSubjects] = useState<SubjectAssignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLecturerData()
  }, [])

  const fetchLecturerData = async () => {
    try {
      setLoading(true)
      const [classesRes, subjectsRes] = await Promise.all([
        lecturerClassApi.getClasses().catch(() => ({ results: [] })),
        lecturerClassApi.getAssignedSubjects().catch(() => ({ results: [] })),
      ])
      setClasses(classesRes.results || [])
      setSubjects(subjectsRes.results || [])
    } catch (error) {
      console.error("Error fetching lecturer data:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalStudents = classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0)
  const activeClasses = classes.filter((cls) => cls.status === 1).length

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          Đang tải dữ liệu giảng viên...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Award size={20} className="text-[#dd7323]" />
          Thống kê giảng dạy
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <Layers size={24} className="text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{subjects.length}</p>
            <p className="text-xs text-blue-500 font-medium">Môn được phân công</p>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <BookOpen size={24} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{activeClasses}</p>
            <p className="text-xs text-emerald-500 font-medium">Lớp đang dạy</p>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <Users size={24} className="text-[#dd7323] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#dd7323]">{totalStudents}</p>
            <p className="text-xs text-orange-500 font-medium">Tổng sinh viên</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <GraduationCap size={24} className="text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{classes.length}</p>
            <p className="text-xs text-purple-500 font-medium">Tổng số lớp</p>
          </div>
        </div>
      </div>

      {/* Assigned Subjects */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Layers size={20} className="text-[#dd7323]" />
          Môn học được phân công
        </h3>

        {subjects.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Layers size={40} className="mx-auto mb-3 text-slate-300" />
            <p>Chưa có môn học nào được phân công</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen size={20} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{subject.subject_name}</h4>
                  <p className="text-sm text-slate-500">{subject.subject_code}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Classes */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen size={20} className="text-[#dd7323]" />
          Lớp học phụ trách
        </h3>

        {classes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <BookOpen size={40} className="mx-auto mb-3 text-slate-300" />
            <p>Bạn chưa có lớp học nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.slice(0, 5).map((cls) => (
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
                    <p className="text-sm text-slate-500">{cls.subject_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cls.status === 1 ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {cls.status === 1 ? "Đang mở" : "Đã đóng"}
                  </span>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 justify-end">
                    <Users size={12} /> {cls.student_count || 0} sinh viên
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
