<template>
  <div class="forbidden">
    <h2>403 - No autorizado</h2>
    <p v-if="!isAuthenticated">Necesitas iniciar sesión para acceder a esta página.</p>
    <p v-else>No tienes permisos para ver esta página en este momento.</p>

    <div class="actions">
      <router-link v-if="!isAuthenticated" to="/login">Ir a iniciar sesión</router-link>
      <div v-else>
        <button class="p-button p-component" @click="reintentar" :disabled="loading">{{ loading ? 'Reintentando...' : 'Reintentar' }}</button>
        <button class="p-button p-component p-button-text p-ml-2" @click="logoutToLogin">Cerrar sesión</button>
        <router-link class="p-ml-2" to="/">Ir al inicio</router-link>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../modules/auth/store/useAuthStore'

const auth = useAuthStore()
const router = useRouter()
const isAuthenticated = computed(() => auth.isAuthenticated)
const loading = ref(false)
const error = ref<string | null>(null)

async function reintentar() {
  error.value = null
  loading.value = true
  try {
    await auth.restoreFromStorage()
    // Si ya se pobló el usuario, redirigimos al panel
    if ((auth.user as any)) {
      await router.push('/admin')
      return
    }
    error.value = 'No se pudo recuperar el usuario. Intenta iniciar sesión de nuevo.'
  } catch (e: any) {
    error.value = e?.message || 'Error al reintentar. Revisa la consola o el servidor.'
  } finally {
    loading.value = false
  }
}

async function logoutToLogin() {
  try {
    await auth.logoutAction()
  } catch (e) { /* ignore */ }
  router.push('/login')
}
</script>

<style scoped>
.forbidden{padding:2rem;text-align:center}
.actions{margin-top:1rem}
.error{color:#c0392b;margin-top:1rem}
</style>
