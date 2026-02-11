<template>
  <div class="admin-page">
    <AppHeader @toggle-sidebar="toggleSidebar" />
    <AppSidebar :isOpen="sidebarOpen" />
    
    <main :class="['main-content', { 'sidebar-open': sidebarOpen }]">
      <div class="page-header">
        <h1>Administración de Usuarios</h1>
        <p>Gestión de permisos y acceso al sistema</p>
      </div>

      <!-- Estadísticas (se mantiene igual) -->
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
          <div class="stat-icon" style="background: #f39c1220;">
            <span>👁️</span>
          </div>
          <div class="stat-content">
            <h4>Supervisores</h4>
            <p class="stat-value">{{ supervisorUsers }}</p>
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
        <!-- Formulario para nuevo usuario -->
        <div class="form-section">
          <div class="section-header">
            <h3>Crear Nuevo Usuario</h3>
            <button v-if="editingUser" @click="cancelEdit" class="btn-cancel">
              ❌ Cancelar Edición
            </button>
          </div>
          
          <form @submit.prevent="saveUser" class="user-form">
            <div class="form-grid">
              <div class="form-group">
                <label>Correo Electrónico:</label>
                <input 
                  type="email" 
                  v-model="userForm.email" 
                  placeholder="Ej: usuario@empresa.com" 
                  required
                >
                <small class="email-hint">Usuario para inicio de sesión vía correo</small>
              </div>
              
              <div class="form-group">
                <label>Nombre de Usuario:</label>
                <input 
                  type="text" 
                  v-model="userForm.username" 
                  placeholder="Ej: juan.perez" 
                  required
                  :disabled="editingUser"
                >
              </div>
              
              <div class="form-group">
                <label>Contraseña:</label>
                <input 
                  type="password" 
                  v-model="userForm.password" 
                  :placeholder="editingUser ? 'Dejar en blanco para no cambiar' : 'Usa caracteres variados'"
                  :required="!editingUser"
                >
                <small class="password-hint">
                  {{ editingUser ? 'Solo llenar para cambiar contraseña' : 'Requerida para nuevo usuario' }}
                </small>
              </div>
              
              <div class="form-group">
                <label>Rol:</label>
                <select v-model="userForm.role" @change="onRoleChange" required>
                  <option value="operador">Operador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="administrador">Administrador</option>
                </select>
                <small class="role-hint">
                  {{
                    userForm.role === 'administrador' ? 'Acceso total al sistema' :
                    userForm.role === 'supervisor' ? 'Puede editar pero no administrar usuarios' :
                    'Solo lectura y creación básica'
                  }}
                </small>
              </div>
              
              <div class="form-group">
                <label>Estado:</label>
                <div class="status-toggle">
                  <label class="toggle-label">
                    <input type="checkbox" v-model="userForm.activo">
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
                >
                <small class="date-hint">
                  {{ userForm.fechaExpiracion ? 'Expira: ' + formatDateMexico(userForm.fechaExpiracion) : 'Sin fecha de expiración' }}
                </small>
              </div>
            </div>

            <!-- PERMISOS ESPECÍFICOS PARA TABLES (se mantiene igual) -->
            <div class="permissions-section">
              <h4>Permisos en Página Tables</h4>
              <div class="permissions-grid">
                <!-- Permisos de formulario -->
                <div class="permission-category">
                  <h5>Formulario de Registros</h5>
                  <div class="permission-item">
                    <label>
                      <input type="checkbox" v-model="userForm.permissions.crearRegistros">
                      <span>Crear nuevos registros</span>
                    </label>
                    <small>Agregar registros en formulario</small>
                  </div>
                </div>
                
                <!-- Permisos de edición -->
                <div class="permission-category">
                  <h5>Edición de Registros</h5>
                  <div class="permission-item">
                    <label>
                      <input type="checkbox" v-model="userForm.permissions.editarRegistrosPropios" 
                        :disabled="userForm.permissions.editarTodosRegistros">
                      <span>Editar registros propios</span>
                    </label>
                    <small>Solo los que creó el usuario</small>
                  </div>
                  <div class="permission-item">
                    <label>
                      <input type="checkbox" v-model="userForm.permissions.editarTodosRegistros"
                        @change="syncEditPermissions">
                      <span>Editar todos los registros</span>
                    </label>
                    <small>Incluye registros de otros usuarios</small>
                  </div>
                </div>
                
                <!-- Permisos de eliminación -->
                <div class="permission-category">
                  <h5>Eliminación de Registros</h5>
                  <div class="permission-item">
                    <label>
                      <input type="checkbox" v-model="userForm.permissions.eliminarRegistrosPropios"
                        :disabled="userForm.permissions.eliminarTodosRegistros">
                      <span>Eliminar registros propios</span>
                    </label>
                    <small>Solo los que creó el usuario</small>
                  </div>
                  <div class="permission-item">
                    <label>
                      <input type="checkbox" v-model="userForm.permissions.eliminarTodosRegistros"
                        @change="syncDeletePermissions">
                      <span>Eliminar cualquier registro</span>
                    </label>
                    <small>Incluye registros de otros usuarios</small>
                  </div>
                </div>
                
                <!-- Permisos de widgets -->
                <div class="permission-category">
                  <h5>Widgets de Caja</h5>
                  <div class="permission-item">
                    <label>
                      <input type="checkbox" v-model="userForm.permissions.modificarCajaInicial">
                      <span>Modificar Caja Inicial</span>
                    </label>
                    <small>Editar presupuesto inicial</small>
                  </div>
                  <div class="permission-item">
                    <label>
                      <input type="checkbox" v-model="userForm.permissions.modificarDineroInicial">
                      <span>Modificar Dinero Inicial</span>
                    </label>
                    <small>Editar dinero disponible</small>
                  </div>
                </div>
                
                <!-- Permiso de exportación -->
                <div class="permission-category">
                  <h5>Exportación de Datos</h5>
                  <div class="permission-item">
                    <label>
                      <input type="checkbox" v-model="userForm.permissions.exportarDatos">
                      <span>Exportar datos</span>
                    </label>
                    <small>Exportar registros a Excel/CSV</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="resetForm">
                Limpiar
              </button>
              <button type="submit" class="btn-primary">
                {{ editingUser ? '💾 Actualizar Usuario' : 'Crear Usuario' }}
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
                placeholder="Buscar usuario o correo..."
                class="search-input"
              >
              <span class="search-icon">🔍</span>
            </div>
          </div>

          <div class="users-table">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
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
                      <small class="user-id">ID: {{ user.id }}</small>
                      <small class="user-created">Creado: {{ formatDateShortMexico(user.fechaCreacion) }}</small>
                    </div>
                  </td>
                  <td>
                    <div class="email-info">
                      <span class="user-email">{{ user.email || 'Sin correo' }}</span>
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
                        {{ countActivePermissions(user.permissions) }} / 9
                      </span>
                      <button 
                        @click="viewPermissions(user)" 
                        class="btn-view-permissions"
                        title="Ver permisos detallados"
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
                      <button @click="editUser(user)" class="btn-edit" title="Editar">
                        ✏️
                      </button>
                      <button 
                        @click="toggleUserStatus(user)" 
                        :class="['btn-toggle', user.activo ? 'deactivate' : 'activate']"
                        :title="user.activo ? 'Desactivar' : 'Activar'"
                      >
                        {{ user.activo ? '⏸️' : '▶️' }}
                      </button>
                      <button 
                        v-if="user.role !== 'administrador'" 
                        @click="deleteUser(user.id)" 
                        class="btn-delete"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                      <button 
                        @click="cloneUser(user)" 
                        class="btn-clone"
                        title="Clonar permisos"
                      >
                        🐑
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredUsers.length === 0">
                  <td colspan="7" class="no-users">
                    No se encontraron usuarios
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal de permisos (se mantiene igual) -->
      <div v-if="showPermissionsModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>🔐 Permisos de {{ selectedUser?.username }}</h3>
            <button @click="closeModal" class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <div class="permissions-detail">
              <div class="permission-group">
                <h4>Formulario:</h4>
                <ul>
                  <li :class="selectedUser?.permissions.crearRegistros ? 'allowed' : 'denied'">
                    Crear registros: {{ selectedUser?.permissions.crearRegistros ? '✅ Permitido' : '❌ Denegado' }}
                  </li>
                </ul>
              </div>
              
              <div class="permission-group">
                <h4>Edición:</h4>
                <ul>
                  <li :class="selectedUser?.permissions.editarRegistrosPropios ? 'allowed' : 'denied'">
                    Editar propios: {{ selectedUser?.permissions.editarRegistrosPropios ? '✅ Permitido' : '❌ Denegado' }}
                  </li>
                  <li :class="selectedUser?.permissions.editarTodosRegistros ? 'allowed' : 'denied'">
                    Editar todos: {{ selectedUser?.permissions.editarTodosRegistros ? '✅ Permitido' : '❌ Denegado' }}
                  </li>
                </ul>
              </div>
              
              <div class="permission-group">
                <h4>Eliminación:</h4>
                <ul>
                  <li :class="selectedUser?.permissions.eliminarRegistrosPropios ? 'allowed' : 'denied'">
                    Eliminar propios: {{ selectedUser?.permissions.eliminarRegistrosPropios ? '✅ Permitido' : '❌ Denegado' }}
                  </li>
                  <li :class="selectedUser?.permissions.eliminarTodosRegistros ? 'allowed' : 'denied'">
                    Eliminar todos: {{ selectedUser?.permissions.eliminarTodosRegistros ? '✅ Permitido' : '❌ Denegado' }}
                  </li>
                </ul>
              </div>
              
              <div class="permission-group">
                <h4>Caja:</h4>
                <ul>
                  <li :class="selectedUser?.permissions.modificarCajaInicial ? 'allowed' : 'denied'">
                    Modificar Caja Inicial: {{ selectedUser?.permissions.modificarCajaInicial ? '✅ Permitido' : '❌ Denegado' }}
                  </li>
                  <li :class="selectedUser?.permissions.modificarDineroInicial ? 'allowed' : 'denied'">
                    Modificar Dinero Inicial: {{ selectedUser?.permissions.modificarDineroInicial ? '✅ Permitido' : '❌ Denegado' }}
                  </li>
                </ul>
              </div>
              
              <div class="permission-group">
                <h4>Exportación:</h4>
                <ul>
                  <li :class="selectedUser?.permissions.exportarDatos ? 'allowed' : 'denied'">
                    Exportar datos: {{ selectedUser?.permissions.exportarDatos ? '✅ Permitido' : '❌ Denegado' }}
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
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import AppHeader from '@/components/Layout/Header.vue'
import AppSidebar from '@/components/Layout/Sidebar.vue'

export default {
  name: 'AdminUsersView',
  components: {
    AppHeader,
    AppSidebar
  },
  setup() {
    const sidebarOpen = ref(false)
    const searchQuery = ref('')
    const editingUser = ref(null)
    const showPermissionsModal = ref(false)
    const selectedUser = ref(null)

    // Formulario de usuario (AGREGADO EMAIL)
    const userForm = ref({
      email: '',
      username: '',
      password: '',
      role: 'operador',
      activo: true,
      fechaExpiracion: '',
      permissions: {
        crearRegistros: true,
        editarRegistrosPropios: false,
        editarTodosRegistros: false,
        eliminarRegistrosPropios: false,
        eliminarTodosRegistros: false,
        modificarCajaInicial: false,
        modificarDineroInicial: false,
        exportarDatos: false
      }
    })

    // Lista de usuarios
    const users = ref([])

    // Cargar usuarios al iniciar
    onMounted(() => {
      loadUsers()
    })

    // Funciones para horario México (se mantienen igual)
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

    const formatDateShortMexico = (dateString) => {
      if (!dateString) return ''
      
      try {
        if (dateString.includes('-')) {
          const [año, mes, dia] = dateString.split('-')
          return `${dia}/${mes}/${año}`
        }
        
        const fechaMexico = getFechaMexico(dateString)
        const dia = String(fechaMexico.getDate()).padStart(2, '0')
        const mes = String(fechaMexico.getMonth() + 1).padStart(2, '0')
        const año = fechaMexico.getFullYear().toString().slice(-2)
        
        return `${dia}/${mes}/${año}`
      } catch (error) {
        console.error('Error formateando fecha corta:', dateString, error)
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

    // Cargar usuarios
    const loadUsers = () => {
      const savedUsers = localStorage.getItem('redyon_users')
      if (savedUsers) {
        users.value = JSON.parse(savedUsers)
      } else {
        // Usuario admin por defecto (AGREGADO EMAIL)
        const defaultUsers = [
          {
            id: 1,
            email: 'admin@redyon.com',
            username: 'admin',
            password: 'admin123',
            role: 'administrador',
            activo: true,
            fechaCreacion: getCurrentDateMexico(),
            fechaExpiracion: '',
            permissions: {
              crearRegistros: true,
              editarRegistrosPropios: true,
              editarTodosRegistros: true,
              eliminarRegistrosPropios: true,
              eliminarTodosRegistros: true,
              modificarCajaInicial: true,
              modificarDineroInicial: true,
              exportarDatos: true
            }
          },
          {
            id: 2,
            email: 'supervisor@redyon.com',
            username: 'supervisor',
            password: 'super123',
            role: 'supervisor',
            activo: true,
            fechaCreacion: getCurrentDateMexico(),
            fechaExpiracion: '',
            permissions: {
              crearRegistros: true,
              editarRegistrosPropios: true,
              editarTodosRegistros: true,
              eliminarRegistrosPropios: true,
              eliminarTodosRegistros: false,
              modificarCajaInicial: false,
              modificarDineroInicial: true,
              exportarDatos: true
            }
          },
          {
            id: 3,
            email: 'operador@redyon.com',
            username: 'operador',
            password: 'oper123',
            role: 'operador',
            activo: true,
            fechaCreacion: getCurrentDateMexico(),
            fechaExpiracion: getFechaMexico(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            permissions: {
              crearRegistros: true,
              editarRegistrosPropios: false,
              editarTodosRegistros: false,
              eliminarRegistrosPropios: false,
              eliminarTodosRegistros: false,
              modificarCajaInicial: false,
              modificarDineroInicial: false,
              exportarDatos: false
            }
          }
        ]
        users.value = defaultUsers
        saveUsers()
      }
    }

    const saveUsers = () => {
      localStorage.setItem('redyon_users', JSON.stringify(users.value))
    }

    // Computed properties
    const totalUsers = computed(() => users.value.length)
    const activeUsers = computed(() => users.value.filter(u => u.activo).length)
    const adminUsers = computed(() => users.value.filter(u => u.role === 'administrador').length)
    const supervisorUsers = computed(() => users.value.filter(u => u.role === 'supervisor').length)
    const operatorUsers = computed(() => users.value.filter(u => u.role === 'operador').length)

    // Búsqueda mejorada para incluir email
    const filteredUsers = computed(() => {
      if (!searchQuery.value) return users.value
      const query = searchQuery.value.toLowerCase()
      return users.value.filter(user => 
        user.username.toLowerCase().includes(query) ||
        (user.email && user.email.toLowerCase().includes(query)) ||
        user.role.toLowerCase().includes(query) ||
        (user.role === 'administrador' && 'administrador'.includes(query)) ||
        (user.role === 'supervisor' && 'supervisor'.includes(query)) ||
        (user.role === 'operador' && 'operador'.includes(query))
      )
    })

    // Funciones
    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value
    }

    const syncEditPermissions = () => {
      if (userForm.value.permissions.editarTodosRegistros) {
        userForm.value.permissions.editarRegistrosPropios = true
      }
    }

    const syncDeletePermissions = () => {
      if (userForm.value.permissions.eliminarTodosRegistros) {
        userForm.value.permissions.eliminarRegistrosPropios = true
      }
    }

    const onRoleChange = () => {
      switch(userForm.value.role) {
        case 'administrador':
          userForm.value.permissions = {
            crearRegistros: true,
            editarRegistrosPropios: true,
            editarTodosRegistros: true,
            eliminarRegistrosPropios: true,
            eliminarTodosRegistros: true,
            modificarCajaInicial: true,
            modificarDineroInicial: true,
            exportarDatos: true
          }
          break
          
        case 'supervisor':
          userForm.value.permissions = {
            crearRegistros: true,
            editarRegistrosPropios: true,
            editarTodosRegistros: true,
            eliminarRegistrosPropios: true,
            eliminarTodosRegistros: false,
            modificarCajaInicial: false,
            modificarDineroInicial: true,
            exportarDatos: true
          }
          break
          
        case 'operador':
          userForm.value.permissions = {
            crearRegistros: true,
            editarRegistrosPropios: false,
            editarTodosRegistros: false,
            eliminarRegistrosPropios: false,
            eliminarTodosRegistros: false,
            modificarCajaInicial: false,
            modificarDineroInicial: false,
            exportarDatos: false
          }
          break
      }
    }

    // Guardar usuario (ACTUALIZADO CON EMAIL)
    const saveUser = () => {
      if (!userForm.value.email.trim()) {
        alert('El correo electrónico es requerido')
        return
      }

      if (!userForm.value.username.trim()) {
        alert('El nombre de usuario es requerido')
        return
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(userForm.value.email)) {
        alert('Ingrese un correo electrónico válido')
        return
      }

      if (!editingUser.value && !userForm.value.password) {
        alert('La contraseña es requerida para nuevos usuarios')
        return
      }

      // Verificar si el usuario o email ya existe
      const userExists = users.value.some(u => 
        (u.username === userForm.value.username || u.email === userForm.value.email) && 
        (!editingUser.value || u.id !== editingUser.value.id)
      )
      
      if (userExists) {
        alert('El nombre de usuario o correo electrónico ya existe')
        return
      }

      if (editingUser.value) {
        const index = users.value.findIndex(u => u.id === editingUser.value.id)
        if (index !== -1) {
          const updatedUser = {
            ...users.value[index],
            email: userForm.value.email,
            username: userForm.value.username,
            role: userForm.value.role,
            activo: userForm.value.activo,
            fechaExpiracion: userForm.value.fechaExpiracion || '',
            permissions: { ...userForm.value.permissions },
            password: userForm.value.password || users.value[index].password
          }
          users.value[index] = updatedUser
        }
      } else {
        const newUser = {
          id: Date.now(),
          email: userForm.value.email,
          username: userForm.value.username,
          password: userForm.value.password,
          role: userForm.value.role,
          activo: userForm.value.activo,
          fechaExpiracion: userForm.value.fechaExpiracion || '',
          permissions: { ...userForm.value.permissions },
          fechaCreacion: getCurrentDateMexico()
        }
        users.value.push(newUser)
      }

      saveUsers()
      resetForm()
      alert(editingUser.value ? '✅ Usuario actualizado' : '✅ Usuario creado')
    }

    // Editar usuario (ACTUALIZADO CON EMAIL)
    const editUser = (user) => {
      editingUser.value = user
      userForm.value = {
        email: user.email || '',
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

    // Resetear formulario (ACTUALIZADO CON EMAIL)
    const resetForm = () => {
      userForm.value = {
        email: '',
        username: '',
        password: '',
        role: 'operador',
        activo: true,
        fechaExpiracion: '',
        permissions: {
          crearRegistros: true,
          editarRegistrosPropios: false,
          editarTodosRegistros: false,
          eliminarRegistrosPropios: false,
          eliminarTodosRegistros: false,
          modificarCajaInicial: false,
          modificarDineroInicial: false,
          exportarDatos: false
        }
      }
      editingUser.value = null
    }

    const toggleUserStatus = (user) => {
      if (user.username === 'admin') {
        alert('No se puede desactivar el usuario administrador principal')
        return
      }
      
      user.activo = !user.activo
      saveUsers()
      alert(`Usuario ${user.activo ? 'activado' : 'desactivado'}`)
    }

    const deleteUser = (id) => {
      const user = users.value.find(u => u.id === id)
      if (!user) return
      
      if (user.username === 'admin') {
        alert('No se puede eliminar el usuario administrador principal')
        return
      }
      
      if (confirm(`¿Está seguro de eliminar al usuario "${user.username}"?`)) {
        users.value = users.value.filter(u => u.id !== id)
        saveUsers()
        alert('Usuario eliminado')
      }
    }

    const cloneUser = (user) => {
      userForm.value = {
        email: '',  // Vacío para nuevo usuario
        username: '', // Vacío para nuevo usuario
        password: '',
        role: user.role,
        activo: user.activo,
        fechaExpiracion: user.fechaExpiracion || '',
        permissions: { ...user.permissions }
      }
      alert('Permisos clonados. Complete los demás datos del usuario.')
    }

    const viewPermissions = (user) => {
      selectedUser.value = user
      showPermissionsModal.value = true
    }

    const closeModal = () => {
      showPermissionsModal.value = false
      selectedUser.value = null
    }

    const countActivePermissions = (permissions) => {
      return Object.values(permissions).filter(p => p).length
    }

    const getRoleName = (role) => {
      switch(role) {
        case 'administrador': return 'Administrador'
        case 'supervisor': return 'Supervisor'
        case 'operador': return 'Operador'
        default: return role
      }
    }

    return {
      sidebarOpen,
      searchQuery,
      editingUser,
      showPermissionsModal,
      selectedUser,
      userForm,
      users,
      totalUsers,
      activeUsers,
      adminUsers,
      supervisorUsers,
      operatorUsers,
      filteredUsers,
      toggleSidebar,
      onRoleChange,
      syncEditPermissions,
      syncDeletePermissions,
      saveUser,
      editUser,
      cancelEdit,
      resetForm,
      toggleUserStatus,
      deleteUser,
      cloneUser,
      viewPermissions,
      closeModal,
      countActivePermissions,
      isExpiredMexico,
      formatDateMexico,
      formatDateShortMexico,
      getCurrentDateMexico,
      getRoleName
    }
  }
}
</script>

<style scoped>

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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

.user-id {
  font-size: 11px;
  color: #999;
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

.role-tag.supervisor {
  background: #f39c1220;
  color: #d35400;
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
  width: 200px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-edit, .btn-toggle, .btn-delete, .btn-clone {
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

.btn-clone:hover {
  background: #9b59b620;
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
/* Ajustes para la nueva estadística */
.admin-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.stat-card:nth-child(4) .stat-icon {
  background: #f39c1220;
}

.stat-card:nth-child(5) .stat-icon {
  background: #9b59b620;
}

/* Ajustes para campos de fecha */
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

/* Información adicional en tabla */
.user-created {
  display: block;
  font-size: 10px;
  color: #888;
  margin-top: 2px;
}

/* Sincronización visual de permisos */
.permission-item input:disabled + span {
  opacity: 0.6;
  color: #999;
}

.email-hint {
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.email-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-email {
  font-size: 13px;
  color: #444;
  word-break: break-all;
}

/* Ajustes responsivos para la tabla con nueva columna */
@media (max-width: 1200px) {
  .users-table {
    overflow-x: auto;
  }
  
  .users-table table {
    min-width: 1000px;
  }
}

</style>