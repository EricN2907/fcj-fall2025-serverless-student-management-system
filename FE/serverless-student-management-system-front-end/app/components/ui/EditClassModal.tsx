'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X,
  Loader2,
  Settings,
} from 'lucide-react'
import { lecturerClassApi } from '~/services/lecturerApi'
import { toaster } from '~/components/ui/toaster'
import type { ClassDTO, UpdateClassRequest } from '~/types'

interface EditClassModalProps {
  isOpen: boolean
  onClose: () => void
  classData: ClassDTO | null
}

interface EditClassFormData {
  name: string
  password: string
  semester: string
  academic_year: string
  description: string
}

export default function EditClassModal({ isOpen, onClose, classData }: EditClassModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditClassFormData>()

  // Reset form when classData changes
  useEffect(() => {
    if (classData && isOpen) {
      reset({
        name: classData.name || '',
        password: classData.password || '',
        semester: classData.semester || '',
        academic_year: classData.academic_year || '',
        description: classData.description || '',
      })
    }
  }, [classData, isOpen, reset])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateClassRequest) => 
      lecturerClassApi.updateClass(classData!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-classes'] })
      queryClient.invalidateQueries({ queryKey: ['lecturer-class', classData!.id] })
      toaster.create({
        title: 'Thành công',
        description: 'Đã cập nhật thông tin lớp học',
        type: 'success',
      })
      handleClose()
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể cập nhật lớp học',
        type: 'error',
      })
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = (data: EditClassFormData) => {
    updateMutation.mutate({
      name: data.name,
      password: data.password || undefined,
      semester: data.semester,
      academic_year: data.academic_year,
      description: data.description || undefined,
    })
  }

  if (!isOpen || !classData) return null

  const currentYear = new Date().getFullYear()
  const academicYears = [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
  ]

  const semesters = ['HK1', 'HK2', 'HK3', 'Hè']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Settings size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Chỉnh sửa lớp học</h2>
              <p className="text-xs text-slate-500">{classData.subject_name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Class Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tên lớp <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name', { required: 'Vui lòng nhập tên lớp' })}
              type="text"
              placeholder="VD: INT1234-01"
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Mã tham gia lớp
            </label>
            <input
              {...register('password')}
              type="text"
              placeholder="VD: ABC123 (để trống nếu không cần)"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-slate-400">Sinh viên cần nhập mã này để tham gia lớp</p>
          </div>

          {/* Semester & Academic Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Học kỳ <span className="text-red-500">*</span>
              </label>
              <select
                {...register('semester', { required: 'Vui lòng chọn học kỳ' })}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                  errors.semester ? 'border-red-300' : 'border-slate-200'
                }`}
              >
                <option value="">-- Chọn --</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
              {errors.semester && (
                <p className="mt-1 text-sm text-red-500">{errors.semester.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Năm học <span className="text-red-500">*</span>
              </label>
              <select
                {...register('academic_year', { required: 'Vui lòng chọn năm học' })}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                  errors.academic_year ? 'border-red-300' : 'border-slate-200'
                }`}
              >
                <option value="">-- Chọn --</option>
                {academicYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {errors.academic_year && (
                <p className="mt-1 text-sm text-red-500">{errors.academic_year.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Mô tả
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Mô tả về lớp học (tùy chọn)"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-all text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
