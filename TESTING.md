# Testing Foros Module

Este documento describe cómo probar el nuevo módulo de foros.

## Prerequisitos

1. **PostgreSQL corriendo localmente** (puerto 5432)
2. **Base de datos `wise_comunidad` creada**
3. **Variables de entorno configuradas** en `.env`:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/wise_comunidad"
   PORT=3000
   ```

## Pasos para probar

### 1. Instalar dependencias (si no lo has hecho)
```powershell
npm.cmd install
```

### 2. Generar cliente Prisma
```powershell
$env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/wise_comunidad"
npx.cmd prisma generate
```

### 3. Aplicar migración a la base de datos
```powershell
$env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/wise_comunidad"
npx.cmd prisma migrate dev --name add_foros
```

Esto creará las tablas: `foro`, `hilo`, `post` en tu BD.

### 4. Iniciar la aplicación en modo desarrollo
```powershell
npm.cmd run start:dev
```

Espera a ver:
```
[Nest] 12345  11/27/2025, 10:30:00 AM     LOG [ComunidadApp] Application is running on: 3000
```

### 5. Probar endpoints (abre otra terminal)

#### **Listar foros (inicialmente vacío)**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/forums" -Method Get | ConvertTo-Json
```

#### **Crear un foro**
```powershell
$forum = @{
    slug = "general"
    nombre = "Foro General"
    descripcion = "Discuss anything here"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/forums" -Method Post -Body $forum -ContentType "application/json" | ConvertTo-Json
```

Expected response:
```json
{
  "id": 1,
  "slug": "general",
  "nombre": "Foro General",
  "descripcion": "Discuss anything here",
  "activo": true,
  "created_at": "2025-11-27T...",
  "updated_at": "2025-11-27T..."
}
```

#### **Crear un usuario (para ser autor de threads/posts)**
Necesitas un usuario existente. Si no tienes, crea uno en la BD directamente o usa un ID que ya exista:
```powershell
# Opcionalmente, crea un usuario de prueba en Prisma Studio
npx.cmd prisma studio
```
O usa un usuario ya existente en tu BD.

#### **Crear un thread (hilo) en el foro**
```powershell
$thread = @{
    title = "Mi primer tema"
    slug = "mi-primer-tema"
    content = "Contenido del primer post"
    authorId = "USER_ID_HERE"  # Reemplaza con un ID de usuario real
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/forums/general/threads" -Method Post -Body $thread -ContentType "application/json" | ConvertTo-Json
```

Expected response:
```json
{
  "id": 1,
  "title": "Mi primer tema",
  "slug": "mi-primer-tema",
  "forumId": 1,
  "authorId": "USER_ID_HERE",
  "isPinned": false,
  "isLocked": false,
  "repliesCount": 1,
  "views": 0,
  "created_at": "2025-11-27T...",
  "updated_at": "2025-11-27T...",
  "posts": [
    {
      "id": 1,
      "threadId": 1,
      "authorId": "USER_ID_HERE",
      "content": "Contenido del primer post",
      "created_at": "2025-11-27T...",
      "updated_at": "2025-11-27T..."
    }
  ]
}
```

#### **Obtener un thread específico**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/threads/1" -Method Get | ConvertTo-Json
```

#### **Crear un post (respuesta) en un thread**
```powershell
$post = @{
    content = "Esta es una respuesta al tema"
    authorId = "USER_ID_HERE"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/threads/1/posts" -Method Post -Body $post -ContentType "application/json" | ConvertTo-Json
```

Expected response:
```json
{
  "id": 2,
  "threadId": 1,
  "authorId": "USER_ID_HERE",
  "parentId": null,
  "content": "Esta es una respuesta al tema",
  "created_at": "2025-11-27T...",
  "updated_at": "2025-11-27T..."
}
```

#### **Listar threads de un foro (con paginación)**
```powershell
# Página 1 (default)
Invoke-RestMethod -Uri "http://localhost:3000/forums/general/threads" -Method Get | ConvertTo-Json

# Página 2
Invoke-RestMethod -Uri "http://localhost:3000/forums/general/threads?page=2" -Method Get | ConvertTo-Json
```

## Alternativa: Usar curl (desde Git Bash o Windows Terminal con bash)

```bash
# Crear foro
curl -X POST http://localhost:3000/forums \
  -H "Content-Type: application/json" \
  -d '{"slug":"general","nombre":"General","descripcion":"Foro general"}'

# Listar foros
curl http://localhost:3000/forums

# Crear thread
curl -X POST http://localhost:3000/forums/general/threads \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi tema","slug":"mi-tema","content":"Contenido","authorId":"user-1"}'

# Obtener thread
curl http://localhost:3000/threads/1

# Crear post
curl -X POST http://localhost:3000/threads/1/posts \
  -H "Content-Type: application/json" \
  -d '{"content":"Respuesta","authorId":"user-1"}'

# Listar threads de foro
curl http://localhost:3000/forums/general/threads
```

## Ejecutar tests e2e

Una vez que la BD está migrada:
```powershell
npm.cmd run test:e2e
```

## Troubleshooting

- **Error: Can't reach database server** → PostgreSQL no está corriendo. Inicia PostgreSQL.
- **Error: Database does not exist** → Crea la BD: `createdb wise_comunidad` (si tienes `psql` en PATH)
- **Error: usuario no encontrado** → Asegúrate de tener un usuario en la tabla `usuarios` o crea uno con Prisma Studio
- **Error: ValidationPipe rejects request** → Verifica que el JSON es válido y cumple con los DTOs

## Endpoints resumen

| Método | Ruta                            | Descripción                    | Status |
|--------|----------------------------------|--------------------------------|--------|
| GET    | `/forums`                        | Listar foros (paginado)        | 200    |
| POST   | `/forums`                        | Crear foro                     | 201    |
| GET    | `/forums/:slug/threads`          | Listar threads de un foro      | 200    |
| POST   | `/forums/:slug/threads`          | Crear thread                   | 201    |
| GET    | `/threads/:id`                   | Obtener thread con posts       | 200    |
| POST   | `/threads/:id/posts`             | Crear post en thread           | 201    |

## Siguiente iteración

Pendiente agregar:
- ✅ Validación y permisos (solo autor puede editar su post)
- ✅ Moderación (admin puede pin/lock threads)
- ✅ Búsqueda de foros/threads
- ✅ Reacciones/likes
- ✅ Attachments
