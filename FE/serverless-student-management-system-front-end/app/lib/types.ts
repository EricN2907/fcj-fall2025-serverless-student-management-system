// Types for the Student Management System

export interface Class {
  id: string
  name: string
  code: string
  description?: string
  status: 1 | 0 // 1 = active, 0 = inactive
  studentCount: number
  createdAt: string
}

export interface Student {
  id: string
  name: string
  email: string
  studentCode: string
  avatar?: string
  classId: string
}

export interface Assignment {
  id: string
  title: string
  description?: string
  classId: string
  dueDate: string
  createdAt: string
  attachments?: AssignmentAttachment[]
}

export interface AssignmentAttachment {
  id: string
  name: string
  type: "file" | "link"
  url: string
  size?: string
}

export interface AssignmentSubmission {
  id: string
  assignmentId: string
  studentId: string
  studentName: string
  studentCode: string
  content?: string
  attachments?: AssignmentAttachment[]
  createdAt: string
}

export interface GradeColumn {
  id: string
  name: string
  classId: string
  maxScore: number
  weight: number
}

export interface Grade {
  id: string
  studentId: string
  gradeColumnId: string
  score: number
  updatedAt: string
}

export interface ChatMessage {
  id: string
  classId: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  reactions: {
    likes: number
    hearts: number
  }
  createdAt: string
  isLecturer: boolean
}

export interface RankingStudent {
  rank: number
  studentId: string
  studentName: string
  studentCode: string
  totalScore: number
  averageScore: number
  classId: string // Add classId to filter by class
}

export interface Notification {
  id: string
  type: "system" | "admin" | "lecturer"
  from: string
  subject: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface SentNotification {
  id: string
  subject: string
  message: string
  recipients: string[]
  recipientCount: number
  classId: string
  className: string
  sentAt: string
}
