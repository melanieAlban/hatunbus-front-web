import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import "./style.css";
import "./styles/theme.css";

import PrimeVue from "primevue/config";
import "primeicons/primeicons.css";

import App from "./App.vue";
import customPreset from "./styles/presets/custom-preset";

const app = createApp(App);

app.use(createPinia());
app.use(PrimeVue, {
  theme: {
    preset: customPreset,
    options: {
      darkModeSelector: ".your-fixed-class-that-never-changes",
    },
  },
});
app.use(router);

app.mount("#app");
