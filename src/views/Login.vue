<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo REDYON -->
      <div class="logo">
        <h1>REDYON</h1>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label for="username">Usuario:</label>
          <input 
            type="text" 
            id="username" 
            v-model="form.username" 
            placeholder="Ej: juan.perez"
            :disabled="loading"
            required
          >
        </div>

        <div class="input-group">
          <label for="password">Contraseña:</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password" 
            placeholder="Ingrese su contraseña"
            :disabled="loading"
            required
          >
        </div>

        <button type="submit" class="btn-continuar" :disabled="loading">
          <span v-if="!loading">Iniciar Sesión</span>
          <span v-else>Iniciando sesión...</span>
        </button>
      </form>

      <!-- Mensaje de error -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/api' 

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter()
    const form = ref({
      username: '',
      password: ''
    })
    const error = ref('')
    const loading = ref(false)

    const handleLogin = async () => {
      // Validar campos
      if (!form.value.username.trim() || !form.value.password.trim()) {
        error.value = 'Por favor complete todos los campos'
        return
      }

      loading.value = true
      error.value = ''
      
      try {
        const response = await login(form.value.username, form.value.password)
        
        // La respuesta del backend contiene:
        // { id, username, role, activo, permissions }
        
        // Verificar si el usuario está activo (el backend ya lo hace, pero por si acaso)
        if (!response.activo) {
          error.value = 'Usuario inactivo'
          return
        }
        
        // Verificar expiración (el backend ya lo hace, pero por si acaso)
        if (response.fechaExpiracion) {
          const expDate = new Date(response.fechaExpiracion)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          expDate.setHours(0, 0, 0, 0)
          
          if (expDate < today) {
            error.value = 'Su cuenta ha expirado'
            return
          }
        }
        
        // Guardar datos de sesión en localStorage
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', response.role)
        localStorage.setItem('currentUsername', response.username)
        localStorage.setItem('currentUser', JSON.stringify({
          id: response.id,
          username: response.username,
          role: response.role,
          permissions: response.permissions || {}
        }))
        
        // Opcional: Guardar token si el backend lo implementara en el futuro
        // if (response.token) {
        //   localStorage.setItem('token', response.token)
        // }
        
        // Redirigir al dashboard
        router.push('/dashboard')
      } catch (err) {
        // Mostrar mensaje de error de la API
        error.value = err.mensaje || 'Usuario o contraseña incorrectos'
        console.error('Error de login:', err)
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      error,
      loading,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1f998f 0%, #21a398 100%);
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.logo {
  text-align: center;
  margin-bottom: 30px;
}

.logo h1 {
  color: #1f998f;
  font-size: 2.5rem;
  font-weight: bold;
  letter-spacing: 2px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.input-group input {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.input-group input:focus {
  outline: none;
  border-color: #21a398;
}

.input-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.btn-continuar {
  background: linear-gradient(135deg, #1f998f 0%, #21a398 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-top: 10px;
}

.btn-continuar:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(31, 153, 143, 0.3);
}

.btn-continuar:active:not(:disabled) {
  transform: translateY(0);
}

.btn-continuar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 15px;
  padding: 10px;
  background: #fee;
  border: 1px solid #f99;
  border-radius: 6px;
  color: #c00;
  text-align: center;
  font-size: 14px;
}
</style>