<template>
  <div class="dashboard">
    <AppHeader @toggle-sidebar="toggleSidebar" />
    <AppSidebar :isOpen="sidebarOpen" />

    <main :class="['main-content', { 'sidebar-open': sidebarOpen }]">
      <div class="dashboard-header">
        <h1>Dashboard REDYON</h1>
        <p>Bienvenido al sistema de gestión</p>
      </div>

      <!-- Widgets rápidos -->

      <!-- Acciones rápidas -->
      <div class="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div class="actions-grid">
          <button class="action-btn" @click="$router.push('/tables')">
            <span>Nuevo Registro</span>
          </button>
          <button class="action-btn" @click="$router.push('/charts')">
            <span>Ver Gráficas</span>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref } from 'vue'
import AppHeader from '@/components/Layout/Header.vue'
import AppSidebar from '@/components/Layout/Sidebar.vue'

export default {
  name: 'DashboardView',
  components: {
    AppHeader,
    AppSidebar
  },
  setup() {
    const sidebarOpen = ref(false)

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value
    }

    const exportData = () => {
      alert('Función de exportación en desarrollo')
    }

    return {
      sidebarOpen,
      toggleSidebar,
      exportData
    }
  }
}
</script>

<style scoped>
.dashboard {
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

.dashboard-header {
  margin-bottom: 30px;
}

.dashboard-header h1 {
  color: #1f998f;
  margin-bottom: 10px;
}

.dashboard-header p {
  color: #666;
  font-size: 16px;
}

.widgets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.widget {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.widget:hover {
  transform: translateY(-5px);
}

.widget-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.widget-content h3 {
  margin: 0 0 5px;
  color: #666;
  font-size: 14px;
  font-weight: 600;
}

.widget-value {
  margin: 0;
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.quick-actions h2 {
  color: #1f998f;
  margin-bottom: 20px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.action-btn {
  background: white;
  border: 2px solid #1f998f;
  color: #1f998f;
  padding: 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #1f998f;
  color: white;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .main-content.sidebar-open {
    margin-left: 0;
  }
}
</style>