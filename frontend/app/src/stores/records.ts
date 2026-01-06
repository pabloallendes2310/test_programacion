import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export interface Record {
  id: number
  sourceId: string
  date: string
  category: string
  amount: number
  status: 'activo' | 'pendiente' | 'cancelado' | 'completado'
  description: string
  createdAt: string
  updatedAt: string
}

export interface RecordFilters {
  page?: number
  limit?: number
  category?: string
  status?: string
  startDate?: string
  endDate?: string
}

export interface RecordsResponse {
  data: Record[]
  total: number
  page: number
  limit: number
}

export interface Stats {
  totalRecords: number
  totalAmount: number
  byStatus: Array<{ status: string; count: number; total: number }>
  byCategory: Array<{ category: string; count: number; total: number }>
}

export const useRecordsStore = defineStore('records', () => {
  const records = ref<Record[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const stats = ref<Stats | null>(null)

  async function fetchRecords(filters: RecordFilters = {}) {
    loading.value = true
    error.value = null
    
    try {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.category) params.append('category', filters.category)
      if (filters.status) params.append('status', filters.status)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      
      const response = await api.get<RecordsResponse>(`/records?${params.toString()}`)
      
      records.value = response.data.data
      total.value = response.data.total
      page.value = response.data.page
      limit.value = response.data.limit
      
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar records'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    try {
      const response = await api.get<Stats>('/records/stats/summary')
      stats.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar estadísticas'
      throw err
    }
  }

  async function createRecord(record: Omit<Record, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post<Record>('/records', record)
      records.value.unshift(response.data)
      total.value++
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear record'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateRecord(id: number, updates: Partial<Record>) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.patch<Record>(`/records/${id}`, updates)
      const index = records.value.findIndex(r => r.id === id)
      if (index !== -1) {
        records.value[index] = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar record'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteRecord(id: number) {
    loading.value = true
    error.value = null
    
    try {
      await api.delete(`/records/${id}`)
      records.value = records.value.filter(r => r.id !== id)
      total.value--
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar record'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    records,
    total,
    page,
    limit,
    loading,
    error,
    stats,
    fetchRecords,
    fetchStats,
    createRecord,
    updateRecord,
    deleteRecord,
  }
})
