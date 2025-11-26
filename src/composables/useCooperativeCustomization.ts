import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../modules/auth/store/useAuthStore'
import { getCooperativeById } from '../modules/cooperatives/services/cooperativeService'

const cooperativeLogo = ref<string | null>(null)
const primaryColor = ref<string>('#8B7355') // earth-primary (café/tierra)
const secondaryColor = ref<string>('#A0826D') // earth-light
const cooperativeName = ref<string>('HatunBus')
const isLoaded = ref(false)

export function useCooperativeCustomization() {
  const authStore = useAuthStore()

  async function loadCooperativeCustomization() {
    try {
      const user = authStore.user
      
      // Solo cargar si el usuario tiene cooperativa
      if (!user?.cooperativeId) {
        isLoaded.value = true
        return
      }

      const coop = await getCooperativeById(user.cooperativeId)
      
      // Actualizar nombre
      if (coop.name) {
        cooperativeName.value = coop.name
      }

      // Actualizar logo
      if (coop.logo) {
        cooperativeLogo.value = coop.logo
      }

      // Actualizar colores
      if (coop.primaryColor) {
        primaryColor.value = coop.primaryColor
      }

      if (coop.secondaryColor) {
        secondaryColor.value = coop.secondaryColor
      }

      // Aplicar colores como CSS variables
      applyColors()

      isLoaded.value = true
    } catch (error) {
      console.error('Error loading cooperative customization:', error)
      isLoaded.value = true
    }
  }

  function applyColors() {
    const root = document.documentElement
    root.style.setProperty('--coop-primary-color', primaryColor.value)
    root.style.setProperty('--coop-secondary-color', secondaryColor.value)
  }

  // Watch para aplicar colores cuando cambien
  watch([primaryColor, secondaryColor], () => {
    applyColors()
  })

  const logo = computed(() => cooperativeLogo.value)
  const name = computed(() => cooperativeName.value)
  const colors = computed(() => ({
    primary: primaryColor.value,
    secondary: secondaryColor.value,
  }))

  return {
    logo,
    name,
    colors,
    isLoaded,
    loadCooperativeCustomization,
  }
}
