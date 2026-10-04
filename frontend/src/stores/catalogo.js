// src/stores/catalogo.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_URL = 'http://localhost:3000/api'

export const useCatalogoStore = defineStore('catalogo', () => {
  const categorias = ref([])
  const productos = ref([])
  const cargando = ref(false)

  const fetchCategorias = async (token) => {
    const res = await fetch(`${API_URL}/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) categorias.value = await res.json()
  }

  const fetchProductos = async (token, params = {}) => {
    cargando.value = true
    const query = new URLSearchParams(params).toString()
    const res = await fetch(`${API_URL}/products?${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) productos.value = await res.json()
    cargando.value = false
  }

  return { categorias, productos, cargando, fetchCategorias, fetchProductos }
})
