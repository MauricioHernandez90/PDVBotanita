<template>
  <div class="container d-flex justify-content-center align-items-center" style="min-height: 100vh;">
    <div class="card shadow-lg" style="max-width: 460px; width: 100%;">
      <div class="card-body p-4">
        <div class="text-center mb-4">
          <i class="bi bi-person-plus display-4 text-success"></i>
          <h2 class="mt-2">Crear Cuenta</h2>
          <p class="text-muted">Regístrate en La Botanita</p>
        </div>

        <form @submit.prevent="handleRegister">
          <div class="form-floating mb-3">
            <input v-model="nombre" type="text" class="form-control" id="nombreInput" placeholder="Tu nombre" required />
            <label for="nombreInput"><i class="bi bi-person"></i> Nombre completo</label>
          </div>

          <div class="form-floating mb-3">
            <input v-model="email" type="email" class="form-control" id="emailInput" placeholder="correo@ejemplo.com" required />
            <label for="emailInput"><i class="bi bi-envelope"></i> Correo electrónico</label>
          </div>

          <div class="form-floating mb-3">
            <input v-model="password" type="password" class="form-control" id="passInput" placeholder="Contraseña" minlength="6" required />
            <label for="passInput"><i class="bi bi-lock"></i> Contraseña (mín. 6 caracteres)</label>
          </div>

          <div v-if="error" class="alert alert-danger py-2">
            <i class="bi bi-exclamation-triangle"></i> {{ error }}
          </div>

          <button type="submit" class="btn btn-success w-100 btn-lg" :disabled="cargando">
            <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-check-circle"></i>
            {{ cargando ? 'Creando...' : 'Registrarme' }}
          </button>
        </form>

        <hr class="my-4" />
        <p class="text-center text-muted mb-0">
          ¿Ya tienes cuenta?
          <router-link to="/login">Inicia sesión</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const nombre = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)

const handleRegister = async () => {
  error.value = ''
  cargando.value = true
  try {
    await auth.register(nombre.value, email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}
</script>
