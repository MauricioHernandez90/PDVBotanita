<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2><i class="bi bi-people-fill"></i> Gestión de Usuarios</h2>
      <button class="btn btn-warning" @click="abrirModalCrear">
        <i class="bi bi-plus-circle"></i> Nuevo Usuario
      </button>
    </div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border text-warning"></div>
    </div>

    <div v-else class="table-responsive">
      <table class="table table-striped table-hover align-middle">
        <thead class="table-dark">
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u._id">
            <td>{{ u.nombre }}</td>
            <td>{{ u.email }}</td>
            <td>
              <span :class="u.rol === 'admin' ? 'badge bg-danger' : 'badge bg-primary'">
                {{ u.rol }}
              </span>
            </td>
            <td>
              <span :class="u.activo ? 'badge bg-success' : 'badge bg-secondary'">
                {{ u.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-primary me-1" @click="abrirModalEditar(u)">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="eliminar(u)">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="modalVisible" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editando ? 'Editar' : 'Nuevo' }} Usuario</h5>
            <button type="button" class="btn-close" @click="cerrarModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Nombre</label>
              <input v-model="form.nombre" type="text" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input v-model="form.email" type="email" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Contraseña {{ editando ? '(dejar vacío para no cambiar)' : '' }}</label>
              <input v-model="form.password" type="password" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Rol</label>
              <select v-model="form.rol" class="form-select">
                <option value="cajero">Cajero</option>
                <option value="admin">Administrador</option>
              </select>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
import { API_URL } from '../config/api'

const usuarios = ref([])
const cargando = ref(false)
const modalVisible = ref(false)
const editando = ref(false)
const error = ref('')

const form = ref({ _id: null, nombre: '', email: '', password: '', rol: 'cajero', activo: true })

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${auth.token}`
})

const cargarUsuarios = async () => {
  cargando.value = true
  try {
    const res = await fetch(`${API_URL}/users`, { headers: headers() })
    if (!res.ok) throw new Error('Error al cargar usuarios')
    usuarios.value = await res.json()
  } catch (e) {
    console.error(e)
  } finally {
    cargando.value = false
  }
}

const abrirModalCrear = () => {
  editando.value = false
  error.value = ''
  form.value = { _id: null, nombre: '', email: '', password: '', rol: 'cajero', activo: true }
  modalVisible.value = true
}

const abrirModalEditar = (u) => {
  editando.value = true
  error.value = ''
  form.value = { ...u, password: '' }
  modalVisible.value = true
}

const cerrarModal = () => { modalVisible.value = false }

const guardar = async () => {
  error.value = ''
  try {
    const url = editando.value ? `${API_URL}/users/${form.value._id}` : `${API_URL}/users`
    const method = editando.value ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: headers(),
      body: JSON.stringify(form.value)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error al guardar')
    cerrarModal()
    cargarUsuarios()
  } catch (e) {
    error.value = e.message
  }
}

const eliminar = async (u) => {
  if (!confirm(`¿Eliminar a ${u.nombre}?`)) return
  try {
    const res = await fetch(`${API_URL}/users/${u._id}`, {
      method: 'DELETE',
      headers: headers()
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.message)
    }
    cargarUsuarios()
  } catch (e) {
    alert(e.message)
  }
}

onMounted(cargarUsuarios)
</script>
