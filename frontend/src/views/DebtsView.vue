<template>
  <div class="container-fluid mt-4">
    <h2 class="mb-3"><i class="bi bi-cash-coin"></i> Deudores y Abonos</h2>

    <div class="row g-3 mb-3">
      <div class="col-md-3">
        <div class="card bg-danger text-white">
          <div class="card-body">
            <div class="small">Total por cobrar</div>
            <div class="fs-3 fw-bold">${{ resumen.totalPorCobrar?.toFixed(2) || '0.00' }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-dark">
          <div class="card-body">
            <div class="small">Deudas vencidas</div>
            <div class="fs-3 fw-bold">${{ resumen.totalVencido?.toFixed(2) || '0.00' }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <div class="small">Número de deudores</div>
            <div class="fs-3 fw-bold">{{ resumen.numeroDeudores || 0 }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body">
            <div class="small">Abonado hoy</div>
            <div class="fs-3 fw-bold">${{ resumen.totalAbonadoHoy?.toFixed(2) || '0.00' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-md-4">
            <select v-model="filtros.estado" @change="cargar" class="form-select">
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="vencida">Vencidas</option>
              <option value="pagada">Pagadas</option>
            </select>
          </div>
          <div class="col-md-3">
            <div class="form-check mt-2">
              <input v-model="filtros.soloVencidas" @change="cargar" class="form-check-input" type="checkbox" id="vencidasCheck" />
              <label class="form-check-label" for="vencidasCheck">Solo vencidas</label>
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
            <th>Cliente</th>
            <th>Folio venta</th>
            <th>Fecha</th>
            <th>Vencimiento</th>
            <th class="text-end">Total</th>
            <th class="text-end">Saldo</th>
            <th>Estado</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in deudas" :key="d._id">
            <td><strong>{{ d.clienteId?.nombre }}</strong></td>
            <td>{{ d.folioVenta }}</td>
            <td class="small">{{ formatFecha(d.fecha) }}</td>
            <td class="small">
              {{ d.fechaVencimiento ? formatFecha(d.fechaVencimiento) : '—' }}
              <i v-if="esVencida(d)" class="bi bi-exclamation-triangle-fill text-danger"></i>
            </td>
            <td class="text-end">${{ d.montoTotal.toFixed(2) }}</td>
            <td class="text-end fw-bold">${{ d.saldoPendiente.toFixed(2) }}</td>
            <td><span :class="badgeEstado(d)">{{ estadoReal(d) }}</span></td>
            <td class="text-end">
              <button
                v-if="d.estado !== 'pagada'"
                class="btn btn-sm btn-success me-1"
                @click="abrirModalAbono(d)"
              >
                <i class="bi bi-cash"></i> Abonar
              </button>
              <button class="btn btn-sm btn-outline-info" @click="verDetalle(d)">
                <i class="bi bi-eye"></i>
              </button>
            </td>
          </tr>
          <tr v-if="deudas.length === 0">
            <td colspan="8" class="text-center text-muted py-4">No hay deudas registradas</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Abono -->
    <div v-if="abonoVisible" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title"><i class="bi bi-cash"></i> Registrar Abono</h5>
            <button type="button" class="btn-close btn-close-white" @click="abonoVisible = false"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <div><strong>Cliente:</strong> {{ deudaSeleccionada.clienteId?.nombre }}</div>
              <div><strong>Folio:</strong> {{ deudaSeleccionada.folioVenta }}</div>
              <div><strong>Saldo pendiente:</strong> ${{ deudaSeleccionada.saldoPendiente?.toFixed(2) }}</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Monto a abonar *</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input v-model.number="formAbono.monto" type="number" min="0" :max="deudaSeleccionada.saldoPendiente" step="0.50" class="form-control form-control-lg" />
              </div>
              <div class="mt-2">
                <button class="btn btn-sm btn-outline-secondary" @click="formAbono.monto = deudaSeleccionada.saldoPendiente">
                  Pagar todo (${{ deudaSeleccionada.saldoPendiente?.toFixed(2) }})
                </button>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Método de pago</label>
              <select v-model="formAbono.metodoPago" class="form-select">
                <option>Efectivo</option>
                <option>Tarjeta</option>
                <option>Transferencia</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Nota</label>
              <input v-model="formAbono.nota" type="text" class="form-control" placeholder="Opcional" />
            </div>
            <div v-if="errorAbono" class="alert alert-danger py-2">{{ errorAbono }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="abonoVisible = false">Cancelar</button>
            <button class="btn btn-success" @click="guardarAbono">Registrar Abono</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Detalle -->
    <div v-if="detalleVisible" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Deuda {{ detalle.deuda?.folioVenta }}</h5>
            <button type="button" class="btn-close" @click="detalleVisible = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-2"><strong>Cliente:</strong> {{ detalle.deuda?.clienteId?.nombre }}</div>
            <div class="mb-2"><strong>Total:</strong> ${{ detalle.deuda?.montoTotal.toFixed(2) }}</div>
            <div class="mb-2"><strong>Saldo:</strong> ${{ detalle.deuda?.saldoPendiente.toFixed(2) }}</div>
            <hr />
            <h6>Abonos</h6>
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th class="text-end">Monto</th>
                  <th>Método</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in detalle.abonos" :key="a._id">
                  <td class="small">{{ formatFecha(a.createdAt) }}</td>
                  <td class="text-end">${{ a.monto.toFixed(2) }}</td>
                  <td>{{ a.metodoPago }}</td>
                  <td class="small">{{ a.usuarioId?.nombre }}</td>
                </tr>
                <tr v-if="!detalle.abonos?.length">
                  <td colspan="4" class="text-center text-muted">Sin abonos</td>
                </tr>
              </tbody>
            </table>
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

const deudas = ref([])
const resumen = ref({})
const cargando = ref(false)
const filtros = ref({ estado: '', soloVencidas: false })

const abonoVisible = ref(false)
const deudaSeleccionada = ref({})
const formAbono = ref({ monto: 0, metodoPago: 'Efectivo', nota: '' })
const errorAbono = ref('')

const detalleVisible = ref(false)
const detalle = ref({})

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${auth.token}`
})

const cargar = async () => {
  cargando.value = true
  const params = new URLSearchParams()
  if (filtros.value.estado) params.append('estado', filtros.value.estado)
  if (filtros.value.soloVencidas) params.append('soloVencidas', 'true')

  const [resDeudas, resResumen] = await Promise.all([
    fetch(`${API_URL}/debts?${params}`, { headers: headers() }),
    fetch(`${API_URL}/debts/resumen`, { headers: headers() })
  ])

  if (resDeudas.ok) deudas.value = await resDeudas.json()
  if (resResumen.ok) resumen.value = await resResumen.json()
  cargando.value = false
}

const abrirModalAbono = (d) => {
  deudaSeleccionada.value = d
  formAbono.value = { monto: 0, metodoPago: 'Efectivo', nota: '' }
  errorAbono.value = ''
  abonoVisible.value = true
}

const guardarAbono = async () => {
  errorAbono.value = ''
  if (!formAbono.value.monto || formAbono.value.monto <= 0) {
    errorAbono.value = 'Ingresa un monto válido'
    return
  }
  try {
    const res = await fetch(`${API_URL}/debts/${deudaSeleccionada.value._id}/abonar`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(formAbono.value)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    abonoVisible.value = false
    cargar()
  } catch (e) {
    errorAbono.value = e.message
  }
}

const verDetalle = async (d) => {
  const res = await fetch(`${API_URL}/debts/${d._id}`, { headers: headers() })
  if (res.ok) {
    detalle.value = await res.json()
    detalleVisible.value = true
  }
}

const formatFecha = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const esVencida = (d) => d.estado === 'vencida' || (d.estado === 'pendiente' && d.fechaVencimiento && new Date(d.fechaVencimiento) < new Date())

const estadoReal = (d) => {
  if (d.estado === 'pagada') return 'pagada'
  if (esVencida(d)) return 'vencida'
  return 'pendiente'
}

const badgeEstado = (d) => {
  const e = estadoReal(d)
  if (e === 'pagada') return 'badge bg-success'
  if (e === 'vencida') return 'badge bg-danger'
  return 'badge bg-warning text-dark'
}

onMounted(cargar)
</script>
