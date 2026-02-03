<template>
  <header class="app-header">
    <!-- Menú hamburguesa -->
    <button class="hamburger-btn" @click="toggleSidebar">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- Logo -->
    <div class="logo">
      <h2>REDYON</h2>
    </div>

    <!-- Información de usuario -->
    <div class="user-info">
      <button class="logout-btn" @click="handleLogout">
        <span>Cerrar Sesión</span>
      </button>
    </div>
  </header>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'AppHeader',
  emits: ['toggle-sidebar'],
  setup(props, { emit }) {
    const router = useRouter()
    const username = ref('')
    
    // Cargar usuario al iniciar
    onMounted(() => {
      loadUsername()
    })
    
    // Observar cambios en localStorage
    watch(() => localStorage.getItem('currentUsername'), (newVal) => {
      username.value = newVal || 'Usuario'
    })

    const loadUsername = () => {
      const savedUsername = localStorage.getItem('currentUsername')
      username.value = savedUsername || 'Usuario'
    }

    const toggleSidebar = () => {
      emit('toggle-sidebar')
    }

    const handleLogout = () => {
      if (confirm('¿Está seguro de cerrar sesión?')) {
        // Limpiar datos de sesión
        localStorage.removeItem('currentUsername')
        
        // Redirigir al login
        router.push('/login')
      }
    }

    return {
      username,
      toggleSidebar,
      handleLogout
    }
  }
}
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 70px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.hamburger-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hamburger-btn span {
  display: block;
  width: 25px;
  height: 3px;
  background: #1f998f;
  border-radius: 2px;
  transition: 0.3s;
}

.hamburger-btn:hover span {
  background: #21a398;
}

.logo h2 {
  color: #1f998f;
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-name {
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.logout-btn {
  background: linear-gradient(135deg, #21A197 0%, #21A197 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #1f998f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(31, 153, 143, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .app-header {
    padding: 0 15px;
  }
  
  .logo h2 {
    font-size: 1.5rem;
  }
  
  .user-info {
    gap: 10px;
  }
  
  .user-name {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .logout-btn {
    padding: 8px 15px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .logo h2 {
    font-size: 1.2rem;
  }
  
  .user-name {
    display: none; /* Ocultar nombre en móviles muy pequeños */
  }
}
</style>