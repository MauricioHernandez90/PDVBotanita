<template>
  <div class="container-fluid mt-3">
    <div v-if="!sesion" class="alert alert-warning d-flex justify-content-between align-items-center">
      <div>
        <i class="bi bi-exclamation-triangle-fill"></i>
        <strong> No tienes la caja abierta.</strong> Debes abrirla antes de vender.
      </div>
      <router-link to="/caja" class="btn btn-warning">
        <i class="bi bi-cash-stack"></i> Abrir Caja
      </router-link>
    </div>

    <div v-else class="row g-3">
      <div class="col-lg-7">
        <div class="card mb-2">
          <div class="card-body py-2">
            <div class="row g-2">
              <div class="col-8">
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-search"></i></span>
                  <input
                    ref="inputBusqueda"
                    v-model="busqueda"
                    @keydown.enter="buscarPorCodigo"
                    type="text"
                    class="form-control form-control-lg"
                    placeholder="Buscar producto o escanear código..."
                  />
                </div>
              </div>
              <div class="col-4">
                <select v-model="categoriaFiltro" class="form-select form-select-lg">
                  <option value="">Todas</option>
                  <option v-for="c in categorias" :key="c._id" :value="c._id">{{ c.nombre }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-2">
          <div v-for="p in productosFiltrados" :key="p._id" class="col-6 col-md-4">
            <div class="card h-100">
              <div class="card-body p-2">
                <div class="fw-bold small">{{ p.nombre }}</div>
                <div class="text-muted small mb-2">{{ p.categoriaId?.nombre || '' }}</div>
                <div class="d-flex flex-wrap gap-1">
                  <button
                    v-for="pres in p.presentaciones"
                    :key="pres._id"
                    @click="agregarAlCarrito(p, pres)"
                    :disabled="pres.stock <= 0"
                    :class="pres.stock <= 0 ? 'btn btn-sm btn-outline-secondary disabled' : 'btn btn-sm btn-outline-success'"
                    :title="`Stock: ${pres.stock}`"
                  >
                    {{ pres.nombre }}<br>${{ pres.precio }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="productosFiltrados.length === 0" class="col-12 text-center text-muted py-4">
            No hay productos que coincidan
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="card sticky-top" style="top: 10px;">
          <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
            <span><i class="bi bi-cart3"></i> Carrito ({{ carrito.length }})</span>
            <button v-if="carrito.length > 0" class="btn btn-sm btn-outline-light" @click="carrito = []">
              <i class="bi bi-trash"></i> Vaciar
            </button>
          </div>
          <div class="card-body" style="max-height: 400px; overflow-y: auto;">
            <div v-if="carrito.length === 0" class="text-center text-muted py-4">
              El carrito está vacío
            </div>
            <div v-for="(item, i) in carrito" :key="i" class="d-flex justify-content-between align-items-center border-bottom py-2">
              <div class="flex-grow-1">
                <div class="fw-bold small">{{ item.productoNombre }}</div>
                <div class="text-muted small">
                  {{ item.presentacionNombre }} - ${{ item.precioUnitario }}
                </div>
              </div>
              <div class="d-flex align-items-center gap-1">
                <button class="btn btn-sm btn-outline-secondary" @click="restar(i)">
                  <i class="bi bi-dash"></i>
                </button>
                <span class="fw-bold" style="min-width: 30px; text-align: center;">{{ item.cantidad }}</span>
                <button class="btn btn-sm btn-outline-secondary" @click="sumar(i)">
                  <i class="bi bi-plus"></i>
                </button>
                <span class="fw-bold ms-2" style="min-width: 70px; text-align: right;">
                  ${{ (item.precioUnitario * item.cantidad).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <div class="d-flex justify-content-between">
              <span>Subtotal:</span>
              <span>${{ subtotal.toFixed(2) }}</span>
            </div>
            <div v-if="impuestos > 0" class="d-flex justify-content-between">
              <span>Impuestos ({{ impuestoPorcentaje }}%):</span>
              <span>${{ impuestos.toFixed(2) }}</span>
            </div>
            <div class="d-flex justify-content-between fs-4 fw-bold">
              <span>TOTAL:</span>
              <span>${{ total.toFixed(2) }}</span>
            </div>

            <hr />

            <label class="form-label small">Método de pago</label>
            <div class="btn-group w-100 mb-2" role="group">
              <button
                v-for="mp in ['Efectivo', 'Tarjeta', 'Transferencia', 'Fiado']"
                :key="mp"
                @click="metodoPago = mp"
                :class="metodoPago === mp ? 'btn btn-warning' : 'btn btn-outline-secondary'"
              >
                {{ mp }}
              </button>
            </div>

            <div v-if="metodoPago === 'Efectivo'" class="mb-2">
              <label class="form-label small">Monto recibido</label>
              <input
                v-model.number="montoRecibido"
                type="number"
                class="form-control form-control-lg"
                min="0"
                step="0.50"
                placeholder="0.00"
              />
              <div v-if="montoRecibido >= total && total > 0" class="alert alert-success mt-2 py-1 mb-0">
                <strong>Cambio: ${{ cambio.toFixed(2) }}</strong>
              </div>
            </div>

            <div v-if="metodoPago === 'Fiado'" class="mb-2">
              <label class="form-label small">Cliente *</label>
              <select v-model="clienteId" class="form-select">
                <option value="">-- Selecciona un cliente --</option>
                <option v-for="c in clientes" :key="c._id" :value="c._id">
                  {{ c.nombre }} — debe ${{ c.saldoActual.toFixed(2) }}
                </option>
              </select>
              <div v-if="clienteId" class="mt-2 small">
                <div v-if="clienteSeleccionado?.limiteCredito > 0">
                  <span :class="alertaLimite ? 'text-danger fw-bold' : 'text-muted'">
                    Límite: ${{ clienteSeleccionado.limiteCredito.toFixed(2) }}
                    — Disponible: ${{ (clienteSeleccionado.limiteCredito - clienteSeleccionado.saldoActual).toFixed(2) }}
                  </span>
                  <div v-if="alertaLimite" class="text-danger">
                    <i class="bi bi-exclamation-triangle-fill"></i> Esta venta excede el límite disponible
                  </div>
                </div>
                <div v-else class="text-muted">Sin límite de crédito configurado</div>
              </div>
            </div>

            <button
              class="btn btn-success btn-lg w-100 mt-2"
              :disabled="carrito.length === 0 || cobrando || (metodoPago === 'Fiado' && !clienteId) || (metodoPago === 'Fiado' && alertaLimite)"
              @click="cobrar"
            >
              <span v-if="cobrando" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-cash-coin"></i>
              {{ cobrando ? 'Procesando...' : `Cobrar $${total.toFixed(2)}` }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Ticket -->
    <div v-if="ticketVisible" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title"><i class="bi bi-check-circle"></i> Venta exitosa</h5>
            <button type="button" class="btn-close btn-close-white" @click="cerrarTicket"></button>
          </div>
          <div class="modal-body ticket-imprimible">
            <div class="text-center">
              <h5>La Botanita</h5>
              <hr />
              <div><strong>Folio:</strong> {{ ventaActual.folio }}</div>
              <div class="small">{{ formatFecha(ventaActual.fecha) }}</div>
              <div v-if="ventaActual.clienteId" class="small">
                <strong>Cliente:</strong> {{ clienteNombreTicket }}
              </div>
              <hr />
            </div>
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Cant</th>
                  <th>Producto</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in itemsActuales" :key="item._id">
                  <td>{{ item.cantidad }}</td>
                  <td>
                    <div>{{ item.productoNombre }}</div>
                    <small class="text-muted">{{ item.presentacionNombre }} - ${{ item.precioUnitario }}</small>
                  </td>
                  <td class="text-end">${{ item.subtotal.toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
            <hr />
            <div class="d-flex justify-content-between">
              <span>Subtotal:</span><span>${{ ventaActual.subtotal?.toFixed(2) }}</span>
            </div>
            <div v-if="ventaActual.impuestos > 0" class="d-flex justify-content-between">
              <span>Impuestos:</span><span>${{ ventaActual.impuestos.toFixed(2) }}</span>
            </div>
            <div class="d-flex justify-content-between fw-bold fs-5">
              <span>TOTAL:</span><span>${{ ventaActual.total?.toFixed(2) }}</span>
            </div>
            <div v-if="ventaActual.metodoPago === 'Efectivo'" class="d-flex justify-content-between">
              <span>Recibido:</span><span>${{ ventaActual.montoRecibido?.toFixed(2) }}</span>
            </div>
            <div v-if="ventaActual.metodoPago === 'Efectivo'" class="d-flex justify-content-between fw-bold">
              <span>Cambio:</span><span>${{ ventaActual.cambio?.toFixed(2) }}</span>
            </div>
            <div v-if="ventaActual.metodoPago === 'Fiado'" class="alert alert-warning mt-3 py-2">
              <i class="bi bi-info-circle"></i> Venta fiada. El saldo quedó pendiente de pago.
            </div>
            <div class="text-center mt-3">
              <small>¡Gracias por su compra!</small>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cerrarTicket">Cerrar</button>
            <button class="btn btn-primary" @click="imprimirTicket">
              <i class="bi bi-printer"></i> Imprimir
            </button>
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

const sesion = ref(null)
const productos = ref([])
const categorias = ref([])
const clientes = ref([])

const busqueda = ref('')
const categoriaFiltro = ref('')
const carrito = ref([])

const metodoPago = ref('Efectivo')
const montoRecibido = ref(0)
const clienteId = ref('')
const cobrando = ref(false)

const ticketVisible = ref(false)
const ventaActual = ref({})
const itemsActuales = ref([])

const inputBusqueda = ref(null)

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${auth.token}`
})

const productosFiltrados = computed(() => {
  let lista = productos.value
  if (categoriaFiltro.value) {
    lista = lista.filter((p) => p.categoriaId?._id === categoriaFiltro.value)
  }
  if (busqueda.value) {
    const q = busqueda.value.toLowerCase()
    lista = lista.filter((p) => p.nombre.toLowerCase().includes(q))
  }
  return lista
})

const subtotal = computed(() =>
  carrito.value.reduce((sum, it) => sum + it.precioUnitario * it.cantidad, 0)
)

const impuestoPorcentaje = computed(() => 0)

const impuestos = computed(() =>
  +(subtotal.value * (impuestoPorcentaje.value / 100)).toFixed(2)
)

const total = computed(() => +(subtotal.value + impuestos.value).toFixed(2))

const cambio = computed(() => {
  if (metodoPago.value !== 'Efectivo') return 0
  return +(Math.max(0, montoRecibido.value - total.value)).toFixed(2)
})

const clienteSeleccionado = computed(() =>
  clientes.value.find((c) => c._id === clienteId.value)
)

const alertaLimite = computed(() => {
  if (!clienteSeleccionado.value || clienteSeleccionado.value.limiteCredito === 0) return false
  return (
    clienteSeleccionado.value.saldoActual + total.value >
    clienteSeleccionado.value.limiteCredito
  )
})

const clienteNombreTicket = computed(() => {
  if (!ventaActual.value.clienteId) return ''
  const c = clientes.value.find((c) => c._id === ventaActual.value.clienteId)
  return c ? c.nombre : ''
})

const cargarSesion = async () => {
  const res = await fetch(`${API_URL}/cash/actual`, { headers: headers() })
  if (res.ok) {
    const data = await res.json()
    sesion.value = data.sesion
  }
}

const cargarProductos = async () => {
  const res = await fetch(`${API_URL}/products`, { headers: headers() })
  if (res.ok) productos.value = await res.json()
}

const cargarCategorias = async () => {
  const res = await fetch(`${API_URL}/categories`, { headers: headers() })
  if (res.ok) categorias.value = await res.json()
}

const cargarClientes = async () => {
  const res = await fetch(`${API_URL}/customers`, { headers: headers() })
  if (res.ok) clientes.value = await res.json()
}

const buscarPorCodigo = async () => {
  if (!busqueda.value) return
  const res = await fetch(`${API_URL}/products/buscar/${busqueda.value}`, { headers: headers() })
  if (res.ok) {
    const p = await res.json()
    const pres = p.presentaciones.find((x) => x.stock > 0)
    if (pres) {
      agregarAlCarrito(p, pres)
      busqueda.value = ''
    }
  }
}

const agregarAlCarrito = (producto, presentacion) => {
  if (presentacion.stock <= 0) return
  const existente = carrito.value.find(
    (it) => it.productoId === producto._id && it.presentacionId === presentacion._id
  )
  if (existente) {
    if (existente.cantidad < presentacion.stock) existente.cantidad++
  } else {
    carrito.value.push({
      productoId: producto._id,
      productoNombre: producto.nombre,
      presentacionId: presentacion._id,
      presentacionNombre: presentacion.nombre,
      precioUnitario: presentacion.precio,
      cantidad: 1,
      stockMax: presentacion.stock
    })
  }
}

const sumar = (i) => {
  if (carrito.value[i].cantidad < carrito.value[i].stockMax) carrito.value[i].cantidad++
}

const restar = (i) => {
  if (carrito.value[i].cantidad > 1) carrito.value[i].cantidad--
  else carrito.value.splice(i, 1)
}

const cobrar = async () => {
  if (carrito.value.length === 0) return
  cobrando.value = true

  try {
    const items = carrito.value.map((it) => ({
      productoId: it.productoId,
      presentacionId: it.presentacionId,
      cantidad: it.cantidad
    }))

    const body = {
      items,
      metodoPago: metodoPago.value,
      montoRecibido: metodoPago.value === 'Efectivo' ? montoRecibido.value : 0,
      clienteId: metodoPago.value === 'Fiado' ? clienteId.value : null
    }

    const res = await fetch(`${API_URL}/sales`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body)
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error al registrar venta')

    ventaActual.value = data.venta
    itemsActuales.value = data.items
    ticketVisible.value = true

    carrito.value = []
    montoRecibido.value = 0
    metodoPago.value = 'Efectivo'
    clienteId.value = ''

    await Promise.all([cargarProductos(), cargarClientes()])
  } catch (e) {
    alert(e.message)
  } finally {
    cobrando.value = false
  }
}

const cerrarTicket = () => {
  ticketVisible.value = false
  ventaActual.value = {}
  itemsActuales.value = []
}

const imprimirTicket = () => window.print()

const formatFecha = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

onMounted(async () => {
  await Promise.all([cargarSesion(), cargarProductos(), cargarCategorias(), cargarClientes()])
  inputBusqueda.value?.focus()
})
</script>

<style scoped>
@media print {
  body * { visibility: hidden; }
  .ticket-imprimible, .ticket-imprimible * { visibility: visible; }
  .ticket-imprimible { position: absolute; left: 0; top: 0; width: 100%; }
}
</style>
