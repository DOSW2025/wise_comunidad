# 🚀 Sistema de Foros - Wise Comunidad

Módulo de foros para la plataforma Wise Comunidad, permitiendo a los usuarios crear y participar en discusiones organizadas por categorías.

## Características

- ✅ **Foros** - Categorías para organizar discusiones
- ✅ **Hilos (Threads)** - Temas individuales dentro de un foro
- ✅ **Posts** - Mensajes/respuestas dentro de un hilo
- ✅ **Paginación** - Listados con paginación integrada
- ✅ **Timestamps** - Seguimiento automático de created_at y updated_at
- ✅ **Contadores** - Contador automático de respuestas por hilo

## Estructura de datos

### Entidades

```
Foro (Categoría)
  ├── id (PK)
  ├── slug (UNIQUE)
  ├── nombre
  ├── descripcion
  ├── activo (default: true)
  ├── created_at
  ├── updated_at
  └── hilos []

Hilo (Thread)
  ├── id (PK)
  ├── title
  ├── slug (UNIQUE)
  ├── forumId (FK → foro.id)
  ├── authorId (FK → usuarios.id)
  ├── isPinned (default: false)
  ├── isLocked (default: false)
  ├── repliesCount (default: 0, auto-increment)
  ├── views (default: 0)
  ├── created_at
  ├── updated_at
  └── posts []

Post (Mensaje)
  ├── id (PK)
  ├── threadId (FK → hilo.id)
  ├── authorId (FK → usuarios.id)
  ├── parentId (FK → post.id, OPTIONAL para replies anidados)
  ├── content
  ├── created_at
  ├── updated_at
  └── children []
```

## Endpoints

### Foros

| Método | Ruta | Descripción | Status |
|--------|------|-------------|--------|
| `GET` | `/forums` | Listar foros (paginado, 20 por página) | 200 |
| `POST` | `/forums` | Crear nuevo foro ⚠️ (sin protección, TODO: admin only) | 201 |

### Hilos

| Método | Ruta | Descripción | Status |
|--------|------|-------------|--------|
| `GET` | `/forums/:slug/threads` | Listar hilos de un foro (paginado) | 200 |
| `POST` | `/forums/:slug/threads` | Crear nuevo hilo con primer post | 201 |
| `GET` | `/threads/:id` | Obtener hilo con sus posts | 200 |

### Posts

| Método | Ruta | Descripción | Status |
|--------|------|-------------|--------|
| `POST` | `/threads/:id/posts` | Crear post en un hilo | 201 |

## Modelos de Request/Response

### Crear Foro
**POST** `/forums`

Request:
```json
{
  "slug": "general",
  "nombre": "Foro General",
  "descripcion": "Discusiones generales"
}
```

Response (201):
```json
{
  "id": 1,
  "slug": "general",
  "nombre": "Foro General",
  "descripcion": "Discusiones generales",
  "activo": true,
  "created_at": "2025-11-27T10:30:00Z",
  "updated_at": "2025-11-27T10:30:00Z"
}
```

### Crear Hilo
**POST** `/forums/:slug/threads`

Request:
```json
{
  "title": "¿Cómo usar la plataforma?",
  "slug": "como-usar-plataforma",
  "content": "Primer mensaje del hilo",
  "authorId": "user-uuid-123"
}
```

Response (201):
```json
{
  "id": 1,
  "title": "¿Cómo usar la plataforma?",
  "slug": "como-usar-plataforma",
  "forumId": 1,
  "authorId": "user-uuid-123",
  "isPinned": false,
  "isLocked": false,
  "repliesCount": 1,
  "views": 0,
  "created_at": "2025-11-27T10:35:00Z",
  "updated_at": "2025-11-27T10:35:00Z",
  "posts": [
    {
      "id": 1,
      "threadId": 1,
      "authorId": "user-uuid-123",
      "parentId": null,
      "content": "Primer mensaje del hilo",
      "created_at": "2025-11-27T10:35:00Z",
      "updated_at": "2025-11-27T10:35:00Z"
    }
  ]
}
```

### Crear Post
**POST** `/threads/:id/posts`

Request:
```json
{
  "content": "Excelente pregunta, aquí está la respuesta...",
  "authorId": "user-uuid-456",
  "parentId": null
}
```

Response (201):
```json
{
  "id": 2,
  "threadId": 1,
  "authorId": "user-uuid-456",
  "parentId": null,
  "content": "Excelente pregunta, aquí está la respuesta...",
  "created_at": "2025-11-27T10:40:00Z",
  "updated_at": "2025-11-27T10:40:00Z"
}
```

## Instalación y Setup

1. **Copiar schema Prisma** - Ya incluido en `prisma/schema.prisma`
2. **Generar cliente Prisma**:
   ```bash
   npx prisma generate
   ```
3. **Aplicar migración**:
   ```bash
   npx prisma migrate dev --name add_foros
   ```
4. **Iniciar app**:
   ```bash
   npm run start:dev
   ```

## Testing

Ver [TESTING.md](./TESTING.md) para instrucciones detalladas de prueba con ejemplos de curl y PowerShell.

### Ejecutar tests e2e
```bash
npm run test:e2e
```

### Ejecutar script automatizado
```powershell
.\test-foros.ps1
```

## Decisiones de diseño

1. **Slugs únicos** - Cada foro e hilo tiene slug para URLs amigables
2. **Contador automático** - `repliesCount` se incrementa automáticamente al crear posts
3. **Timestamps automáticos** - `created_at` y `updated_at` se establecen automáticamente
4. **Paginación** - Por defecto 20 items por página
5. **Pin/Lock (TODO)** - Campos `isPinned` e `isLocked` preparados para moderación futura

## Funcionalidad futura (Roadmap)

- [ ] **Autenticación y permisos**
  - [ ] Solo autores pueden editar/eliminar sus posts
  - [ ] Admins pueden pin/lock threads
  - [ ] Admins pueden crear foros

- [ ] **Búsqueda**
  - [ ] Buscar foros por nombre
  - [ ] Buscar hilos por título o contenido
  - [ ] Buscar posts

- [ ] **Reacciones**
  - [ ] Likes/reactions en posts
  - [ ] Contador de reacciones

- [ ] **Attachments**
  - [ ] Subir archivos en posts
  - [ ] Validar tipo y tamaño

- [ ] **Notificaciones**
  - [ ] Notificar cuando alguien responde en tu hilo
  - [ ] Notificar cuando alguien cita tu post

- [ ] **Moderación**
  - [ ] Soft-delete de posts
  - [ ] Reportar contenido inapropiado
  - [ ] Baneos de usuarios

## Archivos del módulo

```
src/foros/
├── foros.module.ts          # Módulo NestJS
├── foros.controller.ts       # Controlador con rutas
├── foros.service.ts          # Lógica de negocio
└── dto/
    ├── create-thread.dto.ts  # DTO para crear hilos
    └── create-post.dto.ts    # DTO para crear posts

test/
└── foros.e2e-spec.ts        # Tests e2e

TESTING.md                     # Guía de testing
```

## Errors comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Foro no encontrado` | Forum slug no existe | Verifica el slug, crea el foro primero |
| `Hilo no encontrado` | Thread ID no existe | Verifica el ID del hilo |
| `ValidationPipe rejected` | Body no cumple DTO | Revisa los campos requeridos en la request |
| `Can't reach database` | PostgreSQL no corre | Inicia PostgreSQL |

## Contribuidores

- Sistema de foros implementado por el equipo DOSW
- Rama: `feature/foros`
