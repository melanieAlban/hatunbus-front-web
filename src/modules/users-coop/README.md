# Módulo Usuarios - Cooperativa

Vista y lógica para gestionar los usuarios relacionados a cooperativas.

Estructura:

- `interfaces/` - DTOs y tipos TypeScript.
- `services/` - Llamadas a la API (`/usuarios`).
- `store/` - Pinia store para estado y acciones CRUD.
- `components/` - Componentes reutilizables (lista, formulario).
- `views/` - Vistas conectadas a las rutas del panel admin.

Endpoints ejemplo (backend):

- `GET /api/usuarios`
- `GET /api/usuarios/{id}`
- `POST /api/usuarios`
- `PUT /api/usuarios/{id}`
- `DELETE /api/usuarios/{id}`
