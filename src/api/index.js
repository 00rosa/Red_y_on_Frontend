// src/api/index.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://localhost:8081/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token (si lo implementas después)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ============ AUTENTICACIÓN ============
export const login = async (identifier, password) => {
  try {
    const response = await api.post('/auth/login', { identifier, password })
    
    // El backend NO devuelve token, solo datos del usuario
    if (response.data) {
      localStorage.setItem('userRole', response.data.role)
      localStorage.setItem('currentUsername', response.data.username)
      localStorage.setItem('currentUser', JSON.stringify({
        id: response.data.id,
        username: response.data.username,
        role: response.data.role,
        permissions: response.data.permissions || {}
      }))
      localStorage.setItem('isAuthenticated', 'true')
    }
    
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// ============ REGISTROS ============
export const createRecord = async (recordData) => {
  try {
    const response = await api.post('/registros', recordData)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getRecords = async (usuarioId = null, periodo = null) => {
  try {
    const params = {}
    if (usuarioId) params.usuarioId = usuarioId
    if (periodo) params.periodo = periodo
    const response = await api.get('/registros', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getRecordById = async (id) => {
  try {
    const response = await api.get(`/registros/${id}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const updateRecordComment = async (id, usuarioId, comentario) => {
  try {
    const response = await api.put(`/registros/${id}`, { usuarioId, comentario })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// ============ CATÁLOGOS ============
export const getConceptos = async () => {
  try {
    const response = await api.get('/conceptos')
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getMetodosPago = async () => {
  try {
    const response = await api.get('/metodos-pago')
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// ============ ADMINISTRACIÓN DE USUARIOS ============
export const getUsers = async () => {
  try {
    const response = await api.get('/admin/usuarios')
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const createUser = async (userData) => {
  try {
    const response = await api.post('/admin/usuarios', userData)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/admin/usuarios/${id}`, userData)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/admin/usuarios/${id}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const toggleUserStatus = async (id, activo) => {
  try {
    const response = await api.patch(`/admin/usuarios/${id}/estado`, activo, {
      headers: { 'Content-Type': 'application/json' }
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// ============ GRÁFICAS ============
export const getDashboardData = async (usuarioId, periodo = 'week') => {
  try {
    const response = await api.get('/graficas/dashboard', { 
      params: { usuarioId, periodo } 
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getChartData = async (usuarioId, periodo = 'week') => {
  try {
    const response = await api.get(`/graficas/${periodo}`, { 
      params: { usuarioId } 
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// ============ CAJA (si lo implementas después) ============
export const getCajaData = async (usuarioId) => {
  try {
    const response = await api.get(`/caja/${usuarioId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const updateCajaInicial = async (usuarioId, nuevoValor) => {
  try {
    const response = await api.put('/caja/inicial', { usuarioId, nuevoValor })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const updateDineroInicial = async (usuarioId, nuevoValor) => {
  try {
    const response = await api.put('/caja/dinero', { usuarioId, nuevoValor })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export default api