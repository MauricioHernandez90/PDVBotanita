<template>
  <div class="container-fluid mt-4">
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h2><i class="bi bi-box-seam"></i> Catálogo de Productos</h2>
      <button v-if="auth.isAdmin" class="btn btn-warning" @click="abrirModalCrear">
        <i class="bi bi-plus-circle"></i> Nuevo Producto
      </button>
    </div>

    <!-- Filtros -->
    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-md-4">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input v-model="filtros.search" @input="cargarProductos" type="text" class="form-control" placeholder="Buscar por nombre o código..." />
            </div>
          </div>
          <div class="col-md-3">
            <select v-model="filtros.categoria" @change="cargarProductos" class="form-select">
              <option value="">Todas las categorías</option>
              <option v-for="c in categorias" :key="c._id" :value="c._id">{{ c.nombre }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <div class="form-check mt-2">
              <input v-model="filtros.bajoStock" @change="cargarProductos" class="form-check-input" type="checkbox" id="bajoStockCheck" />
              <label class="form-check-label" for="bajoStockCheck">
                <i class="bi bi-exclamation-triangle text-danger"></i> Bajo stock
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
            <th>Producto</th>
            <th>Categoría</th>
            <th>Presentaciones (precio / stock)</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in productos" :key="p._id">
            <td>
              <strong>{{ p.nombre }}</strong>
              <div v-if="p.codigoBarras" class="text-muted small">
                <i class="bi bi-upc-scan"></i> {{ p.codigoBarras }}
              </div>
            </td>
            <td>
              <span class="badge bg-secondary">{{ p.categoriaId?.nombre || 'Sin categoría' }}</span>
            </td>
            <td>
              <div class="d-flex flex-wrap gap-1">
                <span
                  v-for="pres in p.presentaciones"
                  :key="pres._id"
                  :class="pres.stock <= pres.stockMinimo ? 'badge bg-danger' : 'badge bg-light text-dark border'"
                  :title="`${pres.nombre}: $${pres.precio} (stock: ${pres.stock})`"
                >
                  {{ pres.nombre }}: ${{ pres.precio }}
                  <i v-if="pres.stock <= pres.stockMinimo" class="bi bi-exclamation-triangle-fill ms-1"></i>
                </span>
              </div>
            </td>
            <td class="text-end">
              <button v-if="auth.isAdmin" class="btn btn-sm btn-outline-primary me-1" @click="abrirModalEditar(p)">
                <i class="bi bi-pencil"></i>
              </button>
              <button v-if="auth.isAdmin" class="btn btn-sm btn-outline-danger" @click="eliminar(p)">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
          <tr v-if="productos.length === 0">
            <td colspan="4" class="text-center text-muted py-4">
              No hay productos que coincidan con los filtros
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Crear/Editar -->
    <div v-if="modalVisible" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editando ? 'Editar' : 'Nuevo' }} Producto</h5>
            <button type="button" class="btn-close" @click="cerrarModal"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label">Nombre del producto *</label>
                <input v-model="form.nombre" type="text" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Categoría *</label>
                <select v-model="form.categoriaId" class="form-select">
                  <option value="">-- Selecciona --</option>
                  <option v-for="c in categorias" :key="c._id" :value="c._id">{{ c.nombre }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Código de barras</label>
                <input v-model="form.codigoBarras" type="text" class="form-control" placeholder="Opcional" />
              </div>
            </div>

            <hr />
            <h6><i class="bi bi-tags"></i> Presentaciones</h6>
            <div v-for="(pres, i) in form.presentaciones" :key="i" class="row g-2 mb-2 align-items-end">
              <div class="col-md-3">
                <label class="form-label small mb-0">Presentación</label>
                <select v-model="pres.nombre" class="form-select form-select-sm">
                  <option>Bolsita</option>
                  <option>100 gr</option>
                  <option>250 gr</option>
                  <option>450 gr</option>
                  <option>1 Kg</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label small mb-0">Precio</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text">$</span>
                  <input v-model.number="pres.precio" type="number" min="0" class="form-control" />
                </div>
              </div>
              <div class="col-md-2">
                <label class="form-label small mb-0">Stock</label>
                <input v-model.number="pres.stock" type="number" min="0" class="form-control form-control-sm" />
              </div>
              <div class="col-md-2">
                <label class="form-label small mb-0">Stock mín.</label>
                <input v-model.number="pres.stockMinimo" type="number" min="0" class="form-control form-control-sm" />
              </div>
              <div class="col-md-2 text-end">
                <button class="btn btn-sm btn-outline-danger w-100" @click.prevent="quitarPresentacion(i)">
                  <i class="bi bi-x-circle"></i> Quitar
                </button>
              </div>
            </div>

            <button class="btn btn-outline-success btn-sm" @click.prevent="agregarPresentacion">
              <i class="bi bi-plus"></i> Agregar presentación
            </button>

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

const categorias = ref([])
const productos = ref([])
const cargando = ref(false)
const modalVisible = ref(false)
const editando = ref(false)
const error = ref('')

const filtros = ref({ search: '', categoria: '', bajoStock: false })

const form = ref({
  _id: null,
  nombre: '',
  categoriaId: '',
  codigoBarras: '',
  presentaciones: []
})

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${auth.token}`
})

const cargarCategorias = async () => {
  const res = await fetch(`${API_URL}/categories`, { headers: headers() })
  if (res.ok) categorias.value = await res.json()
}

const cargarProductos = async () => {
  cargando.value = true
  const params = new URLSearchParams()
  if (filtros.value.search) params.append('search', filtros.value.search)
  if (filtros.value.categoria) params.append('categoria', filtros.value.categoria)
  if (filtros.value.bajoStock) params.append('bajoStock', 'true')

  const res = await fetch(`${API_URL}/products?${params}`, { headers: headers() })
  if (res.ok) productos.value = await res.json()
  cargando.value = false
}

const abrirModalCrear = () => {
  editando.value = false
  error.value = ''
  form.value = {
    _id: null,
    nombre: '',
    categoriaId: '',
    codigoBarras: '',
    presentaciones: [{ nombre: 'Bolsita', precio: 0, stock: 0, stockMinimo: 5 }]
  }
  modalVisible.value = true
}

const abrirModalEditar = (p) => {
  editando.value = true
  error.value = ''
  form.value = JSON.parse(JSON.stringify(p))
  form.value.categoriaId = p.categoriaId?._id || p.categoriaId
  modalVisible.value = true
}

const cerrarModal = () => { modalVisible.value = false }

const agregarPresentacion = () => {
  form.value.presentaciones.push({ nombre: 'Bolsita', precio: 0, stock: 0, stockMinimo: 5 })
}

const quitarPresentacion = (i) => {
  form.value.presentaciones.splice(i, 1)
}

const guardar = async () => {
  error.value = ''
  if (!form.value.nombre || !form.value.categoriaId || form.value.presentaciones.length === 0) {
    error.value = 'Completa nombre, categoría y al menos una presentación'
    return
  }

  try {
    const url = editando.value ? `${API_URL}/products/${form.value._id}` : `${API_URL}/products`
    const method = editando.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: headers(),
      body: JSON.stringify(form.value)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error al guardar')

    cerrarModal()
    cargarProductos()
  } catch (e) {
    error.value = e.message
  }
}

const eliminar = async (p) => {
  if (!confirm(`¿Desactivar "${p.nombre}"?`)) return
  const res = await fetch(`${API_URL}/products/${p._id}`, {
    method: 'DELETE',
    headers: headers()
  })
  if (res.ok) cargarProductos()
  else alert('Error al eliminar')
}

onMounted(async () => {
  await cargarCategorias()
  await cargarProductos()
})
</script>
