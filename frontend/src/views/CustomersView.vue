<template>
  <div class="container-fluid mt-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2><i class="bi bi-people-fill"></i> Clientes</h2>
      <button class="btn btn-warning" @click="abrirModalCrear">
        <i class="bi bi-plus-circle"></i> Nuevo Cliente
      </button>
    </div>

    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input v-model="filtros.search" @input="cargar" type="text" class="form-control" placeholder="Buscar por nombre o teléfono..." />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-check mt-2">
              <input v-model="filtros.soloDeudores" @change="cargar" class="form-check-input" type="checkbox" id="deudoresCheck" />
              <label class="form-check-label" for="deudoresCheck">
                <i class="bi bi-exclamation-circle text-danger"></i> Solo deudores
              </label>
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
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th class="text-end">Límite crédito</th>
            <th class="text-end">Saldo actual</th>
            <th>Estado</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in clientes" :key="c._id">
            <td><strong>{{ c.nombre }}</strong></td>
            <td>{{ c.telefono || '—' }}</td>
            <td class="small">{{ c.direccion || '—' }}</td>
            <td class="text-end">${{ c.limiteCredito.toFixed(2) }}</td>
            <td class="text-end">
              <span :class="c.saldoActual > 0 ? 'badge bg-danger fs-6' : 'badge bg-success fs-6'">
                ${{ c.saldoActual.toFixed(2) }}
              </span>
            </td>
            <td>
              <span :class="c.activo ? 'badge bg-success' : 'badge bg-secondary'">
                {{ c.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-info me-1" @click="verHistorial(c)" title="Ver historial">
                <i class="bi bi-clock-history"></i>
              </button>
              <button class="btn btn-sm btn-outline-primary me-1" @click="abrirModalEditar(c)">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="eliminar(c)">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
          <tr v-if="clientes.length === 0">
            <td colspan="7" class="text-center text-muted py-4">No hay clientes registrados</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Crear/Editar -->
    <div v-if="modalVisible" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editando ? 'Editar' : 'Nuevo' }} Cliente</h5>
            <button type="button" class="btn-close" @click="cerrarModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Nombre *</label>
              <input v-model="form.nombre" type="text" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Teléfono</label>
              <input v-model="form.telefono" type="tel" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Dirección</label>
              <input v-model="form.direccion" type="text" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Límite de crédito</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input v-model.number="form.limiteCredito" type="number" min="0" class="form-control" />
              </div>
              <small class="text-muted">0 = sin límite</small>
            </div>
            <div class="mb-3">
              <label class="form-label">Notas</label>
              <textarea v-model="form.notas" class="form-control" rows="2"></textarea>
            </div>
            <div v-if="editando" class="form-check">
              <input v-model="form.activo" type="checkbox" class="form-check-input" id="activoCheck" />
              <label class="form-check-label" for="activoCheck">Activo</label>
            </div>
            <div v-if="error" class="alert alert-danger mt-3 py-2">{{ error }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cerrarModal">Cancelar</button>
            <button class="btn btn-warning" @click="guardar">Guardar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Historial -->
    <div v-if="historialVisible" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-clock-history"></i> Historial de {{ clienteSeleccionado.nombre }}
            </h5>
            <button type="button" class="btn-close" @click="historialVisible = false"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <strong>Saldo actual:</strong> ${{ clienteSeleccionado.saldoActual?.toFixed(2) }}
              <span v-if="clienteSeleccionado.limiteCredito > 0">
                de ${{ clienteSeleccionado.limiteCredito.toFixed(2) }} de límite
              </span>
            </div>
            <h6>Deudas</h6>
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Folio</th>
                    <th class="text-end">Total</th>
                    <th class="text-end">Saldo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in deudasCliente" :key="d._id">
                    <td class="small">{{ formatFecha(d.fecha) }}</td>
                    <td>{{ d.folioVenta }}</td>
                    <td class="text-end">${{ d.montoTotal.toFixed(2) }}</td>
                    <td class="text-end">${{ d.saldoPendiente.toFixed(2) }}</td>
                    <td><span :class="badgeDeuda(d.estado)">{{ d.estado }}</span></td>
                  </tr>
                  <tr v-if="deudasCliente.length === 0">
                    <td colspan="5" class="text-center text-muted">Sin deudas registradas</td>
                  </tr>
                </tbody>
              </table>
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

const clientes = ref([])
const cargando = ref(false)
const modalVisible = ref(false)
const editando = ref(false)
const error = ref('')
const filtros = ref({ search: '', soloDeudores: false })

const form = ref({
  _id: null,
  nombre: '',
  telefono: '',
  direccion: '',
  limiteCredito: 0,
  notas: '',
  activo: true
})

const historialVisible = ref(false)
const clienteSeleccionado = ref({})
const deudasCliente = ref([])

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${auth.token}`
})

const cargar = async () => {
  cargando.value = true
  const params = new URLSearchParams()
  if (filtros.value.search) params.append('search', filtros.value.search)
  if (filtros.value.soloDeudores) params.append('soloDeudores', 'true')

  const res = await fetch(`${API_URL}/customers?${params}`, { headers: headers() })
  if (res.ok) clientes.value = await res.json()
  cargando.value = false
}

const abrirModalCrear = () => {
  editando.value = false
  error.value = ''
  form.value = { _id: null, nombre: '', telefono: '', direccion: '', limiteCredito: 0, notas: '', activo: true }
  modalVisible.value = true
}

const abrirModalEditar = (c) => {
  editando.value = true
  error.value = ''
  form.value = { ...c }
  modalVisible.value = true
}

const cerrarModal = () => { modalVisible.value = false }

const guardar = async () => {
  error.value = ''
  if (!form.value.nombre) {
    error.value = 'El nombre es obligatorio'
    return
  }
  try {
    const url = editando.value ? `${API_URL}/customers/${form.value._id}` : `${API_URL}/customers`
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

const eliminar = async (c) => {
  if (!confirm(`¿Desactivar a ${c.nombre}?`)) return
  const res = await fetch(`${API_URL}/customers/${c._id}`, {
    method: 'DELETE',
    headers: headers()
  })
  const data = await res.json()
  if (res.ok) cargar()
  else alert(data.message)
}

const verHistorial = async (c) => {
  const res = await fetch(`${API_URL}/customers/${c._id}`, { headers: headers() })
  if (res.ok) {
    const data = await res.json()
    clienteSeleccionado.value = data.cliente
    deudasCliente.value = data.deudas
    historialVisible.value = true
  }
}

const formatFecha = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const badgeDeuda = (estado) => {
  if (estado === 'pagada') return 'badge bg-success'
  if (estado === 'vencida') return 'badge bg-danger'
  return 'badge bg-warning text-dark'
}

onMounted(cargar)
</script>
