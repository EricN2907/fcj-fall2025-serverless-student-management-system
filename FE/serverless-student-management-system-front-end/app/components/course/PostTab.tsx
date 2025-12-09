'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Spinner,
  Card,
  Avatar,
  Badge,
  Button,
  IconButton,
  Textarea,
  Collapsible
} from '@chakra-ui/react'
import { MessageSquare, Heart, Pin, ChevronDown, ChevronUp, Send, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import StatsCard from '../ui/StatsCard'
import EmptyState from '../ui/EmptyState'
import { studentPostApi } from '../../services/studentApi'
import { toaster } from '../ui/toaster'

// ============================================
// MOCK DATA - Set to false to use real API
// ============================================
const USE_MOCK_DATA = false

const MOCK_POSTS: Post[] = [
  {
    id: 1,
    title: '📢 Thông báo lịch thi giữa kỳ',
    content: `## Lịch thi giữa kỳ

Các bạn sinh viên lưu ý:

- **Ngày thi**: 15/11/2024
- **Thời gian**: 08:00 - 10:00
- **Phòng thi**: A101, A102

### Nội dung ôn tập:
1. Chương 1: Giới thiệu
2. Chương 2: Biến và kiểu dữ liệu
3. Chương 3: Cấu trúc điều khiển

\`\`\`python
# Ví dụ code cần nắm
for i in range(10):
    print(i)
\`\`\`

Chúc các bạn ôn tập tốt! 💪`,
    lecturer_name: 'Nguyễn Văn An',
    is_pinned: true,
    like_count: 24,
    comment_count: 8,
    is_liked: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    title: 'Tài liệu bổ sung tuần 5',
    content: `Các bạn có thể tham khảo thêm tài liệu về **vòng lặp** và **hàm** tại:

- [Python Documentation](https://docs.python.org)
- Slide bài giảng đã upload trên hệ thống

*Lưu ý*: Đọc kỹ phần ví dụ trong slide nhé!`,
    lecturer_name: 'Nguyễn Văn An',
    is_pinned: false,
    like_count: 12,
    comment_count: 3,
    is_liked: false,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    title: 'Hướng dẫn nộp bài Project Phase 1',
    content: `### Yêu cầu nộp bài:

1. File báo cáo định dạng PDF
2. Source code nén thành file .zip
3. Đặt tên file theo format: \`MSSV_HoTen_Phase1.zip\`

**Deadline**: 25/10/2024 23:59

> ⚠️ Bài nộp trễ sẽ bị trừ điểm theo quy định!`,
    lecturer_name: 'Nguyễn Văn An',
    is_pinned: true,
    like_count: 18,
    comment_count: 5,
    is_liked: false,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    title: 'Q&A - Giải đáp thắc mắc Lab 02',
    content: `Một số câu hỏi thường gặp về Lab 02:

**Q: Làm sao để convert string sang int?**
A: Sử dụng hàm \`int()\`

**Q: Tại sao code bị lỗi TypeError?**
A: Kiểm tra lại kiểu dữ liệu của biến

Nếu còn thắc mắc, các bạn comment bên dưới nhé!`,
    lecturer_name: 'Nguyễn Văn An',
    is_pinned: false,
    like_count: 8,
    comment_count: 12,
    is_liked: true,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const MOCK_COMMENTS: Comment[] = [
  {
    id: 1,
    content: 'Dạ thầy cho em hỏi phòng thi có thay đổi không ạ?',
    sender_name: 'Trần Văn Minh',
    sender_role: 'student',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    content: 'Phòng thi giữ nguyên như thông báo nhé em.',
    sender_name: 'Nguyễn Văn An',
    sender_role: 'lecturer',
    created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    content: 'Em cảm ơn thầy ạ!',
    sender_name: 'Trần Văn Minh',
    sender_role: 'student',
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
  }
]

interface Post {
  id?: number | string
  postId?: string // BE có thể trả về postId thay vì id
  post_id?: string // hoặc post_id
  title?: string
  content: string
  lecturer_name?: string
  author_name?: string
  lecturer_avatar?: string
  is_pinned?: boolean
  isPinned?: boolean
  like_count?: number
  likeCount?: number
  comment_count?: number
  commentCount?: number
  is_liked?: boolean
  isLiked?: boolean
  created_at?: string
  createdAt?: string
}

interface Comment {
  id: number | string
  content: string
  sender_name?: string
  senderName?: string
  author_name?: string
  authorName?: string
  sender_avatar?: string
  sender_role?: string
  senderRole?: string
  created_at?: string
  createdAt?: string
}

interface PostTabProps {
  classId: string | number
}

// Format relative time - handle both created_at and createdAt
function getRelativeTime(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays === 1) return 'Hôm qua'
  if (diffDays < 7) return `${diffDays} ngày trước`
  return (
    date.toLocaleDateString('vi-VN') + ' · ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  )
}

// Helper to get date from post/comment (handle both formats)
function getDateStr(item: { created_at?: string; createdAt?: string }): string {
  return item.created_at || item.createdAt || ''
}

export default function PostTab({ classId }: PostTabProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    setLoading(true)

    // Use mock data for UI testing
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      setPosts(MOCK_POSTS)
      setLoading(false)
      return
    }

    try {
      // API: GET /api/student/classes/{class_id}/posts với special headers
      const data = await studentPostApi.getPosts(String(classId))
      console.log('Posts response:', data)
      setPosts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch posts:', err)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Stats
  const stats = useMemo(() => {
    const total = posts.length
    const pinned = posts.filter((p) => p.is_pinned).length
    return { total, pinned }
  }, [posts])

  // Sort: pinned first, then by created_at DESC
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const aPinned = a.is_pinned || a.isPinned
      const bPinned = b.is_pinned || b.isPinned
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1
      const aDate = new Date(getDateStr(a)).getTime() || 0
      const bDate = new Date(getDateStr(b)).getTime() || 0
      return bDate - aDate
    })
  }, [posts])

  const handleLike = async (postIdParam: number | string, isLiked: boolean) => {
    try {
      await studentPostApi.toggleLike(String(classId), String(postIdParam))
      setPosts((prev) =>
        prev.map((p) => {
          // Check all possible ID fields
          const pId = p.postId || p.post_id || p.id
          if (pId === postIdParam) {
            const currentLikes = p.like_count ?? p.likeCount ?? 0
            return {
              ...p,
              is_liked: !isLiked,
              isLiked: !isLiked,
              like_count: isLiked ? currentLikes - 1 : currentLikes + 1,
              likeCount: isLiked ? currentLikes - 1 : currentLikes + 1
            }
          }
          return p
        })
      )
    } catch (err) {
      console.error('Failed to like post:', err)
    }
  }

  if (loading) {
    return (
      <VStack gap={3} py={12}>
        <Spinner size='lg' color='#dd7323' />
        <Text color='gray.500'>Đang tải bài đăng...</Text>
      </VStack>
    )
  }

  return (
    <VStack gap={6} align='stretch'>
      {/* Stats */}
      <HStack gap={4} flexWrap='wrap'>
        <Box flex={1} minW='200px'>
          <StatsCard label='Tổng số bài đăng' value={stats.total} icon={MessageSquare} />
        </Box>
        <Box flex={1} minW='200px'>
          <StatsCard label='Bài ghim' value={stats.pinned} icon={Pin} />
        </Box>
      </HStack>

      {/* Posts Feed */}
      {sortedPosts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title='Chưa có bài đăng nào'
          description='Giảng viên chưa đăng bài thảo luận'
        />
      ) : (
        <VStack gap={4} align='stretch'>
          {sortedPosts.map((post) => {
            const key = post.postId || post.post_id || post.id || Math.random()
            return <PostCard key={key} post={post} classId={classId} onLike={handleLike} />
          })}
        </VStack>
      )}
    </VStack>
  )
}

// Post Card Component
interface PostCardProps {
  post: Post
  classId: string | number
  onLike: (postId: number | string, isLiked: boolean) => void
}

function PostCard({ post, classId: _classId, onLike }: PostCardProps) {
  // _classId có thể dùng sau này nếu cần
  const [expanded, setExpanded] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Get post ID - BE có thể trả về id, postId, hoặc post_id
  const postId = String(post.postId || post.post_id || post.id || '')

  // Debug log
  console.log('=== STUDENT POST DATA DEBUG ===')
  console.log('Post object:', post)
  console.log('Post ID extracted:', postId)

  // Handle both field formats
  const authorName = post.lecturer_name || post.author_name || 'Giảng viên'
  const isPinned = post.is_pinned || post.isPinned
  const likeCount = post.like_count ?? post.likeCount ?? 0
  const commentCount = post.comment_count ?? post.commentCount ?? 0
  const isLiked = post.is_liked || post.isLiked

  const contentPreview = post.content?.length > 300 ? post.content.slice(0, 300) + '...' : post.content || ''
  const needsExpand = (post.content?.length || 0) > 300

  const fetchComments = async () => {
    if (comments.length > 0) return
    setLoadingComments(true)

    // Use mock data for UI testing
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      setComments(MOCK_COMMENTS)
      setLoadingComments(false)
      return
    }

    try {
      console.log('Fetching comments for postId:', postId)
      const data = await studentPostApi.getComments(postId)
      setComments(data || [])
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleToggleComments = () => {
    if (!showComments) {
      fetchComments()
    }
    setShowComments(!showComments)
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return
    if (!postId) {
      console.error('Post ID is empty!')
      toaster.create({
        title: 'Lỗi',
        description: 'Không tìm thấy ID bài viết',
        type: 'error'
      })
      return
    }
    setSubmitting(true)
    try {
      console.log('Creating comment for postId:', postId)
      const newCommentData = await studentPostApi.createComment(postId, {
        content: newComment.trim()
      })
      setComments((prev) => [...prev, newCommentData])
      setNewComment('')
      toaster.create({
        title: 'Đã gửi bình luận',
        type: 'success'
      })
    } catch (err: any) {
      console.error('Failed to submit comment:', err)
      toaster.create({
        title: 'Lỗi',
        description: err.message || 'Không thể gửi bình luận',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string | number) => {
    try {
      await studentPostApi.deleteComment(String(commentId))
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      toaster.create({
        title: 'Đã xóa bình luận',
        type: 'success'
      })
    } catch (err: any) {
      console.error('Failed to delete comment:', err)
      toaster.create({
        title: 'Lỗi',
        description: err.message || 'Không thể xóa bình luận',
        type: 'error'
      })
    }
  }

  return (
    <Card.Root bg='white' borderRadius='xl' border='1px solid' borderColor='orange.200' shadow='sm' overflow='hidden'>
      <Card.Body p={6}>
        {/* Header */}
        <HStack justify='space-between' mb={4}>
          <HStack gap={3}>
            <Avatar.Root size='md'>
              <Avatar.Image src={post.lecturer_avatar} />
              <Avatar.Fallback name={authorName} />
            </Avatar.Root>
            <VStack align='flex-start' gap={0}>
              <HStack gap={2}>
                <Text fontWeight='semibold' color='gray.800'>
                  {authorName}
                </Text>
                <Badge colorPalette='blue' size='sm' borderRadius='full'>
                  Giảng viên
                </Badge>
              </HStack>
              <Text fontSize='sm' color='gray.500'>
                {getRelativeTime(getDateStr(post))}
              </Text>
            </VStack>
          </HStack>
          {isPinned && (
            <Badge colorPalette='orange' variant='solid' borderRadius='full'>
              <Pin size={12} />
              <Text ml={1}>Ghim</Text>
            </Badge>
          )}
        </HStack>

        {/* Title */}
        <Text fontSize='lg' fontWeight='bold' color='gray.800' mb={3}>
          {post.title}
        </Text>

        {/* Content */}
        <Box
          className='markdown-content'
          color='gray.700'
          fontSize='sm'
          lineHeight='1.7'
          mb={4}
          css={{
            '& h1, & h2, & h3': { fontWeight: 'bold', marginTop: '1em', marginBottom: '0.5em' },
            '& p': { marginBottom: '0.5em' },
            '& ul, & ol': { paddingLeft: '1.5em', marginBottom: '0.5em' },
            '& code': { background: '#f4f4f5', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em' },
            '& pre': { background: '#f4f4f5', padding: '12px', borderRadius: '8px', overflow: 'auto' }
          }}
        >
          <ReactMarkdown>{expanded ? post.content : contentPreview}</ReactMarkdown>
        </Box>

        {needsExpand && (
          <Button
            variant='ghost'
            size='sm'
            color='#dd7323'
            _hover={{ bg: 'orange.50' }}
            onClick={() => setExpanded(!expanded)}
            mb={4}
          >
            {expanded ? 'Thu gọn' : 'Xem thêm'}
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        )}

        {/* Actions */}
        <HStack gap={4} pt={4} borderTop='1px solid' borderColor='gray.100'>
          <Button
            variant='ghost'
            size='sm'
            color={isLiked ? 'red.500' : 'gray.600'}
            _hover={{ bg: 'red.50' }}
            onClick={() => onLike(postId, !!isLiked)}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            <Text ml={1}>{likeCount}</Text>
          </Button>
          <Button variant='ghost' size='sm' color='gray.600' _hover={{ bg: 'gray.100' }} onClick={handleToggleComments}>
            <MessageSquare size={18} />
            <Text ml={1}>{commentCount}</Text>
          </Button>
        </HStack>

        {/* Comments Section */}
        <Collapsible.Root open={showComments}>
          <Collapsible.Content>
            <VStack align='stretch' gap={3} mt={4} pt={4} borderTop='1px solid' borderColor='gray.100'>
              {loadingComments ? (
                <HStack justify='center' py={4}>
                  <Spinner size='sm' color='#dd7323' />
                  <Text fontSize='sm' color='gray.500'>
                    Đang tải bình luận...
                  </Text>
                </HStack>
              ) : (
                <>
                  {comments.map((comment) => {
                    const commentAuthor =
                      comment.sender_name ||
                      comment.senderName ||
                      comment.author_name ||
                      comment.authorName ||
                      'Ẩn danh'
                    return (
                      <HStack key={comment.id} align='flex-start' gap={3}>
                        <Avatar.Root size='sm'>
                          <Avatar.Image src={comment.sender_avatar} />
                          <Avatar.Fallback name={commentAuthor} />
                        </Avatar.Root>
                        <Box flex={1} bg='gray.50' borderRadius='lg' p={3}>
                          <HStack justify='space-between' mb={1}>
                            <HStack gap={2}>
                              <Text fontWeight='semibold' fontSize='sm'>
                                {commentAuthor}
                              </Text>
                              <Text fontSize='xs' color='gray.500'>
                                {getRelativeTime(getDateStr(comment))}
                              </Text>
                            </HStack>
                            <IconButton
                              aria-label='Xóa bình luận'
                              size='xs'
                              variant='ghost'
                              colorPalette='red'
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash2 size={14} />
                            </IconButton>
                          </HStack>
                          <Text fontSize='sm' color='gray.700'>
                            {comment.content}
                          </Text>
                        </Box>
                      </HStack>
                    )
                  })}

                  {/* New Comment Input */}
                  <HStack gap={2} mt={2}>
                    <Textarea
                      placeholder='Viết bình luận...'
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      size='sm'
                      borderRadius='lg'
                      borderColor='orange.200'
                      _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                      rows={2}
                    />
                    <IconButton
                      aria-label='Gửi bình luận'
                      bg='#dd7323'
                      color='white'
                      _hover={{ bg: '#c5651f' }}
                      onClick={handleSubmitComment}
                      loading={submitting}
                      disabled={!newComment.trim()}
                    >
                      <Send size={18} />
                    </IconButton>
                  </HStack>
                </>
              )}
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      </Card.Body>
    </Card.Root>
  )
}
