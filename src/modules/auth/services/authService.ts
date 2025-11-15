import { apiClient, setAuthToken } from '../../../services/apiClient'
import type { LoginCredentials, LoginResponse } from '../interfaces/auth.interface'

const LOGIN_PATH = '/login'


export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const res = await apiClient.post(LOGIN_PATH, credentials)
  const data: LoginResponse = res.data
  if (data?.token) {
    setAuthToken(data.token)
  }
  return data
}

export async function logout(): Promise<void> {
  setAuthToken(null)
}

export function getStoredToken(): string | null {
  try { return localStorage.getItem('auth_token') } catch (e) { return null }
}
