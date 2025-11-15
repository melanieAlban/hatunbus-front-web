Auth module
===========

Estructura mínima para el módulo de autenticación (login).

Archivos creados:

- `components/LoginForm.vue` - formulario de login con validación mínima.
- `views/LoginView.vue` - vista que muestra el formulario.
- `services/authService.ts` - funciones `login`, `logout` y `getStoredToken` que usan el cliente HTTP.
- `interfaces/auth.interface.ts` - tipos TypeScript para credenciales y respuesta.

Uso rápido:

1. Configure la variable de entorno `VITE_API_BASE_URL` en el archivo de entorno (p. ej. `.env`) con la URL base del backend.
2. Desde cualquier componente puede importar `login`:

```ts
import { login } from '@/modules/auth/services/authService'

await login({ email: 'a@b.com', password: 'secret' })
```

Notas:
- El `apiClient` guarda el token en `localStorage` y lo añade al header `Authorization`.
- Ajusta las rutas de login/logout (`/auth/login`) según tu API.
