<template>
  <nav v-if="auth.isAuthenticated" class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container-fluid">
      <router-link class="navbar-brand" to="/">
        <i class="bi bi-shop"></i> La Botanita
      </router-link>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navMenu">
       <ul class="navbar-nav me-auto">
  <li class="nav-item">
    <router-link class="nav-link" to="/"><i class="bi bi-house"></i> Inicio</router-link>
  </li>
  <li class="nav-item">
    <router-link class="nav-link" to="/productos">
      <i class="bi bi-box-seam"></i> Productos
    </router-link>
  </li>
  <li class="nav-item">
    <router-link class="nav-link" to="/categorias">
      <i class="bi bi-tags"></i> Categorías
    </router-link>
  </li>
  <li class="nav-item">
    <router-link class="nav-link" to="/inventario">
      <i class="bi bi-boxes"></i> Inventario
    </router-link>
  </li>
  <li v-if="auth.isAdmin" class="nav-item">
    <router-link class="nav-link" to="/usuarios">
      <i class="bi bi-people"></i> Usuarios
    </router-link>
  </li>
</ul>
        <div class="d-flex align-items-center text-white">
          <span class="me-3">
            <i class="bi bi-person-circle"></i>
            {{ auth.user?.nombre }}
            <span class="badge bg-warning text-dark ms-1">{{ auth.user?.rol }}</span>
          </span>
          <button class="btn btn-outline-light btn-sm" @click="cerrarSesion">
            <i class="bi bi-box-arrow-right"></i> Salir
          </button>
        </div>
      </div>
    </div>
  </nav>

  <router-view />
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const router = useRouter()

const cerrarSesion = () => {
  auth.logout()
  router.push('/login')
}
</script>
