import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import './styles/theme.css'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import App from './App.vue'
import './styles/primevue-theme.css'
const app = createApp(App)

app.use(createPinia())

app.use(PrimeVue, {
  unstyled: true,  // ← Esto desactiva los estilos por defecto
  pt: {
    // Configuración global opcional para todos los componentes
    global: {
      // Estilos base que se aplicarán a todos los componentes
      css: `
        .p-component {
          font-family: inherit;
        }
      `
    }
  }
})

app.use(router)

app.mount('#app')