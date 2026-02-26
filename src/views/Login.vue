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
            required
          >
        </div>

        <button type="submit" class="btn-continuar">
          Iniciar Sesión
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

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter()
    const form = ref({
      username: '',
      password: ''
    })
    const error = ref('')

    const handleLogin = async () => {
      try {
        // Cargar usuarios desde localStorage
        const savedUsers = localStorage.getItem('redyon_users')
        const users = savedUsers ? JSON.parse(savedUsers) : []
        
        // Buscar usuario solo por username (ELIMINADO email)
        const user = users.find(u => 
          u.username === form.value.username && 
          u.password === form.value.password &&
          u.activo === true
        )
        
        if (!user) {
          error.value = 'Usuario o contraseña incorrectos'
          return
        }
        
        // Verificar si el usuario ha expirado
        if (user.fechaExpiracion) {
          const expDate = new Date(user.fechaExpiracion)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          expDate.setHours(0, 0, 0, 0)
          
          if (expDate < today) {
            error.value = 'Su cuenta ha expirado'
            return
          }
        }
        
        // Guardar en localStorage (ELIMINADO email)
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', user.role)
        localStorage.setItem('currentUser', JSON.stringify({
          username: user.username,
          id: user.id,
          permissions: user.permissions || {}
        }))
        
        // Guardar username por separado para fácil acceso
        localStorage.setItem('currentUsername', user.username)
        
        // Redirigir al dashboard
        router.push('/dashboard')
      } catch (err) {
        error.value = 'Error en el login. Verifique sus credenciales.'
      }
    }

    return {
      form,
      error,
      handleLogin
    }
  }
}
</script>

<style scoped>
/* Los estilos se mantienen igual */
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

.btn-continuar:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(31, 153, 143, 0.3);
}

.btn-continuar:active {
  transform: translateY(0);
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