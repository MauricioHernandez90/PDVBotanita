<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2><i class="bi bi-tags-fill"></i> Categorías</h2>
      <button v-if="auth.isAdmin" class="btn btn-warning" @click="abrirModalCrear">
        <i class="bi bi-plus-circle"></i> Nueva Categoría
      </button>
    </div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border text-warning"></div>
    </div>

    <div v-else class="row g-3">
      <div v-for="c in categorias" :key="c._id" class="col-md-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <h5 class="card-title mb-1">
                <i class="bi bi-tag"></i> {{ c.nombre }}
              </h5>
              <span :class="c.activo ? 'badge bg-success' : 'badge bg-secondary'">
                {{ c.activo ? 'Activa' : 'Inactiva' }}
              </span>
            </div>
            <p class="card-text text-muted small">{{ c.descripcion || 'Sin descripción' }}</p>
          </div>
          <div v-if="auth.isAdmin" class="card-footer bg-transparent d-flex justify-content-end gap-2">
            <button class="btn btn-sm btn-outline-primary" @click="abrirModalEditar(c)">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" @click="eliminar(c)">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
      <div v-if="categorias.length === 0" class="col-12 text-center text-muted py-5">
        No hay categorías aún. Crea la primera.
      </div>
    </div>

    <div v-if="modalVisible" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editando ? 'Editar' : 'Nueva' }} Categoría</h5>
            <button type="button" class="btn-close" @click="cerrarModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Nombre *</label>
              <input v-model="form.nombre" type="text" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Descripción</label>
              <textarea v-model="form.descripcion" class="form-control" rows="2"></textarea>
            </div>
            <div v-if="editando" class="form-check">
              <input v-model="form.activo" type="checkbox" class="form-check-input" id="activaCheck" />
              <label class="form-check-label" for="activaCheck">Activa</label>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const API_URL = 'http://localhost:3000/api'

const categorias = ref([])
const cargando = ref(false)
const modalVisible = ref(false)
const editando = ref(false)
const error = ref('')

const form = ref({ _id: null, nombre: '', descripcion: '', activo: true })

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${auth.token}`
})

const cargar = async () => {
  cargando.value = true
  const res = await fetch(`${API_URL}/categories`, { headers: headers() })
  if (res.ok) categorias.value = await res.json()
  cargando.value = false
}

const abrirModalCrear = () => {
  editando.value = false
  error.value = ''
  form.value = { _id: null, nombre: '', descripcion: '', activo: true }
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
  try {
    const url = editando.value ? `${API_URL}/categories/${form.value._id}` : `${API_URL}/categories`
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
  if (!confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return
  const res = await fetch(`${API_URL}/categories/${c._id}`, {
    method: 'DELETE',
    headers: headers()
  })
  const data = await res.json()
  if (res.ok) cargar()
  else alert(data.message)
}

onMounted(cargar)
</script>
