<template>
  <div class="container-fluid mt-4">
    <!-- Encabezado con selector de período -->
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <h2><i class="bi bi-speedometer2"></i> Dashboard</h2>
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <div class="btn-group">
          <button
            class="btn"
            :class="periodo === 'hoy' ? 'btn-warning' : 'btn-outline-warning'"
            @click="cambiarPeriodo('hoy')"
          >
            <i class="bi bi-calendar-day"></i> Hoy
          </button>
          <button
            class="btn"
            :class="periodo === 'semana' ? 'btn-warning' : 'btn-outline-warning'"
            @click="cambiarPeriodo('semana')"
          >
            <i class="bi bi-calendar-week"></i> Semana
          </button>
          <button
            class="btn"
            :class="periodo === 'mes' ? 'btn-warning' : 'btn-outline-warning'"
            @click="cambiarPeriodo('mes')"
          >
            <i class="bi bi-calendar-month"></i> Mes
          </button>
          <button
            class="btn"
            :class="periodo === 'anio' ? 'btn-warning' : 'btn-outline-warning'"
            @click="cambiarPeriodo('anio')"
          >
            <i class="bi bi-calendar"></i> Año
          </button>
        </div>
        <button class="btn btn-outline-success" @click="exportarExcel">
          <i class="bi bi-file-earmark-excel"></i> Excel
        </button>
        <button class="btn btn-outline-danger" @click="exportarPdf">
          <i class="bi bi-file-earmark-pdf"></i> PDF
        </button>
      </div>
    </div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border text-warning" style="width: 3rem; height: 3rem;"></div>
      <p class="mt-3 text-muted">Cargando dashboard...</p>
    </div>

    <div v-else>
      <!-- MENSAJE EN LENGUAJE SENCILLO -->
      <div class="alert alert-info d-flex align-items-center mb-3">
        <i class="bi bi-info-circle-fill me-2 fs-4"></i>
        <div>
          <strong>{{ mensajePeriodo.titulo }}</strong><br />
          <span>{{ mensajePeriodo.detalle }}</span>
        </div>
      </div>

      <!-- TARJETAS DE RESUMEN -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card bg-success text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <div class="small opacity-75">Vendiste</div>
                  <div class="fs-3 fw-bold">${{ resumen.ventas?.total?.toFixed(2) || '0.00' }}</div>
                  <div class="small">{{ resumen.ventas?.numero || 0 }} ventas</div>
                </div>
                <i class="bi bi-cash-coin fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-primary text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <div class="small opacity-75">Ticket promedio</div>
                  <div class="fs-3 fw-bold">${{ resumen.ventas?.ticketPromedio?.toFixed(2) || '0.00' }}</div>
                  <div class="small">Por cliente</div>
                </div>
                <i class="bi bi-receipt fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-danger text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <div class="small opacity-75">Gastaste</div>
                  <div class="fs-3 fw-bold">${{ resumen.gastos?.total?.toFixed(2) || '0.00' }}</div>
                  <div class="small">
                    Fijos: ${{ resumen.gastos?.fijos?.toFixed(2) || '0' }} | Var: ${{ resumen.gastos?.variables?.toFixed(2) || '0' }}
                  </div>
                </div>
                <i class="bi bi-wallet2 fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div :class="utilidadNeta >= 0 ? 'card bg-info text-white h-100' : 'card bg-dark text-white h-100'">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <div class="small opacity-75">Ganancia real</div>
                  <div class="fs-3 fw-bold">${{ utilidadNeta.toFixed(2) }}</div>
                  <div class="small">{{ utilidadNeta >= 0 ? 'Ganancia neta' : 'Pérdida' }}</div>
                </div>
                <i class="bi bi-graph-up-arrow fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COMPARACIÓN CON PERÍODO ANTERIOR -->
      <div v-if="comparacion" class="card mb-4">
        <div class="card-body">
          <div class="d-flex align-items-center">
            <i
              :class="comparacion.tendencia === 'sube' ? 'bi bi-arrow-up-circle-fill text-success' : (comparacion.tendencia === 'baja' ? 'bi bi-arrow-down-circle-fill text-danger' : 'bi bi-dash-circle text-secondary')"
              style="font-size: 2.5rem;"
            ></i>
            <div class="ms-3">
              <div class="fw-bold">
                {{ comparacion.tendencia === 'sube' ? 'Vas mejor que antes' : (comparacion.tendencia === 'baja' ? 'Vas por debajo del período anterior' : 'Igual que el período anterior') }}
              </div>
              <div class="text-muted">
                {{ comparacion.tendencia === 'sube' ? 'Subiste' : (comparacion.tendencia === 'baja' ? 'Bajaste' : 'Sin cambios') }}
                {{ Math.abs(comparacion.porcentaje) }}% comparado con el {{ textoPeriodoAnterior }}.
                Antes: ${{ comparacion.anterior.toFixed(2) }} — Ahora: ${{ comparacion.actual.toFixed(2) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- GRÁFICAS PRINCIPALES -->
      <div class="row g-3 mb-4">
        <!-- Gráfica 1: Ventas diarias (línea) -->
        <div class="col-md-8">
          <div class="card h-100">
            <div class="card-header bg-white">
              <strong><i class="bi bi-graph-up text-primary"></i> {{ ventasPeriodoData.titulo || 'Ventas del período' }}</strong>
            </div>
            <div class="card-body">
              <Line ref="refVentasDiarias" :data="chartVentasDiarias.data" :options="chartVentasDiarias.options" />
            </div>
          </div>
        </div>

        <!-- Gráfica 3: Métodos de pago (dona) -->
        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-header bg-white">
              <strong><i class="bi bi-pie-chart text-warning"></i> Cómo te pagaron</strong>
            </div>
            <div class="card-body">
              <Doughnut ref="refMetodosPago" :data="chartMetodosPago.data" :options="chartMetodosPago.options" />
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <!-- Gráfica 2: Ventas por hora (barras) -->
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-header bg-white">
              <strong><i class="bi bi-bar-chart text-success"></i> Horas con más ventas</strong>
            </div>
            <div class="card-body">
              <Bar ref="refVentasPorHora" :data="chartVentasPorHora.data" :options="chartVentasPorHora.options" />
            </div>
          </div>
        </div>

        <!-- Gráfica 4: Top productos (barras horizontales) -->
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-header bg-white">
              <strong><i class="bi bi-trophy text-warning"></i> Productos más vendidos</strong>
            </div>
            <div class="card-body">
              <Bar v-if="topProductos.length" ref="refTopProductos" :data="chartTopProductos.data" :options="chartTopProductos.options" />
              <p v-else class="text-muted text-center py-5">Sin ventas en este período</p>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <!-- Gráfica 5: Gastos por categoría (pastel) -->
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-header bg-white">
              <strong><i class="bi bi-pie-chart-fill text-danger"></i> En qué gastaste</strong>
            </div>
            <div class="card-body">
              <Pie v-if="gastosPorCategoria.length" ref="refGastos" :data="chartGastos.data" :options="chartGastos.options" />
              <p v-else class="text-muted text-center py-5">Sin gastos en este período</p>
            </div>
          </div>
        </div>

        <!-- Tabla: Balance y Deudas -->
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-header bg-white">
              <strong><i class="bi bi-calculator text-info"></i> Balance del período</strong>
            </div>
            <div class="card-body">
              <table class="table table-sm mb-0">
                <tbody>
                  <tr>
                    <td>Ventas totales</td>
                    <td class="text-end text-success fw-bold">
                      ${{ resumen.balance?.ventas?.toFixed(2) || '0.00' }}
                    </td>
                  </tr>
                  <tr>
                    <td class="text-muted">− Costo de mercancía (60%)</td>
                    <td class="text-end text-muted">
                      −${{ resumen.balance?.costoMercancia?.toFixed(2) || '0.00' }}
                    </td>
                  </tr>
                  <tr class="border-top">
                    <td class="fw-bold">Ganancia bruta</td>
                    <td class="text-end fw-bold">
                      ${{ resumen.balance?.utilidadBruta?.toFixed(2) || '0.00' }}
                    </td>
                  </tr>
                  <tr>
                    <td class="text-muted">− Gastos del negocio</td>
                    <td class="text-end text-danger">
                      −${{ resumen.balance?.gastos?.toFixed(2) || '0.00' }}
                    </td>
                  </tr>
                  <tr class="border-top">
                    <td class="fw-bold fs-5">GANANCIA REAL</td>
                    <td
                      class="text-end fw-bold fs-5"
                      :class="utilidadNeta >= 0 ? 'text-success' : 'text-danger'"
                    >
                      ${{ utilidadNeta.toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
              </table>

              <hr />

              <div class="d-flex justify-content-between mb-2">
                <span><i class="bi bi-exclamation-circle text-danger"></i> Te deben:</span>
                <strong class="text-danger">${{ resumen.deudas?.porCobrar?.toFixed(2) || '0.00' }}</strong>
              </div>
              <div class="d-flex justify-content-between">
                <span><i class="bi bi-check-circle text-success"></i> Cobraste en el período:</span>
                <strong class="text-success">${{ resumen.deudas?.cobradoEnPeriodo?.toFixed(2) || '0.00' }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { exportarXLSX } from '../utils/exportar'

// Importar jsPDF y autotable directamente para el PDF con imágenes
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Importar Chart.js y los componentes de vue-chartjs
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut, Pie } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const auth = useAuthStore()
import { API_URL } from '../config/api'

const periodo = ref('hoy')
const cargando = ref(false)
const resumen = ref({})
const comparacion = ref(null)
const ventasDiarias = ref([])
const ventasPorHora = ref([])
const topProductos = ref([])
const gastosPorCategoria = ref([])
const ventasPeriodoData = ref({ titulo: '', labels: [], datos: [], detalle: [] })

// === REFS para las gráficas (para exportar a PDF) ===
const refVentasDiarias = ref(null)
const refVentasPorHora = ref(null)
const refMetodosPago = ref(null)
const refTopProductos = ref(null)
const refGastos = ref(null)

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${auth.token}`
})

// === Cálculo de utilidad neta ===
const utilidadNeta = computed(() => resumen.value.balance?.utilidadNeta || 0)

// === Texto del período ===
const textoPeriodo = computed(() => {
  const t = { hoy: 'hoy', semana: 'esta semana', mes: 'este mes', anio: 'este año' }
  return t[periodo.value] || 'este período'
})

const textoPeriodoAnterior = computed(() => {
  const t = { hoy: 'ayer', semana: 'la semana pasada', mes: 'el mes pasado', anio: 'el año pasado' }
  return t[periodo.value] || 'el período anterior'
})

// === Mensaje en lenguaje sencillo ===
const mensajePeriodo = computed(() => {
  const p = periodo.value
  const numVentas = resumen.value.ventas?.numero || 0
  const total = resumen.value.ventas?.total || 0
  const utilidad = utilidadNeta.value

  if (numVentas === 0) {
    return {
      titulo: `Aún no tienes ventas ${textoPeriodo.value}`,
      detalle: 'En cuanto registres ventas en el POS, verás toda la información aquí.'
    }
  }

  const titulos = {
    hoy: `Hoy has vendido $${total.toFixed(2)} en ${numVentas} venta${numVentas > 1 ? 's' : ''}`,
    semana: `Esta semana llevas $${total.toFixed(2)} en ${numVentas} ventas`,
    mes: `Este mes llevas $${total.toFixed(2)} en ${numVentas} ventas`,
    anio: `Este año llevas $${total.toFixed(2)} en ${numVentas} ventas`
  }

  let detalle = ''
  if (utilidad > 0) {
    detalle = `Después de pagar mercancía y gastos, tu ganancia real es de $${utilidad.toFixed(2)}. `
  } else if (utilidad < 0) {
    detalle = `Cuidado: llevas una pérdida de $${Math.abs(utilidad).toFixed(2)} en el período. `
  }

  const porCobrar = resumen.value.deudas?.porCobrar || 0
  if (porCobrar > 0) {
    detalle += `Tienes $${porCobrar.toFixed(2)} pendientes por cobrar a clientes.`
  } else {
    detalle += 'No tienes deudas pendientes de clientes.'
  }

  return { titulo: titulos[p] || titulos.hoy, detalle }
})

// === Gráfica 1: Ventas dinámicas según período ===
const chartVentasDiarias = computed(() => {
  const datos = ventasPeriodoData.value
  const p = periodo.value

  let pointRadius = 4
  let tension = 0.35
  let borderWidth = 3

  if (p === 'hoy') {
    pointRadius = 5
    tension = 0.2
  } else if (p === 'mes') {
    pointRadius = 2
    tension = 0.3
  } else if (p === 'anio') {
    pointRadius = 6
    tension = 0.35
  }

  const promedio = datos.datos.length > 0
    ? datos.datos.reduce((a, b) => a + b, 0) / datos.datos.length
    : 0

  const coloresPuntos = datos.datos.map((v) =>
    v > promedio * 1.3 ? '#dc3545' : '#d97706'
  )

  return {
    data: {
      labels: datos.labels,
      datasets: [
        {
          label: 'Ventas ($)',
          data: datos.datos,
          borderColor: '#d97706',
          backgroundColor: 'rgba(217, 119, 6, 0.15)',
          fill: true,
          tension,
          borderWidth,
          pointRadius,
          pointHoverRadius: pointRadius + 3,
          pointBackgroundColor: coloresPuntos,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => {
              const i = items[0].dataIndex
              const d = datos.detalle?.[i]
              if (p === 'hoy') return `Hora: ${d?.label}`
              if (p === 'semana') return `Día: ${d?.label}`
              if (p === 'mes') return `Día ${d?.label} del mes`
              if (p === 'anio') return `Mes: ${d?.label}`
              return d?.label || ''
            },
            label: (ctx) => {
              const i = ctx.dataIndex
              const d = datos.detalle?.[i]
              const ventas = d?.numero || 0
              return [
                `Total: $${ctx.parsed.y.toFixed(2)}`,
                `Ventas: ${ventas}`
              ]
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            autoSkip: p !== 'mes',
            maxRotation: p === 'mes' ? 90 : 0,
            minRotation: 0,
            font: { size: p === 'mes' ? 9 : 11 }
          },
          grid: {
            color: (ctx) => {
              if (p === 'mes') {
                const dia = parseInt(datos.labels[ctx.index])
                if (dia === 1 || dia === 8 || dia === 15 || dia === 22 || dia === 29) {
                  return 'rgba(217, 119, 6, 0.4)'
                }
              }
              return 'rgba(0, 0, 0, 0.05)'
            },
            lineWidth: (ctx) => {
              if (p === 'mes') {
                const dia = parseInt(datos.labels[ctx.index])
                if (dia === 1 || dia === 8 || dia === 15 || dia === 22 || dia === 29) {
                  return 2
                }
              }
              return 1
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: { callback: (v) => `$${v}` }
        }
      }
    }
  }
})

// === Gráfica 2: Ventas por hora (barras) ===
const chartVentasPorHora = computed(() => {
  const horasActivas = ventasPorHora.value.filter((h) => h.total > 0)
  return {
    data: {
      labels: horasActivas.map((h) => `${h.hora}:00`),
      datasets: [
        {
          label: 'Ventas ($)',
          data: horasActivas.map((h) => h.total),
          backgroundColor: horasActivas.map((h) => {
            const max = Math.max(...horasActivas.map((x) => x.total))
            return h.total === max ? '#dc3545' : '#16a34a'
          }),
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `$${ctx.parsed.y.toFixed(2)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (v) => `$${v}` }
        }
      }
    }
  }
})

// === Gráfica 3: Métodos de pago (dona) ===
const chartMetodosPago = computed(() => {
  const m = resumen.value.ventas?.porMetodo || {}
  const labels = []
  const data = []
  const colors = ['#16a34a', '#2563eb', '#0891b2', '#d97706']

  Object.entries(m).forEach(([key, val]) => {
    if (val > 0) {
      labels.push(key)
      data.push(val)
    }
  })

  return {
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 1,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = data.reduce((s, v) => s + v, 0)
              const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0
              return `${ctx.label}: $${ctx.parsed.toFixed(2)} (${pct}%)`
            }
          }
        }
      }
    }
  }
})

// === Gráfica 4: Top productos (barras horizontales) ===
const chartTopProductos = computed(() => ({
  data: {
    labels: topProductos.value.map((p) => `${p.nombre} (${p.presentacion})`),
    datasets: [
      {
        label: 'Unidades vendidas',
        data: topProductos.value.map((p) => p.cantidad),
        backgroundColor: ['#d97706', '#16a34a', '#2563eb', '#dc2626', '#7c3aed'],
        borderRadius: 6
      }
    ]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const p = topProductos.value[ctx.dataIndex]
            return `${p.cantidad} unidades - $${p.ingresos.toFixed(2)}`
          }
        }
      }
    },
    scales: {
      x: { beginAtZero: true }
    }
  }
}))

// === Gráfica 5: Gastos por categoría (pastel) ===
const chartGastos = computed(() => ({
  data: {
    labels: gastosPorCategoria.value.map((g) => g.nombre),
    datasets: [
      {
        data: gastosPorCategoria.value.map((g) => g.monto),
        backgroundColor: [
          '#dc2626', '#d97706', '#16a34a', '#2563eb',
          '#7c3aed', '#0891b2', '#be185d', '#4b5563'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = gastosPorCategoria.value.reduce((s, g) => s + g.monto, 0)
            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0
            return `${ctx.label}: $${ctx.parsed.toFixed(2)} (${pct}%)`
          }
        }
      }
    }
  }
}))

// === Cargar todos los datos ===
const cargarTodo = async () => {
  cargando.value = true
  try {
    const [resResumen, resComparacion, resPeriodo, resHoras, resTop, resGastos] = await Promise.all([
      fetch(`${API_URL}/dashboard/resumen?periodo=${periodo.value}`, { headers: headers() }),
      fetch(`${API_URL}/dashboard/comparacion?periodo=${periodo.value}`, { headers: headers() }),
      fetch(`${API_URL}/dashboard/ventas-periodo?periodo=${periodo.value}`, { headers: headers() }),
      fetch(`${API_URL}/dashboard/ventas-por-hora?periodo=${periodo.value}`, { headers: headers() }),
      fetch(`${API_URL}/dashboard/top-productos?periodo=${periodo.value}&limit=5`, { headers: headers() }),
      fetch(`${API_URL}/expenses/resumen`, { headers: headers() })
    ])

    if (resResumen.ok) resumen.value = await resResumen.json()
    if (resComparacion.ok) comparacion.value = await resComparacion.json()
    if (resPeriodo.ok) ventasPeriodoData.value = await resPeriodo.json()
    if (resHoras.ok) ventasPorHora.value = await resHoras.json()
    if (resTop.ok) topProductos.value = await resTop.json()

    if (resGastos.ok) {
      const r = await resGastos.json()
      gastosPorCategoria.value = r.porCategoria || []
    }
  } catch (e) {
    console.error('Error cargando dashboard:', e)
  } finally {
    cargando.value = false
  }
}

const cambiarPeriodo = (p) => {
  periodo.value = p
  cargarTodo()
}

// === Exportar a Excel (sin cambios) ===
const exportarExcel = () => {
  const datos = [
    { concepto: 'Ventas totales', valor: resumen.value.ventas?.total || 0 },
    { concepto: 'Número de ventas', valor: resumen.value.ventas?.numero || 0 },
    { concepto: 'Ticket promedio', valor: resumen.value.ventas?.ticketPromedio || 0 },
    { concepto: 'Gastos totales', valor: resumen.value.gastos?.total || 0 },
    { concepto: 'Gastos fijos', valor: resumen.value.gastos?.fijos || 0 },
    { concepto: 'Gastos variables', valor: resumen.value.gastos?.variables || 0 },
    { concepto: 'Costo de mercancía', valor: resumen.value.balance?.costoMercancia || 0 },
    { concepto: 'Utilidad bruta', valor: resumen.value.balance?.utilidadBruta || 0 },
    { concepto: 'Utilidad neta', valor: utilidadNeta.value }
  ]

  const columnas = [
    { titulo: 'Concepto', valor: (d) => d.concepto },
    { titulo: 'Valor', valor: (d) => `$${parseFloat(d.valor).toFixed(2)}` }
  ]

  exportarXLSX(datos, columnas, `dashboard-${periodo.value}-${new Date().toISOString().slice(0, 10)}`, 'Dashboard')
}

// === Helper: insertar gráfica respetando su proporción original ===
const agregarGraficaAlPdf = (doc, refChart, x, y, anchoMaximo) => {
  if (!refChart?.chart) return y

  const chart = refChart.chart
  const canvas = chart.canvas

  // Dimensiones reales del canvas (en píxeles)
  const anchoReal = canvas.width
  const altoReal = canvas.height
  const ratio = altoReal / anchoReal

  // Calcular alto manteniendo la proporción
  const anchoFinal = anchoMaximo
  const altoFinal = anchoMaximo * ratio

  const imgData = chart.toBase64Image('image/png', 2)
  doc.addImage(imgData, 'PNG', x, y, anchoFinal, altoFinal)

  return y + altoFinal
}

// === NUEVO: Exportar PDF con gráficas ===
const exportarPdf = () => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 14

  // ============================================================
  // PÁGINA 1: PORTADA + RESUMEN NUMÉRICO
  // ============================================================
  // Encabezado
  doc.setFillColor(217, 119, 6)
  doc.rect(0, 0, pageWidth, 22, 'F')

  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('La Botanita', margin, 10)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Reporte de Balance General', margin, 17)

  doc.setFontSize(8)
  doc.text(
    `Generado: ${new Date().toLocaleString('es-MX')}`,
    pageWidth - margin,
    10,
    { align: 'right' }
  )
  doc.text(
    `Período: ${textoPeriodo.value}`,
    pageWidth - margin,
    17,
    { align: 'right' }
  )

  // Mensaje principal
  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.text(mensajePeriodo.value.titulo, margin, 38)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80)
  const detalle = doc.splitTextToSize(mensajePeriodo.value.detalle, pageWidth - margin * 2)
  doc.text(detalle, margin, 46)

  // Tabla de resumen
  const datosResumen = [
    ['Ventas totales', `$${resumen.value.ventas?.total?.toFixed(2) || '0.00'}`],
    ['Número de ventas', `${resumen.value.ventas?.numero || 0}`],
    ['Ticket promedio por cliente', `$${resumen.value.ventas?.ticketPromedio?.toFixed(2) || '0.00'}`],
    ['Gastos fijos', `$${resumen.value.gastos?.fijos?.toFixed(2) || '0.00'}`],
    ['Gastos variables', `$${resumen.value.gastos?.variables?.toFixed(2) || '0.00'}`],
    ['Total de gastos', `$${resumen.value.gastos?.total?.toFixed(2) || '0.00'}`],
    ['Costo de mercancía vendida', `$${resumen.value.balance?.costoMercancia?.toFixed(2) || '0.00'}`],
    ['Ganancia bruta', `$${resumen.value.balance?.utilidadBruta?.toFixed(2) || '0.00'}`],
    ['GANANCIA REAL (después de gastos)', `$${utilidadNeta.value.toFixed(2)}`]
  ]

  autoTable(doc, {
    startY: 62,
    head: [['Concepto', 'Valor']],
    body: datosResumen,
    theme: 'grid',
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11
    },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Destacar la fila de ganancia real
      if (data.row.index === datosResumen.length - 1 && data.section === 'body') {
        data.cell.styles.fillColor = [220, 252, 231]
        data.cell.styles.textColor = utilidadNeta.value >= 0 ? [22, 101, 52] : [153, 27, 27]
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })

  // Información de deudas
  let y = doc.lastAutoTable.finalY + 10

  doc.setFontSize(10)
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.text('Cuentas por cobrar', margin, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  y += 6
  doc.text(
    `• Pendiente de cobro: $${resumen.value.deudas?.porCobrar?.toFixed(2) || '0.00'}`,
    margin + 3,
    y
  )
  y += 5
  doc.text(
    `• Cobrado en el período: $${resumen.value.deudas?.cobradoEnPeriodo?.toFixed(2) || '0.00'}`,
    margin + 3,
    y
  )

  // Footer de página
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(
    `Página 1 de 3 — La Botanita POS`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  )

  // ============================================================
  // PÁGINA 2: VENTAS DIARIAS + MÉTODOS DE PAGO + TOP PRODUCTOS
  // ============================================================
  doc.addPage()

  // Título de sección
  doc.setFillColor(217, 119, 6)
  doc.rect(0, 0, pageWidth, 12, 'F')
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('Análisis de Ventas', margin, 8)

  // Gráfica 1: Ventas diarias (ancho completo)
  doc.setFontSize(11)
  doc.setTextColor(0)
  doc.text(ventasPeriodoData.value.titulo || 'Ventas del período', margin, 22)

  if (refVentasDiarias.value?.chart) {
    agregarGraficaAlPdf(doc, refVentasDiarias.value, margin, 26, pageWidth - margin * 2)
  } else {
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text('(Gráfica no disponible)', margin, 30)
  }

  // Gráfica 3: Métodos de pago (mitad izquierda)
  const midY = 130
  const halfWidth = (pageWidth - margin * 3) / 2

  doc.setFontSize(11)
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.text('Métodos de pago', margin, midY)

  if (refMetodosPago.value?.chart) {
    agregarGraficaAlPdf(doc, refMetodosPago.value, margin, midY + 4, halfWidth)
  }

  // Gráfica 4: Top productos (mitad derecha)
  doc.text('Productos más vendidos', margin + halfWidth + margin, midY)

  if (refTopProductos.value?.chart) {
    agregarGraficaAlPdf(doc, refTopProductos.value, margin + halfWidth + margin, midY + 4, halfWidth)
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(
    `Página 2 de 3 — La Botanita POS`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  )

  // ============================================================
  // PÁGINA 3: HORAS PICO + GASTOS POR CATEGORÍA
  // ============================================================
  doc.addPage()

  doc.setFillColor(217, 119, 6)
  doc.rect(0, 0, pageWidth, 12, 'F')
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('Análisis Operativo', margin, 8)

  // Gráfica 2: Horas pico
  doc.setFontSize(11)
  doc.setTextColor(0)
  doc.text('Horas con más ventas', margin, 22)

  if (refVentasPorHora.value?.chart) {
    agregarGraficaAlPdf(doc, refVentasPorHora.value, margin, 26, pageWidth - margin * 2)
  } else {
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text('(Sin ventas en el período)', margin, 30)
  }
  
  // Gráfica 5: Gastos por categoría
  doc.setFontSize(11)
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.text('Distribución de gastos por categoría', margin, 130)

  if (refGastos.value?.chart) {
    agregarGraficaAlPdf(doc, refGastos.value, margin, 134, (pageWidth - margin * 3) / 2)
  }

  // Tabla de gastos a la derecha
  if (gastosPorCategoria.value.length) {
    const totalGastos = gastosPorCategoria.value.reduce((s, g) => s + g.monto, 0)

    autoTable(doc, {
      startY: 134,
      margin: { left: margin + (pageWidth - margin * 3) / 2 + margin },
      head: [['Categoría', 'Monto', '%']],
      body: gastosPorCategoria.value.map((g) => [
        g.nombre,
        `$${g.monto.toFixed(2)}`,
        `${((g.monto / totalGastos) * 100).toFixed(1)}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [217, 119, 6], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' }
      }
    })
  }

  // Conclusiones al pie
  const conclusionY = 210
  doc.setFontSize(11)
  doc.setTextColor(217, 119, 6)
  doc.setFont('helvetica', 'bold')
  doc.text('Conclusiones del período', margin, conclusionY)

  doc.setFontSize(9)
  doc.setTextColor(60)
  doc.setFont('helvetica', 'normal')

  let conclusiones = []

  // Mejor día de la semana
  if (ventasDiarias.value.length > 0) {
    const mejorDia = [...ventasDiarias.value].sort((a, b) => b.total - a.total)[0]
    conclusiones.push(`• Tu mejor día fue el ${mejorDia.fecha} con $${mejorDia.total.toFixed(2)} en ventas.`)
  }

  // Hora pico
  if (ventasPorHora.value.length > 0) {
    const mejorHora = [...ventasPorHora.value].sort((a, b) => b.total - a.total)[0]
    if (mejorHora.total > 0) {
      conclusiones.push(`• La hora con más ventas es alrededor de las ${mejorHora.hora}:00 hrs.`)
    }
  }

  // Producto estrella
  if (topProductos.value.length > 0) {
    const estrella = topProductos.value[0]
    conclusiones.push(`• Tu producto estrella es "${estrella.nombre} (${estrella.presentacion})" con ${estrella.cantidad} unidades.`)
  }

  // Balance
  if (utilidadNeta.value >= 0) {
    conclusiones.push(`• El negocio generó una ganancia real de $${utilidadNeta.value.toFixed(2)} en el período.`)
  } else {
    conclusiones.push(`• Atención: hubo una pérdida de $${Math.abs(utilidadNeta.value).toFixed(2)}. Revisa gastos y precios.`)
  }

  let conclusionY2 = conclusionY + 8
  conclusiones.forEach((c) => {
    const lineas = doc.splitTextToSize(c, pageWidth - margin * 2)
    doc.text(lineas, margin, conclusionY2)
    conclusionY2 += lineas.length * 5
  })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(
    `Página 3 de 3 — La Botanita POS — Reporte generado automáticamente`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  )

  // Guardar
  const fecha = new Date().toISOString().slice(0, 10)
  doc.save(`balance-${periodo.value}-${fecha}.pdf`)
}

onMounted(cargarTodo)
</script>
<style scoped>
.card {
  transition: transform 0.15s ease;
}
.card:hover {
  transform: translateY(-2px);
}
</style>
