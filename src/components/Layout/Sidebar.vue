<template>
  <aside :class="['app-sidebar', { 'open': isOpen }]">
    <nav class="sidebar-nav">
      <!-- Perfil de usuario -->
      <div class="user-profile">
        <div class="avatar">
          <span>👤</span>
        </div>
        <div class="user-details">
          <h4>{{ userName }}</h4>
          <p>{{ userRole }}</p>
        </div>
      </div>

      <!-- Sección principal -->
      <div class="nav-section">
        <h3>Menú Principal</h3>
        <!-- 1. INICIO -->
        <router-link to="/dashboard" class="nav-link" @click="closeSidebar">
          <span>Inicio</span>
        </router-link>
        
        <!-- 2. REGISTROS -->
        <router-link to="/tables" class="nav-link" @click="closeSidebar">
          <span>Registros</span>
        </router-link>
        
        <!-- 3. GRÁFICAS -->
        <router-link to="/charts" class="nav-link" @click="closeSidebar">
          <span>Gráficas</span>
        </router-link>
      </div>

      <!-- Sección administración (solo visible para admin) -->
      <div v-if="isAdmin" class="nav-section">
        <h3>Administración</h3>
        <router-link to="/admin/users" class="nav-link" @click="closeSidebar">
          <span>Usuarios</span>
        </router-link>
        <!-- ELIMINADO: Enlace a settings -->
      </div>
    </nav>
    
    <!-- Información de versión -->
    <div class="sidebar-footer">
      <div class="version-info">
        <small>REDYON v1.0</small>
        <small>© Sistema de Gestión</small>
      </div>
    </div>
  </aside>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'AppSidebar',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const router = useRouter()
    
    // Datos del usuario
    const userName = computed(() => {
      const currentUser = localStorage.getItem('currentUsername')
      return currentUser || 'Usuario'
    })
    
    const userRole = computed(() => {
      // Obtener rol directamente desde localStorage
      const role = localStorage.getItem('userRole')
      if (!role) {
        // Si no está en localStorage, intentar obtener desde users
        const username = localStorage.getItem('currentUsername')
        const savedUsers = localStorage.getItem('redyon_users')
        
        if (savedUsers && username) {
          try {
            const users = JSON.parse(savedUsers)
            const user = users.find(u => u.username === username)
            return user ? user.role : 'Operador'
          } catch (error) {
            console.error('Error parsing users:', error)
            return 'Operador'
          }
        }
        return 'Operador'
      }
      return role
    })
    
    const isAdmin = computed(() => {
      return userRole.value === 'administrador'
    })

    // Cerrar sidebar en móviles al hacer clic en un enlace
    const closeSidebar = () => {
      if (window.innerWidth < 768) {
        emit('toggle-sidebar')
      }
    }

    return {
      userName,
      userRole,
      isAdmin,
      closeSidebar
    }
  }
}
</script>

<style scoped>
/* Los estilos se mantienen igual */
.app-sidebar {
  position: fixed;
  left: -280px;
  top: 70px;
  width: 280px;
  height: calc(100vh - 70px);
  background: white;
  box-shadow: 2px 0 15px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  z-index: 999;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.app-sidebar.open {
  left: 0;
}

/* Perfil de usuario */
.user-profile {
  padding: 25px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #1f998f10 0%, #21a39810 100%);
}

.avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #1f998f 0%, #21a398 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  box-shadow: 0 4px 8px rgba(31, 153, 143, 0.3);
}

.user-details h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.user-details p {
  margin: 5px 0 0;
  color: #666;
  font-size: 13px;
  text-transform: capitalize;
}

/* Secciones de navegación */
.nav-section {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.nav-section:last-child {
  border-bottom: none;
}

.nav-section h3 {
  color: #666;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 15px;
  font-weight: 600;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  color: #555;
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s;
  font-size: 14px;
}

.nav-link:hover {
  background: #f5f5f5;
  transform: translateX(5px);
}

.nav-link.router-link-active {
  background: linear-gradient(135deg, #1f998f15 0%, #21a39815 100%);
  color: #1f998f;
  font-weight: 600;
  border-left: 4px solid #1f998f;
}

.nav-link span:first-child {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

/* Pie del sidebar */
.sidebar-footer {
  margin-top: auto;
  padding: 20px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

.version-info {
  text-align: center;
}

.version-info small {
  display: block;
  color: #666;
  font-size: 11px;
  margin-bottom: 4px;
}

.version-info small:first-child {
  font-weight: 600;
  color: #1f998f;
}

/* Responsive */
@media (max-width: 768px) {
  .app-sidebar {
    top: 70px;
    height: calc(100vh - 70px);
    box-shadow: 2px 0 20px rgba(0, 0, 0, 0.15);
  }
  
  .user-profile {
    padding: 20px 15px;
  }
  
  .nav-section {
    padding: 15px;
  }
  
  .nav-link {
    padding: 10px 12px;
    font-size: 13px;
  }
}

/* Animación suave para enlaces */
.nav-link {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>