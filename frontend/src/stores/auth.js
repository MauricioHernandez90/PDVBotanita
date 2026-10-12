// src/stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import { API_URL } from '../config/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.rol === 'admin')

  const setToken = (nuevoToken) => {
    token.value = nuevoToken
    if (nuevoToken) {
      localStorage.setItem('token', nuevoToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión')
    setToken(data.token)
    user.value = data.user
    return data
  }

  const register = async (nombre, email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error al registrarse')
    setToken(data.token)
    user.value = data.user
    return data
  }

  const cargarUsuario = async () => {
    if (!token.value) return null
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token.value}` }
      })
      if (!res.ok) {
        setToken(null)
        user.value = null
        return null
      }
      const data = await res.json()
      user.value = data.user
      return data.user
    } catch {
      setToken(null)
      user.value = null
      return null
    }
  }

  const logout = () => {
    setToken(null)
    user.value = null
  }

  return { user, token, isAuthenticated, isAdmin, login, register, cargarUsuario, logout }
})
