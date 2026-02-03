<template>
  <div class="tables-page">
    <AppHeader @toggle-sidebar="toggleSidebar" />
    <AppSidebar :isOpen="sidebarOpen" />

    <main :class="['main-content', { 'sidebar-open': sidebarOpen }]">
      <div class="page-header">
        <h1>Nuevo Registro</h1>
        <p>Complete el formulario para agregar un nuevo registro</p>
        <div v-if="esSabado" class="sabado-notice">
          ⚠️ Hoy es sábado - Se debe reiniciar la Caja Inicial y registros
        </div>
      </div>

      <!-- WIDGETS DE CAJA -->
      <div class="caja-widgets">
        <div class="widget">
          <div class="widget-icon" style="background: #1f998f20;">
            <span>💰</span>
          </div>
          <div class="widget-content">
            <h3>Caja Inicial</h3>
            <p class="widget-value">${{ formatCurrency(cajaInicial) }}</p>
            <div v-if="currentUserPermissions.modificarCajaInicial">
              <input 
                type="number" 
                v-model.number="nuevaCajaInicial" 
                step="100"
                min="0"
                class="widget-input"
                placeholder="Ingrese monto"
              >
              <button 
                @click="actualizarCajaInicial" 
                class="btn-actualizar-caja"
                :disabled="!nuevaCajaInicial || nuevaCajaInicial <= 0"
              >
                Actualizar
              </button>
              <small class="widget-hint">Cada sábado se reinicia</small>
              <div v-if="esSabado" class="reinicio-info">
                <small>💡 Hoy es sábado, actualice la caja</small>
              </div>
            </div>
            <div v-else class="widget-view-only">
              <div class="view-only-value">${{ formatCurrency(cajaInicial) }}</div>
              <small class="permission-info">👁️ Solo visualización</small>
            </div>
          </div>
        </div>

        <div class="widget">
          <div class="widget-icon" style="background: #21a39820;">
            <span>💵</span>
          </div>
          <div class="widget-content">
            <h3>Dinero Inicial</h3>
            <p class="widget-value">${{ formatCurrency(dineroInicial) }}</p>
            <div v-if="currentUserPermissions.modificarDineroInicial">
              <input 
                type="number" 
                v-model.number="nuevoDineroInicial" 
                step="100"
                :max="cajaInicial"
                min="0"
                class="widget-input"
                placeholder="Monto disponible"
              >
              <button 
                @click="actualizarDineroInicial" 
                class="btn-actualizar-caja"
                :disabled="!nuevoDineroInicial || nuevoDineroInicial <= 0 || nuevoDineroInicial > cajaInicial"
              >
                Actualizar
              </button>
              <small class="widget-hint">Máximo: ${{ formatCurrency(cajaInicial) }}</small>
              <div v-if="nuevoDineroInicial > cajaInicial" class="error-message">
                <small>❌ No puede exceder la caja inicial</small>
              </div>
            </div>
            <div v-else class="widget-view-only">
              <div class="view-only-value">${{ formatCurrency(dineroInicial) }}</div>
              <small class="permission-info">👁️ Solo visualización</small>
            </div>
          </div>
        </div>

        <div class="widget">
          <div class="widget-icon" style="background: #27ae6020;">
            <span>💲</span>
          </div>
          <div class="widget-content">
            <h3>Dinero Final</h3>
            <p class="widget-value" :class="dineroFinal >= 0 ? 'positive' : 'negative'">
              ${{ formatCurrency(dineroFinal) }}
            </p>
            <div class="widget-info">
              <small>Saldo: ${{ formatCurrency(dineroFinal) }}</small>
              <small v-if="dineroFinal < 0" class="warning">⚠️ Caja en números rojos</small>
              <small v-if="dineroFinal > cajaInicial" class="warning">⚠️ Excede caja inicial</small>
            </div>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- Formulario -->
        <div class="form-container">
          <form @submit.prevent="handleSubmit" class="record-form">
            <div class="form-grid">
              <div class="form-group">
                <label>Fecha:</label>
                <input 
                  type="date" 
                  v-model="form.fecha" 
                  required
                  :max="getHoyMexico()"
                >
                <small class="field-hint">No puede seleccionar fechas futuras</small>
              </div>

              <div class="form-group">
                <label>Nombre:</label>
                <input 
                  type="text" 
                  v-model="form.nombre" 
                  placeholder="Nombre completo" 
                  required
                  @input="validarNombre"
                  pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+"
                  title="Solo se permiten letras y espacios"
                >
                <small class="field-hint">Solo letras y espacios</small>
              </div>

              <div class="form-group">
                <label>Concepto:</label>
                <select v-model="form.concepto" required>
                  <option value="">Seleccione concepto</option>
                  <option value="servicio_internet">Servicio de Internet</option>
                  <option value="gastos_operativos">Gastos Operativos</option>
                  <option value="gasto_administrativo">Gasto Admin.</option>
                  <option value="viaticos">Viáticos</option>
                  <option value="propinas">Propinas</option>
                  <option value="dedicados_clientes">Dedicados-Clientes</option>
                  <option value="actividades">Actividades</option>
                  <option value="venta_almacen">Venta de Almacen</option>
                  <option value="recarga">Recarga</option>
                  <option value="comisiones">Comisiones</option>
                  <option value="entrega_efectivo">Entrega Efectivo</option>
                  <option value="gastos_personales">Gastos Personales</option>
                  <option value="pagos_tarjetas">Pagos a Tarjetas</option>
                  <option value="compras">Compras</option>
                  <option value="dedicados_pagos">Dedicados Pagos</option>
                  <option value="recibimiento_efectivo">Recibimiento de efectivo</option>
                  <option value="otros">Otros</option>
                </select>
                <small class="field-hint">Seleccione un concepto</small>
              </div>

              <div class="form-group">
                <label>Folio:</label>
                <input 
                  type="text" 
                  v-model="form.folio" 
                  placeholder="Ej: ABC123" 
                  required
                  @input="validarFolio"
                  pattern="[A-Za-z0-9]+"
                  title="Solo letras y números, sin espacios"
                >
                <small class="field-hint">Letras y números, sin espacios</small>
              </div>

              <div class="form-group">
                <label>Método de Pago:</label>
                <select v-model="form.metodoPago" required>
                  <option value="">Seleccione método</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="terminal">Terminal</option>
                  <option value="transferencia">Transferencia</option>
                </select>
                <small class="field-hint">Seleccione un método de pago</small>
              </div>

              <div class="form-group">
                <label>Cantidad:</label>
                <div class="amount-input">
                  <input 
                    type="number" 
                    v-model.number="form.cantidad" 
                    placeholder="0.00" 
                    step="0.01" 
                    required
                    :class="form.cantidad >= 0 ? 'positive' : 'negative'"
                    :disabled="!currentUserPermissions.crearRegistros"
                  >
                  <span class="amount-hint">
                    {{ form.cantidad >= 0 ? '(Ingreso)' : '(Egreso)' }}
                  </span>
                </div>
                <div class="permission-info">
                  <small v-if="!currentUserPermissions.crearRegistros">
                    ❌ No tienes permiso para crear registros
                  </small>
                </div>
              </div>
            </div>

            <!-- Botones -->
            <div class="form-actions">
              <button 
                type="submit" 
                class="btn-primary"
                :disabled="!currentUserPermissions.crearRegistros || !formValido"
              >
                Agregar
              </button>
            </div>
          </form>

          <!-- Resumen de caja -->
          <div class="caja-summary">
            <h4>Resumen de Caja</h4>
            <div class="summary-grid">
              <div class="summary-item">
                <span>Caja Inicial:</span>
                <span>${{ formatCurrency(cajaInicial) }}</span>
              </div>
              <div class="summary-item">
                <span>Dinero Inicial:</span>
                <span>${{ formatCurrency(dineroInicial) }}</span>
              </div>
              <div class="summary-item">
                <span>Total Ingresos:</span>
                <span class="positive">${{ formatCurrency(totalIngresos) }}</span>
              </div>
              <div class="summary-item">
                <span>Total Egresos:</span>
                <span class="negative">${{ formatCurrency(Math.abs(totalEgresos)) }}</span>
              </div>
              <div class="summary-item total">
                <span>Dinero Final:</span>
                <span :class="dineroFinal >= 0 ? 'positive' : 'negative'">
                  ${{ formatCurrency(dineroFinal) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Vista previa/Registros -->
        <div class="preview-container">
          <div class="preview-header">
            <h3>Registros Recientes</h3>
            <div class="filter-options">
              <button 
                v-for="period in filterPeriods" 
                :key="period"
                :class="['period-btn', { active: activeFilter === period }]"
                @click="setFilter(period)"
              >
                {{ period }}
              </button>
            </div>
          </div>

          <div class="records-table">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Nombre</th>
                  <th>Concepto</th>
                  <th>Método Pago</th>
                  <th>Folio</th>
                  <th>Cantidad</th>
                  <th>Creado por</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in filteredRecords" :key="record.id">
                  <td>
                    <input 
                      v-if="record.editing" 
                      type="date" 
                      v-model="record.fecha"
                      class="edit-input"
                      :max="getHoyMexico()"
                    >
                    <span v-else>{{ formatFechaMexico(record.fecha) }}</span>
                  </td>
                  <td>
                    <input 
                      v-if="record.editing" 
                      type="text" 
                      v-model="record.nombre"
                      class="edit-input"
                      @input="validarNombreEditar(record)"
                      pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+"
                      title="Solo se permiten letras y espacios"
                    >
                    <span v-else>{{ record.nombre }}</span>
                  </td>
                  <td>
                    <select 
                      v-if="record.editing" 
                      v-model="record.concepto"
                      class="edit-input"
                    >
                      <option value="">Seleccione concepto</option>
                      <option value="servicio_internet">Servicio de Internet</option>
                      <option value="gastos_operativos">Gastos Operativos</option>
                      <option value="gasto_administrativo">Gasto Administrativo</option>
                      <option value="viaticos">Viáticos</option>
                      <option value="propinas">Propinas</option>
                      <option value="dedicados_clientes">Dedicados-Clientes</option>
                      <option value="actividades">Actividades</option>
                      <option value="venta_almacen">Venta de Almacen</option>
                      <option value="recarga">Recarga</option>
                      <option value="comisiones">Comisiones</option>
                      <option value="entrega_efectivo">Entrega Efectivo</option>
                      <option value="gastos_personales">Gastos Personales</option>
                      <option value="pagos_tarjetas">Pagos a Tarjetas</option>
                      <option value="compras">Compras</option>
                      <option value="dedicados_pagos">Dedicados Pagos</option>
                      <option value="recibimiento_efectivo">Recibimiento de efectivo</option>
                      <option value="otros">Otros</option>
                    </select>
                    <span v-else>
                      <span class="concept-tag" :class="record.concepto">
                        {{ getConceptoLabel(record.concepto) }}
                      </span>
                    </span>
                  </td>
                  <td>
                    <select 
                      v-if="record.editing" 
                      v-model="record.metodoPago"
                      class="edit-input"
                    >
                      <option value="">Seleccione método</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="terminal">Terminal</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                    <span v-else>
                      <span class="payment-tag">{{ getMetodoPagoLabel(record.metodoPago) }}</span>
                    </span>
                  </td>
                  <td>
                    <input 
                      v-if="record.editing" 
                      type="text" 
                      v-model="record.folio"
                      class="edit-input"
                      @input="validarFolioEditar(record)"
                      pattern="[A-Za-z0-9]+"
                      title="Solo letras y números, sin espacios"
                    >
                    <span v-else>{{ record.folio }}</span>
                  </td>
                  <td :class="record.cantidad >= 0 ? 'positive' : 'negative'">
                    <input 
                      v-if="record.editing" 
                      type="number" 
                      v-model.number="record.cantidad"
                      step="0.01"
                      class="edit-input"
                      :class="record.cantidad >= 0 ? 'positive' : 'negative'"
                    >
                    <span v-else>
                      ${{ Math.abs(record.cantidad).toFixed(2) }}
                    </span>
                  </td>
                  <td>
                    <small>{{ record.creadoPor || 'Sistema' }}</small>
                  </td>
                  <td class="actions-cell">
                    <div v-if="record.editing" class="edit-actions">
                      <button @click="saveEdit(record)" class="btn-save" title="Guardar">
                        💾
                      </button>
                      <button @click="cancelEdit(record)" class="btn-cancel" title="Cancelar">
                        ❌
                      </button>
                    </div>
                    <div v-else class="record-actions">
                      <button 
                        @click="startEdit(record)" 
                        class="btn-edit" 
                        title="Editar"
                        :disabled="!canEditRecord(record)"
                      >
                        ✏️
                      </button>
                      <button 
                        @click="deleteRecord(record.id)" 
                        class="btn-delete" 
                        title="Eliminar"
                        :disabled="!canDeleteRecord(record)"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredRecords.length === 0">
                  <td colspan="8" class="no-records">
                    No hay registros para mostrar
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/Layout/Header.vue'
import AppSidebar from '@/components/Layout/Sidebar.vue'

export default {
  name: 'TablesView',
  components: {
    AppHeader,
    AppSidebar
  },
  setup() {
    const router = useRouter()
    const sidebarOpen = ref(false)
    
    // Widgets de caja
    const cajaInicial = ref(10000) // Presupuesto inicial total
    const dineroInicial = ref(5000) // Dinero disponible inicial (parte de la caja)
    const nuevaCajaInicial = ref('')
    const nuevoDineroInicial = ref('')
    
    // Permisos del usuario
    const currentUserPermissions = ref({
      crearRegistros: false,
      editarRegistrosPropios: false,
      editarTodosRegistros: false,
      eliminarRegistrosPropios: false,
      eliminarTodosRegistros: false,
      modificarCajaInicial: false,
      modificarDineroInicial: false,
      exportarDatos: false
    })
    
    const currentUsername = ref('')

    // Función para verificar si hoy es sábado
    const esSabado = computed(() => {
      const hoy = new Date()
      // Ajustar a zona horaria de México
      const offsetMexico = -6 * 60
      const utc = hoy.getTime() + (hoy.getTimezoneOffset() * 60000)
      const hoyMexico = new Date(utc + (offsetMexico * 60000))
      
      // 6 = Sábado (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
      return hoyMexico.getDay() === 6
    })

    // Función para obtener la fecha actual en México (UTC-6) YYYY-MM-DD
    const getHoyMexico = () => {
      const now = new Date()
      const offsetMexico = -6 * 60 // UTC-6 en minutos
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
      const fechaMexico = new Date(utc + (offsetMexico * 60000))
      
      const año = fechaMexico.getFullYear()
      const mes = String(fechaMexico.getMonth() + 1).padStart(2, '0')
      const dia = String(fechaMexico.getDate()).padStart(2, '0')
      
      return `${año}-${mes}-${dia}`
    }

    // Función para convertir fecha a México (UTC-6)
    const getFechaMexico = (fechaString) => {
      if (!fechaString) return new Date()
      
      const fecha = new Date(fechaString)
      const offsetMexico = -6 * 60
      const utc = fecha.getTime() + (fecha.getTimezoneOffset() * 60000)
      return new Date(utc + (offsetMexico * 60000))
    }

    // Función para formatear fecha en formato mexicano DD/MM/YYYY
    const formatFechaMexico = (dateString) => {
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

    // Función para validar que solo contiene letras y espacios
    const validarNombre = (event) => {
      const input = event.target
      const valor = input.value
      const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/
      
      if (!regex.test(valor)) {
        input.value = valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '')
        form.value.nombre = input.value
      }
    }

    // Función para validar que solo contiene letras y números (sin espacios)
    const validarFolio = (event) => {
      const input = event.target
      const valor = input.value
      const regex = /^[A-Za-z0-9]*$/
      
      if (!regex.test(valor)) {
        input.value = valor.replace(/[^A-Za-z0-9]/g, '')
        form.value.folio = input.value
      }
      
      input.value = input.value.toUpperCase()
      form.value.folio = input.value
    }

    // Funciones de validación para edición
    const validarNombreEditar = (record) => {
      const valor = record.nombre
      const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/
      
      if (!regex.test(valor)) {
        record.nombre = valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '')
      }
    }

    const validarFolioEditar = (record) => {
      const valor = record.folio
      const regex = /^[A-Za-z0-9]*$/
      
      if (!regex.test(valor)) {
        record.folio = valor.replace(/[^A-Za-z0-9]/g, '')
      }
      
      record.folio = record.folio.toUpperCase()
    }

    const form = ref({
      fecha: getHoyMexico(),
      nombre: '',
      concepto: '',
      folio: '',
      metodoPago: '',
      cantidad: 0
    })

    const records = ref([])
    const filterPeriods = ['Día', 'Semana', 'Mes', 'Año', 'Todos']
    const activeFilter = ref('Todos')

    // Cargar datos guardados al iniciar
    onMounted(() => {
      cargarDesdeLocalStorage()
      loadUserPermissions()
      verificarReinicioSabado()
    })

    // FUNCIÓN MEJORADA PARA CARGAR PERMISOS
    const loadUserPermissions = () => {
      try {
        // Obtener el username
        let username = localStorage.getItem('currentUsername')
        
        if (!username) {
          const currentUserStr = localStorage.getItem('currentUser')
          if (currentUserStr) {
            try {
              const currentUser = JSON.parse(currentUserStr)
              username = currentUser.username
              localStorage.setItem('currentUsername', username)
            } catch (e) {
              console.error('Error parseando currentUser:', e)
            }
          }
        }
        
        if (!username) {
          username = 'operador'
        }
        
        currentUsername.value = username
        
        // Cargar permisos desde redyon_users
        const savedUsers = localStorage.getItem('redyon_users')
        
        if (savedUsers) {
          try {
            const users = JSON.parse(savedUsers)
            
            // Buscar el usuario actual
            const currentUser = users.find(u => u.username === username)
            
            if (currentUser && currentUser.permissions) {
              // Asignar permisos SIN filtros avanzados
              currentUserPermissions.value = {
                crearRegistros: currentUser.permissions.crearRegistros || false,
                editarRegistrosPropios: currentUser.permissions.editarRegistrosPropios || false,
                editarTodosRegistros: currentUser.permissions.editarTodosRegistros || false,
                eliminarRegistrosPropios: currentUser.permissions.eliminarRegistrosPropios || false,
                eliminarTodosRegistros: currentUser.permissions.eliminarTodosRegistros || false,
                modificarCajaInicial: currentUser.permissions.modificarCajaInicial || false,
                modificarDineroInicial: currentUser.permissions.modificarDineroInicial || false,
                exportarDatos: currentUser.permissions.exportarDatos || false
              }
            } else {
              setDefaultPermissions()
            }
          } catch (e) {
            console.error('Error parseando redyon_users:', e)
            setDefaultPermissions()
          }
        } else {
          setDefaultPermissions()
        }
      } catch (error) {
        console.error('Error cargando permisos:', error)
        setDefaultPermissions()
      }
    }

    const setDefaultPermissions = () => {
      currentUserPermissions.value = {
        crearRegistros: false,
        editarRegistrosPropios: false,
        editarTodosRegistros: false,
        eliminarRegistrosPropios: false,
        eliminarTodosRegistros: false,
        modificarCajaInicial: false,
        modificarDineroInicial: false,
        exportarDatos: false
      }
    }

    // Función para verificar si se debe reiniciar la caja (cada sábado)
    const verificarReinicioSabado = () => {
      if (!esSabado.value) return
      
      const ultimoSabadoGuardado = localStorage.getItem('redyon_ultimoSabado')
      const hoy = getHoyMexico()
      
      if (ultimoSabadoGuardado !== hoy) {
        // Es un nuevo sábado, reiniciar la caja y registros
        if (confirm('Hoy es sábado. ¿Desea reiniciar la caja inicial y todos los registros?')) {
          // Reiniciar caja inicial
          const nuevaCaja = prompt(
            'Ingrese el nuevo valor para la Caja Inicial:',
            '10000'
          )
          
          if (nuevaCaja !== null && !isNaN(parseFloat(nuevaCaja))) {
            cajaInicial.value = parseFloat(nuevaCaja)
            // Reiniciar dinero inicial también (por defecto 50% de la caja)
            dineroInicial.value = Math.round(parseFloat(nuevaCaja) * 0.5)
            // Limpiar registros
            records.value = []
            // Guardar que hoy ya se reinició
            localStorage.setItem('redyon_ultimoSabado', hoy)
            guardarEnLocalStorage()
            alert('✅ Caja y registros reiniciados para el nuevo período')
          }
        }
      }
    }

    const cargarDesdeLocalStorage = () => {
      const savedCaja = localStorage.getItem('redyon_cajaInicial')
      const savedDinero = localStorage.getItem('redyon_dineroInicial')
      const savedRecords = localStorage.getItem('redyon_records')
      const savedSabado = localStorage.getItem('redyon_ultimoSabado')
      
      if (savedCaja) cajaInicial.value = parseFloat(savedCaja)
      if (savedDinero) dineroInicial.value = parseFloat(savedDinero)
      if (savedRecords) {
        records.value = JSON.parse(savedRecords)
        ordenarRegistrosPorFecha()
      }
      
      // Si no hay fecha de sábado guardada, guardar la actual
      if (!savedSabado) {
        localStorage.setItem('redyon_ultimoSabado', getHoyMexico())
      }
    }

    const ordenarRegistrosPorFecha = () => {
      records.value.sort((a, b) => {
        const fechaA = getFechaMexico(a.fecha)
        const fechaB = getFechaMexico(b.fecha)
        return fechaB - fechaA
      })
    }

    const guardarEnLocalStorage = () => {
      localStorage.setItem('redyon_cajaInicial', cajaInicial.value)
      localStorage.setItem('redyon_dineroInicial', dineroInicial.value)
      localStorage.setItem('redyon_records', JSON.stringify(records.value))
    }

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value
    }

    // Función para actualizar caja inicial
    const actualizarCajaInicial = () => {
      if (!nuevaCajaInicial.value || nuevaCajaInicial.value <= 0) {
        alert('Ingrese un monto válido para la caja inicial')
        return
      }
      
      const nuevaCaja = parseFloat(nuevaCajaInicial.value)
      cajaInicial.value = nuevaCaja
      
      // Si el dinero inicial actual excede la nueva caja, ajustarlo
      if (dineroInicial.value > nuevaCaja) {
        dineroInicial.value = nuevaCaja
        alert(`Caja inicial actualizada. Dinero inicial ajustado a $${formatCurrency(nuevaCaja)}`)
      } else {
        alert(`Caja inicial actualizada a $${formatCurrency(nuevaCaja)}`)
      }
      
      nuevaCajaInicial.value = ''
      guardarEnLocalStorage()
    }

    // Función para actualizar dinero inicial
    const actualizarDineroInicial = () => {
      if (!nuevoDineroInicial.value || nuevoDineroInicial.value <= 0) {
        alert('Ingrese un monto válido para el dinero inicial')
        return
      }
      
      const nuevoDinero = parseFloat(nuevoDineroInicial.value)
      
      if (nuevoDinero > cajaInicial.value) {
        alert(`El dinero inicial no puede exceder la caja inicial de $${formatCurrency(cajaInicial.value)}`)
        return
      }
      
      dineroInicial.value = nuevoDinero
      nuevoDineroInicial.value = ''
      guardarEnLocalStorage()
      alert(`Dinero inicial actualizado a $${formatCurrency(nuevoDinero)}`)
    }

    // Cálculo del dinero final (dinero inicial + sumatoria de registros)
    const dineroFinal = computed(() => {
      let total = dineroInicial.value
      records.value.forEach(record => {
        total += record.cantidad
      })
      return total
    })

    // Totales por tipo
    const totalIngresos = computed(() => {
      return records.value
        .filter(r => r.cantidad > 0)
        .reduce((sum, r) => sum + r.cantidad, 0)
    })

    const totalEgresos = computed(() => {
      return records.value
        .filter(r => r.cantidad < 0)
        .reduce((sum, r) => sum + r.cantidad, 0)
    })

    // Validación del formulario
    const formValido = computed(() => {
      return form.value.nombre.trim() !== '' &&
             form.value.concepto !== '' &&
             form.value.folio.trim() !== '' &&
             form.value.metodoPago !== '' &&
             form.value.cantidad !== 0
    })

    const handleSubmit = async () => {
      try {
        if (!currentUserPermissions.value.crearRegistros) {
          alert('❌ No tienes permiso para crear registros')
          return
        }

        // Validaciones de formato
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(form.value.nombre)) {
          alert('❌ El nombre solo puede contener letras y espacios')
          return
        }

        if (!/^[A-Za-z0-9]+$/.test(form.value.folio)) {
          alert('❌ El folio solo puede contener letras y números (sin espacios)')
          return
        }

        if (!form.value.concepto) {
          alert('❌ Debe seleccionar un concepto')
          return
        }

        if (!form.value.metodoPago) {
          alert('❌ Debe seleccionar un método de pago')
          return
        }

        // Validar fecha no futura
        const fechaSeleccionada = getFechaMexico(form.value.fecha)
        const hoyMexico = getFechaMexico(getHoyMexico())
        fechaSeleccionada.setHours(0, 0, 0, 0)
        hoyMexico.setHours(0, 0, 0, 0)
        
        if (fechaSeleccionada > hoyMexico) {
          alert('❌ No puede seleccionar fechas futuras')
          return
        }

        // Validar que no exceda el presupuesto si es egreso
        if (form.value.cantidad < 0) {
          const saldoDespuesEgreso = dineroFinal.value + form.value.cantidad
          if (saldoDespuesEgreso < 0) {
            alert(`❌ Fondos insuficientes. Saldo disponible: $${formatCurrency(dineroFinal.value)}`)
            return
          }
        }

        const newRecord = {
          id: Date.now(),
          ...form.value,
          folio: form.value.folio.toUpperCase(),
          editing: false,
          creadoPor: currentUsername.value
        }
        
        records.value.unshift(newRecord)
        ordenarRegistrosPorFecha()
        guardarEnLocalStorage()

        // Resetear formulario
        form.value = {
          fecha: getHoyMexico(),
          nombre: '',
          concepto: '',
          folio: '',
          metodoPago: '',
          cantidad: 0
        }

        alert('✅ Registro agregado exitosamente')
      } catch (error) {
        console.error('Error al guardar:', error)
        alert('❌ Error al guardar el registro')
      }
    }

    const goToCharts = () => {
      if (!currentUserPermissions.value.exportarDatos) {
        alert('❌ No tienes permiso para exportar datos')
        return
      }
      router.push('/charts')
    }

    const setFilter = (period) => {
      activeFilter.value = period
    }

    const filteredRecords = computed(() => {
      let registrosFiltrados = [...records.value]
      
      if (activeFilter.value !== 'Todos') {
        const hoyMexico = getFechaMexico(getHoyMexico())
        hoyMexico.setHours(0, 0, 0, 0)
        
        registrosFiltrados = registrosFiltrados.filter(record => {
          const recordDate = getFechaMexico(record.fecha)
          recordDate.setHours(0, 0, 0, 0)
          const diffTime = hoyMexico - recordDate
          const diffDays = diffTime / (1000 * 60 * 60 * 24)
          
          switch(activeFilter.value) {
            case 'Día': return diffDays < 1
            case 'Semana': return diffDays < 7
            case 'Mes': return diffDays < 30
            case 'Año': return diffDays < 365
            default: return true
          }
        })
      }
      
      return registrosFiltrados.sort((a, b) => {
        const fechaA = getFechaMexico(a.fecha)
        const fechaB = getFechaMexico(b.fecha)
        return fechaB - fechaA
      })
    })

    // FUNCIÓN PARA VERIFICAR SI PUEDE EDITAR
    const canEditRecord = (record) => {
      const esRegistroPropio = record.creadoPor === currentUsername.value
      
      if (currentUserPermissions.value.editarTodosRegistros === true) {
        return true
      }
      
      if (esRegistroPropio && currentUserPermissions.value.editarRegistrosPropios === true) {
        return true
      }
      
      return false
    }

    // FUNCIÓN PARA VERIFICAR SI PUEDE ELIMINAR
    const canDeleteRecord = (record) => {
      const esRegistroPropio = record.creadoPor === currentUsername.value
      
      if (currentUserPermissions.value.eliminarTodosRegistros === true) {
        return true
      }
      
      if (esRegistroPropio && currentUserPermissions.value.eliminarRegistrosPropios === true) {
        return true
      }
      
      return false
    }

    // FUNCIÓN PARA INICIAR EDICIÓN
    const startEdit = (record) => {
      if (!canEditRecord(record)) {
        alert('❌ No tienes permiso para editar este registro')
        return
      }
      
      record.editing = true
      record.originalData = { ...record }
    }

    const saveEdit = (record) => {
      if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(record.nombre)) {
        alert('❌ El nombre solo puede contener letras y espacios')
        return
      }

      if (!/^[A-Za-z0-9]+$/.test(record.folio)) {
        alert('❌ El folio solo puede contener letras y números (sin espacios)')
        return
      }

      if (!record.concepto) {
        alert('❌ Debe seleccionar un concepto')
        return
      }

      if (!record.metodoPago) {
        alert('❌ Debe seleccionar un método de pago')
        return
      }

      // Validar fecha no futura
      const fechaSeleccionada = getFechaMexico(record.fecha)
      const hoyMexico = getFechaMexico(getHoyMexico())
      fechaSeleccionada.setHours(0, 0, 0, 0)
      hoyMexico.setHours(0, 0, 0, 0)
      
      if (fechaSeleccionada > hoyMexico) {
        alert('❌ No puede seleccionar fechas futuras')
        cancelEdit(record)
        return
      }

      // Convertir folio a mayúsculas
      record.folio = record.folio.toUpperCase()

      // Validar que no exceda el presupuesto si cambió a egreso
      const oldAmount = record.originalData.cantidad
      const newAmount = record.cantidad
      
      if (newAmount < oldAmount) {
        const diferencia = newAmount - oldAmount
        if (dineroFinal.value + diferencia < 0) {
          alert('❌ Fondos insuficientes para este cambio')
          cancelEdit(record)
          return
        }
      }
      
      record.editing = false
      delete record.originalData
      ordenarRegistrosPorFecha()
      guardarEnLocalStorage()
      alert('✅ Registro actualizado')
    }

    const cancelEdit = (record) => {
      if (record.originalData) {
        Object.assign(record, record.originalData)
        record.editing = false
        delete record.originalData
      }
    }

    const deleteRecord = (id) => {
      const record = records.value.find(r => r.id === id)
      if (!record) return
      
      if (!canDeleteRecord(record)) {
        alert('❌ No tienes permiso para eliminar este registro')
        return
      }
      
      if (confirm('¿Está seguro de eliminar este registro?')) {
        const index = records.value.findIndex(r => r.id === id)
        if (index !== -1) {
          records.value.splice(index, 1)
          guardarEnLocalStorage()
          alert('✅ Registro eliminado')
        }
      }
    }

    const formatCurrency = (amount) => {
      return Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    const getConceptoLabel = (concepto) => {
      const labels = {
        servicio_internet: 'Servicio Internet',
        gastos_operativos: 'Gastos Operativos',
        gasto_administrativo: 'Gasto Admin.',
        viaticos: 'Viáticos',
        propinas: 'Propinas',
        dedicados_clientes: 'Dedicados-Clientes',
        actividades: 'Actividades',
        venta_almacen: 'Venta Almacen',
        recarga: 'Recarga',
        comisiones: 'Comisiones',
        entrega_efectivo: 'Entrega Efectivo',
        gastos_personales: 'Gastos Personales',
        pagos_tarjetas: 'Pagos Tarjetas',
        compras: 'Compras',
        dedicados_pagos: 'Dedicados Pagos',
        recibimiento_efectivo: 'Recibimiento',
        otros: 'Otros'
      }
      return labels[concepto] || concepto
    }

    const getMetodoPagoLabel = (metodo) => {
      const labels = {
        efectivo: 'Efectivo',
        tarjeta: 'Tarjeta',
        terminal: 'Terminal',
        transferencia: 'Transferencia'
      }
      return labels[metodo] || metodo
    }

    // Observar cambios en records
    watch(records, () => {
      guardarEnLocalStorage()
    }, { deep: true })

    return {
      sidebarOpen,
      cajaInicial,
      dineroInicial,
      nuevaCajaInicial,
      nuevoDineroInicial,
      dineroFinal,
      totalIngresos,
      totalEgresos,
      currentUserPermissions,
      currentUsername,
      form,
      records,
      filterPeriods,
      activeFilter,
      filteredRecords,
      formValido,
      esSabado,
      toggleSidebar,
      actualizarCajaInicial,
      actualizarDineroInicial,
      handleSubmit,
      goToCharts,
      setFilter,
      formatFechaMexico,
      formatCurrency,
      getConceptoLabel,
      getMetodoPagoLabel,
      validarNombre,
      validarFolio,
      validarNombreEditar,
      validarFolioEditar,
      startEdit,
      saveEdit,
      cancelEdit,
      deleteRecord,
      canEditRecord,
      canDeleteRecord,
      guardarEnLocalStorage,
      getHoyMexico
    }
  }
}
</script>

<style scoped>
/* EL CSS SE MANTIENE IGUAL - ES CORRECTO */
.tables-page {
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
  margin-bottom: 10px;
}

.page-header p {
  color: #666;
}

.sabado-notice {
  background: #f39c1220;
  border: 1px solid #f39c12;
  border-radius: 6px;
  padding: 10px 15px;
  margin-top: 10px;
  color: #d35400;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* WIDGETS DE CAJA */
.caja-widgets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 1024px) {
  .caja-widgets {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .caja-widgets {
    grid-template-columns: 1fr;
  }
}

.widget {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 2px solid transparent;
  transition: all 0.3s;
}

.widget:hover {
  border-color: #1f998f20;
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

.widget-content {
  flex: 1;
}

.widget-content h3 {
  margin: 0 0 5px;
  color: #666;
  font-size: 14px;
  font-weight: 600;
}

.widget-value {
  margin: 0 0 10px;
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.widget-value.positive {
  color: #27ae60;
}

.widget-value.negative {
  color: #e74c3c;
}

.widget-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 8px;
}

.widget-input:focus {
  outline: none;
  border-color: #1f998f;
}

.btn-actualizar-caja {
  width: 100%;
  padding: 8px 12px;
  background: #1f998f;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.btn-actualizar-caja:hover:not(:disabled) {
  background: #21a398;
}

.btn-actualizar-caja:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
}

.widget-hint {
  font-size: 11px;
  color: #666;
  display: block;
  margin-top: 4px;
}

.reinicio-info {
  margin-top: 8px;
  padding: 6px 10px;
  background: #f39c1210;
  border-radius: 4px;
  border-left: 3px solid #f39c12;
}

.reinicio-info small {
  color: #d35400;
  font-weight: 500;
}

.widget-view-only {
  padding: 8px 0;
}

.view-only-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.permission-info {
  font-size: 11px;
  color: #666;
  font-style: italic;
}

.error-message {
  color: #e74c3c;
  font-size: 11px;
  margin-top: 4px;
}

.warning {
  color: #e74c3c;
  font-weight: 500;
  display: block;
  margin-top: 4px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.form-container, .preview-container {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
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
  opacity: 0.7;
}

.field-hint {
  font-size: 11px;
  color: #666;
  font-style: italic;
  margin-top: 4px;
}

.amount-input {
  position: relative;
}

.amount-input input.positive {
  border-color: #27ae6050;
}

.amount-input input.negative {
  border-color: #e74c3c50;
}

.amount-hint {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #666;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-bottom: 30px;
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(31, 153, 143, 0.3);
}

.btn-primary:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 2px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background: #e9e9e9;
}

.btn-secondary:disabled {
  background: #ecf0f1;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Resumen de Caja */
.caja-summary {
  border-top: 2px solid #f5f5f5;
  padding-top: 20px;
}

.caja-summary h4 {
  color: #1f998f;
  margin-bottom: 15px;
}

.summary-grid {
  display: grid;
  gap: 10px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 6px;
}

.summary-item.total {
  background: #1f998f10;
  border: 1px solid #1f998f30;
  font-weight: bold;
}

.summary-item span:first-child {
  color: #666;
}

.summary-item .positive {
  color: #27ae60;
  font-weight: 600;
}

.summary-item .negative {
  color: #e74c3c;
  font-weight: 600;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.preview-header h3 {
  color: #1f998f;
  margin: 0;
}

.filter-options {
  display: flex;
  gap: 10px;
}

.period-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.period-btn.active {
  background: #1f998f;
  color: white;
  border-color: #1f998f;
}

.period-btn:hover:not(.active) {
  background: #e9e9e9;
}

.records-table {
  overflow-x: auto;
}

.records-table table {
  width: 100%;
  border-collapse: collapse;
}

.records-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  color: #666;
  font-weight: 600;
  border-bottom: 2px solid #eee;
}

.records-table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.edit-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.edit-input.positive {
  border-color: #27ae60;
}

.edit-input.negative {
  border-color: #e74c3c;
}

.concept-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.concept-tag.servicio_internet {
  background: #3498db20;
  color: #3498db;
}

.concept-tag.gastos_operativos {
  background: #e74c3c20;
  color: #e74c3c;
}

.concept-tag.gasto_administrativo {
  background: #9b59b620;
  color: #9b59b6;
}

.concept-tag.viaticos {
  background: #1abc9c20;
  color: #1abc9c;
}

.concept-tag.propinas {
  background: #f1c40f20;
  color: #f1c40f;
}

.concept-tag.dedicados_clientes {
  background: #34495e20;
  color: #34495e;
}

.concept-tag.actividades {
  background: #e67e2220;
  color: #e67e22;
}

.concept-tag.venta_almacen {
  background: #27ae6020;
  color: #27ae60;
}

.concept-tag.recarga {
  background: #8e44ad20;
  color: #8e44ad;
}

.concept-tag.comisiones {
  background: #16a08520;
  color: #16a085;
}

.concept-tag.entrega_efectivo {
  background: #c0392b20;
  color: #c0392b;
}

.concept-tag.gastos_personales {
  background: #7f8c8d20;
  color: #7f8c8d;
}

.concept-tag.pagos_tarjetas {
  background: #d3540020;
  color: #d35400;
}

.concept-tag.compras {
  background: #2980b920;
  color: #2980b9;
}

.concept-tag.dedicados_pagos {
  background: #2c3e5020;
  color: #2c3e50;
}

.concept-tag.recibimiento_efectivo {
  background: #27ae6020;
  color: #27ae60;
}

.concept-tag.otros {
  background: #95a5a620;
  color: #95a5a6;
}

.payment-tag {
  display: inline-block;
  padding: 4px 10px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.positive {
  color: #27ae60;
  font-weight: 600;
}

.negative {
  color: #e74c3c;
  font-weight: 600;
}

.actions-cell {
  width: 120px;
}

.record-actions, .edit-actions {
  display: flex;
  gap: 8px;
}

.btn-edit, .btn-delete, .btn-save, .btn-cancel {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 6px 10px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-edit:hover:not(:disabled) {
  background: #3498db20;
}

.btn-edit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-delete:hover:not(:disabled) {
  background: #e74c3c20;
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-save:hover {
  background: #27ae6020;
}

.btn-cancel:hover {
  background: #95a5a620;
}

.no-records {
  text-align: center;
  color: #666;
  padding: 30px !important;
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .main-content.sidebar-open {
    margin-left: 0;
  }
  
  .caja-widgets,
  .content-grid {
    gap: 15px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-primary, .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>