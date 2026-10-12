<template>
  <div class="container-fluid mt-4">
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h2><i class="bi bi-boxes"></i> Inventario y Movimientos</h2>
      <div class="d-flex gap-2">
        <button class="btn btn-success" @click="abrirModalEntrada">
          <i class="bi bi-box-arrow-in-down"></i> Entrada
        </button>
        <button class="btn btn-danger" @click="abrirModalSalida">
          <i class="bi bi-box-arrow-up"></i> Salida
        </button>
        <button v-if="auth.isAdmin" class="btn btn-secondary" @click="abrirModalAjuste">
          <i class="bi bi-sliders"></i> Ajuste
        </button>
      </div>
    </div>

    <!-- Resumen -->
    <div class="row g-3 mb-3">
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <div class="small">Productos</div>
                <div class="fs-3 fw-bold">{{ resumen.totalProductos || 0 }}</div>
              </div>
              <i class="bi bi-box-seam fs-1 opacity-50"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <div class="small">Presentaciones</div>
                <div class="fs-3 fw-bold">{{ resumen.totalPresentaciones || 0 }}</div>
              </div>
              <i class="bi bi-tags fs-1 opacity-50"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <div class="small">Valor inventario</div>
                <div class="fs-3 fw-bold">${{ (resumen.valorTotalInventario || 0).toFixed(2) }}</div>
              </div>
              <i class="bi bi-currency-dollar fs-1 opacity-50"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div :class="resumen.presentacionesBajoStock > 0 ? 'card bg-danger text-white' : 'card bg-secondary text-white'">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <div class="small">Bajo stock</div>
                <div class="fs-3 fw-bold">{{ resumen.presentacionesBajoStock || 0 }}</div>
              </div>
              <i class="bi bi-exclamation-triangle fs-1 opacity-50"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alertas.length > 0" class="card border-danger mb-3">
      <div class="card-header bg-danger text-white">
        <i class="bi bi-exclamation-triangle-fill"></i> Alertas de bajo stock ({{ alertas.length }})
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-sm mb-0">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Presentación</th>
                <th class="text-center">Stock</th>
                <th class="text-center">Mínimo</th>
                <th class="text-center">Faltan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in alertas" :key="a.presentacionId">
                <td>{{ a.productoNombre }}</td>
                <td><span class="badge bg-secondary">{{ a.categoria }}</span></td>
                <td>{{ a.presentacionNombre }}</td>
                <td class="text-center">
                  <span class="badge bg-danger">{{ a.stock }}</span>
                </td>
                <td class="text-center">{{ a.stockMinimo }}</td>
                <td class="text-center"><strong>{{ a.faltante }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card mb-3">
      <div class="card-body">
        <h6 class="card-title">Historial de movimientos</h6>
        <div class="row g-2">
          <div class="col-md-4">
            <select v-model="filtros.producto" @change="cargarMovimientos" class="form-select form-select-sm">
              <option value="">Todos los productos</option>
              <option v-for="p in productos" :key="p._id" :value="p._id">{{ p.nombre }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="filtros.tipo" @change="cargarMovimientos" class="form-select form-select-sm">
              <option value="">Todos los tipos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
              <option value="ajuste">Ajustes</option>
            </select>
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
            <th>Producto</th>
            <th>Presentación</th>
            <th class="text-center">Tipo</th>
            <th class="text-center">Cantidad</th>
            <th class="text-center">Stock antes → después</th>
            <th>Motivo</th>
            <th>Usuario</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in movimientos" :key="m._id">
            <td class="small">{{ formatFecha(m.createdAt) }}</td>
            <td>{{ m.productoId?.nombre || 'N/A' }}</td>
            <td>{{ m.presentacionNombre }}</td>
            <td class="text-center">
              <span :class="badgeTipo(m.tipo)">{{ m.tipo }}</span>
            </td>
            <td class="text-center">
              <strong v-if="m.tipo === 'entrada'" class="text-success">+{{ m.cantidad }}</strong>
              <strong v-else-if="m.tipo === 'salida'" class="text-danger">-{{ m.cantidad }}</strong>
              <strong v-else class="text-secondary">={{ m.cantidad }}</strong>
            </td>
            <td class="text-center small">{{ m.stockAnterior }} → <strong>{{ m.stockNuevo }}</strong></td>
            <td class="small">{{ m.motivo || '-' }}</td>
            <td class="small">{{ m.usuarioId?.nombre || '-' }}</td>
          </tr>
          <tr v-if="movimientos.length === 0">
            <td colspan="8" class="text-center text-muted py-4">No hay movimientos registrados</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="modalVisible" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i :class="iconoTipo"></i> {{ tituloModal }}
            </h5>
            <button type="button" class="btn-close" @click="cerrarModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Producto *</label>
              <select v-model="form.productoId" class="form-select" @change="alCambiarProducto">
                <option value="">-- Selecciona --</option>
                <option v-for="p in productos" :key="p._id" :value="p._id">{{ p.nombre }}</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Presentación *</label>
              <select v-model="form.presentacionId" class="form-select" :disabled="!form.productoId">
                <option value="">-- Selecciona --</option>
                <option v-for="pres in presentacionesDisponibles" :key="pres._id" :value="pres._id">
                  {{ pres.nombre }} — stock actual: {{ pres.stock }}
                </option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">
                {{ tipoMovimiento === 'ajuste' ? 'Nuevo stock (valor absoluto)' : 'Cantidad' }} *
              </label>
              <input v-model.number="form.cantidad" type="number" min="0" class="form-control" />
            </div>

            <div class="mb-3">
              <label class="form-label">Motivo</label>
              <input v-model="form.motivo" type="text" class="form-control" placeholder="Ej: compra a proveedor, merma, conteo físico..." />
            </div>

            <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cerrarModal">Cancelar</button>
            <button class="btn" :class="btnClase" @click="guardar">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
import { API_URL } from '../config/api'

const productos = ref([])
const movimientos = ref([])
const alertas = ref([])
const resumen = ref({})
const cargando = ref(false)
const modalVisible = ref(false)
const tipoMovimiento = ref('entrada')
const error = ref('')

const filtros = ref({ producto: '', tipo: '' })

const form = ref({
  productoId: '',
  presentacionId: '',
  cantidad: 0,
  motivo: ''
})

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${auth.token}`
})

const tituloModal = computed(() => {
  if (tipoMovimiento.value === 'entrada') return 'Registrar Entrada'
  if (tipoMovimiento.value === 'salida') return 'Registrar Salida'
  return 'Ajustar Inventario'
})

const iconoTipo = computed(() => {
  if (tipoMovimiento.value === 'entrada') return 'bi bi-box-arrow-in-down text-success'
  if (tipoMovimiento.value === 'salida') return 'bi bi-box-arrow-up text-danger'
  return 'bi bi-sliders text-secondary'
})

const btnClase = computed(() => {
  if (tipoMovimiento.value === 'entrada') return 'btn-success'
  if (tipoMovimiento.value === 'salida') return 'btn-danger'
  return 'btn-secondary'
})

const presentacionesDisponibles = computed(() => {
  const prod = productos.value.find((p) => p._id === form.value.productoId)
  return prod ? prod.presentaciones : []
})

const formatFecha = (iso) => {
  const d = new Date(iso)
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const badgeTipo = (tipo) => {
  if (tipo === 'entrada') return 'badge bg-success'
  if (tipo === 'salida') return 'badge bg-danger'
  return 'badge bg-secondary'
}

const cargarProductos = async () => {
  const res = await fetch(`${API_URL}/products`, { headers: headers() })
  if (res.ok) productos.value = await res.json()
}

const cargarMovimientos = async () => {
  cargando.value = true
  const params = new URLSearchParams()
  if (filtros.value.producto) params.append('producto', filtros.value.producto)
  if (filtros.value.tipo) params.append('tipo', filtros.value.tipo)
  params.append('limit', '100')

  const res = await fetch(`${API_URL}/inventory/movements?${params}`, { headers: headers() })
  if (res.ok) movimientos.value = await res.json()
  cargando.value = false
}

const cargarAlertas = async () => {
  const res = await fetch(`${API_URL}/inventory/alerts`, { headers: headers() })
  if (res.ok) alertas.value = await res.json()
}

const cargarResumen = async () => {
  const res = await fetch(`${API_URL}/inventory/resumen`, { headers: headers() })
  if (res.ok) resumen.value = await res.json()
}

const abrirModal = (tipo) => {
  tipoMovimiento.value = tipo
  error.value = ''
  form.value = { productoId: '', presentacionId: '', cantidad: 0, motivo: '' }
  modalVisible.value = true
}

const abrirModalEntrada = () => abrirModal('entrada')
const abrirModalSalida = () => abrirModal('salida')
const abrirModalAjuste = () => abrirModal('ajuste')

const alCambiarProducto = () => {
  form.value.presentacionId = ''
  form.value.cantidad = 0
}

const cerrarModal = () => { modalVisible.value = false }

const guardar = async () => {
  error.value = ''
  if (!form.value.productoId || !form.value.presentacionId) {
    error.value = 'Selecciona producto y presentación'
    return
  }

  let url, method = 'POST', body

  if (tipoMovimiento.value === 'entrada') {
    url = `${API_URL}/inventory/entrada`
    body = {
      productoId: form.value.productoId,
      presentacionId: form.value.presentacionId,
      cantidad: form.value.cantidad,
      motivo: form.value.motivo
    }
  } else if (tipoMovimiento.value === 'salida') {
    url = `${API_URL}/inventory/salida`
    body = {
      productoId: form.value.productoId,
      presentacionId: form.value.presentacionId,
      cantidad: form.value.cantidad,
      motivo: form.value.motivo
    }
  } else {
    url = `${API_URL}/inventory/ajuste`
    method = 'PUT'
    body = {
      productoId: form.value.productoId,
      presentacionId: form.value.presentacionId,
      nuevoStock: form.value.cantidad,
      motivo: form.value.motivo
    }
  }

  try {
    const res = await fetch(url, {
      method,
      headers: headers(),
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error al guardar')

    cerrarModal()
    await Promise.all([cargarProductos(), cargarMovimientos(), cargarAlertas(), cargarResumen()])
  } catch (e) {
    error.value = e.message
  }
}

onMounted(async () => {
  await cargarProductos()
  await Promise.all([cargarMovimientos(), cargarAlertas(), cargarResumen()])
})
</script>
