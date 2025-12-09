import api from '../utils/axios'

// ============================================
// SEARCH API TYPES
// ============================================

export type SearchType = 'classes' | 'subjects'

export interface SearchParams {
  type: SearchType
  keyword?: string
  filters?: string
}

export interface SearchResult {
  id: string
  title: string
  subtitle: string | null
  type: string // "class" | "subject"
  avatar: string | null
  extraInfo: string | null
  createdAt: string | null
  status: number | null
}

export interface SearchResponse {
  data: SearchResult[]
  total: number
}

// ============================================
// SEARCH API FUNCTIONS
// ============================================

/**
 * GET /api/search?type=classes|subjects&keyword=xxx
 * Tìm kiếm lớp học hoặc môn học cho student
 * Response: Array trực tiếp [{ id, title, subtitle, type, avatar, extraInfo, createdAt, status }]
 */
export const search = async (params: SearchParams): Promise<SearchResponse> => {
  try {
    console.log('Search API params:', params)
    const response = await api.get('/api/search', { params })
    console.log('Search API RAW response:', response)
    console.log('Search API response.data:', response.data)

    // Response có thể là nhiều format khác nhau
    let results: SearchResult[] = []
    if (Array.isArray(response.data)) {
      results = response.data
    } else if (response.data?.results && Array.isArray(response.data.results)) {
      results = response.data.results
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      results = response.data.data
    }

    console.log('Search API parsed results:', results)
    return {
      data: results,
      total: results.length
    }
  } catch (error) {
    console.error('Search API error:', error)
    return { data: [], total: 0 }
  }
}

export default {
  search
}
