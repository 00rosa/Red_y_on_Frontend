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
                  :max="getMaxFecha()"
                >
                <small class="field-hint">Puede seleccionar cualquier fecha</small>
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
                  :disabled="soloVer"
                >
                <small class="field-hint">Solo letras y espacios</small>
              </div>

              <div class="form-group">
                <label>Concepto:</label>
                <select v-model="form.concepto" required :disabled="soloVer">
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

              <!-- Dato Extra (no obligatorio) -->
              <div class="form-group">
                <label>Dato Extra:</label>
                <input 
                  type="text" 
                  v-model="form.folio" 
                  placeholder="Folio transacciones"
                  @input="validarFolio"
                  pattern="[A-Za-z0-9]*"
                  title="Solo letras y números, sin espacios (opcional)"
                  :disabled="soloVer"
                >
                <small class="field-hint">Opcional - Solo letras y números</small>
              </div>

              <div class="form-group">
                <label>Método de Pago:</label>
                <select v-model="form.metodoPago" required :disabled="soloVer">
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
                    :disabled="!currentUserPermissions.crearRegistros || soloVer"
                  >
                  <span class="amount-hint">
                    {{ form.cantidad >= 0 ? '(Ingreso)' : '(Egreso)' }}
                  </span>
                </div>
                <div class="permission-info">
                  <small v-if="!currentUserPermissions.crearRegistros">
                    ❌ No tienes permiso para crear registros
                  </small>
                  <small v-if="soloVer" class="warning">
                    🔍 Modo solo lectura
                  </small>
                </div>
              </div>
            </div>

            <!-- Botones -->
            <div class="form-actions">
              <button 
                type="submit" 
                class="btn-primary"
                :disabled="!currentUserPermissions.crearRegistros || !formValido || soloVer"
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
                  <!-- Columna ID -->
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Nombre</th>
                  <th>Concepto</th>
                  <th>Método Pago</th>
                  <th>Dato Extra</th>
                  <th>Cantidad</th>
                  <th>Creado por</th>
                  <!-- Comentarios (editable) -->
                  <th>Comentarios</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(record, index) in recordsParaMostrar" :key="record.id">
                  <!-- ID autoincremental (índice + 1) -->
                  <td class="id-column">{{ index + 1 }}</td>
                  
                  <td>{{ formatFechaMexico(record.fecha) }}</td>
                  <td>{{ record.nombre }}</td>
                  <td>
                    <span class="concept-tag" :class="record.concepto">
                      {{ getConceptoLabel(record.concepto) }}
                    </span>
                  </td>
                  <td>
                    <span class="payment-tag">{{ getMetodoPagoLabel(record.metodoPago) }}</span>
                  </td>
                  <td>{{ record.folio || '-' }}</td>
                  <td :class="record.cantidad >= 0 ? 'positive' : 'negative'">
                    ${{ Math.abs(record.cantidad).toFixed(2) }}
                  </td>
                  <td>
                    <small>{{ record.creadoPor || 'Sistema' }}</small>
                  </td>
                  <!-- Columna de comentarios con control de permisos -->
                  <td class="comments-cell">
                    <div v-if="record.editandoComentario" class="comment-edit">
                      <input 
                        type="text" 
                        v-model="record.comentarioTemp" 
                        class="comment-input"
                        placeholder="Escribir comentario..."
                        @keyup.enter="guardarComentarioEdit(record)"
                        @keyup.esc="cancelarComentarioEdit(record)"
                        ref="comentarioInput"
                        :disabled="!puedeEditarComentarios"
                      >
                      <div v-if="puedeEditarComentarios" class="comment-actions">
                        <button @click="guardarComentarioEdit(record)" class="btn-comment-save" title="Guardar">✓</button>
                        <button @click="cancelarComentarioEdit(record)" class="btn-comment-cancel" title="Cancelar">✗</button>
                      </div>
                    </div>
                    <div v-else class="comment-display">
                      <span class="comment-text">{{ record.comentario || 'Sin comentario' }}</span>
                      <button 
                        v-if="puedeEditarComentarios" 
                        @click="editarComentario(record)" 
                        class="btn-edit-comment" 
                        title="Editar comentario"
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                  <!-- Botón de imprimir con control de permiso -->
                  <td class="print-cell">
                    <button 
                      v-if="puedeImprimir"
                      @click="imprimirRegistro(record, index)" 
                      class="btn-print" 
                      title="Imprimir"
                    >
                      🖨️
                    </button>
                    <span v-else class="no-permission">🚫</span>
                  </td>
                </tr>
                <tr v-if="recordsParaMostrar.length === 0">
                  <td colspan="10" class="no-records">
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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
    const comentarioInput = ref(null)
    
    // Widgets de caja
    const cajaInicial = ref(10000)
    const dineroInicial = ref(5000)
    const nuevaCajaInicial = ref('')
    const nuevoDineroInicial = ref('')
    
    // Permisos del usuario (ACTUALIZADO con permiso de imprimir)
    const currentUserPermissions = ref({
      crearRegistros: false,
      soloVer: false,
      editarComentarios: false,
      imprimir: false,
      modificarCajaInicial: false,
      modificarDineroInicial: false,
      exportarDatos: false
    })
    
    const currentUsername = ref('')

    // Función para verificar si hoy es sábado
    const esSabado = computed(() => {
      const hoy = new Date()
      const offsetMexico = -6 * 60
      const utc = hoy.getTime() + (hoy.getTimezoneOffset() * 60000)
      const hoyMexico = new Date(utc + (offsetMexico * 60000))
      return hoyMexico.getDay() === 6
    })

    const getMaxFecha = () => {
      return undefined
    }

    const getHoyMexico = () => {
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

    const validarNombre = (event) => {
      const input = event.target
      const valor = input.value
      const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/
      
      if (!regex.test(valor)) {
        input.value = valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '')
        form.value.nombre = input.value
      }
    }

    // Validación de folio (opcional)
    const validarFolio = (event) => {
      const input = event.target
      const valor = input.value
      const regex = /^[A-Za-z0-9]*$/
      
      if (valor && !regex.test(valor)) {
        input.value = valor.replace(/[^A-Za-z0-9]/g, '')
        form.value.folio = input.value
      }
      
      if (input.value) {
        input.value = input.value.toUpperCase()
        form.value.folio = input.value
      }
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

    onMounted(() => {
      cargarDesdeLocalStorage()
      loadUserPermissions()
      verificarReinicioSabado()
    })

    // ACTUALIZADO: Carga los nuevos permisos (incluyendo imprimir)
    const loadUserPermissions = () => {
      try {
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
        
        const savedUsers = localStorage.getItem('redyon_users')
        
        if (savedUsers) {
          try {
            const users = JSON.parse(savedUsers)
            const currentUser = users.find(u => u.username === username)
            
            if (currentUser && currentUser.permissions) {
              // Mapear los nuevos permisos
              currentUserPermissions.value = {
                crearRegistros: currentUser.permissions.crearRegistros || false,
                soloVer: currentUser.permissions.soloVer || false,
                editarComentarios: currentUser.permissions.editarComentarios || false,
                imprimir: currentUser.permissions.imprimir || false,
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
        soloVer: false,
        editarComentarios: false,
        imprimir: false,
        modificarCajaInicial: false,
        modificarDineroInicial: false,
        exportarDatos: false
      }
    }

    // Computed para modo solo ver
    const soloVer = computed(() => {
      return currentUserPermissions.value.soloVer || false
    })

    // Computed para editar comentarios
    const puedeEditarComentarios = computed(() => {
      return currentUserPermissions.value.editarComentarios || false
    })

    // Computed para imprimir
    const puedeImprimir = computed(() => {
      return currentUserPermissions.value.imprimir || false
    })

    const verificarReinicioSabado = () => {
      if (!esSabado.value) return
      
      const ultimoSabadoGuardado = localStorage.getItem('redyon_ultimoSabado')
      const hoy = getHoyMexico()
      
      if (ultimoSabadoGuardado !== hoy) {
        if (confirm('Hoy es sábado. ¿Desea reiniciar la caja inicial y todos los registros?')) {
          const nuevaCaja = prompt(
            'Ingrese el nuevo valor para la Caja Inicial:',
            '10000'
          )
          
          if (nuevaCaja !== null && !isNaN(parseFloat(nuevaCaja))) {
            cajaInicial.value = parseFloat(nuevaCaja)
            dineroInicial.value = Math.round(parseFloat(nuevaCaja) * 0.5)
            records.value = []
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
        // Asegurar que todos los registros tengan los campos necesarios
        records.value.forEach(record => {
          if (!record.hasOwnProperty('comentario')) {
            record.comentario = ''
          }
          if (!record.hasOwnProperty('editandoComentario')) {
            record.editandoComentario = false
          }
          if (!record.hasOwnProperty('comentarioTemp')) {
            record.comentarioTemp = record.comentario || ''
          }
        })
      }
      
      if (!savedSabado) {
        localStorage.setItem('redyon_ultimoSabado', getHoyMexico())
      }
    }

    const guardarEnLocalStorage = () => {
      // Limpiar campos temporales antes de guardar
      const recordsParaGuardar = records.value.map(record => {
        const { editandoComentario, comentarioTemp, ...recordLimpio } = record
        return recordLimpio
      })
      localStorage.setItem('redyon_cajaInicial', cajaInicial.value)
      localStorage.setItem('redyon_dineroInicial', dineroInicial.value)
      localStorage.setItem('redyon_records', JSON.stringify(recordsParaGuardar))
    }

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value
    }

    const actualizarCajaInicial = () => {
      if (!nuevaCajaInicial.value || nuevaCajaInicial.value <= 0) {
        alert('Ingrese un monto válido para la caja inicial')
        return
      }
      
      const nuevaCaja = parseFloat(nuevaCajaInicial.value)
      cajaInicial.value = nuevaCaja
      
      if (dineroInicial.value > nuevaCaja) {
        dineroInicial.value = nuevaCaja
        alert(`Caja inicial actualizada. Dinero inicial ajustado a $${formatCurrency(nuevaCaja)}`)
      } else {
        alert(`Caja inicial actualizada a $${formatCurrency(nuevaCaja)}`)
      }
      
      nuevaCajaInicial.value = ''
      guardarEnLocalStorage()
    }

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

    const dineroFinal = computed(() => {
      let total = dineroInicial.value
      records.value.forEach(record => {
        total += record.cantidad
      })
      return total
    })

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

    const formValido = computed(() => {
      return form.value.nombre.trim() !== '' &&
             form.value.concepto !== '' &&
             form.value.metodoPago !== '' &&
             form.value.cantidad !== 0
    })

    const handleSubmit = async () => {
      try {
        if (!currentUserPermissions.value.crearRegistros) {
          alert('❌ No tienes permiso para crear registros')
          return
        }

        if (soloVer.value) {
          alert('❌ Modo solo lectura - No puedes crear registros')
          return
        }

        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(form.value.nombre)) {
          alert('❌ El nombre solo puede contener letras y espacios')
          return
        }

        if (form.value.folio && !/^[A-Za-z0-9]+$/.test(form.value.folio)) {
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

        if (!form.value.fecha) {
          alert('❌ Debe seleccionar una fecha')
          return
        }

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
          folio: form.value.folio ? form.value.folio.toUpperCase() : '',
          comentario: '',
          editandoComentario: false,
          comentarioTemp: '',
          creadoPor: currentUsername.value,
          fechaCreacion: new Date().toISOString()
        }
        
        records.value.push(newRecord)
        
        guardarEnLocalStorage()

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

    const recordsParaMostrar = computed(() => {
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
        const fechaA = a.fechaCreacion ? new Date(a.fechaCreacion) : a.id
        const fechaB = b.fechaCreacion ? new Date(b.fechaCreacion) : b.id
        return fechaA - fechaB
      })
    })

    // Funciones para editar comentarios (controladas por permiso)
    const editarComentario = (record) => {
      if (!puedeEditarComentarios.value) {
        alert('❌ No tienes permiso para editar comentarios')
        return
      }
      record.comentarioTemp = record.comentario || ''
      record.editandoComentario = true
      // Enfocar el input después de que se renderice
      nextTick(() => {
        const inputs = document.querySelectorAll('.comment-input')
        if (inputs.length > 0) {
          inputs[inputs.length - 1].focus()
        }
      })
    }

    const guardarComentarioEdit = (record) => {
      if (!puedeEditarComentarios.value) {
        alert('❌ No tienes permiso para editar comentarios')
        return
      }
      record.comentario = record.comentarioTemp
      record.editandoComentario = false
      guardarEnLocalStorage()
    }

    const cancelarComentarioEdit = (record) => {
      record.editandoComentario = false
      record.comentarioTemp = record.comentario || ''
    }

    // Función para guardar comentarios (mantener compatibilidad)
    const guardarComentario = (record) => {
      guardarEnLocalStorage()
    }

    // Función para imprimir registro (con control de permiso)
    const imprimirRegistro = (record, index) => {
      if (!puedeImprimir.value) {
        alert('❌ No tienes permiso para imprimir')
        return
      }

      const ventanaImpresion = window.open('', '_blank')
      
      const contenido = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Registro #${index + 1}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1f998f; }
            .registro { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
            .campo { margin-bottom: 10px; }
            .label { font-weight: bold; color: #666; }
            .valor { margin-left: 10px; }
            .positivo { color: #27ae60; }
            .negativo { color: #e74c3c; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Comprobante de Registro</h1>
          <div class="registro">
            <div class="campo">
              <span class="label">ID:</span>
              <span class="valor">${index + 1}</span>
            </div>
            <div class="campo">
              <span class="label">Fecha:</span>
              <span class="valor">${formatFechaMexico(record.fecha)}</span>
            </div>
            <div class="campo">
              <span class="label">Nombre:</span>
              <span class="valor">${record.nombre}</span>
            </div>
            <div class="campo">
              <span class="label">Concepto:</span>
              <span class="valor">${getConceptoLabel(record.concepto)}</span>
            </div>
            <div class="campo">
              <span class="label">Dato Extra:</span>
              <span class="valor">${record.folio || '-'}</span>
            </div>
            <div class="campo">
              <span class="label">Método de Pago:</span>
              <span class="valor">${getMetodoPagoLabel(record.metodoPago)}</span>
            </div>
            <div class="campo">
              <span class="label">Cantidad:</span>
              <span class="valor ${record.cantidad >= 0 ? 'positivo' : 'negativo'}">
                $${Math.abs(record.cantidad).toFixed(2)} ${record.cantidad >= 0 ? '(Ingreso)' : '(Egreso)'}
              </span>
            </div>
            <div class="campo">
              <span class="label">Creado por:</span>
              <span class="valor">${record.creadoPor || 'Sistema'}</span>
            </div>
            <div class="campo">
              <span class="label">Comentarios:</span>
              <span class="valor">${record.comentario || '-'}</span>
            </div>
          </div>
          <div style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()">Imprimir</button>
          </div>
        </body>
        </html>
      `
      
      ventanaImpresion.document.write(contenido)
      ventanaImpresion.document.close()
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
      recordsParaMostrar,
      formValido,
      esSabado,
      soloVer,
      puedeEditarComentarios,
      puedeImprimir,
      comentarioInput,
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
      guardarComentario,
      imprimirRegistro,
      editarComentario,
      guardarComentarioEdit,
      cancelarComentarioEdit,
      guardarEnLocalStorage,
      getHoyMexico,
      getMaxFecha
    }
  }
}
</script>

<style scoped>
.id-column {
  font-weight: 600;
  color: #1f998f;
  text-align: center;
}

.comments-cell {
  min-width: 200px;
}

.comment-display {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.comment-text {
  flex: 1;
  font-size: 13px;
  color: #333;
  word-break: break-word;
  padding: 4px 0;
}

.btn-edit-comment {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0.6;
}

.btn-edit-comment:hover {
  background: #1f998f20;
  opacity: 1;
  transform: scale(1.1);
}

.comment-edit {
  display: flex;
  gap: 4px;
  align-items: center;
}

.comment-input {
  flex: 1;
  padding: 6px 10px;
  border: 2px solid #1f998f;
  border-radius: 4px;
  font-size: 13px;
  transition: all 0.2s;
}

.comment-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(31, 153, 143, 0.2);
}

.comment-actions {
  display: flex;
  gap: 2px;
}

.btn-comment-save, .btn-comment-cancel {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-comment-save {
  color: #27ae60;
}

.btn-comment-save:hover {
  background: #27ae6020;
  transform: scale(1.1);
}

.btn-comment-cancel {
  color: #e74c3c;
}

.btn-comment-cancel:hover {
  background: #e74c3c20;
  transform: scale(1.1);
}

.print-cell {
  text-align: center;
}

.btn-print {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 6px 10px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-print:hover {
  background: #1f998f20;
  transform: scale(1.1);
}

/* Ajuste de tabla para nuevas columnas */
.records-table th {
  white-space: nowrap;
}

.records-table td {
  vertical-align: middle;
}

@media (max-width: 1200px) {
  .records-table {
    overflow-x: auto;
    display: block;
  }
  
  .records-table table {
    min-width: 1300px;
  }
}

/* Resto del CSS original se mantiene igual */
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
.no-permission {
  opacity: 0.3;
  font-size: 16px;
  display: inline-block;
  padding: 6px 10px;
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

.no-records {
  text-align: center;
  color: #666;
  padding: 30px !important;
  font-style: italic;
}

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