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
    if (res.user) {
      user.value = res.user
      try { localStorage.setItem('auth_user', JSON.stringify(res.user)) } catch (e) { /* ignore */ }
    }
    // Persistir token en apiClient y localStorage
    setAuthToken(token.value)
    return res
  }

  async function logoutAction() {
    try { await authLogout() } catch (e) { /* ignore */ }
    token.value = null
    user.value = null
    setAuthToken(null)
    try { localStorage.removeItem('auth_user') } catch (e) { /* ignore */ }
  }

  function restoreFromStorage() {
    try {
      // Si ya tenemos token en memoria (por ejemplo después de login), no sobreescribimos
      if (token.value) return

      const t = localStorage.getItem('auth_token')
      if (t) {
        token.value = t
        setAuthToken(t)
        // Restaurar user desde storage local para no depender de /me
        try {
          const raw = localStorage.getItem('auth_user')
          if (raw && !user.value) {
            user.value = JSON.parse(raw) as UserDto
          }
        } catch (e) { /* ignore parse errors */ }
      }
    } catch (e) { /* ignore */ }
  }

  return { user, token, isAuthenticated, loginAction, logoutAction, restoreFromStorage }
})
