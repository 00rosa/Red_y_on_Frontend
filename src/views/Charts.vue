<template>
  <div class="charts-page">
    <AppHeader @toggle-sidebar="toggleSidebar" />
    <AppSidebar :isOpen="sidebarOpen" />
    
    <main :class="['main-content', { 'sidebar-open': sidebarOpen }]">
      <div class="page-header">
        <h1>Gráficas de REDYON</h1>
        <p>Visualización de datos por periodo</p>
        <div v-if="loading" class="loading-notice">
          ⏳ Cargando datos...
        </div>
      </div>

      <!-- Filtros y controles -->
      <div class="charts-controls">
        <div class="filter-section">
          <div class="period-filters">
            <button 
              v-for="period in periods" 
              :key="period.value"
              :class="['period-btn', { active: activePeriod === period.value }]"
              @click="setPeriod(period.value)"
              :disabled="loading"
            >
              {{ period.label }}
            </button>
          </div>
          
          <div class="date-range" v-if="activePeriod === 'custom'">
            <div class="date-input">
              <label>Desde:</label>
              <input type="date" v-model="dateRange.from" :disabled="loading">
            </div>
            <div class="date-input">
              <label>Hasta:</label>
              <input type="date" v-model="dateRange.to" :disabled="loading">
            </div>
            <button @click="applyCustomRange" class="btn-apply" :disabled="loading">
              Aplicar
            </button>
          </div>
        </div>

        <div class="stats-summary">
          <div class="stat-card">
            <div class="stat-icon" style="background: #1f998f20;">
              <span>💰</span>
            </div>
            <div class="stat-content">
              <h4>Total Periodo</h4>
              <p class="stat-value" :class="chartData?.totalPeriod >= 0 ? 'positive' : 'negative'">
                ${{ formatCurrency(chartData?.totalPeriod || 0) }}
              </p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon" style="background: #27ae6020;">
              <span>📈</span>
            </div>
            <div class="stat-content">
              <h4>Ingresos</h4>
              <p class="stat-value positive">${{ formatCurrency(chartData?.totalIncome || 0) }}</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon" style="background: #e74c3c20;">
              <span>📉</span>
            </div>
            <div class="stat-content">
              <h4>Egresos</h4>
              <p class="stat-value negative">${{ formatCurrency(chartData?.totalExpense || 0) }}</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon" style="background: #3498db20;">
              <span>📊</span>
            </div>
            <div class="stat-content">
              <h4>Registros</h4>
              <p class="stat-value">{{ chartData?.recordCount || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid de gráficas -->
      <div class="charts-grid">
        <!-- Gráfica 1: Ingresos vs Egresos -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>📊 Ingresos vs Egresos</h3>
            <span class="chart-subtitle">Comparativa del periodo</span>
          </div>
          <div class="chart-wrapper">
            <canvas ref="incomeExpenseChart"></canvas>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color" style="background: #27ae60;"></span>
              <span>Ingresos: ${{ formatCurrency(chartData?.totalIncome || 0) }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #e74c3c;"></span>
              <span>Egresos: ${{ formatCurrency(chartData?.totalExpense || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- Gráfica 2: Evolución diaria -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>📈 Evolución Diaria</h3>
            <span class="chart-subtitle">Flujo de caja por día</span>
          </div>
          <div class="chart-wrapper">
            <canvas ref="dailyChart"></canvas>
          </div>
          <div class="chart-info">
            <small>Saldo acumulado por día</small>
          </div>
        </div>

        <!-- Gráfica 3: Distribución por concepto -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>🥧 Distribución por Concepto</h3>
            <span class="chart-subtitle">Desglose de ingresos/egresos</span>
          </div>
          <div class="chart-wrapper">
            <canvas ref="conceptChart"></canvas>
          </div>
          <div class="chart-legend compact">
            <div v-for="item in conceptData" :key="item.label" class="legend-item">
              <span class="legend-color" :style="{ background: item.color }"></span>
              <span>{{ item.label }}: {{ item.percentage }}%</span>
            </div>
          </div>
        </div>

        <!-- Gráfica 4: Métodos de pago -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>💳 Métodos de Pago</h3>
            <span class="chart-subtitle">Distribución por forma de pago</span>
          </div>
          <div class="chart-wrapper">
            <canvas ref="paymentChart"></canvas>
          </div>
          <div class="chart-info">
            <small>Frecuencia de uso de cada método</small>
          </div>
        </div>
      </div>

      <!-- Tabla de datos -->
      <div class="data-table-container">
        <div class="table-header">
          <h3>📋 Detalle de Registros</h3>
          <div class="table-actions">
            <button 
              @click="exportToExcel" 
              class="btn-export"
              :disabled="!canExport || loading || !records.length"
            >
              📥 Exportar Excel
              <span v-if="!canExport" class="permission-hint">(Sin permiso)</span>
            </button>
            <button @click="toggleFilters" class="btn-filter" :disabled="loading">
              🔍 {{ showFilters ? 'Ocultar' : 'Mostrar' }} Filtros
            </button>
          </div>
        </div>

        <div v-if="showFilters" class="advanced-filters">
          <div class="filter-row">
            <div class="filter-group">
              <label>Concepto:</label>
              <select v-model="advancedFilters.concepto" :disabled="loading">
                <option value="">Todos</option>
                <option v-for="concepto in conceptosUnicos" :key="concepto" :value="concepto">
                  {{ concepto }}
                </option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Método Pago:</label>
              <select v-model="advancedFilters.metodoPago" :disabled="loading">
                <option value="">Todos</option>
                <option v-for="metodo in metodosUnicos" :key="metodo" :value="metodo">
                  {{ metodo }}
                </option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Monto mínimo:</label>
              <input type="number" v-model.number="advancedFilters.minAmount" placeholder="0" :disabled="loading">
            </div>
            
            <div class="filter-group">
              <label>Monto máximo:</label>
              <input type="number" v-model.number="advancedFilters.maxAmount" placeholder="999999" :disabled="loading">
            </div>
          </div>
          
          <div class="filter-actions">
            <button @click="applyAdvancedFilters" class="btn-apply" :disabled="loading">
              🔍 Aplicar Filtros
            </button>
            <button @click="clearFilters" class="btn-clear" :disabled="loading">
              🗑️ Limpiar
            </button>
          </div>
        </div>

        <div class="table-wrapper">
          <div v-if="loadingRecords" class="loading-indicator">
            Cargando registros...
          </div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Concepto</th>
                <th>Método Pago</th>
                <th>Folio</th>
                <th>Cantidad</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in paginatedRecords" :key="record.id">
                <td>{{ formatDateMexico(record.fecha) }}</td>
                <td>{{ record.nombre }}</td>
                <td>
                  <span class="concept-tag" :class="getConceptoKey(record.concepto)">
                    {{ record.concepto }}
                  </span>
                </td>
                <td>
                  <span class="payment-tag">{{ record.metodoPago }}</span>
                </td>
                <td>{{ record.folio || 'N/A' }}</td>
                <td :class="record.cantidad >= 0 ? 'positive' : 'negative'">
                  ${{ Math.abs(record.cantidad).toFixed(2) }}
                </td>
                <td>
                  <span :class="record.cantidad >= 0 ? 'type-positive' : 'type-negative'">
                    {{ record.cantidad >= 0 ? 'Ingreso' : 'Egreso' }}
                  </span>
                </td>
              </tr>
              <tr v-if="filteredRecords.length === 0">
                <td colspan="7" class="no-data">
                  No hay registros para el periodo seleccionado
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div v-if="filteredRecords.length > 0" class="pagination">
          <button 
            @click="prevPage" 
            :disabled="currentPage === 1 || loading"
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
            :disabled="currentPage === totalPages || loading"
            class="page-btn"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import AppHeader from '@/components/Layout/Header.vue'
import AppSidebar from '@/components/Layout/Sidebar.vue'
import { getDashboardData, getRecords } from '@/api' // IMPORTAR funciones de API

export default {
  name: 'ChartsView',
  components: {
    AppHeader,
    AppSidebar
  },
  setup() {
    const sidebarOpen = ref(false)
    
    // Estados de carga
    const loading = ref(false)
    const loadingRecords = ref(false)
    
    // Datos del usuario
    const currentUserId = ref(null)
    const canExport = ref(false)
    
    // Datos de gráficas
    const chartData = ref(null)
    
    // Registros para la tabla
    const records = ref([])
    
    // Referencias para los gráficos
    const incomeExpenseChart = ref(null)
    const dailyChart = ref(null)
    const conceptChart = ref(null)
    const paymentChart = ref(null)
    
    // Instancias de Chart.js
    let incomeExpenseChartInstance = null
    let dailyChartInstance = null
    let conceptChartInstance = null
    let paymentChartInstance = null

    // Periodos disponibles
    const periods = [
      { label: 'Hoy', value: 'today' },
      { label: 'Ayer', value: 'yesterday' },
      { label: 'Semana', value: 'week' },
      { label: 'Mes', value: 'month' },
      { label: 'Año', value: 'year' },
      { label: 'Personalizado', value: 'custom' },
      { label: 'Todos', value: 'all' }
    ]
    
    const activePeriod = ref('week')
    const dateRange = ref({
      from: '',
      to: ''
    })

    // Filtros avanzados
    const showFilters = ref(false)
    const advancedFilters = ref({
      concepto: '',
      metodoPago: '',
      minAmount: null,
      maxAmount: null
    })

    // Paginación
    const currentPage = ref(1)
    const pageSize = 10

    // ========== FUNCIONES PARA HORARIO MÉXICO (UTC-6) ==========
    
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

    // ========== CARGA DE DATOS ==========
    
    // Cargar datos del usuario
    const loadUserData = () => {
      const userStr = localStorage.getItem('currentUser')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          currentUserId.value = user.id
          canExport.value = user.permissions?.exportarDatos || false
        } catch (e) {
          console.error('Error parsing currentUser:', e)
        }
      }
    }

    // Cargar datos de gráficas desde API
    const loadChartData = async () => {
      if (!currentUserId.value) return
      
      loading.value = true
      try {
        const data = await getDashboardData(currentUserId.value, activePeriod.value)
        chartData.value = data
        
        // También cargar registros para la tabla
        await loadRecords()
        
        // Actualizar gráficos
        nextTick(() => {
          initCharts()
        })
      } catch (error) {
        console.error('Error cargando datos de gráficas:', error)
        alert('Error al cargar datos de gráficas')
      } finally {
        loading.value = false
      }
    }

    // Cargar registros para la tabla
    const loadRecords = async () => {
      if (!currentUserId.value) return
      
      loadingRecords.value = true
      try {
        const data = await getRecords(currentUserId.value, activePeriod.value)
        records.value = data
      } catch (error) {
        console.error('Error cargando registros:', error)
      } finally {
        loadingRecords.value = false
      }
    }

    // ========== FILTRADO LOCAL ==========
    
    // Obtener conceptos únicos para filtros
    const conceptosUnicos = computed(() => {
      const conceptos = records.value.map(r => r.concepto)
      return [...new Set(conceptos)]
    })

    // Obtener métodos de pago únicos para filtros
    const metodosUnicos = computed(() => {
      const metodos = records.value.map(r => r.metodoPago)
      return [...new Set(metodos)]
    })

    // Filtrar registros según filtros avanzados
    const filteredRecords = computed(() => {
      let filtered = [...records.value]
      
      if (advancedFilters.value.concepto) {
        filtered = filtered.filter(r => r.concepto === advancedFilters.value.concepto)
      }
      
      if (advancedFilters.value.metodoPago) {
        filtered = filtered.filter(r => r.metodoPago === advancedFilters.value.metodoPago)
      }
      
      if (advancedFilters.value.minAmount !== null && advancedFilters.value.minAmount !== '') {
        filtered = filtered.filter(r => Math.abs(r.cantidad) >= advancedFilters.value.minAmount)
      }
      
      if (advancedFilters.value.maxAmount !== null && advancedFilters.value.maxAmount !== '') {
        filtered = filtered.filter(r => Math.abs(r.cantidad) <= advancedFilters.value.maxAmount)
      }
      
      return filtered
    })

    // ========== PAGINACIÓN ==========
    
    const totalPages = computed(() => {
      return Math.ceil(filteredRecords.value.length / pageSize)
    })

    const paginatedRecords = computed(() => {
      const start = (currentPage.value - 1) * pageSize
      const end = start + pageSize
      return filteredRecords.value.slice(start, end)
    })

    // ========== DATOS PARA GRÁFICAS ==========
    
    // Datos para gráfica de conceptos (usando chartData de la API)
    const conceptData = computed(() => {
      return chartData.value?.conceptData || []
    })

    // Datos para métodos de pago
    const paymentData = computed(() => {
      return chartData.value?.paymentData || []
    })

    // Datos para evolución diaria
    const dailyData = computed(() => {
      return chartData.value?.dailyData || []
    })

    // ========== FUNCIONES PRINCIPALES ==========
    
    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value
    }

    const setPeriod = (period) => {
      activePeriod.value = period
      currentPage.value = 1
      
      // Si es personalizado, establecer fechas por defecto
      if (period === 'custom') {
        const hoy = getHoyMexico()
        const semanaAtras = new Date(getFechaMexico(hoy))
        semanaAtras.setDate(semanaAtras.getDate() - 7)
        
        dateRange.value = {
          from: semanaAtras.toISOString().split('T')[0],
          to: hoy
        }
      }
      
      // Recargar datos
      loadChartData()
    }

    const applyCustomRange = () => {
      currentPage.value = 1
      loadChartData()
    }

    const toggleFilters = () => {
      showFilters.value = !showFilters.value
    }

    const applyAdvancedFilters = () => {
      currentPage.value = 1
    }

    const clearFilters = () => {
      advancedFilters.value = {
        concepto: '',
        metodoPago: '',
        minAmount: null,
        maxAmount: null
      }
      currentPage.value = 1
    }

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
      }
    }

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++
      }
    }

    // ========== FUNCIONES DE UTILIDAD ==========
    
    const formatCurrency = (amount) => {
      return Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    const getConceptoKey = (concepto) => {
      return concepto.toLowerCase().replace(/ /g, '_')
    }

    const exportToExcel = () => {
      if (!canExport.value) {
        alert('❌ No tienes permiso para exportar datos')
        return
      }
      
      const data = filteredRecords.value.map(record => ({
        Fecha: formatDateMexico(record.fecha),
        Nombre: record.nombre,
        Concepto: record.concepto,
        'Método Pago': record.metodoPago,
        Folio: record.folio || 'N/A',
        Cantidad: record.cantidad,
        Tipo: record.cantidad >= 0 ? 'Ingreso' : 'Egreso'
      }))
      
      if (data.length === 0) {
        alert('No hay datos para exportar')
        return
      }
      
      // Crear CSV
      const headers = Object.keys(data[0])
      const csv = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n')
      
      // Descargar
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `redyon_${activePeriod.value}_${getHoyMexico()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert(`Exportados ${data.length} registros`)
    }

    // ========== INICIALIZACIÓN DE GRÁFICAS ==========
    
    const initCharts = () => {
      if (!chartData.value) return
      
      // Destruir gráficos anteriores si existen
      if (incomeExpenseChartInstance) incomeExpenseChartInstance.destroy()
      if (dailyChartInstance) dailyChartInstance.destroy()
      if (conceptChartInstance) conceptChartInstance.destroy()
      if (paymentChartInstance) paymentChartInstance.destroy()

      // Gráfica 1: Ingresos vs Egresos
      if (incomeExpenseChart.value) {
        const ctx = incomeExpenseChart.value.getContext('2d')
        incomeExpenseChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Ingresos', 'Egresos'],
            datasets: [{
              label: 'Monto ($)',
              data: [chartData.value.totalIncome, chartData.value.totalExpense],
              backgroundColor: ['#27ae60', '#e74c3c'],
              borderColor: ['#219653', '#c0392b'],
              borderWidth: 1,
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => `$${context.raw.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => `$${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                }
              }
            }
          }
        })
      }

      // Gráfica 2: Evolución diaria
      if (dailyChart.value && dailyData.value.length > 0) {
        const ctx = dailyChart.value.getContext('2d')
        const labels = dailyData.value.map(d => d.date)
        const dailyValues = dailyData.value.map(d => d.daily)
        const acumuladoValues = dailyData.value.map(d => d.acumulado)
        
        dailyChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Flujo Diario',
                data: dailyValues,
                borderColor: '#3498db',
                backgroundColor: '#3498db20',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              },
              {
                label: 'Acumulado',
                data: acumuladoValues,
                borderColor: '#9b59b6',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.dataset.label
                    const value = context.raw
                    return `${label}: $${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                  }
                }
              }
            },
            scales: {
              y: {
                ticks: {
                  callback: (value) => `$${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                }
              }
            }
          }
        })
      }

      // Gráfica 3: Distribución por concepto
      if (conceptChart.value && conceptData.value.length > 0) {
        const ctx = conceptChart.value.getContext('2d')
        const labels = conceptData.value.map(d => d.label)
        const data = conceptData.value.map(d => d.total)
        const colors = conceptData.value.map(d => d.color)
        
        conceptChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: colors,
              borderColor: colors.map(c => c + 'CC'),
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label
                    const value = context.raw
                    const percentage = ((value / data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)
                    return `${label}: $${value.toFixed(2)} (${percentage}%)`
                  }
                }
              }
            }
          }
        })
      }

      // Gráfica 4: Métodos de pago
      if (paymentChart.value && paymentData.value.length > 0) {
        const ctx = paymentChart.value.getContext('2d')
        const labels = paymentData.value.map(d => d.label)
        const data = paymentData.value.map(d => d.count)
        const colors = paymentData.value.map(d => d.color)
        
        paymentChartInstance = new Chart(ctx, {
          type: 'polarArea',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: colors,
              borderColor: colors.map(c => c + 'CC'),
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label
                    const value = context.raw
                    const total = data.reduce((a, b) => a + b, 0)
                    const percentage = ((value / total) * 100).toFixed(1)
                    return `${label}: ${value} uso${value !== 1 ? 's' : ''} (${percentage}%)`
                  }
                }
              }
            }
          }
        })
      }
    }

    // ========== WATCHERS ==========
    
    // Observar cambios en filtros avanzados para reiniciar paginación
    watch(advancedFilters, () => {
      currentPage.value = 1
    }, { deep: true })

    // Inicializar al montar
    onMounted(() => {
      loadUserData()
      
      // Establecer rango de fechas por defecto
      const hoy = getHoyMexico()
      const semanaAtras = new Date(getFechaMexico(hoy))
      semanaAtras.setDate(semanaAtras.getDate() - 7)
      
      dateRange.value = {
        from: semanaAtras.toISOString().split('T')[0],
        to: hoy
      }
      
      // Cargar datos
      if (currentUserId.value) {
        loadChartData()
      }
    })

    return {
      sidebarOpen,
      loading,
      loadingRecords,
      currentUserId,
      canExport,
      chartData,
      records,
      incomeExpenseChart,
      dailyChart,
      conceptChart,
      paymentChart,
      periods,
      activePeriod,
      dateRange,
      showFilters,
      advancedFilters,
      currentPage,
      pageSize,
      conceptosUnicos,
      metodosUnicos,
      filteredRecords,
      paginatedRecords,
      totalPages,
      conceptData,
      paymentData,
      dailyData,
      toggleSidebar,
      setPeriod,
      applyCustomRange,
      toggleFilters,
      applyAdvancedFilters,
      clearFilters,
      prevPage,
      nextPage,
      exportToExcel,
      formatDateMexico,
      formatCurrency,
      getConceptoKey
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

.charts-page {
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

/* Controles */
.charts-controls {
  margin-bottom: 30px;
}

.filter-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.period-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.period-btn {
  padding: 10px 20px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.period-btn:hover {
  background: #e9e9e9;
  transform: translateY(-2px);
}

.period-btn.active {
  background: #1f998f;
  color: white;
  border-color: #1f998f;
  box-shadow: 0 4px 8px rgba(31, 153, 143, 0.2);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.date-input {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.date-input label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.date-input input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.btn-apply {
  padding: 8px 20px;
  background: #1f998f;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  align-self: flex-end;
}

.btn-apply:hover {
  background: #18857c;
  transform: translateY(-2px);
}

/* Estadísticas */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
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

.stat-value.positive {
  color: #27ae60;
}

.stat-value.negative {
  color: #e74c3c;
}

/* Grid de gráficas */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

.chart-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
}

.chart-header {
  margin-bottom: 20px;
}

.chart-header h3 {
  color: #1f998f;
  margin: 0 0 5px;
  font-size: 1.2rem;
}

.chart-subtitle {
  color: #666;
  font-size: 13px;
}

.chart-wrapper {
  position: relative;
  height: 250px;
  width: 100%;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.chart-legend.compact {
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  display: inline-block;
}

.chart-info {
  margin-top: 10px;
  font-size: 12px;
  color: #666;
  text-align: center;
}

/* Tabla de datos */
.data-table-container {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-header h3 {
  color: #1f998f;
  margin: 0;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.btn-export, .btn-filter {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-export {
  background: #27ae60;
  color: white;
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

.btn-filter {
  background: #3498db;
  color: white;
}

.btn-filter:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.permission-hint {
  font-size: 11px;
  font-style: italic;
  color: #f8f9fa;
  margin-left: 5px;
}

/* Filtros avanzados */
.advanced-filters {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #eee;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.filter-group select,
.filter-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.filter-group input:focus,
.filter-group select:focus {
  outline: none;
  border-color: #1f998f;
}

.filter-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-clear {
  padding: 8px 20px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: #7f8c8d;
  transform: translateY(-2px);
}

/* Tabla */
.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #eee;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  color: #666;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 2px solid #eee;
  white-space: nowrap;
}

.data-table td {
  padding: 15px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.data-table tr:hover {
  background: #f9f9f9;
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
  padding: 4px 10px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.positive {
  color: #27ae60;
  font-weight: 600;
}

.negative {
  color: #e74c3c;
  font-weight: 600;
}

.type-positive, .type-negative {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.type-positive {
  background: #27ae6020;
  color: #27ae60;
}

.type-negative {
  background: #e74c3c20;
  color: #e74c3c;
}

.no-data {
  text-align: center;
  color: #666;
  padding: 40px !important;
  font-style: italic;
}

/* Paginación */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.page-btn {
  padding: 8px 20px;
  background: #1f998f;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #18857c;
  transform: translateY(-2px);
}

.page-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

.page-info {
  color: #666;
  font-size: 14px;
}

.record-count {
  color: #999;
  font-size: 12px;
  margin-left: 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .main-content.sidebar-open {
    margin-left: 0;
  }
  
  .period-filters {
    justify-content: center;
  }
  
  .stats-summary {
    grid-template-columns: 1fr;
  }
  
  .table-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .table-actions {
    flex-direction: column;
  }
  
  .filter-row {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    flex-direction: column;
    gap: 10px;
  }
}
</style>