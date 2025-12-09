'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Pin,
  Heart,
  MessageCircle,
  Loader2,
  Upload,
  X,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  MoreVertical,
} from 'lucide-react'
import { lecturerPostApi } from '~/services/lecturerApi'
import { toaster } from '~/components/ui/toaster'
import type { PostDTO, CreatePostRequest, UpdatePostRequest } from '~/types'

interface PostsTabProps {
  classId: number
}

// Form data type
interface PostFormData {
  title: string
  content: string
  is_pinned: boolean
}

// Skeleton for post cards
function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
          <div className="flex gap-4 mt-4">
            <div className="h-4 bg-slate-100 rounded w-16" />
            <div className="h-4 bg-slate-100 rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Empty state
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <MessageCircle size={32} className="text-orange-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Chưa có bài đăng nào</h3>
      <p className="text-slate-500 mb-6 max-w-sm mx-auto">
        Tạo bài đăng đầu tiên để chia sẻ thông tin với sinh viên trong lớp
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium transition-all shadow-lg shadow-orange-200"
      >
        <Plus size={18} />
        Tạo bài đăng
      </button>
    </div>
  )
}

// Post Card Component
interface PostCardProps {
  post: PostDTO
  onEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
  isTogglingPin: boolean
}

function PostCard({ post, onEdit, onDelete, onTogglePin, isTogglingPin }: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  // Simple markdown to text preview (strip markdown)
  const getPreviewText = (markdown: string): string => {
    return markdown
      .replace(/#+\s/g, '') // Headers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
      .replace(/\*(.+?)\*/g, '$1') // Italic
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
      .replace(/`(.+?)`/g, '$1') // Inline code
      .replace(/```[\s\S]*?```/g, '') // Code blocks
      .replace(/\n/g, ' ')
      .trim()
      .slice(0, 200)
  }

  const previewText = getPreviewText(post.content)

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Check if attachment is image
  const isImageAttachment = post.attachment_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md ${
      post.is_pinned ? 'border-orange-200 bg-orange-50/30' : 'border-slate-100'
    }`}>
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div className="bg-orange-500 text-white text-xs font-medium px-3 py-1 flex items-center gap-1.5">
          <Pin size={12} />
          Đã ghim
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Author avatar placeholder */}
          <div className="w-10 h-10 bg-linear-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-semibold">
              {post.lecturer_name?.charAt(0).toUpperCase() || 'GV'}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900 text-base line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {post.lecturer_name || 'Giảng viên'} • {formatDate(post.created_at)}
                </p>
              </div>

              {/* Actions menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <MoreVertical size={18} />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 min-w-[140px]">
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          onTogglePin()
                        }}
                        disabled={isTogglingPin}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {isTogglingPin ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Pin size={14} />
                        )}
                        {post.is_pinned ? 'Bỏ ghim' : 'Ghim bài'}
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          onEdit()
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Edit size={14} />
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          onDelete()
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                        Xóa
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Content preview */}
            <p className="text-sm text-slate-600 mt-3 line-clamp-3">
              {previewText}
              {post.content.length > 200 && '...'}
            </p>

            {/* Attachment preview */}
            {post.attachment_url && (
              <div className="mt-3">
                {isImageAttachment ? (
                  <div className="relative rounded-lg overflow-hidden bg-slate-100 max-w-xs">
                    <img
                      src={post.attachment_url}
                      alt="Attachment"
                      className="w-full h-40 object-cover"
                    />
                  </div>
                ) : (
                  <a
                    href={post.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <FileText size={16} className="text-slate-500" />
                    <span className="truncate max-w-[200px]">
                      {post.attachment_name || 'Tải xuống tệp đính kèm'}
                    </span>
                    <ExternalLink size={14} className="text-slate-400" />
                  </a>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Heart size={16} className={post.is_liked ? 'fill-red-500 text-red-500' : ''} />
                <span className="text-sm">{post.like_count} lượt thích</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <MessageCircle size={16} />
                <span className="text-sm">{post.comment_count} bình luận</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Create/Edit Modal Component
interface PostModalProps {
  isOpen: boolean
  onClose: () => void
  classId: number
  editData?: PostDTO | null
}

function PostModal({ isOpen, onClose, classId, editData }: PostModalProps) {
  const queryClient = useQueryClient()
  const [attachment, setAttachment] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PostFormData>({
    defaultValues: {
      title: editData?.title || '',
      content: editData?.content || '',
      is_pinned: editData?.is_pinned || false,
    },
  })

  const contentValue = watch('content')

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreatePostRequest) => lecturerPostApi.createPost(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-posts', classId] })
      toaster.create({
        title: 'Thành công',
        description: 'Đã tạo bài đăng mới',
        type: 'success',
      })
      handleClose()
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tạo bài đăng',
        type: 'error',
      })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdatePostRequest) =>
      lecturerPostApi.updatePost(classId, editData!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-posts', classId] })
      toaster.create({
        title: 'Thành công',
        description: 'Đã cập nhật bài đăng',
        type: 'success',
      })
      handleClose()
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể cập nhật bài đăng',
        type: 'error',
      })
    },
  })

  const handleClose = () => {
    reset()
    setAttachment(null)
    onClose()
  }

  const onSubmit = (data: PostFormData) => {
    if (editData) {
      updateMutation.mutate({
        title: data.title,
        content: data.content,
        is_pinned: data.is_pinned,
      })
    } else {
      createMutation.mutate({
        class_id: classId,
        title: data.title,
        content: data.content,
        is_pinned: data.is_pinned,
        attachment: attachment || undefined,
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAttachment(file)
    }
  }

  if (!isOpen) return null

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {editData ? 'Chỉnh sửa bài đăng' : 'Tạo bài đăng mới'}
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
              placeholder="Nhập tiêu đề bài đăng..."
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Content - Markdown Editor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nội dung <span className="text-red-500">*</span>
            </label>
            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
              {/* Markdown toolbar hint */}
              <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-3 text-xs text-slate-500">
                <span>Hỗ trợ Markdown:</span>
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">**đậm**</code>
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">*nghiêng*</code>
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">[link](url)</code>
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200"># Tiêu đề</code>
              </div>
              <textarea
                {...register('content', { required: 'Vui lòng nhập nội dung' })}
                rows={10}
                placeholder="Viết nội dung bài đăng..."
                className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
              />
            </div>
            {errors.content && (
              <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              {contentValue.length} ký tự
            </p>
          </div>

          {/* File Upload (only for create) */}
          {!editData && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tệp đính kèm
              </label>
              {attachment ? (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    {attachment.type.startsWith('image/') ? (
                      <ImageIcon size={20} className="text-blue-500" />
                    ) : (
                      <FileText size={20} className="text-slate-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-700 truncate max-w-[300px]">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-orange-300 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="post-attachment"
                    accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                  />
                  <label
                    htmlFor="post-attachment"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload size={28} className="text-slate-400 mb-2" />
                    <span className="text-sm text-slate-600 font-medium">
                      Kéo thả hoặc click để tải lên
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Hình ảnh, PDF, Word, Excel, PowerPoint, ZIP (tối đa 10MB)
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Pin toggle */}
          <div className="flex items-center gap-3">
            <input
              {...register('is_pinned')}
              type="checkbox"
              id="is_pinned"
              className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="is_pinned" className="text-sm text-slate-700 flex items-center gap-2">
              <Pin size={14} className="text-slate-400" />
              Ghim bài đăng này lên đầu
            </label>
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
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {editData ? 'Cập nhật' : 'Đăng bài'}
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
  postTitle: string
  isDeleting: boolean
}

function DeleteModal({ isOpen, onClose, onConfirm, postTitle, isDeleting }: DeleteModalProps) {
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
            Bạn có chắc muốn xóa bài đăng "<span className="font-medium text-slate-700">{postTitle}</span>"?
            Tất cả bình luận cũng sẽ bị xóa.
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
export default function PostsTab({ classId }: PostsTabProps) {
  const queryClient = useQueryClient()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<PostDTO | null>(null)
  const [deletingPost, setDeletingPost] = useState<PostDTO | null>(null)

  // Fetch posts
  const {
    data: postsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['lecturer-posts', classId, searchKeyword],
    queryFn: async () => {
      const params: { keyword?: string } = {}
      if (searchKeyword) params.keyword = searchKeyword
      return lecturerPostApi.getPosts(classId, params)
    },
    staleTime: 1000 * 60 * 2,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (postId: number) => lecturerPostApi.deletePost(classId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-posts', classId] })
      toaster.create({
        title: 'Thành công',
        description: 'Đã xóa bài đăng',
        type: 'success',
      })
      setDeletingPost(null)
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xóa bài đăng',
        type: 'error',
      })
    },
  })

  // Toggle pin mutation
  const togglePinMutation = useMutation({
    mutationFn: ({ postId, isPinned }: { postId: number; isPinned: boolean }) =>
      lecturerPostApi.togglePin(classId, postId, isPinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-posts', classId] })
      toaster.create({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái ghim',
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

  // Sort posts: pinned first, then by created_at DESC
  const posts = (postsData?.results || []).sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const handleOpenCreate = () => {
    setEditingPost(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (post: PostDTO) => {
    setEditingPost(post)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPost(null)
  }

  const handleDeleteConfirm = () => {
    if (deletingPost) {
      deleteMutation.mutate(deletingPost.id)
    }
  }

  const handleTogglePin = (post: PostDTO) => {
    togglePinMutation.mutate({
      postId: post.id,
      isPinned: !post.is_pinned,
    })
  }

  return (
    <div className="space-y-4">
      {/* Search & Create */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium transition-all text-sm shadow-lg shadow-orange-200"
        >
          <Plus size={18} />
          Tạo bài đăng
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">Không thể tải danh sách bài đăng</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-sm font-medium"
          >
            Thử lại
          </button>
        </div>
      ) : posts.length === 0 ? (
        <EmptyState onCreateClick={handleOpenCreate} />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={() => handleOpenEdit(post)}
              onDelete={() => setDeletingPost(post)}
              onTogglePin={() => handleTogglePin(post)}
              isTogglingPin={
                togglePinMutation.isPending &&
                togglePinMutation.variables?.postId === post.id
              }
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <PostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        classId={classId}
        editData={editingPost}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deletingPost}
        onClose={() => setDeletingPost(null)}
        onConfirm={handleDeleteConfirm}
        postTitle={deletingPost?.title || ''}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
