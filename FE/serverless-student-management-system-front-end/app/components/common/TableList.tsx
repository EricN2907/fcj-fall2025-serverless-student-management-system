import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Download, MoreVertical, ChevronLeft, ChevronRight, Edit, Ban } from 'lucide-react'

export interface Column<T> {
  header: string
  accessor: keyof T | string
  render?: (item: T) => React.ReactNode
  className?: string
}

interface TableListProps<T> {
  title: string
  subtitle?: string
  data: T[]
  columns: Column<T>[]
  onAdd?: () => void
  onImport?: () => void
  onSearch?: (term: string) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  deleteLabel?: string | ((item: T) => string) // Hỗ trợ cả string và function
  isLoading?: boolean
}

function TableList<T extends { id: string | number }>({
  title,
  subtitle,
  data,
  columns,
  onAdd,
  onImport,
  onSearch,
  onEdit,
  onDelete,
  deleteLabel = 'Xóa',
  isLoading
}: TableListProps<T>) {
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleMenu = (id: string | number) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  const handleEdit = (item: T) => {
    setOpenMenuId(null)
    onEdit?.(item)
  }

  const handleDelete = (item: T) => {
    setOpenMenuId(null)
    onDelete?.(item)
  }

  return (
    <div className='space-y-4'>
      {/* Header Actions */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-slate-800'>{title}</h2>
          {subtitle && <p className='text-slate-500 text-sm mt-1'>{subtitle}</p>}
        </div>

        <div className='flex items-center gap-3'>
          {onSearch && (
            <div className='relative group'>
              <Search
                className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#dd7323] transition-colors'
                size={18}
              />
              <input
                type='text'
                placeholder='Tìm kiếm...'
                className='pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none text-sm w-full md:w-64 transition-all'
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          )}

          {onImport && (
            <button
              onClick={onImport}
              className='flex items-center gap-2 px-4 py-2.5 bg-[#293548] text-white rounded-xl hover:bg-[#1e2736] transition-colors font-medium shadow-sm shadow-slate-200 text-sm'
            >
              <Download size={18} />
              <span className='hidden sm:inline'>Import Excel</span>
            </button>
          )}

          {onAdd && (
            <button
              onClick={onAdd}
              className='flex items-center gap-2 px-4 py-2.5 bg-[#dd7323] text-white rounded-xl hover:bg-[#c2621a] transition-colors font-medium shadow-sm shadow-orange-200 text-sm'
            >
              <Plus size={18} />
              <span className='hidden sm:inline'>Thêm mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className='bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='bg-slate-50 border-b border-slate-100'>
                {columns.map((col, index) => (
                  <th
                    key={index}
                    className={`py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
                <th className='py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right'>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-50'>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 1} className='py-12 text-center text-slate-500'>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className='py-12 text-center text-slate-500'>
                    Không có dữ liệu nào.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className='hover:bg-slate-50/50 transition-colors group'>
                    {columns.map((col, idx) => (
                      <td key={idx} className='py-4 px-6 text-sm text-slate-700'>
                        {col.render ? col.render(row) : (row as any)[col.accessor]}
                      </td>
                    ))}
                    <td className='py-4 px-6 text-right'>
                      <div className='relative inline-block'>
                        <button
                          onClick={() => toggleMenu(row.id)}
                          className='p-2 text-slate-400 hover:text-[#dd7323] hover:bg-orange-50 rounded-lg transition-colors'
                        >
                          <MoreVertical size={18} />
                        </button>

                        {/* Dropdown Menu - hiện bên trái của button */}
                        {openMenuId === row.id && (
                          <div
                            ref={menuRef}
                            className='absolute right-full top-0 mr-2 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] min-w-[160px] py-2 animate-in fade-in slide-in-from-right-2 duration-200'
                          >
                            {onEdit && (
                              <button
                                onClick={() => handleEdit(row)}
                                className='w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors'
                              >
                                <Edit size={16} className='text-slate-500' />
                                <span className='font-medium'>Cập nhật</span>
                              </button>
                            )}
                            {onEdit && onDelete && <div className='my-1 border-t border-slate-100' />}
                            {onDelete && (
                              <button
                                onClick={() => handleDelete(row)}
                                className='w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors'
                              >
                                <Ban size={16} />
                                <span className='font-medium'>
                                  {typeof deleteLabel === 'function' ? deleteLabel(row) : deleteLabel}
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Static UI) */}
        {!isLoading && data.length > 0 && (
          <div className='px-6 py-4 border-t border-slate-100 flex items-center justify-between'>
            <span className='text-sm text-slate-500'>Hiển thị 1-10 trên tổng số {data.length}</span>
            <div className='flex items-center gap-2'>
              <button className='p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-50'>
                <ChevronLeft size={16} />
              </button>
              <button className='p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500'>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TableList
