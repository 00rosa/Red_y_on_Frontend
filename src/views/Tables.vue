<template>
  <div class="tables-page">
    <AppHeader @toggle-sidebar="toggleSidebar" />
    <AppSidebar :isOpen="sidebarOpen" />

    <main :class="['main-content', { 'sidebar-open': sidebarOpen }]">
      <div class="page-header">
        <h1>Nuevo Registro</h1>
        <p>Complete el formulario para agregar un nuevo registro</p>
        <div v-if="loading" class="loading-notice">
          ⏳ Cargando...
        </div>
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
                :disabled="updatingCaja"
              >
              <button 
                @click="actualizarCajaInicial" 
                class="btn-actualizar-caja"
                :disabled="!nuevaCajaInicial || nuevaCajaInicial <= 0 || updatingCaja"
              >
                {{ updatingCaja ? 'Actualizando...' : 'Actualizar' }}
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
                :disabled="updatingCaja"
              >
              <button 
                @click="actualizarDineroInicial" 
                class="btn-actualizar-caja"
                :disabled="!nuevoDineroInicial || nuevoDineroInicial <= 0 || nuevoDineroInicial > cajaInicial || updatingCaja"
              >
                {{ updatingCaja ? 'Actualizando...' : 'Actualizar' }}
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
                  :disabled="submitting"
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
                  :disabled="soloVer || submitting"
                >
                <small class="field-hint">Solo letras y espacios</small>
              </div>

              <div class="form-group">
                <label>Concepto:</label>
                <select v-model="form.conceptoId" required :disabled="soloVer || submitting || loadingCatalogos">
                  <option value="">Seleccione concepto</option>
                  <option v-for="concepto in conceptos" :key="concepto.id" :value="concepto.id">
                    {{ concepto.nombre }}
                  </option>
                </select>
                <small class="field-hint" v-if="loadingCatalogos">Cargando conceptos...</small>
                <small class="field-hint" v-else>Seleccione un concepto</small>
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
                  :disabled="soloVer || submitting"
                >
                <small class="field-hint">Opcional - Solo letras y números</small>
              </div>

              <div class="form-group">
                <label>Método de Pago:</label>
                <select v-model="form.metodoPagoId" required :disabled="soloVer || submitting || loadingCatalogos">
                  <option value="">Seleccione método</option>
                  <option v-for="metodo in metodosPago" :key="metodo.id" :value="metodo.id">
                    {{ metodo.nombre }}
                  </option>
                </select>
                <small class="field-hint" v-if="loadingCatalogos">Cargando métodos...</small>
                <small class="field-hint" v-else>Seleccione un método de pago</small>
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
                    :disabled="!currentUserPermissions.crearRegistros || soloVer || submitting"
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
                :disabled="!currentUserPermissions.crearRegistros || !formValido || soloVer || submitting"
              >
                {{ submitting ? 'Guardando...' : 'Agregar' }}
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
                :disabled="loadingRecords"
              >
                {{ period }}
              </button>
            </div>
          </div>

          <div class="records-table">
            <div v-if="loadingRecords" class="loading-indicator">
              Cargando registros...
            </div>
            <table v-else>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Nombre</th>
                  <th>Concepto</th>
                  <th>Método Pago</th>
                  <th>Dato Extra</th>
                  <th>Cantidad</th>
                  <th>Creado por</th>
                  <th>Comentarios</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(record, index) in recordsParaMostrar" :key="record.id">
                  <td class="id-column">{{ index + 1 }}</td>
                  <td>{{ formatFechaMexico(record.fecha) }}</td>
                  <td>{{ record.nombre }}</td>
                  <td>
                    <span class="concept-tag" :class="getConceptoKey(record.concepto)">
                      {{ record.concepto }}
                    </span>
                  </td>
                  <td>
                    <span class="payment-tag">{{ record.metodoPago }}</span>
                  </td>
                  <td>{{ record.folio || '-' }}</td>
                  <td :class="record.cantidad >= 0 ? 'positive' : 'negative'">
                    ${{ Math.abs(record.cantidad).toFixed(2) }}
                  </td>
                  <td>
                    <small>{{ record.creadoPor || 'Sistema' }}</small>
                  </td>
                  <td class="comments-cell">
                    <div v-if="record.editandoComentario" class="comment-edit">
                      <input 
                        type="text" 
                        v-model="record.comentarioTemp" 
                        class="comment-input"
                        placeholder="Escribir comentario..."
                        @keyup.enter="guardarComentarioEdit(record)"
                        @keyup.esc="cancelarComentarioEdit(record)"
                        :disabled="!puedeEditarComentarios || updatingComment"
                      >
                      <div v-if="puedeEditarComentarios" class="comment-actions">
                        <button @click="guardarComentarioEdit(record)" class="btn-comment-save" :disabled="updatingComment" title="Guardar">✓</button>
                        <button @click="cancelarComentarioEdit(record)" class="btn-comment-cancel" :disabled="updatingComment" title="Cancelar">✗</button>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/Layout/Header.vue'
import AppSidebar from '@/components/Layout/Sidebar.vue'
import { 
  getRecords, 
  createRecord, 
  updateRecordComment,
  getConceptos,
  getMetodosPago 
} from '@/api'

export default {
  name: 'TablesView',
  components: {
    AppHeader,
    AppSidebar
  },
  setup() {
    const router = useRouter()
    const sidebarOpen = ref(false)
    
    // Estados de carga
    const loading = ref(false)
    const loadingRecords = ref(false)
    const loadingCatalogos = ref(false)
    const submitting = ref(false)
    const updatingCaja = ref(false)
    const updatingComment = ref(false)
    
    // Widgets de caja
    const cajaInicial = ref(10000)
    const dineroInicial = ref(5000)
    const nuevaCajaInicial = ref('')
    const nuevoDineroInicial = ref('')
    
    // Datos del usuario actual
    const currentUser = ref(null)
    const currentUserPermissions = ref({})
    const currentUserId = ref(null)
    
    // Catálogos
    const conceptos = ref([])
    const metodosPago = ref([])
    
    // Mapeo para convertir nombre a ID
    const conceptoMap = ref({})
    const metodoPagoMap = ref({})

    const form = ref({
      fecha: getHoyMexico(),
      nombre: '',
      conceptoId: null,
      folio: '',
      metodoPagoId: null,
      cantidad: 0
    })

    const records = ref([])
    const filterPeriods = ['Día', 'Semana', 'Mes', 'Año', 'Todos']
    const activeFilter = ref('Todos')

    // Cargar datos al montar
    onMounted(async () => {
      await loadUserData()
      await loadCatalogos()
      await loadCajaData()
      await loadRecordsFromAPI()
    })

    // Cargar datos del usuario desde localStorage
    const loadUserData = () => {
      const userStr = localStorage.getItem('currentUser')
      if (userStr) {
        try {
          currentUser.value = JSON.parse(userStr)
          currentUserId.value = currentUser.value.id
          currentUserPermissions.value = currentUser.value.permissions || {}
        } catch (e) {
          console.error('Error parsing currentUser:', e)
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    }

    // Cargar catálogos desde API
    const loadCatalogos = async () => {
      loadingCatalogos.value = true
      try {
        const [conceptosData, metodosData] = await Promise.all([
          getConceptos(),
          getMetodosPago()
        ])
        
        conceptos.value = conceptosData
        metodosPago.value = metodosData
        
        // Crear mapas para convertir
        conceptosData.forEach(c => {
          conceptoMap.value[c.nombre.toLowerCase()] = c.id
        })
        
        metodosData.forEach(m => {
          metodoPagoMap.value[m.nombre.toLowerCase()] = m.id
        })
      } catch (error) {
        console.error('Error cargando catálogos:', error)
        alert('Error al cargar catálogos')
      } finally {
        loadingCatalogos.value = false
      }
    }

    // Cargar datos de caja desde API
    const loadCajaData = async () => {
      // TODO: Implementar cuando tengas el endpoint de caja
      // Por ahora mantener valores por defecto
    }

    // Cargar registros desde API
    const loadRecordsFromAPI = async () => {
      if (!currentUserId.value) return
      
      loadingRecords.value = true
      try {
        const periodo = activeFilter.value !== 'Todos' 
          ? activeFilter.value.toLowerCase() 
          : null
        
        const data = await getRecords(currentUserId.value, periodo)
        
        // Transformar datos al formato de la tabla
        records.value = data.map(r => ({
          id: r.id,
          fecha: r.fecha,
          nombre: r.nombre,
          concepto: r.concepto,
          folio: r.folio || '',
          metodoPago: r.metodoPago,
          cantidad: r.cantidad,
          comentario: r.comentario || '',
          creadoPor: r.creadoPor || 'Sistema',
          editandoComentario: false,
          comentarioTemp: r.comentario || ''
        }))
      } catch (error) {
        console.error('Error cargando registros:', error)
        alert('Error al cargar registros')
      } finally {
        loadingRecords.value = false
      }
    }

    // Guardar nuevo registro
    const handleSubmit = async () => {
      if (!currentUserPermissions.value.crearRegistros) {
        alert('❌ No tienes permiso para crear registros')
        return
      }

      // Validaciones
      if (!form.value.nombre.trim()) {
        alert('❌ El nombre es requerido')
        return
      }

      if (!form.value.conceptoId) {
        alert('❌ Debe seleccionar un concepto')
        return
      }

      if (!form.value.metodoPagoId) {
        alert('❌ Debe seleccionar un método de pago')
        return
      }

      if (form.value.cantidad === 0) {
        alert('❌ La cantidad no puede ser cero')
        return
      }

      submitting.value = true
      try {
        await createRecord({
          fecha: form.value.fecha,
          nombre: form.value.nombre,
          conceptoId: form.value.conceptoId,
          folio: form.value.folio?.toUpperCase() || '',
          metodoPagoId: form.value.metodoPagoId,
          cantidad: form.value.cantidad,
          usuarioId: currentUserId.value,
          comentario: ''
        })

        alert('✅ Registro agregado exitosamente')
        
        // Limpiar formulario
        form.value = {
          fecha: getHoyMexico(),
          nombre: '',
          conceptoId: null,
          folio: '',
          metodoPagoId: null,
          cantidad: 0
        }
        
        // Recargar registros
        await loadRecordsFromAPI()
        
      } catch (error) {
        alert('❌ ' + (error.mensaje || 'Error al guardar el registro'))
      } finally {
        submitting.value = false
      }
    }

    // Guardar comentario
    const guardarComentarioEdit = async (record) => {
      if (!currentUserPermissions.value.editarComentarios) {
        alert('❌ No tienes permiso para editar comentarios')
        return
      }
      
      updatingComment.value = true
      try {
        await updateRecordComment(record.id, currentUserId.value, record.comentarioTemp)
        
        record.comentario = record.comentarioTemp
        record.editandoComentario = false
        
        alert('✅ Comentario actualizado')
      } catch (error) {
        alert('❌ ' + (error.mensaje || 'Error al actualizar comentario'))
      } finally {
        updatingComment.value = false
      }
    }

    // Función para obtener la clave del concepto (para CSS)
    const getConceptoKey = (conceptoNombre) => {
      return conceptoNombre.toLowerCase().replace(/ /g, '_')
    }

    // Función para verificar si hoy es sábado
    const esSabado = computed(() => {
      const hoy = new Date()
      const offsetMexico = -6 * 60
      const utc = hoy.getTime() + (hoy.getTimezoneOffset() * 60000)
      const hoyMexico = new Date(utc + (offsetMexico * 60000))
      return hoyMexico.getDay() === 6
    })

    const getMaxFecha = () => undefined

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

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value
    }

    const actualizarCajaInicial = async () => {
      // TODO: Implementar cuando tengas el endpoint
      alert('Función en desarrollo')
    }

    const actualizarDineroInicial = async () => {
      // TODO: Implementar cuando tengas el endpoint
      alert('Función en desarrollo')
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
             form.value.conceptoId &&
             form.value.metodoPagoId &&
             form.value.cantidad !== 0
    })

    const soloVer = computed(() => {
      return currentUserPermissions.value.soloVer || false
    })

    const puedeEditarComentarios = computed(() => {
      return currentUserPermissions.value.editarComentarios || false
    })

    const puedeImprimir = computed(() => {
      return currentUserPermissions.value.imprimir || false
    })

    const setFilter = async (period) => {
      activeFilter.value = period
      await loadRecordsFromAPI()
    }

    const recordsParaMostrar = computed(() => {
      return records.value
    })

    const editarComentario = (record) => {
      if (!puedeEditarComentarios.value) {
        alert('❌ No tienes permiso para editar comentarios')
        return
      }
      record.comentarioTemp = record.comentario || ''
      record.editandoComentario = true
      nextTick(() => {
        const inputs = document.querySelectorAll('.comment-input')
        if (inputs.length > 0) {
          inputs[inputs.length - 1].focus()
        }
      })
    }

    const cancelarComentarioEdit = (record) => {
      record.editandoComentario = false
      record.comentarioTemp = record.comentario || ''
    }

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
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>Comprobante de Registro</h1>
          <div class="registro">
            <div class="campo"><span class="label">ID:</span><span class="valor">${index + 1}</span></div>
            <div class="campo"><span class="label">Fecha:</span><span class="valor">${formatFechaMexico(record.fecha)}</span></div>
            <div class="campo"><span class="label">Nombre:</span><span class="valor">${record.nombre}</span></div>
            <div class="campo"><span class="label">Concepto:</span><span class="valor">${record.concepto}</span></div>
            <div class="campo"><span class="label">Dato Extra:</span><span class="valor">${record.folio || '-'}</span></div>
            <div class="campo"><span class="label">Método de Pago:</span><span class="valor">${record.metodoPago}</span></div>
            <div class="campo"><span class="label">Cantidad:</span><span class="valor ${record.cantidad >= 0 ? 'positivo' : 'negativo'}">$${Math.abs(record.cantidad).toFixed(2)} ${record.cantidad >= 0 ? '(Ingreso)' : '(Egreso)'}</span></div>
            <div class="campo"><span class="label">Creado por:</span><span class="valor">${record.creadoPor || 'Sistema'}</span></div>
            <div class="campo"><span class="label">Comentarios:</span><span class="valor">${record.comentario || '-'}</span></div>
          </div>
          <div style="margin-top:20px; text-align:center;"><button onclick="window.print()">Imprimir</button></div>
        </body>
        </html>
      `
      ventanaImpresion.document.write(contenido)
      ventanaImpresion.document.close()
    }

    const formatCurrency = (amount) => {
      return Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    return {
      sidebarOpen,
      loading,
      loadingRecords,
      loadingCatalogos,
      submitting,
      updatingCaja,
      updatingComment,
      cajaInicial,
      dineroInicial,
      nuevaCajaInicial,
      nuevoDineroInicial,
      dineroFinal,
      totalIngresos,
      totalEgresos,
      currentUserPermissions,
      conceptos,
      metodosPago,
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
      toggleSidebar,
      actualizarCajaInicial,
      actualizarDineroInicial,
      handleSubmit,
      setFilter,
      formatFechaMexico,
      formatCurrency,
      getConceptoKey,
      validarNombre,
      validarFolio,
      imprimirRegistro,
      editarComentario,
      guardarComentarioEdit,
      cancelarComentarioEdit,
      getHoyMexico,
      getMaxFecha
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