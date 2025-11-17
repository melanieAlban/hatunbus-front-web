import apiClient from '../../../services/apiClient'

const BASE = '/ciudades'

export interface CityDto {
  id: string
  name: string
  province: string
  active: boolean
}

export async function getAllCities(): Promise<CityDto[]> {
  const res = await apiClient.get(`${BASE}`)
  return res.data as CityDto[]
}

export async function getAllProvinces(): Promise<string[]> {
  const res = await apiClient.get(`${BASE}/provincias`)
  return res.data as string[]
}

export async function getCityById(id: string): Promise<CityDto> {
  const res = await apiClient.get(`${BASE}/${id}`)
  return res.data as CityDto
}

export async function getCityByName(name: string): Promise<CityDto> {
  const res = await apiClient.get(`${BASE}/nombre/${name}`)
  return res.data as CityDto
}

export async function getCitiesByProvince(province: string): Promise<CityDto[]> {
  const res = await apiClient.get(`${BASE}/provincia/${province}`)
  return res.data as CityDto[]
}

export default {
  getAllCities,
  getAllProvinces,
  getCityById,
  getCityByName,
  getCitiesByProvince
}
