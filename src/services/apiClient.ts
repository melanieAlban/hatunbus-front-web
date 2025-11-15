import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
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
export default apiClient
