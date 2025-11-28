# Sistema de Mensajería en Foros 📨

## Descripción General

El sistema de mensajería permite que los usuarios se comuniquen directamente dentro de cada foro de una materia. Los mensajes se almacenan en la base de datos y permiten:

- Enviar mensajes en un foro específico
- Listar mensajes con paginación
- Marcar mensajes como leídos
- Obtener contador de mensajes no leídos

## Modelo de Datos

### Entidad `mensaje`

```prisma
model mensaje {
  id         Int      @id @default(autoincrement())
  forumId    Int      // Referencia al foro
  authorId   String   // Referencia al usuario que envía
  contenido  String   // Texto del mensaje
  leido      Boolean  @default(false) // Estado de lectura
  created_at DateTime @default(now()) // Timestamp de creación
  updated_at DateTime @default(now()) // Timestamp de actualización

  foro       foro     @relation(fields: [forumId], references: [id], onDelete: Cascade)
  author     usuarios @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([forumId])
  @@index([authorId])
  @@index([created_at])
}
```

**Relaciones:**
- `forumId`: Vincula cada mensaje a un foro específico
- `authorId`: Vincula cada mensaje al usuario que lo envía
- Cascade delete: Si se elimina un foro o usuario, también se eliminan sus mensajes

---

## Endpoints de Mensajería

### 1. **Listar Mensajes en un Foro**
```http
GET /forums/:id/messages?page=1&unreadOnly=false
```

**Parámetros:**
- `id` (path): ID del foro
- `page` (query, opcional): Número de página (default: 1)
- `unreadOnly` (query, opcional): Solo mostrar mensajes no leídos (default: false)

**Ejemplo de uso:**
```bash
curl -X GET "http://localhost:3000/forums/1/messages?page=1&unreadOnly=false"
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "✅ Mensajes listados exitosamente.",
  "data": {
    "mensajes": [
      {
        "id": 1,
        "forumId": 1,
        "authorId": "user-123",
        "contenido": "¿Alguien sabe cómo resolver el ejercicio 5?",
        "leido": false,
        "created_at": "2025-11-27T10:30:00Z",
        "updated_at": "2025-11-27T10:30:00Z",
        "author": {
          "id": "user-123",
          "nombre": "Juan",
          "apellido": "Pérez",
          "email": "juan@example.com",
          "avatar_url": "https://..."
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  },
  "timestamp": "2025-11-27T10:35:00Z",
  "path": "/forums/1/messages"
}
```

---

### 2. **Enviar un Mensaje en un Foro**
```http
POST /forums/:id/messages
Content-Type: application/json

{
  "contenido": "Alguien sabe cómo resolver esto?",
  "authorId": "user-uuid-123"
}
```

**Parámetros:**
- `id` (path): ID del foro
- `contenido` (body): Texto del mensaje (requerido, no vacío)
- `authorId` (body): ID del usuario que envía (requerido)

**Validaciones:**
- El foro debe existir
- El usuario (authorId) debe existir
- El contenido no puede estar vacío

**Ejemplo de uso:**
```bash
curl -X POST "http://localhost:3000/forums/1/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "contenido": "¿Cómo se resuelve este problema?",
    "authorId": "user-uuid-123"
  }'
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "✅ Mensaje enviado exitosamente por Juan Pérez.",
  "data": {
    "id": 2,
    "forumId": 1,
    "authorId": "user-uuid-123",
    "contenido": "¿Cómo se resuelve este problema?",
    "leido": false,
    "created_at": "2025-11-27T10:35:00Z",
    "updated_at": "2025-11-27T10:35:00Z",
    "author": {
      "id": "user-uuid-123",
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan@example.com",
      "avatar_url": "https://..."
    },
    "foro": {
      "id": 1,
      "nombre": "Foro de Matemáticas",
      "slug": "matematicas",
      "materia": {
        "id": "MAT101",
        "nombre": "Cálculo I",
        "codigo": "MAT-101"
      }
    }
  },
  "timestamp": "2025-11-27T10:35:00Z",
  "path": "/forums/1/messages"
}
```

**Errores posibles:**
- `404 NOT_FOUND`: El foro o el usuario no existe
- `400 BAD_REQUEST`: El contenido está vacío o hay error de base de datos

---

### 3. **Marcar Mensaje como Leído**
```http
POST /forums/:forumId/messages/:messageId/read
```

**Parámetros:**
- `forumId` (path): ID del foro
- `messageId` (path): ID del mensaje

**Ejemplo de uso:**
```bash
curl -X POST "http://localhost:3000/forums/1/messages/5/read"
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "✅ Mensaje marcado como leído.",
  "data": {
    "id": 5,
    "forumId": 1,
    "authorId": "user-uuid-123",
    "contenido": "Mi mensaje aquí",
    "leido": true,
    "created_at": "2025-11-27T10:35:00Z",
    "updated_at": "2025-11-27T10:35:00Z",
    "author": { ... }
  },
  "timestamp": "2025-11-27T10:40:00Z",
  "path": "/forums/1/messages/5/read"
}
```

---

### 4. **Obtener Contador de Mensajes No Leídos**
```http
GET /forums/:id/messages/unread/count
```

**Parámetros:**
- `id` (path): ID del foro

**Ejemplo de uso:**
```bash
curl -X GET "http://localhost:3000/forums/1/messages/unread/count"
```

**Respuesta (200):**
```json
{
  "forumId": 1,
  "unreadCount": 3
}
```

---

## Flujo de Uso Completo (PowerShell)

### Paso 1: Crear un Foro
```powershell
$forumData = @{
    slug = "matematicas-basica"
    nombre = "Matemáticas Básica"
    descripcion = "Foro para discutir ejercicios de matemáticas"
    materiaId = "MAT101"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/forums" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $forumData
```

### Paso 2: Enviar Mensajes en el Foro
```powershell
$messageData = @{
    contenido = "¿Alguien me puede ayudar con el ejercicio 5?"
    authorId = "user-uuid-123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/forums/1/messages" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $messageData
```

### Paso 3: Listar Mensajes
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/forums/1/messages?page=1" `
  -Method GET `
  -Headers @{"Content-Type"="application/json"}
```

### Paso 4: Marcar Mensaje como Leído
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/forums/1/messages/1/read" `
  -Method POST
```

### Paso 5: Obtener Mensajes No Leídos
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/forums/1/messages/unread/count" `
  -Method GET
```

---

## Mensajes de Sistema

### Éxito
- `✅ Mensajes listados exitosamente.`
- `✅ Mensaje enviado exitosamente por [Nombre Usuario].`
- `✅ Mensaje marcado como leído.`

### Errores
- `❌ El foro solicitado no fue encontrado.` (404)
- `❌ El usuario con ID "[id]" no existe.` (404)
- `❌ El campo "contenido" es requerido.` (400)
- `❌ Error al acceder a la base de datos.` (400)
- `❌ Error al crear el registro en la base de datos.` (400)

---

## Implementación Técnica

### MensajesService

**Métodos principales:**

1. **`listMensajes(forumId, opts)`**
   - Obtiene mensajes paginados con información del autor
   - Soporta filtrado por estado de lectura
   - Incluye datos del usuario autor (nombre, apellido, avatar)

2. **`sendMensaje(forumId, dto)`**
   - Valida existencia del foro y usuario
   - Valida contenido no vacío
   - Crea registro en BD con timestamp
   - Retorna respuesta ApiResponse.created()

3. **`markAsRead(forumId, messageId)`**
   - Actualiza estado leido a true
   - Valida que el mensaje pertenece al foro

4. **`getUnreadCount(forumId)`**
   - Retorna cantidad de mensajes no leídos en el foro
   - Útil para mostrar notificaciones en UI

### Validaciones Implementadas

✅ El foro debe existir  
✅ El usuario (authorId) debe existir  
✅ El contenido no puede estar vacío  
✅ El mensaje debe pertenecer al foro (al marcar como leído)  
✅ Manejo centralizado de excepciones  
✅ Logging de todas las operaciones  

---

## Base de Datos

### Migration

Para crear la tabla de mensajes en la base de datos:

```bash
npx prisma migrate dev --name add_mensajes
```

### Queries Útiles (SQL)

```sql
-- Ver todos los mensajes de un foro
SELECT * FROM mensaje WHERE "forumId" = 1 ORDER BY "created_at" DESC;

-- Ver mensajes no leídos
SELECT * FROM mensaje WHERE "forumId" = 1 AND leido = false;

-- Contar mensajes no leídos por foro
SELECT "forumId", COUNT(*) as unread_count FROM mensaje 
WHERE leido = false GROUP BY "forumId";

-- Ver últimos 10 mensajes de un foro
SELECT m.*, u.nombre, u.apellido FROM mensaje m
JOIN usuarios u ON m."authorId" = u.id
WHERE m."forumId" = 1
ORDER BY m."created_at" DESC
LIMIT 10;
```

---

## Próximas Mejoras

- [ ] WebSocket para notificaciones en tiempo real
- [ ] Edición y eliminación de mensajes
- [ ] Menciones (@usuario)
- [ ] Reacciones con emojis
- [ ] Búsqueda de mensajes
- [ ] Historial de cambios
- [ ] Moderación (eliminar por admin)
- [ ] Rate limiting para evitar spam

