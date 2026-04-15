<template>
  <div class="tables-page">
    <AppHeader @toggle-sidebar="toggleSidebar" />
    <AppSidebar :isOpen="sidebarOpen" />

    <main :class="['main-content', { 'sidebar-open': sidebarOpen }]">
      <div class="page-header">
        <h1>Registros</h1>
        <p>Gestión de ingresos y egresos</p>
        
        <!-- Mensaje de modo solo lectura -->
        <div v-if="soloVer" class="readonly-notice">
          🔍 Modo Solo Lectura - No puedes crear, editar ni eliminar registros
        </div>
      </div>

<!-- WIDGETS DE CAJA - Solo visible si tiene permisos -->
<div v-if="mostrarWidgetsCaja" class="caja-widgets">

  <!-- Mostrar loading mientras carga -->
  <div v-if="!cajaDataLoaded" class="widget loading-widget">
    <div class="widget-icon">⏳</div>
    <div class="widget-content">
      <h3>Cargando datos...</h3>
      <p>Conectando con el servidor</p>
    </div>
  </div>

  <!-- Mostrar error si no hay conexión -->
  <div v-else-if="cajaInicial === null" class="widget error-widget">
    <div class="widget-icon">⚠️</div>
    <div class="widget-content">
      <h3>Error de Conexión</h3>
      <p>No se pudo conectar con la base de datos</p>
      <button @click="loadCajaData" class="btn-reintentar">Reintentar</button>
    </div>
  </div>

  <!-- Widgets normales (cuando hay datos) -->
  <template v-else>
    <!-- Widget Caja Inicial -->
    <div class="widget">
      <div class="widget-icon" style="background: #1f998f20;">
        <span>💰</span>
      </div>
      <div class="widget-content">
        <h3>Caja Inicial</h3>
        <p class="widget-value">${{ formatCurrency(cajaInicial) }}</p>
        
        <div v-if="puedeModificarCajaInicial">
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
        </div>
        <div v-else class="widget-view-only">
          <div class="view-only-value">${{ formatCurrency(cajaInicial) }}</div>
          <small class="permission-info">👁️ Solo visualización</small>
        </div>
      </div>
    </div>

    <!-- Widget Dinero Inicial -->
    <div class="widget">
      <div class="widget-icon" style="background: #21a39820;">
        <span>💵</span>
      </div>
      <div class="widget-content">
        <h3>Dinero Inicial</h3>
        <p class="widget-value">${{ formatCurrency(dineroInicial) }}</p>
        
        <div v-if="puedeModificarDineroInicial">
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

    <!-- Widget Dinero Final -->
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
          <small v-if="dineroFinal < 0" class="warning">⚠️ Caja en números rojos</small>
          <small v-if="dineroFinal > cajaInicial" class="warning">⚠️ Excede caja inicial</small>
        </div>
      </div>
    </div>
  </template>
</div>

      <div class="content-grid">
        <!-- FORMULARIO - Solo visible si puede crear registros Y NO está en solo ver -->
        <div v-if="puedeCrearRegistros && !soloVer" class="form-container">
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
                  :disabled="submitting"
                >
                <small class="field-hint">Solo letras y espacios</small>
              </div>

              <div class="form-group">
                <label>Concepto:</label>
                <select v-model="form.concepto" required :disabled="submitting">
                  <option value="">Seleccione concepto</option>
                  <option v-for="concepto in conceptos" :key="concepto.id" :value="concepto.nombre">
                    {{ concepto.nombre }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Dato Extra:</label>
                <input 
                  type="text" 
                  v-model="form.folio" 
                  placeholder="Folio (opcional)"
                  @input="validarFolio"
                  pattern="[A-Za-z0-9]*"
                  title="Solo letras y números, sin espacios"
                  :disabled="submitting"
                >
                <small class="field-hint">Opcional - Solo letras y números</small>
              </div>

              <div class="form-group">
                <label>Método de Pago:</label>
                <select v-model="form.metodoPago" required :disabled="submitting">
                  <option value="">Seleccione método</option>
                  <option v-for="metodo in metodosPago" :key="metodo.id" :value="metodo.nombre">
                    {{ metodo.nombre }}
                  </option>
                </select>
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
                    :disabled="submitting"
                  >
                  <span class="amount-hint">
                    {{ form.cantidad >= 0 ? '(Ingreso)' : '(Egreso)' }}
                  </span>
                </div>
                <small>Positivo = Ingreso, Negativo = Egreso</small>
              </div>
            </div>

            <div class="form-actions">
              <button 
                type="submit" 
                class="btn-primary"
                :disabled="!formValido || submitting"
              >
                {{ submitting ? 'Guardando...' : 'Agregar Registro' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Mensaje si no tiene permiso para crear registros -->
        <div v-else-if="!puedeCrearRegistros && !soloVer" class="no-permission-message">
          <span>🔒</span>
          <p>No tienes permiso para crear registros</p>
        </div>

        <!-- TABLA DE REGISTROS -->
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
            
            <!-- Botón de exportar - Eliminado visualmente -->
            <!-- <button 
              v-if="puedeExportar"
              @click="exportToExcel" 
              class="btn-export"
              :disabled="!records.length || loadingRecords"
            >
              📥 Exportar Excel
            </button> -->
          </div>

          <div class="records-table">
            <div v-if="loadingRecords" class="loading-indicator">
              Cargando registros...
            </div>
            <table v-else>
              <thead>
                <tr>
                  <th>#</th>
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
                <tr v-for="(record, idx) in recordsParaMostrar" :key="record.id">
                  <td class="id-column">{{ idx + 1 }}</td>
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
                  <td><small>{{ record.creadoPor || 'Sistema' }}</small></td>
                  
                  <!-- Comentarios con edición - Solo si tiene permiso -->
                  <td class="comments-cell">
                    <div v-if="record.editandoComentario" class="comment-edit">
                      <input 
                        type="text" 
                        v-model="record.comentarioTemp" 
                        class="comment-input"
                        placeholder="Escribir comentario..."
                        @keyup.enter="guardarComentarioEdit(record)"
                        @keyup.esc="cancelarComentarioEdit(record)"
                        :disabled="updatingComment"
                      >
                      <div class="comment-actions">
                        <button @click="guardarComentarioEdit(record)" class="btn-comment-save" :disabled="updatingComment">✓</button>
                        <button @click="cancelarComentarioEdit(record)" class="btn-comment-cancel" :disabled="updatingComment">✗</button>
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
                  
                  <!-- Botón imprimir - Solo si tiene permiso -->
                  <td class="print-cell">
                    <button 
                      v-if="puedeImprimir"
                      @click="imprimirRegistro(record, idx + 1)" 
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

          <!-- Paginación -->
          <div v-if="filteredRecords.length > 0" class="pagination">
            <button 
              @click="prevPage" 
              :disabled="currentPage === 1 || loadingRecords"
              class="page-btn"
            >
              ← Anterior
            </button>
            <span class="page-info">
              Página {{ currentPage }} de {{ totalPages }}
              <span class="record-count">({{ filteredRecords.length }} registros)</span>
            </span>
            <button 
              @click="nextPage" 
              :disabled="currentPage === totalPages || loadingRecords"
              class="page-btn"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/Layout/Header.vue'
import AppSidebar from '@/components/Layout/Sidebar.vue'
import { 
  getRecords, 
  createRecord, 
  updateRecordComment,
  getConceptos,
  getMetodosPago,
  getCajaData,
  updateCajaInicial,
  updateDineroInicial 
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
    
    // Datos del usuario actual
    const currentUserId = ref(null)
    const currentUserName = ref('')
    
    // PERMISOS - Cargados desde localStorage
    const currentUserPermissions = ref({
      crearRegistros: false,
      soloVer: false,
      editarComentarios: false,
      imprimir: false,
      modificarCajaInicial: false,
      modificarDineroInicial: false,
      exportarDatos: false
    })
    
    // Computed para permisos
    const puedeCrearRegistros = computed(() => currentUserPermissions.value.crearRegistros === true)
    const soloVer = computed(() => currentUserPermissions.value.soloVer === true)
    const puedeEditarComentarios = computed(() => currentUserPermissions.value.editarComentarios === true)
    const puedeImprimir = computed(() => currentUserPermissions.value.imprimir === true)
    const puedeModificarCajaInicial = computed(() => currentUserPermissions.value.modificarCajaInicial === true)
    const puedeModificarDineroInicial = computed(() => currentUserPermissions.value.modificarDineroInicial === true)
    const puedeExportar = computed(() => currentUserPermissions.value.exportarDatos === true)
    
    // Mostrar widgets de caja
    const mostrarWidgetsCaja = computed(() => true)
    
    // Datos de caja
    const cajaInicial = ref(null)
    const dineroInicial = ref(null)
    const cajaDataLoaded = ref(false)
    const nuevaCajaInicial = ref('')
    const nuevoDineroInicial = ref('')
    
    // Catálogos
    const conceptos = ref([])
    const metodosPago = ref([])
    
    // Formulario
    const form = ref({
      fecha: '',
      nombre: '',
      concepto: '',
      folio: '',
      metodoPago: '',
      cantidad: 0
    })
    
    // Registros - Ordenados por fecha ascendente (los más antiguos primero)
    const records = ref([])
    const filterPeriods = ['Día', 'Semana', 'Mes', 'Año', 'Todos']
    const activeFilter = ref('Todos')
    
    // Paginación
    const currentPage = ref(1)
    const pageSize = 10
    
    // Filtros avanzados
    const advancedFilters = ref({
      concepto: '',
      metodoPago: '',
      minAmount: null,
      maxAmount: null
    })
    
    // ========== FUNCIONES DE PERMISOS ==========
    const loadUserPermissions = () => {
      const userStr = localStorage.getItem('currentUser')
      console.log('🔵 Cargando permisos desde localStorage:', userStr)
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          currentUserId.value = user.id
          currentUserName.value = user.username || 'Usuario'
          
          currentUserPermissions.value = {
            crearRegistros: user.permissions?.crearRegistros ?? false,
            soloVer: user.permissions?.soloVer ?? false,
            editarComentarios: user.permissions?.editarComentarios ?? false,
            imprimir: user.permissions?.imprimir ?? false,
            modificarCajaInicial: user.permissions?.modificarCajaInicial ?? false,
            modificarDineroInicial: user.permissions?.modificarDineroInicial ?? false,
            exportarDatos: user.permissions?.exportarDatos ?? false
          }
          
          console.log('✅ Permisos cargados:', currentUserPermissions.value)
        } catch (e) {
          console.error('❌ Error parsing currentUser:', e)
          router.push('/login')
        }
      } else {
        console.error('❌ No hay currentUser en localStorage')
        router.push('/login')
      }
    }
    
    // ========== FUNCIONES DE CAJA ==========
    const loadCajaData = async () => {
      try {
        console.log('🔄 Cargando datos de caja desde API...')
        const data = await getCajaData()
        
        console.log('📦 Datos CRUDOS del backend:', data)
        
        if (data) {
          cajaInicial.value = data.cajaInicial || 0
          dineroInicial.value = data.dineroInicial || 0
          
          dineroFinal.value = data.dineroFinal || 0
          
          cajaDataLoaded.value = true
          
          console.log('✅ Caja cargada:', {
            cajaInicial: cajaInicial.value,
            dineroInicial: dineroInicial.value,
            dineroFinal: dineroFinal.value
          })
        } else {
          console.error('❌ No se recibieron datos')
          mostrarErrorConexion()
        }
      } catch (error) {
        console.error('❌ Error cargando caja:', error)
        mostrarErrorConexion()
        cajaDataLoaded.value = false
      }
    }
    
    const dineroFinalBackend = ref(0)
    
    const mostrarErrorConexion = () => {
      cajaInicial.value = null
      dineroInicial.value = null
      console.warn('⚠️ No se pudo conectar con la API. Verifica que el backend esté corriendo.')
    }
    
    const actualizarCajaInicial = async () => {
      if (!puedeModificarCajaInicial.value) {
        alert('❌ No tienes permiso para modificar la caja inicial')
        return
      }
      
      if (!nuevaCajaInicial.value || nuevaCajaInicial.value <= 0) {
        alert('❌ Ingrese un valor válido')
        return
      }
      
      updatingCaja.value = true
      try {
        await updateCajaInicial(Number(nuevaCajaInicial.value))
        await loadCajaData()
        nuevaCajaInicial.value = ''
        alert('✅ Caja inicial actualizada')
      } catch (error) {
        alert('❌ ' + (error.mensaje || 'Error al actualizar'))
      } finally {
        updatingCaja.value = false
      }
      
    }
    
    const actualizarDineroInicial = async () => {
      if (!puedeModificarDineroInicial.value) {
        alert('❌ No tienes permiso para modificar el dinero inicial')
        return
      }
      
      if (!nuevoDineroInicial.value || nuevoDineroInicial.value <= 0) {
        alert('❌ Ingrese un valor válido')
        return
      }
      
      if (nuevoDineroInicial.value > cajaInicial.value) {
        alert(`❌ No puede exceder la caja inicial ($${formatCurrency(cajaInicial.value)})`)
        return
      }
      
      updatingCaja.value = true
      try {
        await updateDineroInicial(Number(nuevoDineroInicial.value))
        await loadCajaData()
        nuevoDineroInicial.value = ''
        alert('✅ Dinero inicial actualizado')
      } catch (error) {
        alert('❌ ' + (error.mensaje || 'Error al actualizar'))
      } finally {
        updatingCaja.value = false
      }
    }
    
    // ========== FUNCIONES DE FECHA ==========
    const getHoyMexico = () => {
      const now = new Date()
      const año = now.getFullYear()
      const mes = String(now.getMonth() + 1).padStart(2, '0')
      const dia = String(now.getDate()).padStart(2, '0')
      return `${año}-${mes}-${dia}`
    }
    
    const getMaxFecha = () => getHoyMexico()
    
    const formatFechaMexico = (dateString) => {
      if (!dateString) return ''
      
      try {
        let fechaStr = dateString
        
        if (fechaStr.includes('T')) {
          fechaStr = fechaStr.split('T')[0]
        }
        
        if (fechaStr.includes('-')) {
          const partes = fechaStr.split('-')
          if (partes.length >= 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`
          }
        }
        
        const fecha = new Date(dateString)
        if (!isNaN(fecha.getTime())) {
          const dia = String(fecha.getDate()).padStart(2, '0')
          const mes = String(fecha.getMonth() + 1).padStart(2, '0')
          const año = fecha.getFullYear()
          return `${dia}/${mes}/${año}`
        }
        
        return dateString
      } catch {
        return dateString
      }
    }
    
    // ========== CARGA DE DATOS ==========
    const loadCatalogos = async () => {
      loadingCatalogos.value = true
      try {
        const [conceptosData, metodosData] = await Promise.all([
          getConceptos(),
          getMetodosPago()
        ])
        conceptos.value = conceptosData || []
        metodosPago.value = metodosData || []
      } catch (error) {
        console.error('Error cargando catálogos:', error)
      } finally {
        loadingCatalogos.value = false
      }
    }
    
    const loadRecordsFromAPI = async () => {
      if (!currentUserId.value) return
      
      loadingRecords.value = true
      try {
        let data = await getRecords(currentUserId.value, activeFilter.value === 'Todos' ? null : activeFilter.value.toLowerCase())
        
        // Ordenar registros por fecha ASCENDENTE (los más antiguos primero)
        // para que los nuevos se agreguen al final
        const recordsData = (data || []).map(r => ({
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
        
        // Ordenar por fecha (ascendente - más antiguos primero)
        records.value = recordsData.sort((a, b) => {
          return new Date(a.fecha) - new Date(b.fecha)
        })
        
      } catch (error) {
        console.error('Error cargando registros:', error)
      } finally {
        loadingRecords.value = false
      }
    }
    
    // ========== FILTRADO ==========
    const filteredRecords = computed(() => {
      let filtered = [...records.value]
      
      if (advancedFilters.value.concepto) {
        filtered = filtered.filter(r => r.concepto === advancedFilters.value.concepto)
      }
      if (advancedFilters.value.metodoPago) {
        filtered = filtered.filter(r => r.metodoPago === advancedFilters.value.metodoPago)
      }
      if (advancedFilters.value.minAmount) {
        filtered = filtered.filter(r => Math.abs(r.cantidad) >= advancedFilters.value.minAmount)
      }
      if (advancedFilters.value.maxAmount) {
        filtered = filtered.filter(r => Math.abs(r.cantidad) <= advancedFilters.value.maxAmount)
      }
      
      // Mantener el orden ascendente por fecha
      return filtered.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    })
    
    const totalPages = computed(() => Math.ceil(filteredRecords.value.length / pageSize))
    
    const recordsParaMostrar = computed(() => {
      const start = (currentPage.value - 1) * pageSize
      const end = start + pageSize
      return filteredRecords.value.slice(start, end)
    })
    
    const dineroFinal = ref(0)
    
    const formValido = computed(() => {
      return form.value.nombre.trim() !== '' &&
             form.value.concepto &&
             form.value.metodoPago &&
             form.value.cantidad !== 0
    })
    
    // ========== ACCIONES PRINCIPALES ==========
    const handleSubmit = async () => {
      console.log('=== ENVIANDO REGISTRO ===')
      
      const conceptoSeleccionado = conceptos.value.find(c => c.nombre === form.value.concepto)
      const metodoSeleccionado = metodosPago.value.find(m => m.nombre === form.value.metodoPago)

      if (!conceptoSeleccionado || !metodoSeleccionado) {
        alert('❌ Concepto o método de pago no válido')
        return
      }

      const recordData = {
        fecha: form.value.fecha,
        nombre: form.value.nombre,
        conceptoId: conceptoSeleccionado.id,
        folio: form.value.folio || '',
        metodoPagoId: metodoSeleccionado.id,
        cantidad: Number(form.value.cantidad),
        usuarioId: currentUserId.value,
        comentario: ''
      }
      
      submitting.value = true
      try {
        await createRecord(recordData)
        
        alert('✅ Registro agregado exitosamente')

        form.value = {
          fecha: getHoyMexico(),
          nombre: '',
          concepto: '',
          folio: '',
          metodoPago: '',
          cantidad: 0
        }

        await Promise.all([
          loadRecordsFromAPI(),
          loadCajaData()
        ])

      } catch (error) {
        console.error('Error:', error)
        alert('❌ ' + (error?.mensaje || error?.message || 'Error al guardar el registro'))
      } finally {
        submitting.value = false
      }
    }
    
    const guardarComentarioEdit = async (record) => {
      if (!puedeEditarComentarios.value) {
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
    
    const editarComentario = (record) => {
      if (!puedeEditarComentarios.value) {
        alert('❌ No tienes permiso para editar comentarios')
        return
      }
      record.comentarioTemp = record.comentario || ''
      record.editandoComentario = true
    }
    
    const cancelarComentarioEdit = (record) => {
      record.editandoComentario = false
      record.comentarioTemp = record.comentario || ''
    }
    
    const imprimirRegistro = (record, numeroRegistro) => {
      if (!puedeImprimir.value) {
        alert('❌ No tienes permiso para imprimir')
        return
      }
      
      const ventanaImpresion = window.open('', '_blank')
      const contenido = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Registro #${numeroRegistro}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1f998f; }
            .registro { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
            .campo { margin-bottom: 10px; }
            .label { font-weight: bold; color: #666; }
            .valor { margin-left: 10px; }
            .positivo { color: #27ae60; }
            .negativo { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>Comprobante de Registro</h1>
          <div class="registro">
            <div class="campo"><span class="label">#:</span><span class="valor">${numeroRegistro}</span></div>
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
    
    const exportToExcel = () => {
      if (!puedeExportar.value) {
        alert('❌ No tienes permiso para exportar datos')
        return
      }
      
      if (filteredRecords.value.length === 0) {
        alert('No hay datos para exportar')
        return
      }
      
      const data = filteredRecords.value.map((record, idx) => ({
        '#': idx + 1,
        Fecha: formatFechaMexico(record.fecha),
        Nombre: record.nombre,
        Concepto: record.concepto,
        'Método Pago': record.metodoPago,
        Folio: record.folio || 'N/A',
        Cantidad: record.cantidad,
        Tipo: record.cantidad >= 0 ? 'Ingreso' : 'Egreso'
      }))
      
      const headers = Object.keys(data[0])
      const csv = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `redyon_${activeFilter.value}_${getHoyMexico()}.csv`)
      link.click()
      URL.revokeObjectURL(url)
      
      alert(`✅ Exportados ${data.length} registros`)
    }
    
    // ========== UTILIDADES ==========
    const validarNombre = (event) => {
      const input = event.target
      const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/
      if (!regex.test(input.value)) {
        input.value = input.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '')
        form.value.nombre = input.value
      }
    }
    
    const validarFolio = (event) => {
      const input = event.target
      const regex = /^[A-Za-z0-9]*$/
      if (input.value && !regex.test(input.value)) {
        input.value = input.value.replace(/[^A-Za-z0-9]/g, '')
        form.value.folio = input.value
      }
      if (input.value) {
        input.value = input.value.toUpperCase()
        form.value.folio = input.value
      }
    }
    
    const getConceptoKey = (concepto) => {
      if (!concepto) return 'otros'
      return concepto.toLowerCase().replace(/ /g, '_')
    }
    
    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined) return '0.00'
      return Math.abs(Number(amount)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    
    const setFilter = async (period) => {
      activeFilter.value = period
      currentPage.value = 1
      await loadRecordsFromAPI()
    }
    
    const prevPage = () => {
      if (currentPage.value > 1) currentPage.value--
    }
    
    const nextPage = () => {
      if (currentPage.value < totalPages.value) currentPage.value++
    }
    
    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value
    }
    
    // ========== LIFECYCLE ==========
    onMounted(async () => {
      console.log('🚀 Iniciando carga de datos...')
      
      loadUserPermissions()
      form.value.fecha = getHoyMexico()
      
      await loadCatalogos()
      
      try {
        await loadCajaData()
        
        if (currentUserId.value && cajaDataLoaded.value) {
          await loadRecordsFromAPI()
        } else {
          console.warn('⚠️ No se cargaron registros porque la caja falló')
        }
      } catch (error) {
        console.error('❌ Error crítico al iniciar:', error)
      }
    })
    
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
      cajaDataLoaded,
      nuevaCajaInicial,
      nuevoDineroInicial,
      dineroFinal,
      conceptos,
      metodosPago,
      form,
      records,
      filterPeriods,
      activeFilter,
      currentPage,
      recordsParaMostrar,
      filteredRecords,
      totalPages,
      formValido,
      puedeCrearRegistros,
      soloVer,
      puedeEditarComentarios,
      puedeImprimir,
      puedeModificarCajaInicial,
      puedeModificarDineroInicial,
      puedeExportar,
      mostrarWidgetsCaja,
      toggleSidebar,
      handleSubmit,
      guardarComentarioEdit,
      editarComentario,
      cancelarComentarioEdit,
      imprimirRegistro,
      exportToExcel,
      actualizarCajaInicial,
      actualizarDineroInicial,
      setFilter,
      prevPage,
      nextPage,
      formatFechaMexico,
      formatCurrency,
      getConceptoKey,
      validarNombre,
      validarFolio,
      getMaxFecha,
      loadCajaData
    }
  }
}
</script>

<style scoped>
/* Mantén todos tus estilos existentes aquí */

.readonly-notice {
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

.no-permission-message {
  background: #e74c3c20;
  border: 1px solid #e74c3c;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  color: #c0392b;
}

.no-permission-message span {
  font-size: 48px;
  display: block;
  margin-bottom: 10px;
}

.btn-export {
  padding: 8px 16px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-export:hover:not(:disabled) {
  background: #219653;
  transform: translateY(-2px);
}

.btn-export:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
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
.loading-widget, .error-widget {
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
}

.loading-widget .widget-icon {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.error-widget {
  border-color: #e74c3c;
  background: #e74c3c10;
}

.error-widget .widget-icon {
  color: #e74c3c;
}

.btn-reintentar {
  margin-top: 8px;
  padding: 6px 12px;
  background: #1f998f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-reintentar:hover {
  background: #21a398;
}

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

.form-group input:disabled,
.form-group select:disabled {
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
}

.btn-primary {
  padding: 14px 28px;
  background: linear-gradient(135deg, #1f998f 0%, #21a398 100%);
  color: white;
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(31, 153, 143, 0.3);
}

.btn-primary:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
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

.no-permission {
  opacity: 0.3;
  font-size: 16px;
  display: inline-block;
  padding: 6px 10px;
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

.loading-indicator {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.page-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #1f998f;
  color: white;
  border-color: #1f998f;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.record-count {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
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
  
  .btn-primary {
    width: 100%;
    justify-content: center;
  }

  .preview-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .filter-options {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>