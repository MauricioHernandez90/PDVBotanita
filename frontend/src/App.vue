<template>
  <div v-if="auth.isAuthenticated" class="app-container">
    <!-- Overlay para móvil -->
    <div
      v-if="esMovil && sidebarAbierto"
      class="overlay"
      @click="sidebarAbierto = false"
    ></div>

    <!-- Sidebar -->
    <aside
      class="sidebar"
      :class="{
        'sidebar-open': sidebarAbierto,
        'sidebar-collapsed': !sidebarAbierto && !esMovil,
        'sidebar-mobile': esMovil
      }"
    >
      <!-- Header del sidebar con botón hamburguesa -->
      <div class="sidebar-header" :class="{ 'header-collapsed': !sidebarAbierto }">
        <button
          class="btn btn-link text-white p-0 hamburger-btn"
          @click="toggleSidebar"
          :title="sidebarAbierto ? 'Colapsar menú' : 'Expandir menú'"
        >
          <i class="bi bi-list fs-3"></i>
        </button>
        <span v-show="sidebarAbierto" class="ms-3 fw-bold titulo-app d-flex align-items-center">
          <img :src="logoUrl" alt="La Botanita" class="logo-sidebar" />
          <span class="ms-2">La Botanita</span>
        </span>
      </div>

      <!-- Links de navegación -->
      <nav class="sidebar-nav">
        <router-link
          v-for="link in links"
          :key="link.path"
          :to="link.path"
          class="sidebar-link"
          :class="{ 'active': $route.path === link.path }"
          :title="link.texto"
          @click="esMovil && (sidebarAbierto = false)"
        >
          <i :class="`bi ${link.icon}`"></i>
          <span v-show="sidebarAbierto" class="ms-3">{{ link.texto }}</span>
        </router-link>
      </nav>

      <!-- Usuario + botón salir -->
      <div class="sidebar-footer">
        <div v-if="sidebarAbierto" class="usuario-info mb-2">
          <i class="bi bi-person-circle fs-5"></i>
          <div class="ms-2 overflow-hidden">
            <div class="small fw-bold text-truncate">{{ auth.user?.nombre }}</div>
            <span class="badge bg-warning text-dark" style="font-size: 0.65rem;">
              {{ auth.user?.rol }}
            </span>
          </div>
        </div>
        <button
          class="btn btn-outline-light btn-sm w-100"
          @click="cerrarSesion"
          :title="'Cerrar sesión'"
        >
          <i class="bi bi-box-arrow-right"></i>
          <span v-show="sidebarAbierto" class="ms-2">Salir</span>
        </button>
      </div>
    </aside>

    <!-- Botón hamburguesa flotante para móvil -->
    <button
      v-if="esMovil && !sidebarAbierto"
      class="btn-hamburguesa-flotante"
      @click="sidebarAbierto = true"
      title="Abrir menú"
    >
      <i class="bi bi-list fs-3"></i>
    </button>

    <!-- Contenido principal -->
    <main class="main-content" :class="{ 'main-collapsed': !sidebarAbierto && !esMovil }">
      <router-view />
    </main>
  </div>

  <router-view v-else />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import logoUrl from './assets/logoscript.png'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const sidebarAbierto = ref(true)
const esMovil = ref(false)

// Links del menú (se construyen según el rol)
const links = computed(() => {
  const base = [
    { path: '/', texto: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/pos', texto: 'POS', icon: 'bi-cart-check-fill' },
    { path: '/caja', texto: 'Caja', icon: 'bi-cash-stack' },
    { path: '/ventas', texto: 'Ventas', icon: 'bi-receipt' },
    { path: '/clientes', texto: 'Clientes', icon: 'bi-people-fill' },
    { path: '/deudas', texto: 'Deudas', icon: 'bi-cash-coin' }
  ]

  if (auth.isAdmin) {
    base.push({ path: '/gastos', texto: 'Gastos', icon: 'bi-wallet2' })
  }

  base.push(
    { path: '/productos', texto: 'Productos', icon: 'bi-box-seam' },
    { path: '/categorias', texto: 'Categorías', icon: 'bi-tags' },
    { path: '/inventario', texto: 'Inventario', icon: 'bi-boxes' }
  )

  if (auth.isAdmin) {
    base.push({ path: '/usuarios', texto: 'Usuarios', icon: 'bi-people' })
  }

  return base
})

const checkMovil = () => {
  esMovil.value = window.innerWidth < 768
  if (esMovil.value) {
    sidebarAbierto.value = false
  }
}

const toggleSidebar = () => {
  sidebarAbierto.value = !sidebarAbierto.value
}

const cerrarSesion = () => {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  checkMovil()
  window.addEventListener('resize', checkMovil)

  // Recuperar preferencia guardada (solo en escritorio)
  const guardado = localStorage.getItem('sidebarAbierto')
  if (guardado !== null && !esMovil.value) {
    sidebarAbierto.value = guardado === 'true'
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMovil)
})

// Guardar preferencia cuando cambia (solo en escritorio)
watch(sidebarAbierto, (v) => {
  if (!esMovil.value) {
    localStorage.setItem('sidebarAbierto', v.toString())
  }
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* ===== SIDEBAR ===== */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 250px;
  background: linear-gradient(180deg, #1a1d21 0%, #212529 100%);
  color: #fff;
  transition: width 0.3s ease, transform 0.3s ease;
  z-index: 1040;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-collapsed {
  width: 70px;
}

.sidebar-mobile {
  transform: translateX(-100%);
  width: 250px;
}

.sidebar-mobile.sidebar-open {
  transform: translateX(0);
}

.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  height: 70px;
  flex-shrink: 0;
}

.sidebar-header.header-collapsed {
  justify-content: center;
  padding: 15px 10px;
}

.sidebar-header.header-collapsed .hamburger-btn {
  margin: 0;
}

.hamburger-btn {
  text-decoration: none !important;
  transition: transform 0.2s;
  border: none;
}

.hamburger-btn:hover {
  transform: scale(1.1);
}

.titulo-app {
  white-space: nowrap;
  font-size: 1.05rem;
}

.logo-sidebar {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  object-fit: contain;
  filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.3));
}

.titulo-app {
  white-space: nowrap;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== NAV LINKS ===== */
.sidebar-nav {
  flex: 1;
  padding: 15px 8px;
  overflow-y: auto;
}

.sidebar-link {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: #adb5bd;
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-link:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.sidebar-link.active {
  background-color: #d97706;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
}

.sidebar-link i {
  font-size: 1.2rem;
  min-width: 24px;
  text-align: center;
  flex-shrink: 0;
}

/* ===== FOOTER ===== */
.sidebar-footer {
  padding: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.usuario-info {
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

/* ===== CONTENIDO PRINCIPAL ===== */
.main-content {
  margin-left: 250px;
  padding: 25px;
  transition: margin-left 0.3s ease;
  min-height: 100vh;
}

.main-collapsed {
  margin-left: 70px;
}

/* ===== BOTÓN HAMBURGUESA FLOTANTE (MÓVIL) ===== */
.btn-hamburguesa-flotante {
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 1030;
  background-color: #212529;
  color: #fff;
  border: none;
  border-radius: 10px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s, background-color 0.2s;
}

.btn-hamburguesa-flotante:hover {
  background-color: #d97706;
  transform: scale(1.05);
}

.btn-hamburguesa-flotante:active {
  transform: scale(0.95);
}

/* ===== OVERLAY MÓVIL ===== */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1035;
  backdrop-filter: blur(2px);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 767px) {
  .main-content {
    margin-left: 0 !important;
    padding: 15px;
    padding-top: 75px; /* espacio para el botón flotante */
  }
}

/* ===== SCROLLBAR ===== */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}
.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.35);
}
</style>
