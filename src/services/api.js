import axios from 'axios'

const api = axios.create({
  baseURL: 'https://localhost:7100/api', // Tu API en C#
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Funciones para Login
export const login = async (ubicacion, password) => {
  try {
    const response = await api.post('/Auth/login', {
      ubicacion,
      password
    })
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('userRole', response.data.role)
    }
    
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Funciones para Registros
export const saveRecord = async (recordData) => {
  try {
    const response = await api.post('/Records', recordData)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getRecords = async (filter = {}) => {
  try {
    const response = await api.get('/Records', { params: filter })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Funciones para Gráficas
export const getChartData = async (period) => {
  try {
    const response = await api.get(`/Charts/${period}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Funciones de Administración
export const getUsers = async () => {
  try {
    const response = await api.get('/Admin/users')
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const createUser = async (userData) => {
  try {
    const response = await api.post('/Admin/users', userData)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export default api