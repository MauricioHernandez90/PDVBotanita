<template>
  <div class="container-fluid mt-4">
    <h2><i class="bi bi-receipt"></i> Historial de Ventas</h2>

    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-md-3">
            <label class="form-label small">Desde</label>
            <input v-model="filtros.desde" @change="cargar" type="date" class="form-control form-control-sm" />
          </div>
          <div class="col-md-3">
            <label class="form-label small">Hasta</label>
            <input v-model="filtros.hasta" @change="cargar" type="date" class="form-control form-control-sm" />
          </div>
          <div class="col-md-3">
            <label class="form-label small">Método de pago</label>
            <select v-model="filtros.metodoPago" @change="cargar" class="form-select form-select-sm">
              <option value="">Todos</option>
              <option>Efectivo</option>
              <option>Tarjeta</option>
              <option>Transferencia</option>
              <option>Fiado</option>
            </select>
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <button class="btn btn-sm btn-outline-secondary w-100" @click="limpiar">
              <i class="bi bi-x-circle"></i> Limpiar filtros
            </button>
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
            <th>Folio</th>
            <th>Fecha</th>
            <th>Cajero</th>
            <th>Cliente</th>
            <th>Método</th>
            <th class="text-end">Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in ventas" :key="v._id">
            <td><strong>{{ v.folio }}</strong></td>
            <td class="small">{{ formatFecha(v.fecha) }}</td>
            <td class="small">{{ v.cajeroId?.nombre }}</td>
            <td class="small">{{ v.clienteId?.nombre || '—' }}</td>
            <td><span :class="badgeMetodo(v.metodoPago)">{{ v.metodoPago }}</span></td>
            <td class="text-end fw-bold">${{ v.total.toFixed(2) }}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary" @click="verDetalle(v)">
                <i class="bi bi-eye"></i>
              </button>
            </td>
          </tr>
          <tr v-if="ventas.length === 0">
            <td colspan="7" class="text-center text-muted py-4">No hay ventas en el período</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="detalleVisible" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Venta {{ detalle.venta?.folio }}</h5>
            <button type="button" class="btn-close" @click="detalleVisible = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-2"><strong>Fecha:</strong> {{ formatFecha(detalle.venta?.fecha) }}</div>
            <div class="mb-2"><strong>Cajero:</strong> {{ detalle.venta?.cajeroId?.nombre }}</div>
            <div class="mb-2"><strong>Método:</strong> {{ detalle.venta?.metodoPago }}</div>
            <hr />
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="text-center">Cant</th>
                  <th class="text-end">P.Unit</th>
                  <th class="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in detalle.items" :key="item._id">
                  <td>{{ item.productoNombre }} <small class="text-muted d-block">{{ item.presentacionNombre }}</small></td>
                  <td class="text-center">{{ item.cantidad }}</td>
                  <td class="text-end">${{ item.precioUnitario.toFixed(2) }}</td>
                  <td class="text-end">${{ item.subtotal.toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
            <hr />
            <div class="d-flex justify-content-between">
              <span>Subtotal:</span><span>${{ detalle.venta?.subtotal.toFixed(2) }}</span>
            </div>
            <div class="d-flex justify-content-between fw-bold fs-5">
              <span>TOTAL:</span><span>${{ detalle.venta?.total.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
import { API_URL } from '../config/api'

const ventas = ref([])
const cargando = ref(false)
const filtros = ref({ desde: '', hasta: '', metodoPago: '' })
const detalleVisible = ref(false)
const detalle = ref({})

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${auth.token}`
})

const cargar = async () => {
  cargando.value = true
  const params = new URLSearchParams()
  if (filtros.value.desde) params.append('desde', filtros.value.desde)
  if (filtros.value.hasta) params.append('hasta', filtros.value.hasta + 'T23:59:59')
  if (filtros.value.metodoPago) params.append('metodoPago', filtros.value.metodoPago)

  const res = await fetch(`${API_URL}/sales?${params}`, { headers: headers() })
  if (res.ok) ventas.value = await res.json()
  cargando.value = false
}

const limpiar = () => {
  filtros.value = { desde: '', hasta: '', metodoPago: '' }
  cargar()
}

const verDetalle = async (v) => {
  const res = await fetch(`${API_URL}/sales/${v._id}`, { headers: headers() })
  if (res.ok) {
    detalle.value = await res.json()
    detalleVisible.value = true
  }
}

const formatFecha = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const badgeMetodo = (m) => {
  if (m === 'Efectivo') return 'badge bg-success'
  if (m === 'Tarjeta') return 'badge bg-primary'
  if (m === 'Transferencia') return 'badge bg-info'
  return 'badge bg-warning text-dark'
}

onMounted(cargar)
</script>
