'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Upload,
  X,
  AlertTriangle,
  Users,
  Clock,
} from 'lucide-react'
import { lecturerAssignmentApi } from '~/services/lecturerApi'
import { toaster } from '~/components/ui/toaster'
import type { AssignmentDTO, CreateAssignmentRequest, AssignmentType } from '~/types'

// Weight constants
const ASSIGNMENT_WEIGHTS_MAP: Record<AssignmentType, number> = {
  homework: 0.20,
  project: 0.30,
  midterm: 0.25,
  final: 0.25,
}

// Type labels
const TYPE_LABELS: Record<AssignmentType, string> = {
  homework: 'Bài tập',
  project: 'Đồ án',
  midterm: 'Giữa kỳ',
  final: 'Cuối kỳ',
}

// Type colors
const TYPE_COLORS: Record<AssignmentType, string> = {
  homework: 'bg-blue-50 text-blue-700 border-blue-200',
  project: 'bg-purple-50 text-purple-700 border-purple-200',
  midterm: 'bg-amber-50 text-amber-700 border-amber-200',
  final: 'bg-rose-50 text-rose-700 border-rose-200',
}

interface AssignmentsTabProps {
  classId: number
}

// Form data type
interface AssignmentFormData {
  title: string
  description: string
  type: AssignmentType
  deadline: string
  max_score: number
}

// Table skeleton
function TableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="h-5 bg-slate-200 rounded w-1/4" />
          <div className="h-5 bg-slate-200 rounded w-20" />
          <div className="h-5 bg-slate-200 rounded w-16" />
          <div className="h-5 bg-slate-200 rounded w-32" />
          <div className="h-5 bg-slate-200 rounded w-16" />
          <div className="h-5 bg-slate-200 rounded w-16" />
          <div className="h-5 bg-slate-200 rounded w-24 ml-auto" />
        </div>
      ))}
    </div>
  )
}

// Empty state
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <FileText size={32} className="text-orange-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Chưa có bài tập nào</h3>
      <p className="text-slate-500 mb-6 max-w-sm mx-auto">
        Tạo bài tập đầu tiên cho lớp học này để bắt đầu đánh giá sinh viên
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium transition-all shadow-lg shadow-orange-200"
      >
        <Plus size={18} />
        Tạo bài tập
      </button>
    </div>
  )
}

// Assignment row component
interface AssignmentRowProps {
  assignment: AssignmentDTO
  onEdit: () => void
  onDelete: () => void
  onTogglePublish: () => void
  isDeleting: boolean
  isTogglingPublish: boolean
}

function AssignmentRow({
  assignment,
  onEdit,
  onDelete,
  onTogglePublish,
  isDeleting,
  isTogglingPublish,
}: AssignmentRowProps) {
  const isPastDeadline = new Date(assignment.deadline) < new Date()

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      {/* Title */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${TYPE_COLORS[assignment.type]}`}>
            <FileText size={18} />
          </div>
          <div>
            <p className="font-medium text-slate-900">{assignment.title}</p>
            {assignment.description && (
              <p className="text-sm text-slate-500 line-clamp-1">{assignment.description}</p>
            )}
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="py-4 px-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${TYPE_COLORS[assignment.type]}`}>
          {TYPE_LABELS[assignment.type]}
        </span>
      </td>

      {/* Weight */}
      <td className="py-4 px-4">
        <span className="text-sm text-slate-600 font-medium">
          {(assignment.weight * 100).toFixed(0)}%
        </span>
      </td>

      {/* Deadline */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <Calendar size={14} className={isPastDeadline ? 'text-red-400' : 'text-slate-400'} />
          <span className={`text-sm ${isPastDeadline ? 'text-red-600' : 'text-slate-600'}`}>
            {new Date(assignment.deadline).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </td>

      {/* Max Score */}
      <td className="py-4 px-4 text-center">
        <span className="text-sm font-medium text-slate-700">{assignment.max_score}</span>
      </td>

      {/* Published */}
      <td className="py-4 px-4">
        <button
          onClick={onTogglePublish}
          disabled={isTogglingPublish}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            assignment.is_published
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {isTogglingPublish ? (
            <Loader2 size={12} className="animate-spin" />
          ) : assignment.is_published ? (
            <Eye size={12} />
          ) : (
            <EyeOff size={12} />
          )}
          {assignment.is_published ? 'Đã công bố' : 'Ẩn'}
        </button>
      </td>

      {/* Submissions */}
      <td className="py-4 px-4 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Users size={14} className="text-slate-400" />
          <span className="text-sm text-slate-600">{assignment.submission_count || 0}</span>
        </div>
      </td>

      {/* Actions */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={onEdit}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Chỉnh sửa"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa"
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        </div>
      </td>
    </tr>
  )
}

// Create/Edit Modal Component
interface AssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  classId: number
  editData?: AssignmentDTO | null
}

function AssignmentModal({ isOpen, onClose, classId, editData }: AssignmentModalProps) {
  const queryClient = useQueryClient()
  const [files, setFiles] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormData>({
    defaultValues: {
      title: editData?.title || '',
      description: editData?.description || '',
      type: editData?.type || 'homework',
      deadline: editData?.deadline ? new Date(editData.deadline).toISOString().slice(0, 16) : '',
      max_score: editData?.max_score || 10,
    },
  })

  const selectedType = watch('type')
  const autoWeight = ASSIGNMENT_WEIGHTS_MAP[selectedType]

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateAssignmentRequest) => lecturerAssignmentApi.createAssignment(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-assignments', classId] })
      toaster.create({
        title: 'Thành công',
        description: 'Đã tạo bài tập mới',
        type: 'success',
      })
      handleClose()
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tạo bài tập',
        type: 'error',
      })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<AssignmentFormData>) =>
      lecturerAssignmentApi.updateAssignment(classId, editData!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-assignments', classId] })
      toaster.create({
        title: 'Thành công',
        description: 'Đã cập nhật bài tập',
        type: 'success',
      })
      handleClose()
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể cập nhật bài tập',
        type: 'error',
      })
    },
  })

  const handleClose = () => {
    reset()
    setFiles([])
    onClose()
  }

  const onSubmit = (data: AssignmentFormData) => {
    if (editData) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate({
        ...data,
        class_id: classId,
        files: files.length > 0 ? files : undefined,
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  if (!isOpen) return null

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {editData ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title', { required: 'Vui lòng nhập tiêu đề' })}
              type="text"
              placeholder="Nhập tiêu đề bài tập..."
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Mô tả
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Nhập mô tả chi tiết..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
            />
          </div>

          {/* Type & Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Loại bài tập <span className="text-red-500">*</span>
              </label>
              <select
                {...register('type', { required: 'Vui lòng chọn loại' })}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white ${
                  errors.type ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
              >
                <option value="homework">Bài tập (20%)</option>
                <option value="project">Đồ án (30%)</option>
                <option value="midterm">Giữa kỳ (25%)</option>
                <option value="final">Cuối kỳ (25%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Trọng số (Tự động)
              </label>
              <div className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-600">
                {(autoWeight * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Deadline & Max Score */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Hạn nộp <span className="text-red-500">*</span>
              </label>
              <input
                {...register('deadline', { required: 'Vui lòng chọn hạn nộp' })}
                type="datetime-local"
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.deadline ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
              />
              {errors.deadline && (
                <p className="mt-1 text-sm text-red-500">{errors.deadline.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Điểm tối đa
              </label>
              <input
                {...register('max_score', { min: 1, max: 100, valueAsNumber: true })}
                type="number"
                step="0.5"
                placeholder="10"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* File Upload (only for create) */}
          {!editData && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tài liệu đính kèm
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload size={24} className="text-slate-400 mb-2" />
                  <span className="text-sm text-slate-600">
                    Kéo thả hoặc click để tải lên
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    Hỗ trợ PDF, DOC, DOCX, PPT, PPTX, ZIP
                  </span>
                </label>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={16} className="text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-700 truncate">{file.name}</span>
                        <span className="text-xs text-slate-400 shrink-0">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {editData ? 'Cập nhật' : 'Tạo bài tập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Delete confirmation modal
interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  assignmentTitle: string
  isDeleting: boolean
}

function DeleteModal({ isOpen, onClose, onConfirm, assignmentTitle, isDeleting }: DeleteModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Xác nhận xóa</h3>
          <p className="text-slate-500 mb-6">
            Bạn có chắc muốn xóa bài tập "<span className="font-medium text-slate-700">{assignmentTitle}</span>"?
            Hành động này không thể hoàn tác.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-all text-sm"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium transition-all text-sm disabled:opacity-50"
            >
              {isDeleting && <Loader2 size={16} className="animate-spin" />}
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component
export default function AssignmentsTab({ classId }: AssignmentsTabProps) {
  const queryClient = useQueryClient()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<AssignmentType | ''>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<AssignmentDTO | null>(null)
  const [deletingAssignment, setDeletingAssignment] = useState<AssignmentDTO | null>(null)

  // Fetch assignments
  const {
    data: assignmentsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['lecturer-assignments', classId, searchKeyword, typeFilter],
    queryFn: async () => {
      const params: { keyword?: string; type?: string } = {}
      if (searchKeyword) params.keyword = searchKeyword
      if (typeFilter) params.type = typeFilter
      return lecturerAssignmentApi.getAssignments(classId, params)
    },
    staleTime: 1000 * 60 * 2,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (assignmentId: number) => lecturerAssignmentApi.deleteAssignment(classId, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-assignments', classId] })
      toaster.create({
        title: 'Thành công',
        description: 'Đã xóa bài tập',
        type: 'success',
      })
      setDeletingAssignment(null)
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xóa bài tập',
        type: 'error',
      })
    },
  })

  // Toggle publish mutation
  const togglePublishMutation = useMutation({
    mutationFn: ({ assignmentId, isPublished }: { assignmentId: number; isPublished: boolean }) =>
      lecturerAssignmentApi.togglePublish(classId, assignmentId, isPublished),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-assignments', classId] })
      toaster.create({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái',
        type: 'success',
      })
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể cập nhật trạng thái',
        type: 'error',
      })
    },
  })

  const assignments = assignmentsData?.results || []

  const handleOpenCreate = () => {
    setEditingAssignment(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (assignment: AssignmentDTO) => {
    setEditingAssignment(assignment)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAssignment(null)
  }

  const handleDeleteConfirm = () => {
    if (deletingAssignment) {
      deleteMutation.mutate(deletingAssignment.id)
    }
  }

  const handleTogglePublish = (assignment: AssignmentDTO) => {
    togglePublishMutation.mutate({
      assignmentId: assignment.id,
      isPublished: !assignment.is_published,
    })
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as AssignmentType | '')}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
        >
          <option value="">Tất cả loại</option>
          <option value="homework">Bài tập</option>
          <option value="project">Đồ án</option>
          <option value="midterm">Giữa kỳ</option>
          <option value="final">Cuối kỳ</option>
        </select>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium transition-all text-sm shadow-lg shadow-orange-200"
        >
          <Plus size={18} />
          Tạo bài tập
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">Không thể tải danh sách bài tập</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-sm font-medium"
          >
            Thử lại
          </button>
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState onCreateClick={handleOpenCreate} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Bài tập
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Trọng số
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Hạn nộp
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Điểm
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Bài nộp
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <AssignmentRow
                    key={assignment.id}
                    assignment={assignment}
                    onEdit={() => handleOpenEdit(assignment)}
                    onDelete={() => setDeletingAssignment(assignment)}
                    onTogglePublish={() => handleTogglePublish(assignment)}
                    isDeleting={deleteMutation.isPending && deletingAssignment?.id === assignment.id}
                    isTogglingPublish={
                      togglePublishMutation.isPending &&
                      togglePublishMutation.variables?.assignmentId === assignment.id
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AssignmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        classId={classId}
        editData={editingAssignment}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deletingAssignment}
        onClose={() => setDeletingAssignment(null)}
        onConfirm={handleDeleteConfirm}
        assignmentTitle={deletingAssignment?.title || ''}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
