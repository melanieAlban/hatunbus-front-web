# Guía de Contribución

## Requisitos previos
- Node.js 18+ y npm instalados.
- Familiaridad con Vue 3 + TypeScript y PrimeVue.
- Git configurado y una cuenta en GitHub.

## Flujo para contribuir
1. Haz un **fork** del repositorio y clónalo.
2. Crea una rama descriptiva:  
   `git checkout -b feature/nombre-corto` o `git checkout -b fix/bug-descripcion`.
3. Copia `.env.example` a `.env` y ajusta `VITE_API_BASE_URL` al backend disponible.
4. Arranca el proyecto con `npm run dev` y verifica tu cambio en el navegador.
5. Ejecuta el build antes de abrir el PR:
   ```bash
   npm run build
   ```
6. Usa la convención de commits:
   - `feat:` nueva funcionalidad
   - `fix:` corrección de bug
   - `chore:` tareas de soporte
   - `docs:` documentación
   - `refactor:` cambios internos sin afectar comportamiento
   - `test:` adición/mejora de pruebas
7. Abre un Pull Request usando la plantilla incluida y enlaza el Issue correspondiente.

## Estandares del proyecto
- Usa `<script setup lang="ts">` y tipa los datos; evita `any` sin justificación.
- Componentiza la UI y reutiliza estilos/variables definidos en `src/styles`.
- Mantén servicios de API en `src/services` y el estado global en Pinia.
- No subas credenciales en `.env`; solo usa `.env.example` como referencia.

## Dudas o soporte
Usa las plantillas de Issues para reportar errores o proponer mejoras. Para dudas rápidas, comenta en el PR.
