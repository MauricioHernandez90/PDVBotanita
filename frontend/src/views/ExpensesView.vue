<template>
  <div class="container-fluid mt-4">
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h2><i class="bi bi-cash-stack"></i> Gastos del Negocio</h2>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-success" @click="exportarExcel">
          <i class="bi bi-file-earmark-excel"></i> Excel
        </button>
        <button class="btn btn-outline-danger" @click="exportarPdf">
          <i class="bi bi-file-earmark-pdf"></i> PDF
        </button>
        <button class="btn btn-outline-primary" @click="exportarSheets">
          <i class="bi bi-google"></i> Sheets
        </button>
        <button v-if="auth.isAdmin" class="btn btn-warning" @click="abrirModalCrear">
          <i class="bi bi-plus-circle"></i> Nuevo Gasto
        </button>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex flex-wrap gap-2 align-items-end">
          <div>
            <label class="form-label small mb-0">Período rápido</label>
            <div class="btn-group">
              <button class="btn btn-sm btn-outline-secondary" :class="periodo === 'hoy' ? 'active' : ''" @click="setPeriodo('hoy')">Hoy</button>
              <button class="btn btn-sm btn-outline-secondary" :class="periodo === 'semana' ? 'active' : ''" @click="setPeriodo('semana')">Semana</button>
              <button class="btn btn-sm btn-outline-secondary" :class="periodo === 'mes' ? 'active' : ''" @click="setPeriodo('mes')">Mes</button>
            </div>
          </div>
          <div>
            <label class="form-label small mb-0">Desde</label>
            <input v-model="filtros.desde" @change="cargar" type="date" class="form-control form-control-sm" />
          </div>
          <div>
            <label class="form-label small mb-0">Hasta</label>
            <input v-model="filtros.hasta" @change="cargar" type="date" class="form-control form-control-sm" />
          </div>
          <div>
            <label class="form-label small mb-0">Tipo</label>
            <select v-model="filtros.tipo" @change="cargar" class="form-select form-select-sm">
              <option value="">Todos</option>
              <option value="fijo">Fijos</option>
              <option value="variable">Variables</option>
            </select>
          </div>
          <div>
            <label class="form-label small mb-0">Categoría</label>
            <select v-model="filtros.categoriaId" @change="cargar" class="form-select form-select-sm">
              <option value="">Todas</option>
              <option v-for="c in categorias" :key="c._id" :value="c._id">{{ c.nombre }}</option>
            </select>
          </div>
          <button class="btn btn-sm btn-outline-secondary" @click="limpiarFiltros">
            <i class="bi bi-x-circle"></i> Limpiar
          </button>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-3">
      <div class="col-md-3">
        <div class="card bg-dark text-white">
          <div class="card-body">
            <div class="small">Total del período</div>
            <div class="fs-3 fw-bold">${{ resumen.total?.toFixed(2) || '0.00' }}</div>
            <div class="small">{{ resumen.numeroGastos || 0 }} gastos</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <div class="small">Gastos Fijos</div>
            <div class="fs-3 fw-bold">${{ resumen.totalFijos?.toFixed(2) || '0.00' }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-dark">
          <div class="card-body">
            <div class="small">Gastos Variables</div>
            <div class="fs-3 fw-bold">${{ resumen.totalVariables?.toFixed(2) || '0.00' }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body">
            <div class="small">Categoría más gastada</div>
            <div class="fs-6 fw-bold">
              {{ resumen.porCategoria?.[0]?.nombre || '—' }}
            </div>
            <div class="small">${{ resumen.porCategoria?.[0]?.monto?.toFixed(2) || '0.00' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="resumen.porCategoria?.length" class="card mb-3">
      <div class="card-header">
        <i class="bi bi-pie-chart"></i> Desglose por categoría
      </div>
      <div class="card-body">
        <div class="row">
          <div v-for="cat in resumen.porCategoria" :key="cat.nombre" class="col-md-4 mb-2">
            <div class="d-flex justify-content-between align-items-center border-bottom pb-1">
              <span>{{ cat.nombre }}</span>
              <strong>${{ cat.monto.toFixed(2) }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border text-warning"></div>
    </div>

    <div v-else class="table-responsive">
      <table class="table table-striped table-hover align-middle">
        <thead class="table-dark">
          <tr>
            <th>Fecha</th>
            <th>Concepto</th>
            <th>Categoría</th>
            <th>Tipo</th>
            <th>Método</th>
            <th>Proveedor</th>
            <th class="text-end">Monto</th>
            <th v-if="auth.isAdmin" class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in gastos" :key="g._id">
            <td class="small">{{ formatFecha(g.fecha) }}</td>
            <td>
              <strong>{{ g.concepto }}</strong>
              <div v-if="g.notas" class="text-muted small">{{ g.notas }}</div>
            </td>
            <td>
              <span class="badge bg-secondary">{{ g.categoriaId?.nombre || '—' }}</span>
            </td>
            <td>
              <span :class="g.tipo === 'fijo' ? 'badge bg-primary' : 'badge bg-warning text-dark'">
                {{ g.tipo }}
              </span>
            </td>
            <td class="small">{{ g.metodoPago }}</td>
            <td class="small">{{ g.proveedor || '—' }}</td>
            <td class="text-end fw-bold">${{ g.monto.toFixed(2) }}</td>
            <td v-if="auth.isAdmin" class="text-end">
              <button class="btn btn-sm btn-outline-primary me-1" @click="abrirModalEditar(g)">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="eliminar(g)">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
          <tr v-if="gastos.length === 0">
            <td :colspan="auth.isAdmin ? 8 : 7" class="text-center text-muted py-4">
              No hay gastos en el período seleccionado
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="modalVisible" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editando ? 'Editar' : 'Nuevo' }} Gasto</h5>
            <button type="button" class="btn-close" @click="cerrarModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Fecha *</label>
              <input v-model="form.fecha" type="date" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Concepto *</label>
              <input v-model="form.concepto" type="text" class="form-control" placeholder="Ej: Renta de octubre" />
            </div>
            <div class="mb-3">
              <label class="form-label">Monto *</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input v-model.number="form.monto" type="number" min="0" step="0.50" class="form-control" />
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Categoría *</label>
              <select v-model="form.categoriaId" @change="alCambiarCategoria" class="form-select">
                <option value="">-- Selecciona --</option>
                <optgroup label="Gastos Fijos">
                  <option v-for="c in categoriasFijas" :key="c._id" :value="c._id">{{ c.nombre }}</option>
                </optgroup>
                <optgroup label="Gastos Variables">
                  <option v-for="c in categoriasVariables" :key="c._id" :value="c._id">{{ c.nombre }}</option>
                </optgroup>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Tipo *</label>
              <div>
                <span :class="form.tipo === 'fijo' ? 'badge bg-primary fs-6' : 'badge bg-warning text-dark fs-6'">
                  {{ form.tipo }}
                </span>
                <small class="text-muted ms-2">Se asigna automáticamente según la categoría</small>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Método de pago</label>
              <select v-model="form.metodoPago" class="form-select">
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Tarjeta</option>
                <option>Otro</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Proveedor</label>
              <input v-model="form.proveedor" type="text" class="form-control" placeholder="Opcional" />
            </div>
            <div class="mb-3">
              <label class="form-label">Notas</label>
              <textarea v-model="form.notas" class="form-control" rows="2"></textarea>
            </div>
            <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cerrarModal">Cancelar</button>
            <button class="btn btn-warning" @click="guardar">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { exportarXLSX, exportarPDF, exportarGoogleSheets } from '../utils/exportar'

const auth = useAuthStore()
import { API_URL } from '../config/api'

const gastos = ref([])
const categorias = ref([])
const resumen = ref({})
const cargando = ref(false)
const modalVisible = ref(false)
const editando = ref(false)
const error = ref('')
const periodo = ref('mes')

const filtros = ref({
  desde: '',
  hasta: '',
  tipo: '',
  categoriaId: ''
})

const form = ref({
  _id: null,
  fecha: '',
  concepto: '',
  monto: 0,
  tipo: 'variable',
  categoriaId: '',
  metodoPago: 'Efectivo',
  proveedor: '',
  notas: ''
})

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${auth.token}`
})

const categoriasFijas = computed(() => categorias.value.filter((c) => c.tipo === 'fijo'))
const categoriasVariables = computed(() => categorias.value.filter((c) => c.tipo === 'variable'))

const setPeriodo = (p) => {
  periodo.value = p
  const hoy = new Date()
  const yyyy = hoy.getFullYear()
  const mm = String(hoy.getMonth() + 1).padStart(2, '0')
  const dd = String(hoy.getDate()).padStart(2, '0')

  if (p === 'hoy') {
    filtros.value.desde = `${yyyy}-${mm}-${dd}`
    filtros.value.hasta = `${yyyy}-${mm}-${dd}`
  } else if (p === 'semana') {
    const primerDia = new Date(hoy)
    primerDia.setDate(hoy.getDate() - hoy.getDay())
    filtros.value.desde = primerDia.toISOString().slice(0, 10)
    filtros.value.hasta = `${yyyy}-${mm}-${dd}`
  } else if (p === 'mes') {
    const primerDia = new Date(yyyy, hoy.getMonth(), 1)
    filtros.value.desde = primerDia.toISOString().slice(0, 10)
    filtros.value.hasta = `${yyyy}-${mm}-${dd}`
  }
  cargar()
}

const cargarCategorias = async () => {
  const res = await fetch(`${API_URL}/expenses/categories`, { headers: headers() })
  if (res.ok) categorias.value = await res.json()
}

const cargar = async () => {
  cargando.value = true
  const params = new URLSearchParams()
  if (filtros.value.desde) params.append('desde', filtros.value.desde)
  if (filtros.value.hasta) params.append('hasta', filtros.value.hasta)
  if (filtros.value.tipo) params.append('tipo', filtros.value.tipo)
  if (filtros.value.categoriaId) params.append('categoriaId', filtros.value.categoriaId)

  const [resGastos, resResumen] = await Promise.all([
    fetch(`${API_URL}/expenses?${params}`, { headers: headers() }),
    fetch(`${API_URL}/expenses/resumen?${params}`, { headers: headers() })
  ])

  if (resGastos.ok) gastos.value = await resGastos.json()
  if (resResumen.ok) resumen.value = await resResumen.json()
  cargando.value = false
}

const limpiarFiltros = () => {
  filtros.value = { desde: '', hasta: '', tipo: '', categoriaId: '' }
  periodo.value = ''
  cargar()
}

const abrirModalCrear = () => {
  editando.value = false
  error.value = ''
  const hoy = new Date().toISOString().slice(0, 10)
  form.value = {
    _id: null,
    fecha: hoy,
    concepto: '',
    monto: 0,
    tipo: 'variable',
    categoriaId: '',
    metodoPago: 'Efectivo',
    proveedor: '',
    notas: ''
  }
  modalVisible.value = true
}

const abrirModalEditar = (g) => {
  editando.value = true
  error.value = ''
  form.value = {
    _id: g._id,
    fecha: g.fecha?.slice(0, 10),
    concepto: g.concepto,
    monto: g.monto,
    tipo: g.tipo,
    categoriaId: g.categoriaId?._id || g.categoriaId,
    metodoPago: g.metodoPago,
    proveedor: g.proveedor,
    notas: g.notas
  }
  modalVisible.value = true
}

const alCambiarCategoria = () => {
  const cat = categorias.value.find((c) => c._id === form.value.categoriaId)
  if (cat) form.value.tipo = cat.tipo
}

const cerrarModal = () => { modalVisible.value = false }

const guardar = async () => {
  error.value = ''
  if (!form.value.concepto || !form.value.monto || !form.value.categoriaId) {
    error.value = 'Concepto, monto y categoría son obligatorios'
    return
  }
  try {
    const url = editando.value ? `${API_URL}/expenses/${form.value._id}` : `${API_URL}/expenses`
    const method = editando.value ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: headers(),
      body: JSON.stringify(form.value)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error al guardar')
    cerrarModal()
    cargar()
  } catch (e) {
    error.value = e.message
  }
}

const eliminar = async (g) => {
  if (!confirm(`¿Eliminar el gasto "${g.concepto}"?`)) return
  const res = await fetch(`${API_URL}/expenses/${g._id}`, {
    method: 'DELETE',
    headers: headers()
  })
  if (res.ok) cargar()
  else alert('Error al eliminar')
}

const formatFecha = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const columnas = [
  { titulo: 'Fecha', valor: (g) => formatFecha(g.fecha) },
  { titulo: 'Concepto', valor: (g) => g.concepto },
  { titulo: 'Categoría', valor: (g) => g.categoriaId?.nombre || '—' },
  { titulo: 'Tipo', valor: (g) => g.tipo },
  { titulo: 'Método', valor: (g) => g.metodoPago },
  { titulo: 'Proveedor', valor: (g) => g.proveedor || '—' },
  { titulo: 'Monto', valor: (g) => g.monto.toFixed(2) }
]

const subtituloPeriodo = computed(() => {
  const d = filtros.value.desde ? formatFecha(filtros.value.desde) : 'inicio'
  const h = filtros.value.hasta ? formatFecha(filtros.value.hasta) : 'hoy'
  return `Período: ${d} - ${h} | Total: $${resumen.value.total?.toFixed(2) || '0.00'}`
})

const exportarExcel = () => {
  exportarXLSX(gastos.value, columnas, `gastos-${new Date().toISOString().slice(0, 10)}`, 'Gastos')
}

const exportarPdf = () => {
  exportarPDF(gastos.value, columnas, 'Reporte de Gastos - La Botanita', `gastos-${new Date().toISOString().slice(0, 10)}`, subtituloPeriodo.value)
}

const exportarSheets = () => {
  exportarGoogleSheets(gastos.value, columnas, `gastos-${new Date().toISOString().slice(0, 10)}`)
}

onMounted(async () => {
  await cargarCategorias()
  setPeriodo('mes')
})
</script>
