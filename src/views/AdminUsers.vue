<template>
  <div class="admin-page">
    <AppHeader @toggle-sidebar="toggleSidebar" />
    <AppSidebar :isOpen="sidebarOpen" />
    
    <main :class="['main-content', { 'sidebar-open': sidebarOpen }]">
      <!-- Mensaje de acceso denegado para no administradores -->
      <div v-if="!esAdministrador" class="access-denied">
        <div class="denied-card">
          <span class="denied-icon">🔒</span>
          <h2>Acceso Restringido</h2>
          <p>Solo los administradores pueden gestionar usuarios.</p>
          <button @click="volverAlDashboard" class="btn-volver">
            Volver al Dashboard
          </button>
        </div>
      </div>

      <template v-else>
        <div class="page-header">
          <h1>Administración de Usuarios</h1>
          <p>Gestión de permisos y acceso al sistema</p>
          <div v-if="loading" class="loading-notice">
            ⏳ Cargando...
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="admin-stats">
          <div class="stat-card">
            <div class="stat-icon" style="background: #1f998f20;">
              <span>👤</span>
            </div>
            <div class="stat-content">
              <h4>Total Usuarios</h4>
              <p class="stat-value">{{ totalUsers }}</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon" style="background: #27ae6020;">
              <span>✅</span>
            </div>
            <div class="stat-content">
              <h4>Activos</h4>
              <p class="stat-value">{{ activeUsers }}</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon" style="background: #3498db20;">
              <span>👑</span>
            </div>
            <div class="stat-content">
              <h4>Administradores</h4>
              <p class="stat-value">{{ adminUsers }}</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon" style="background: #9b59b620;">
              <span>🗂️</span>
            </div>
            <div class="stat-content">
              <h4>Operadores</h4>
              <p class="stat-value">{{ operatorUsers }}</p>
            </div>
          </div>
        </div>

        <div class="admin-content">
          <!-- Formulario para nuevo usuario (solo visible para admins) -->
          <div class="form-section">
            <div class="section-header">
              <h3>{{ editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}</h3>
              <button v-if="editingUser" @click="cancelEdit" class="btn-cancel">
                ❌ Cancelar Edición
              </button>
            </div>
            
            <form @submit.prevent="saveUser" class="user-form">
              <div class="form-grid">
                <div class="form-group">
                  <label>Nombre de Usuario:</label>
                  <input 
                    type="text" 
                    v-model="userForm.username" 
                    placeholder="Ej: juan.perez" 
                    required
                    :disabled="submitting"
                  >
                </div>
                
                <div class="form-group">
                  <label>Contraseña:</label>
                  <input 
                    type="password" 
                    v-model="userForm.password" 
                    :placeholder="editingUser ? 'Dejar en blanco para no cambiar' : 'Usa caracteres variados'"
                    :required="!editingUser"
                    :disabled="submitting"
                  >
                  <small class="password-hint">
                    {{ editingUser ? 'Solo llenar para cambiar contraseña' : 'Requerida para nuevo usuario' }}
                  </small>
                </div>
                
                <div class="form-group">
                  <label>Rol:</label>
                  <select v-model="userForm.role" @change="onRoleChange" required :disabled="submitting">
                    <option value="operador">Operador</option>
                    <option value="administrador">Administrador</option>
                  </select>
                  <small class="role-hint">
                    {{
                      userForm.role === 'administrador' ? 'Acceso total al sistema' :
                      'Solo lectura y creación básica'
                    }}
                  </small>
                </div>
                
                <div class="form-group">
                  <label>Estado:</label>
                  <div class="status-toggle">
                    <label class="toggle-label">
                      <input type="checkbox" v-model="userForm.activo" :disabled="submitting">
                      <span class="toggle-slider"></span>
                      <span class="toggle-text">
                        {{ userForm.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </label>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Fecha de Expiración:</label>
                  <input 
                    type="date"
                    v-model="userForm.fechaExpiracion"
                    :min="getCurrentDateMexico()"
                    :disabled="submitting"
                  >
                  <small class="date-hint">
                    {{ userForm.fechaExpiracion ? 'Expira: ' + formatDateMexico(userForm.fechaExpiracion) : 'Sin fecha de expiración' }}
                  </small>
                </div>
              </div>

              <!-- PERMISOS ESPECÍFICOS PARA TABLES -->
              <div class="permissions-section">
                <h4>Permisos en Página Tables</h4>
                <div class="permissions-grid">
                  <div class="permission-category">
                    <h5>Formulario de Registros</h5>
                    <div class="permission-item">
                      <label>
                        <input type="checkbox" v-model="userForm.permissions.crearRegistros" :disabled="submitting">
                        <span>Crear nuevos registros</span>
                      </label>
                      <small>Agregar registros en formulario</small>
                    </div>
                  </div>
                  
                  <div class="permission-category">
                    <h5>Visualización</h5>
                    <div class="permission-item">
                      <label>
                        <input type="checkbox" v-model="userForm.permissions.soloVer" :disabled="submitting">
                        <span>Solo Ver registros</span>
                      </label>
                      <small>No puede crear, editar ni eliminar</small>
                    </div>
                  </div>
                  
                  <div class="permission-category">
                    <h5>Comentarios</h5>
                    <div class="permission-item">
                      <label>
                        <input type="checkbox" v-model="userForm.permissions.editarComentarios" :disabled="submitting">
                        <span>Editar Comentarios</span>
                      </label>
                      <small>Permite editar comentarios en registros</small>
                    </div>
                  </div>
                  
                  <div class="permission-category">
                    <h5>Impresión</h5>
                    <div class="permission-item">
                      <label>
                        <input type="checkbox" v-model="userForm.permissions.imprimir" :disabled="submitting">
                        <span>Imprimir registros</span>
                      </label>
                      <small>Permite imprimir comprobantes</small>
                    </div>
                  </div>
                  
                  <div class="permission-category">
                    <h5>Widgets de Caja</h5>
                    <div class="permission-item">
                      <label>
                        <input type="checkbox" v-model="userForm.permissions.modificarCajaInicial" :disabled="submitting">
                        <span>Modificar Caja Inicial</span>
                      </label>
                      <small>Editar presupuesto inicial</small>
                    </div>
                    <div class="permission-item">
                      <label>
                        <input type="checkbox" v-model="userForm.permissions.modificarDineroInicial" :disabled="submitting">
                        <span>Modificar Dinero Inicial</span>
                      </label>
                      <small>Editar dinero disponible</small>
                    </div>
                  </div>
                  
                  <div class="permission-category">
                    <h5>Exportación de Datos</h5>
                    <div class="permission-item">
                      <label>
                        <input type="checkbox" v-model="userForm.permissions.exportarDatos" :disabled="submitting">
                        <span>Exportar datos</span>
                      </label>
                      <small>Exportar registros a Excel/CSV</small>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn-secondary" @click="resetForm" :disabled="submitting">
                  Limpiar
                </button>
                <button type="submit" class="btn-primary" :disabled="submitting">
                  <span v-if="submitting">Guardando...</span>
                  <span v-else>{{ editingUser ? '💾 Actualizar Usuario' : 'Crear Usuario' }}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Lista de usuarios -->
          <div class="users-section">
            <div class="section-header">
              <h3>Lista de Usuarios</h3>
              <div class="search-box">
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  placeholder="Buscar usuario..."
                  class="search-input"
                  :disabled="loading"
                >
                <span class="search-icon">🔍</span>
              </div>
            </div>

            <div class="users-table">
              <div v-if="loading" class="loading-indicator">
                Cargando usuarios...
              </div>
              <table v-else>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Permisos Tables</th>
                    <th>Expiración</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in filteredUsers" :key="user.id">
                    <td>
                      <div class="user-info">
                        <span class="username">{{ user.username }}</span>
                      </div>
                    </td>
                    <td>
                      <span :class="['role-tag', user.role]">
                        {{ getRoleName(user.role) }}
                      </span>
                    </td>
                    <td>
                      <span :class="['status-badge', user.activo ? 'active' : 'inactive']">
                        {{ user.activo ? '✅ Activo' : '❌ Inactivo' }}
                      </span>
                    </td>
                    <td>
                      <div class="permissions-summary">
                        <span class="permission-count">
                          {{ countActivePermissions(user.permissions) }} / 7
                        </span>
                        <button 
                          @click="viewPermissions(user)" 
                          class="btn-view-permissions"
                          title="Ver permisos detallados"
                          :disabled="updating"
                        >
                          👁️
                        </button>
                      </div>
                    </td>
                    <td>
                      <span :class="['expiration', isExpiredMexico(user) ? 'expired' : 'valid']">
                        {{ user.fechaExpiracion ? formatDateMexico(user.fechaExpiracion) : 'Sin expiración' }}
                        <small v-if="isExpiredMexico(user)" class="expired-label">(Expirado)</small>
                      </span>
                    </td>
                    <td class="actions-cell">
                      <div class="action-buttons">
                        <button @click="editUser(user)" class="btn-edit" title="Editar" :disabled="updating">
                          ✏️
                        </button>
                        <button 
                          @click="toggleUserStatus(user)" 
                          :class="['btn-toggle', user.activo ? 'deactivate' : 'activate']"
                          :title="user.activo ? 'Desactivar' : 'Activar'"
                          :disabled="updating"
                        >
                          {{ user.activo ? '⏸️' : '▶️' }}
                        </button>
                        <button 
                          v-if="user.role !== 'administrador'" 
                          @click="deleteUser(user.id)" 
                          class="btn-delete"
                          title="Eliminar"
                          :disabled="updating"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="filteredUsers.length === 0">
                    <td colspan="6" class="no-users">
                      No se encontraron usuarios
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Modal de permisos -->
        <div v-if="showPermissionsModal" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>Permisos de {{ selectedUser?.username }}</h3>
              <button @click="closeModal" class="modal-close">×</button>
            </div>
            <div class="modal-body">
              <div class="permissions-detail">
                <div class="permission-group">
                  <h4>Formulario:</h4>
                  <ul>
                    <li :class="selectedUser?.permissions.crearRegistros ? 'allowed' : 'denied'">
                      {{ selectedUser?.permissions.crearRegistros ? '✅' : '❌' }} Crear registros
                    </li>
                  </ul>
                </div>
                
                <div class="permission-group">
                  <h4>Visualización:</h4>
                  <ul>
                    <li :class="selectedUser?.permissions.soloVer ? 'allowed' : 'denied'">
                      {{ selectedUser?.permissions.soloVer ? '✅' : '❌' }} Solo Ver
                    </li>
                  </ul>
                </div>
                
                <div class="permission-group">
                  <h4>Comentarios:</h4>
                  <ul>
                    <li :class="selectedUser?.permissions.editarComentarios ? 'allowed' : 'denied'">
                      {{ selectedUser?.permissions.editarComentarios ? '✅' : '❌' }} Editar Comentarios
                    </li>
                  </ul>
                </div>
                
                <div class="permission-group">
                  <h4>Impresión:</h4>
                  <ul>
                    <li :class="selectedUser?.permissions.imprimir ? 'allowed' : 'denied'">
                      {{ selectedUser?.permissions.imprimir ? '✅' : '❌' }} Imprimir
                    </li>
                  </ul>
                </div>
                
                <div class="permission-group">
                  <h4>Caja:</h4>
                  <ul>
                    <li :class="selectedUser?.permissions.modificarCajaInicial ? 'allowed' : 'denied'">
                      {{ selectedUser?.permissions.modificarCajaInicial ? '✅' : '❌' }} Modificar Caja Inicial
                    </li>
                    <li :class="selectedUser?.permissions.modificarDineroInicial ? 'allowed' : 'denied'">
                      {{ selectedUser?.permissions.modificarDineroInicial ? '✅' : '❌' }} Modificar Dinero Inicial
                    </li>
                  </ul>
                </div>
                
                <div class="permission-group">
                  <h4>Exportación:</h4>
                  <ul>
                    <li :class="selectedUser?.permissions.exportarDatos ? 'allowed' : 'denied'">
                      {{ selectedUser?.permissions.exportarDatos ? '✅' : '❌' }} Exportar datos
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button @click="closeModal" class="btn-close-modal">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/Layout/Header.vue'
import AppSidebar from '@/components/Layout/Sidebar.vue'
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  toggleUserStatus 
} from '@/api' // IMPORTAR funciones de API

export default {
  name: 'AdminUsersView',
  components: {
    AppHeader,
    AppSidebar
  },
  setup() {
    const router = useRouter()
    const sidebarOpen = ref(false)
    const searchQuery = ref('')
    const editingUser = ref(null)
    const showPermissionsModal = ref(false)
    const selectedUser = ref(null)
    
    // Estados de carga
    const loading = ref(false)
    const submitting = ref(false)
    const updating = ref(false)

    // Verificar si el usuario actual es administrador
    const esAdministrador = computed(() => {
      const userRole = localStorage.getItem('userRole')
      return userRole === 'administrador'
    })

    // Formulario de usuario
    const userForm = ref({
      username: '',
      password: '',
      role: 'operador',
      activo: true,
      fechaExpiracion: '',
      permissions: {
        crearRegistros: false,
        soloVer: false,
        editarComentarios: false,
        imprimir: false,
        modificarCajaInicial: false,
        modificarDineroInicial: false,
        exportarDatos: false
      }
    })

    // Lista de usuarios
    const users = ref([])

    // Cargar datos al iniciar
    onMounted(() => {
      if (esAdministrador.value) {
        loadUsersFromAPI()
      }
    })

    const volverAlDashboard = () => {
      router.push('/dashboard')
    }

    // ========== FUNCIONES DE API ==========

    // Cargar usuarios desde API
    const loadUsersFromAPI = async () => {
      loading.value = true
      try {
        const data = await getUsers()
        users.value = data
      } catch (error) {
        console.error('Error cargando usuarios:', error)
        alert('Error al cargar usuarios')
      } finally {
        loading.value = false
      }
    }

    // Guardar usuario (crear o actualizar)
    const saveUser = async () => {
      if (!esAdministrador.value) {
        alert('❌ No tienes permiso para crear/modificar usuarios')
        return
      }

      // Validaciones
      if (!userForm.value.username.trim()) {
        alert('El nombre de usuario es requerido')
        return
      }

      if (!editingUser.value && !userForm.value.password) {
        alert('La contraseña es requerida para nuevos usuarios')
        return
      }

      submitting.value = true
      try {
        if (editingUser.value) {
          // Actualizar usuario existente
          await updateUser(editingUser.value.id, {
            username: userForm.value.username,
            role: userForm.value.role,
            activo: userForm.value.activo,
            fechaExpiracion: userForm.value.fechaExpiracion || null,
            permissions: userForm.value.permissions,
            password: userForm.value.password || undefined
          })
          alert('✅ Usuario actualizado')
        } else {
          // Crear nuevo usuario
          await createUser({
            username: userForm.value.username,
            password: userForm.value.password,
            role: userForm.value.role,
            activo: userForm.value.activo,
            fechaExpiracion: userForm.value.fechaExpiracion || null,
            permissions: userForm.value.permissions
          })
          alert('✅ Usuario creado')
        }
        
        resetForm()
        await loadUsersFromAPI()
      } catch (error) {
        alert('❌ ' + (error.mensaje || 'Error al guardar usuario'))
      } finally {
        submitting.value = false
      }
    }

    // Cambiar estado del usuario
    const toggleUserStatus = async (user) => {
      if (!esAdministrador.value) {
        alert('❌ No tienes permiso para cambiar el estado de usuarios')
        return
      }

      if (user.username === 'admin') {
        alert('No se puede desactivar el usuario administrador principal')
        return
      }

      updating.value = true
      try {
        await toggleUserStatus(user.id, !user.activo)
        await loadUsersFromAPI()
        alert(`✅ Usuario ${!user.activo ? 'activado' : 'desactivado'}`)
      } catch (error) {
        alert('❌ ' + (error.mensaje || 'Error al cambiar estado'))
      } finally {
        updating.value = false
      }
    }

    // Eliminar usuario
    const deleteUser = async (id) => {
      if (!esAdministrador.value) {
        alert('❌ No tienes permiso para eliminar usuarios')
        return
      }

      const user = users.value.find(u => u.id === id)
      if (!user) return

      if (user.username === 'admin') {
        alert('No se puede eliminar el usuario administrador principal')
        return
      }

      if (confirm(`¿Está seguro de eliminar al usuario "${user.username}"?`)) {
        updating.value = true
        try {
          await deleteUser(id)
          await loadUsersFromAPI()
          alert('✅ Usuario eliminado')
        } catch (error) {
          alert('❌ ' + (error.mensaje || 'Error al eliminar'))
        } finally {
          updating.value = false
        }
      }
    }

    // ========== FUNCIONES DE FORMULARIO ==========

    const editUser = (user) => {
      if (!esAdministrador.value) {
        alert('❌ No tienes permiso para editar usuarios')
        return
      }
      editingUser.value = user
      userForm.value = {
        username: user.username,
        password: '',
        role: user.role,
        activo: user.activo,
        fechaExpiracion: user.fechaExpiracion || '',
        permissions: { ...user.permissions }
      }
      
      document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' })
    }

    const cancelEdit = () => {
      editingUser.value = null
      resetForm()
    }

    const resetForm = () => {
      userForm.value = {
        username: '',
        password: '',
        role: 'operador',
        activo: true,
        fechaExpiracion: '',
        permissions: {
          crearRegistros: true,
          soloVer: false,
          editarComentarios: true,
          imprimir: true,
          modificarCajaInicial: false,
          modificarDineroInicial: false,
          exportarDatos: false
        }
      }
      editingUser.value = null
    }

    const onRoleChange = () => {
      switch(userForm.value.role) {
        case 'administrador':
          userForm.value.permissions = {
            crearRegistros: true,
            soloVer: false,
            editarComentarios: true,
            imprimir: true,
            modificarCajaInicial: true,
            modificarDineroInicial: true,
            exportarDatos: true
          }
          break
          
        case 'operador':
          userForm.value.permissions = {
            crearRegistros: true,
            soloVer: false,
            editarComentarios: true,
            imprimir: true,
            modificarCajaInicial: false,
            modificarDineroInicial: false,
            exportarDatos: false
          }
          break
      }
    }

    // ========== FUNCIONES DE UTILIDAD ==========

    // Funciones para horario México
    const getCurrentDateMexico = () => {
      const now = new Date()
      const offsetMexico = -6 * 60
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
      const fechaMexico = new Date(utc + (offsetMexico * 60000))
      
      const año = fechaMexico.getFullYear()
      const mes = String(fechaMexico.getMonth() + 1).padStart(2, '0')
      const dia = String(fechaMexico.getDate()).padStart(2, '0')
      
      return `${año}-${mes}-${dia}`
    }

    const getFechaMexico = (fechaString) => {
      if (!fechaString) return new Date()
      
      const fecha = new Date(fechaString)
      const offsetMexico = -6 * 60
      const utc = fecha.getTime() + (fecha.getTimezoneOffset() * 60000)
      return new Date(utc + (offsetMexico * 60000))
    }

    const formatDateMexico = (dateString) => {
      if (!dateString) return ''
      
      try {
        if (dateString.includes('-')) {
          const [año, mes, dia] = dateString.split('-')
          return `${dia}/${mes}/${año}`
        }
        
        const fechaMexico = getFechaMexico(dateString)
        const dia = String(fechaMexico.getDate()).padStart(2, '0')
        const mes = String(fechaMexico.getMonth() + 1).padStart(2, '0')
        const año = fechaMexico.getFullYear()
        
        return `${dia}/${mes}/${año}`
      } catch (error) {
        console.error('Error formateando fecha:', dateString, error)
        return dateString
      }
    }

    const isExpiredMexico = (user) => {
      if (!user.fechaExpiracion) return false
      
      const hoyMexico = getFechaMexico(getCurrentDateMexico())
      hoyMexico.setHours(0, 0, 0, 0)
      
      const expDate = getFechaMexico(user.fechaExpiracion)
      expDate.setHours(0, 0, 0, 0)
      
      return expDate < hoyMexico
    }

    // Computed properties
    const totalUsers = computed(() => users.value.length)
    const activeUsers = computed(() => users.value.filter(u => u.activo).length)
    const adminUsers = computed(() => users.value.filter(u => u.role === 'administrador').length)
    const operatorUsers = computed(() => users.value.filter(u => u.role === 'operador').length)

    // Búsqueda
    const filteredUsers = computed(() => {
      if (!searchQuery.value) return users.value
      const query = searchQuery.value.toLowerCase()
      return users.value.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      )
    })

    // Funciones de modal
    const viewPermissions = (user) => {
      selectedUser.value = user
      showPermissionsModal.value = true
    }

    const closeModal = () => {
      showPermissionsModal.value = false
      selectedUser.value = null
    }

    const countActivePermissions = (permissions) => {
      if (!permissions) return 0
      const soloLosSiete = [
        permissions.crearRegistros,
        permissions.soloVer,
        permissions.editarComentarios,
        permissions.imprimir,
        permissions.modificarCajaInicial,
        permissions.modificarDineroInicial,
        permissions.exportarDatos
      ]
      return soloLosSiete.filter(p => p === true).length
    }

    const getRoleName = (role) => {
      switch(role) {
        case 'administrador': return 'Administrador'
        case 'operador': return 'Operador'
        default: return role
      }
    }

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value
    }

    return {
      sidebarOpen,
      searchQuery,
      editingUser,
      showPermissionsModal,
      selectedUser,
      userForm,
      users,
      loading,
      submitting,
      updating,
      totalUsers,
      activeUsers,
      adminUsers,
      operatorUsers,
      filteredUsers,
      esAdministrador,
      toggleSidebar,
      onRoleChange,
      saveUser,
      editUser,
      cancelEdit,
      resetForm,
      toggleUserStatus,
      deleteUser,
      viewPermissions,
      closeModal,
      countActivePermissions,
      isExpiredMexico,
      formatDateMexico,
      getCurrentDateMexico,
      getRoleName,
      volverAlDashboard
    }
  }
}
</script>

<style scoped>
/* Mantén todos los estilos originales y añade: */
.loading-notice {
  background: #3498db20; 
  border: 1px solid #3498db;
  border-radius: 6px;
  padding: 10px 15px;
  margin-top: 10px;
  color: #2980b9;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.loading-indicator {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}
/* Tus estilos existentes más: */

.access-denied {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.denied-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  max-width: 400px;
}

.denied-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 20px;
}

.denied-card h2 {
  color: #e74c3c;
  margin-bottom: 10px;
}

.denied-card p {
  color: #666;
  margin-bottom: 30px;
}

.btn-volver {
  background: #1f998f;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-volver:hover {
  background: #18857c;
  transform: translateY(-2px);
}

.admin-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.main-content {
  padding: 20px;
  margin-left: 0;
  transition: margin-left 0.3s ease;
}

.main-content.sidebar-open {
  margin-left: 280px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  color: #1f998f;
  margin-bottom: 8px;
  font-size: 1.8rem;
}

.page-header p {
  color: #666;
  font-size: 16px;
}

/* Estadísticas */
.admin-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-content h4 {
  margin: 0 0 5px;
  color: #666;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

/* Layout principal */
.admin-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

@media (max-width: 1200px) {
  .admin-content {
    grid-template-columns: 1fr;
  }
}

/* Sección de formulario */
.form-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  color: #1f998f;
  margin: 0;
}

.btn-cancel {
  padding: 8px 16px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-cancel:hover {
  background: #c0392b;
}

/* Formulario */
.user-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-group input,
.form-group select {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #1f998f;
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.password-hint,
.role-hint,
.date-hint {
  font-size: 12px;
  color: #666;
  font-style: italic;
}

/* Toggle de estado */
.status-toggle {
  margin-top: 8px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.toggle-label input {
  display: none;
}

.toggle-slider {
  width: 50px;
  height: 26px;
  background: #ddd;
  border-radius: 13px;
  position: relative;
  transition: background 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
}

.toggle-label input:checked + .toggle-slider {
  background: #27ae60;
}

.toggle-label input:checked + .toggle-slider::before {
  transform: translateX(24px);
}

.toggle-text {
  font-weight: 500;
}

/* Permisos */
.permissions-section {
  border-top: 2px solid #eee;
  padding-top: 20px;
}

.permissions-section h4 {
  color: #1f998f;
  margin-bottom: 15px;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.permission-category {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
}

.permission-category h5 {
  color: #333;
  margin: 0 0 10px;
  font-size: 14px;
}

.permission-item {
  margin-bottom: 12px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #eee;
}

.permission-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 4px;
}

.permission-item small {
  display: block;
  font-size: 11px;
  color: #666;
  margin-left: 24px;
}

/* Botones del formulario */
.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 2px solid #eee;
}

.btn-primary, .btn-secondary {
  padding: 14px 28px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #1f998f 0%, #21a398 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(31, 153, 143, 0.3);
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 2px solid #ddd;
}

.btn-secondary:hover {
  background: #e9e9e9;
}

/* Sección de usuarios */
.users-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.search-box {
  position: relative;
  width: 300px;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.search-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

/* Tabla de usuarios */
.users-table {
  overflow-x: auto;
  margin-top: 20px;
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  color: #666;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 2px solid #eee;
  white-space: nowrap;
}

.users-table td {
  padding: 15px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  vertical-align: middle;
}

.users-table tr:hover {
  background: #f9f9f9;
}

/* Estilos para celdas */
.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.username {
  font-weight: 600;
  color: #333;
}

.role-tag {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}

.role-tag.administrador {
  background: #e74c3c20;
  color: #c0392b;
}

.role-tag.operador {
  background: #3498db20;
  color: #2980b9;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.active {
  background: #27ae6020;
  color: #219653;
}

.status-badge.inactive {
  background: #95a5a620;
  color: #7f8c8d;
}

.permissions-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}

.permission-count {
  font-weight: 600;
  color: #333;
}

.btn-view-permissions {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-view-permissions:hover {
  background: #f5f5f5;
  transform: scale(1.1);
}

.expiration {
  font-size: 13px;
}

.expiration.valid {
  color: #27ae60;
}

.expiration.expired {
  color: #e74c3c;
}

.expired-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
}

/* Botones de acción */
.actions-cell {
  width: 150px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-edit, .btn-toggle, .btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 6px 10px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-edit:hover {
  background: #3498db20;
}

.btn-toggle.activate:hover {
  background: #27ae6020;
}

.btn-toggle.deactivate:hover {
  background: #f39c1220;
}

.btn-delete:hover {
  background: #e74c3c20;
}

.no-users {
  text-align: center;
  color: #666;
  padding: 40px !important;
  font-style: italic;
}

/* Modal de permisos */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid #eee;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.modal-header h3 {
  color: #1f998f;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #666;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.modal-close:hover {
  background: #f5f5f5;
  color: #e74c3c;
}

.modal-body {
  padding: 20px;
}

.permissions-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.permission-group h4 {
  color: #333;
  margin-bottom: 10px;
  font-size: 15px;
}

.permission-group ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.permission-group li {
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
}

.permission-group li.allowed {
  background: #27ae6020;
  color: #219653;
}

.permission-group li.denied {
  background: #e74c3c20;
  color: #c0392b;
}

.modal-footer {
  padding: 20px;
  border-top: 2px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.btn-close-modal {
  padding: 10px 20px;
  background: #1f998f;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-close-modal:hover {
  background: #18857c;
}

/* Responsive */
@media (max-width: 768px) {
  .main-content.sidebar-open {
    margin-left: 0;
  }
  
  .admin-stats {
    grid-template-columns: 1fr;
  }
  
  .search-box {
    width: 100%;
  }
  
  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .modal-content {
    margin: 10px;
  }
}

.form-group input[type="date"] {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
  width: 100%;
}

.form-group input[type="date"]:focus {
  outline: none;
  border-color: #1f998f;
}

.permission-item input:disabled + span {
  opacity: 0.6;
  color: #999;
}

@media (max-width: 1200px) {
  .users-table {
    overflow-x: auto;
  }
  
  .users-table table {
    min-width: 800px;
  }
}
</style>