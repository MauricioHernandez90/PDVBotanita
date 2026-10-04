// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import UsersView from '../views/UsersView.vue'
import ProductsView from '../views/ProductsView.vue'
import CategoriesView from '../views/CategoriesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { publica: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { publica: true } },
    { path: '/', name: 'home', component: HomeView },
    { path: '/productos', name: 'productos', component: ProductsView },
    { path: '/categorias', name: 'categorias', component: CategoriesView },
    { path: '/usuarios', name: 'usuarios', component: UsersView, meta: { soloAdmin: true } }
  ]
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.token && !auth.user) await auth.cargarUsuario()
  if (!to.meta.publica && !auth.isAuthenticated) return { name: 'login' }
  if (to.meta.soloAdmin && !auth.isAdmin) return { name: 'home' }
  if (to.meta.publica && auth.isAuthenticated) return { name: 'home' }
})

export default router
