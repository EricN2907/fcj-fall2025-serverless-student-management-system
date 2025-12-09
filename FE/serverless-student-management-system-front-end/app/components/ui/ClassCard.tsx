'use client'

import { useMemo } from 'react'
import { Link } from 'react-router'
import {
  Users,
  BookOpen,
  Calendar,
  MoreVertical,
  Settings,
  Power,
  Eye,
} from 'lucide-react'
import type { ClassDTO } from '~/types'

interface ClassCardProps {
  classData: ClassDTO
  onEdit: (classData: ClassDTO) => void
  onDeactivate: (classData: ClassDTO) => void
}

// Abstract background images from Unsplash
const ABSTRACT_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80', // Gradient blue
  'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=800&q=80', // Gradient orange
  'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80', // Abstract waves
  'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=800&q=80', // Gradient purple
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80', // Colorful gradient
  'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&q=80', // Blue abstract
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80', // Gradient mesh
  'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=800&q=80', // Purple gradient
  'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=800&q=80', // Abstract lines
  'https://images.unsplash.com/photo-1614851099511-773084f6911d?w=800&q=80', // Blue mesh
]

// Get consistent background for a class based on its ID
function getBackgroundImage(classId: number): string {
  const index = classId % ABSTRACT_BACKGROUNDS.length
  return ABSTRACT_BACKGROUNDS[index]
}

// Status badge component
function StatusBadge({ status }: { status: number }) {
  const isActive = status === 1
  return (
    <span
      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
        isActive
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      {isActive ? 'Đang hoạt động' : 'Đã tạm dừng'}
    </span>
  )
}

export default function ClassCard({ classData, onEdit, onDeactivate }: ClassCardProps) {
  const backgroundImage = useMemo(() => getBackgroundImage(classData.id), [classData.id])
  const isActive = classData.status === 1

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:border-slate-200 transition-all duration-300">
      {/* Background Image with Overlay */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={backgroundImage}
          alt=""
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Top Actions - More Menu */}
        <div className="absolute top-3 right-3 z-10">
          <div className="relative group/menu">
            <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
              <MoreVertical size={16} />
            </button>
            {/* Dropdown Menu */}
            <div className="absolute top-full right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-20">
              <div className="py-1">
                <Link
                  to={`/lecturer/classes/${classData.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Eye size={16} />
                  Xem chi tiết
                </Link>
                <button
                  onClick={() => onEdit(classData)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Settings size={16} />
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => onDeactivate(classData)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Power size={16} />
                  {isActive ? 'Tạm dừng' : 'Kích hoạt'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Class Info on Image */}
        <div className="absolute bottom-3 left-4 right-4 z-10">
          <h3 className="text-lg font-semibold text-white truncate mb-1">
            {classData.name}
          </h3>
          <p className="text-sm text-white/80 truncate">{classData.subject_name}</p>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-4">
        {/* Description */}
        {classData.description && (
          <p className="text-sm text-slate-500 line-clamp-2">{classData.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <Users size={15} className="text-slate-400" />
            <span>{classData.student_count || 0} SV</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen size={15} className="text-slate-400" />
            <span>{classData.semester}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={15} className="text-slate-400" />
            <span>{classData.academic_year}</span>
          </div>
        </div>

        {/* Footer: Status + View Button */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <StatusBadge status={classData.status} />
          <Link
            to={`/lecturer/classes/${classData.id}`}
            className="px-4 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
          >
            Vào lớp
          </Link>
        </div>
      </div>
    </div>
  )
}
