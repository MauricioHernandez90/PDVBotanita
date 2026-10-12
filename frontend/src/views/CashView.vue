<template>
  <div class="container mt-4">
    <h2><i class="bi bi-cash-stack"></i> Caja</h2>

    <div v-if="sesion" class="row g-3">
      <div class="col-md-8">
        <div class="card border-success">
          <div class="card-header bg-success text-white">
            <i class="bi bi-check-circle"></i> Caja abierta desde {{ formatFecha(sesion.fechaApertura) }}
          </div>
          <div class="card-body">
            <div class="row text-center">
              <div class="col-md-3 mb-2">
                <div class="small text-muted">Monto inicial</div>
                <div class="fs-4 fw-bold">${{ sesion.montoInicial.toFixed(2) }}</div>
              </div>
              <div class="col-md-3 mb-2">
                <div class="small text-muted">Ventas efectivo</div>
                <div class="fs-4 fw-bold text-success">${{ sesion.ventasEfectivo.toFixed(2) }}</div>
              </div>
              <div class="col-md-3 mb-2">
                <div class="small text-muted">Ventas totales</div>
                <div class="fs-4 fw-bold">${{ sesion.totalVentas.toFixed(2) }}</div>
              </div>
              <div class="col-md-3 mb-2">
                <div class="small text-muted">Número ventas</div>
                <div class="fs-4 fw-bold">{{ sesion.numeroVentas }}</div>
              </div>
            </div>
            <hr />
            <div class="row text-center">
              <div class="col-md-3">
                <div class="small text-muted">Tarjeta</div>
                <div class="fw-bold">${{ sesion.ventasTarjeta.toFixed(2) }}</div>
              </div>
              <div class="col-md-3">
                <div class="small text-muted">Transferencia</div>
                <div class="fw-bold">${{ sesion.ventasTransferencia.toFixed(2) }}</div>
              </div>
              <div class="col-md-3">
                <div class="small text-muted">Fiado</div>
                <div class="fw-bold">${{ sesion.ventasFiado.toFixed(2) }}</div>
              </div>
              <div class="col-md-3">
                <div class="small text-muted">Efectivo esperado</div>
                <div class="fw-bold text-primary">
                  ${{ (sesion.montoInicial + sesion.ventasEfectivo).toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card mt-3">
          <div class="card-body">
            <h5>Cerrar Caja</h5>
            <div class="mb-3">
              <label class="form-label">Monto final contado en caja</label>
              <input v-model.number="montoFinal" type="number" class="form-control form-control-lg" min="0" step="0.50" />
            </div>
            <div class="mb-3">
              <label class="form-label">Notas (opcional)</label>
              <input v-model="notas" type="text" class="form-control" />
            </div>
            <button class="btn btn-danger btn-lg" @click="cerrarCaja" :disabled="cerrando">
              <i class="bi bi-lock"></i> Cerrar Caja
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h5><i class="bi bi-unlock"></i> Abrir Caja</h5>
            <p class="text-muted">Registra el efectivo con el que empiezas el turno.</p>
            <div class="mb-3">
              <label class="form-label">Monto inicial</label>
              <input v-model.number="montoInicial" type="number" class="form-control form-control-lg" min="0" step="0.50" />
            </div>
            <button class="btn btn-success btn-lg" @click="abrirCaja" :disabled="abriendo">
              <i class="bi bi-unlock"></i> Abrir Caja
            </button>
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

const sesion = ref(null)
const montoInicial = ref(0)
const montoFinal = ref(0)
const notas = ref('')
const abriendo = ref(false)
const cerrando = ref(false)

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${auth.token}`
})

const cargarSesion = async () => {
  const res = await fetch(`${API_URL}/cash/actual`, { headers: headers() })
  if (res.ok) {
    const data = await res.json()
    sesion.value = data.sesion
  }
}

const abrirCaja = async () => {
  abriendo.value = true
  try {
    const res = await fetch(`${API_URL}/cash/abrir`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ montoInicial: montoInicial.value })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    sesion.value = data.sesion
    montoInicial.value = 0
  } catch (e) {
    alert(e.message)
  } finally {
    abriendo.value = false
  }
}

const cerrarCaja = async () => {
  if (!confirm('¿Cerrar la caja? Esta acción no se puede deshacer.')) return
  cerrando.value = true
  try {
    const res = await fetch(`${API_URL}/cash/cerrar`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ montoFinal: montoFinal.value, notas: notas.value })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)

    const dif = data.sesion.diferencia
    alert(`Caja cerrada.\n\nDiferencia: $${dif.toFixed(2)}\n${dif === 0 ? '¡Cuadre perfecto!' : (dif > 0 ? 'Sobrante' : 'Faltante')}`)
    sesion.value = null
    montoFinal.value = 0
    notas.value = ''
  } catch (e) {
    alert(e.message)
  } finally {
    cerrando.value = false
  }
}

const formatFecha = (iso) => new Date(iso).toLocaleString('es-MX')

onMounted(cargarSesion)
</script>
