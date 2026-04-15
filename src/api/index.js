import axios from 'axios'

const api = axios.create({
  baseURL: 'https://localhost:8081/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ============ INTERCEPTOR CORREGIDO ============
api.interceptors.response.use(
  response => {
    // Transformar PascalCase a camelCase (SOLO para datos)
    if (response.data && typeof response.data === 'object') {
      const transformKeys = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(item => transformKeys(item))
        }
        if (obj !== null && typeof obj === 'object') {
          const newObj = {}
          Object.keys(obj).forEach(key => {
            const newKey = key.charAt(0).toLowerCase() + key.slice(1)
            newObj[newKey] = transformKeys(obj[key])
          })
          return newObj
        }
        return obj
      }
      response.data = transformKeys(response.data)
    }
    return response
  },
  error => {
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.error('❌ Error de conexión con el servidor')
    }
    return Promise.reject(error)
  }
)

// ============ AUTENTICACIÓN ============
export const login = async (identifier, password) => {
  try {
    const response = await api.post('/auth/login', { identifier, password })
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

export const updateRecordComment = async (id, usuarioId, comentario) => {
  try {
    const response = await api.put(`/registros/${id}`, { usuarioId, comentario })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// ============ CAJA (CORREGIDO) ============
// ✅ CORREGIDO: No envía usuarioId porque la caja es GLOBAL
export const getCajaData = async () => {
  try {
    const response = await api.get('/caja')
    console.log('📦 Respuesta de /caja:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Error getCajaData:', error)
    throw error.response?.data || error
  }
}

// ✅ CORREGIDO: No necesita usuarioId
export const updateCajaInicial = async (nuevoValor) => {
  try {
    const response = await api.put('/caja/inicial', { nuevoValor })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// ✅ CORREGIDO: No necesita usuarioId
export const updateDineroInicial = async (nuevoValor) => {
  try {
    const response = await api.put('/caja/dinero', { nuevoValor })
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

// ============ ADMINISTRACIÓN ============
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
export const getChartData = async (usuarioId, periodo = 'week') => {
  try {
    const response = await api.get('/graficas/dashboard', { 
      params: { usuarioId, periodo } 
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getDashboardData = async (usuarioId, periodo = 'week') => {
  return getChartData(usuarioId, periodo)
}

export default api