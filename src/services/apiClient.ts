import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'https://fram--hatunbus-back--hcqk4hv77kmd.code.run/api',
  withCredentials: true,
})

const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    try { localStorage.setItem('auth_token', token) } catch (e) { /* ignore */ }
  } else {
    delete apiClient.defaults.headers.common['Authorization']
    try { localStorage.removeItem('auth_token') } catch (e) { /* ignore */ }
  }
}

// Initialize token from storage (if present)
try {
  const token = localStorage.getItem('auth_token')
  if (token) setAuthToken(token)
} catch (e) {
  // ignore storage errors in non-browser environments
}

export { apiClient, setAuthToken }

apiClient.interceptors.response.use(
  response => response,
  async (error) => {
    if (error?.response?.status === 401) {
      try {
        const { useAuthStore } = await import('../modules/auth/store/useAuthStore')
        const auth = useAuthStore()
        await auth.logoutAction()
      } catch (e) {
        console.error('Error clearing auth after 401:', e)
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
export default apiClient
