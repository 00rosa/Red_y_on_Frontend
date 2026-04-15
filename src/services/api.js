import axios from 'axios'

const api = axios.create({
  baseURL: 'https://localhost:8081/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token
// En api.js - Agrega esto después de crear el axios instance
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.error('❌ Error de conexión con el servidor');
      // Puedes emitir un evento global o mostrar una notificación
      window.dispatchEvent(new CustomEvent('api-connection-error', {  
        detail: { message: 'No se pudo conectar con el servidor' }
      }));
    }
    return Promise.reject(error);
  }
);

// ============ AUTENTICACIÓN ============
export const login = async (identifier, password) => {
  try {
    const response = await api.post('/auth/login', { identifier, password })
    
    // El backend NO devuelve token (según AuthController en RedApi.txt)
    // Solo devuelve: id, username, role, activo, permissions
    if (response.data) {
      localStorage.setItem('userRole', response.data.role)
      localStorage.setItem('currentUsername', response.data.username)
      localStorage.setItem('currentUser', JSON.stringify({
        id: response.data.id,
        username: response.data.username,
        role: response.data.role,
        permissions: response.data.permissions
      }))
      localStorage.setItem('isAuthenticated', 'true')
    }
    
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// ============ REGISTROS ============
// api.js
export const createRecord = async (recordData) => {
  try {
    console.log('📤 Enviando registro:', recordData);
    
    const response = await api.post('/registros', {
      fecha: recordData.fecha,
      nombre: recordData.nombre,
      conceptoId: recordData.conceptoId,  // ← IMPORTANTE: es conceptoId, no concepto
      folio: recordData.folio || '',
      metodoPagoId: recordData.metodoPagoId,  // ← IMPORTANTE: es metodoPagoId, no metodoPago
      cantidad: Number(recordData.cantidad),
      usuarioId: recordData.usuarioId,
      comentario: recordData.comentario || ''
    });
    
    console.log('📥 Respuesta:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error en createRecord:', error);
    console.error('Respuesta del servidor:', error.response?.data);
    throw error.response?.data || error;
  }
};
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

// CORREGIDO: Ahora solo actualiza comentarios (como espera el backend)
export const updateRecordComment = async (id, usuarioId, comentario) => {
  try {
    const response = await api.put(`/registros/${id}`, { usuarioId, comentario })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// ⚠️ ELIMINADO: updateRecord (no se usa, se reemplaza por updateRecordComment)
// ⚠️ ELIMINADO: filterRecords (se usa getRecords con parámetros)


// ============ CAJA (GLOBAL) ============
export const getCajaData = async () => {
  try {
    const response = await api.get('/caja')
    // El backend debe devolver algo como:
    // { cajaInicial: 10000, dineroInicial: 5000 }
    return response.data
  } catch (error) {
    console.error('Error getCajaData:', error)
    throw error
  }
}

export const updateCajaInicial = async (nuevoValor) => {
  try {
    const response = await api.put('/caja/inicial', { nuevoValor })
    console.log('📦 Respuesta updateCajaInicial:', response.data)
    return response.data  // Debe incluir cajaInicial, dineroInicial, dineroFinal
  } catch (error) {
    throw error.response?.data || error
  }
}

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
// 🔥 CORREGIDO: Ahora usa GET con parámetros (como espera el backend)
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

// Alternativa: usar el endpoint dashboard
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

export default api