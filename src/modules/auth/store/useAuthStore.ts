import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as authLogin, logout as authLogout } from '../services/authService'
import { setAuthToken } from '../../../services/apiClient'
import type { LoginCredentials, UserDto } from '../interfaces/auth.interface'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserDto | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function loginAction(credentials: LoginCredentials) {
    const res = await authLogin(credentials)
    // Si backend no devuelve token consideramos credenciales inválidas
    if (!res || !(res as any).token) {
      const message = (res as any)?.message || 'Credenciales inválidas'
      throw new Error(message)
    }
    token.value = res.token
    if (res.user) user.value = res.user
    // Persistir token en apiClient y localStorage
    setAuthToken(token.value)
    return res
  }

  async function logoutAction() {
    try { await authLogout() } catch (e) { /* ignore */ }
    token.value = null
    user.value = null
    setAuthToken(null)
  }

  function restoreFromStorage() {
    try {
      const t = localStorage.getItem('auth_token')
      if (t) {
        token.value = t
        setAuthToken(t)
      }
    } catch (e) { /* ignore */ }
  }

  return { user, token, isAuthenticated, loginAction, logoutAction, restoreFromStorage }
})
