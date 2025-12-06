# HatunBus Web (Panel Administrativo)

SPA construida con Vue 3 + PrimeVue para administrar cooperativas, rutas, buses, conductores, ventas, pagos y reportes del ecosistema HatunBus.

## Caracteristicas
- Escritorio y widgets en tiempo real (pagos pendientes, viajes, pasajeros).
- CRUD completo de cooperativas, usuarios, buses, templates, rutas y frecuencias.
- Generador visual de templates de buses y asignacion automatica de hojas de ruta.
- Venta presencial con seleccion dinamica de asientos, descuentos y pagos (cash, transferencia, PayPal).
- Reporteria (PDF/CSV) para pasajeros, validaciones y gastos de buses.
- Integracion con backend via REST + WebSockets para notificaciones instantaneas.

## Stack tecnico
- Vue 3 + TypeScript + Vite 7.
- PrimeVue 4, PrimeIcons y @primeuix/themes.
- Pinia para estado global y Vue Router 4.
- Axios con interceptores para auth y manejo de errores.
- Chart.js, jsPDF autotable y `qrcode` para reportes.
- Sass para theming y overrides.

## Estructura
```
src/
├─ modules/
│  ├─ auth/              # Login, stores, helpers
│  ├─ cooperatives/      # Formularios, stores, services
│  ├─ buses/             # Templates, grupos, detalle de bus
│  ├─ conductores/       # Driver CRUD
│  ├─ tickets/           # Venta presencial, componentes
│  └─ ...                # payments, routes, sales, admin
├─ layouts/              # AdminLayout, Sidebar, nav
├─ router/               # Definicion de rutas y guards
├─ services/             # Axios instance, interceptors
├─ composables/          # Hooks compartidos (permisos, theming)
├─ styles/               # Variables PrimeVue, utilidades
└─ lib/                  # Notifier, formatters, helpers
```

## Instalacion
1. Requisitos: Node.js 18+ y npm.
2. Clona el repo:
   ```bash
   git clone https://github.com/TU-USUARIO/hatunbus-front-web.git
   cd hatunbus-front-web
   npm install
   ```
3. Duplica `.env.example`:
   ```bash
   cp .env.example .env
   ```

### Variables de entorno
| Variable             | Ejemplo                        | Uso                                      |
|----------------------|--------------------------------|------------------------------------------|
| `VITE_API_BASE_URL`  | `http://localhost:8080/api`    | Base de los endpoints REST.              |
| `VITE_WS_URL`        | `ws://localhost:8080/ws`       | Socket para notificaciones (opcional).   |
| `VITE_APP_NAME`      | `HatunBus`                     | Branding usado en layout y meta tags.    |

## Scripts
| Comando         | Descripcion                                                  |
|-----------------|--------------------------------------------------------------|
| `npm run dev`   | Arranca Vite en `http://localhost:5173`.                     |
| `npm run build` | Build de produccion (output en `dist/`).                     |
| `npm run preview` | Previsualiza el build.                                    |
| `npm run lint`  | Ejecuta ESLint (config Expo/TypeScript).                     |
| `npm run test`  | Espacio reservado para integrar Vitest/Jest.                 |

## Flujo basico
1. Arranca backend (`hatunbus-back`) y configura `VITE_API_BASE_URL`.
2. Ejecuta `npm run dev`.
3. Autentica con usuario ADMIN o COOPERATIVE.
4. Crea cooperativas/usuarios/buses desde los formularios.
5. Usa el modulo de ventas para emitir boletos y verificar pagos.

## Troubleshooting
- **CORS/401**: confirma que el backend exponga `http://localhost:5173` y que el token JWT este vigente (ver `auth/store/useAuthStore`).
- **PrimeVue estilos rotos**: verifica que `src/styles/theme.css` se importe en `main.ts` y que `@primeuix/themes` coincida con la version de PrimeVue.
- **Errores WebSocket**: deshabilita `VITE_WS_URL` temporalmente si el backend aun no expone el socket.
- **Build sin iconos**: asegúrate de ejecutar `npm install` despues de cambiar tema/PrimeIcons.

## Contribuciones
Revisa `CONTRIBUTING.md` y usa las plantillas de PR/Issues en `.github/`.

## Licencia
MIT (ver `LICENSE`).

## Mantenimiento
- Mantén consistentes los hooks y stores en `modules/*/store`.
- Al agregar endpoints, actualiza `modules/*/services` y documenta los payloads.
- Ejecuta `npm run lint` antes de subir cambios.
- Usa ramas `feature/*` o `fix/*` y describe los cambios en el README si agregas modulos nuevos.
