# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).
# HatunBus Web (Panel Administrativo)

## Descripcion
Panel web para cooperativas y administración de HatunBus. Permite gestionar usuarios, cooperativas, buses y asientos, rutas y frecuencias, ventas y pagos pendientes, además de generar boletos con QR y reportes descargables para la operación diaria.

## Tecnologias
- Vue 3 + TypeScript con Vite
- PrimeVue, PrimeIcons y @primeuix/themes para UI
- Pinia para manejo de estado y Vue Router para navegación
- Axios para consumo de la API REST
- Chart.js, jsPDF + autotable y `qrcode` para reportes y visualizaciones
- Sass para estilos

## Instalacion
1. Requisitos: Node.js 18+ y npm.
2. Clona el repositorio e instala dependencias:
   ```bash
   git clone https://github.com/TU-USUARIO/hatunbus-front-web.git
   cd hatunbus-front-web
   npm install
   ```
3. Copia el archivo de entorno y ajusta las variables:
   ```bash
   cp .env.example .env
   # VITE_API_BASE_URL=http://localhost:8080/api
   # VITE_APP_NAME=HatunBus
   ```

## Ejecucion y build
```bash
npm run dev      # desarrollo (http://localhost:5173 por defecto)
npm run build    # build de producción
npm run preview  # previsualización del build
```

## Contribuciones
Revisa `CONTRIBUTING.md` y usa la plantilla de PR para enviar cambios.

## Licencia
Este proyecto usa la licencia MIT incluida en `LICENSE`.

## Mantenimiento
- Mantén alineados los estilos en `src/styles` y los temas de PrimeVue.
- Módulos clave: auth, admin, cooperatives, buses, routes, conductores, payments, tickets y sales.
- Si cambias la API, actualiza los servicios en `src/services` y las rutas en `src/router`.
