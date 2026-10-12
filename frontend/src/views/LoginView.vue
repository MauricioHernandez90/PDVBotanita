<template>
  <div class="container d-flex justify-content-center align-items-center" style="min-height: 100vh;">
    <div class="card shadow-lg" style="max-width: 420px; width: 100%;">
      <div class="card-body p-4">
<div class="text-center mb-4">
  <img :src="logoUrl" alt="La Botanita" class="login-logo" />
  <h2 class="mt-3">La Botanita</h2>
  <p class="text-muted">Inicia sesión para continuar</p>
</div>

        <form @submit.prevent="handleLogin">
          <div class="form-floating mb-3">
            <input v-model="email" type="email" class="form-control" id="emailInput" placeholder="correo@ejemplo.com" required />
            <label for="emailInput"><i class="bi bi-envelope"></i> Correo electrónico</label>
          </div>

          <div class="form-floating mb-3">
            <input v-model="password" type="password" class="form-control" id="passwordInput" placeholder="Contraseña" required />
            <label for="passwordInput"><i class="bi bi-lock"></i> Contraseña</label>
          </div>

          <div v-if="error" class="alert alert-danger py-2">
            <i class="bi bi-exclamation-triangle"></i> {{ error }}
          </div>

          <button type="submit" class="btn btn-warning w-100 btn-lg" :disabled="cargando">
            <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-box-arrow-in-right"></i>
            {{ cargando ? 'Entrando...' : 'Iniciar Sesión' }}
          </button>
        </form>

        <hr class="my-4" />
        <p class="text-center text-muted mb-0">
          ¿No tienes cuenta?
          <router-link to="/register">Regístrate aquí</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import logoUrl from '../assets/logoscript.png'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)

const handleLogin = async () => {
  error.value = ''
  cargando.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.login-logo {
  width: 130px;
  height: 130px;
  object-fit: contain;
  margin-bottom: 5px;
}
</style>
