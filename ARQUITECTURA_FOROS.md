# 🏗️ Arquitectura del Módulo de Foros

**Documento de Referencia Arquitectónica**  
**Fecha**: 28 de Noviembre de 2025  
**Versión**: 1.0  
**Estado**: Producción

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Estructura del Módulo](#estructura-del-módulo)
3. [Componentes Principales](#componentes-principales)
4. [Modelo de Datos](#modelo-de-datos)
5. [Patrones de Arquitectura](#patrones-de-arquitectura)
6. [Flujos de Negocio](#flujos-de-negocio)
7. [Validación y Seguridad](#validación-y-seguridad)
8. [Manejo de Errores](#manejo-de-errores)
9. [Integración con Otros Módulos](#integración-con-otros-módulos)
10. [Decisiones Arquitectónicas](#decisiones-arquitectónicas)

---

## 🎯 Visión General

El módulo de foros (`foros`) proporciona un sistema completo de comunicación colaborativa dentro de la plataforma de tutorías. Permite a estudiantes y tutores:

- **Crear y gestionar foros** por materia
- **Organizar discusiones** en hilos (threads)
- **Participar en conversaciones** a través de posts
- **Comunicarse directamente** mediante mensajes privados

### Objetivos Arquitectónicos

| Objetivo | Descripción |
|----------|-------------|
| **Modularidad** | Componentes independientes y reutilizables |
| **Escalabilidad** | Capacidad de manejar miles de usuarios concurrentes |
| **Mantenibilidad** | Código limpio, documentado y testeable |
| **Robustez** | Manejo consistente de errores y validaciones |
| **Performance** | Respuestas rápidas con paginación eficiente |

---

## 📁 Estructura del Módulo

```
src/foros/
├── foros.module.ts              # Módulo principal con inyección de dependencias
├── foros.service.ts             # Lógica de negocio de foros
├── foros.controller.ts          # Endpoints REST y routing
├── mensajes.service.ts          # Lógica de negocio de mensajes
├── dto/
│   ├── create-foro.dto.ts        # DTO para creación de foros
│   ├── create-thread.dto.ts      # DTO para creación de hilos
│   ├── create-post.dto.ts        # DTO para creación de posts
│   └── create-mensaje.dto.ts     # DTO para creación de mensajes
└── spec/
    ├── foros.service.spec.ts     # Tests del servicio (23 pruebas)
    ├── mensajes.service.spec.ts  # Tests de mensajes (25 pruebas)
    └── foros.controller.spec.ts   # Tests del controlador (17 pruebas)
```

### Archivos de Infraestructura Compartida

```
src/common/
├── responses/
│   ├── api.response.ts           # Factory de respuestas estandarizadas
│   └── api.response.spec.ts      # Tests de respuestas (19 pruebas)
├── filters/
│   ├── global-exception.filter.ts # Manejo centralizado de excepciones
│   └── global-exception.filter.spec.ts # Tests (12 pruebas)
└── messages/
    └── foros.messages.ts         # Mensajes de negocio centralizados
```

---

## 🔧 Componentes Principales

### 1. **ForosModule** - Módulo Principal

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [ForosController],
  providers: [ForosService, MensajesService],
})
export class ForosModule {}
```

**Responsabilidades:**
- Registrar servicios y controladores
- Importar módulo de Prisma
- Establecer inyección de dependencias

**Dependencias:**
- `PrismaModule`: Acceso a base de datos

---

### 2. **ForosService** - Orquestador de Negocio

**Rol:** Lógica de negocio de foros, hilos y posts.

**Métodos Principales:**

#### `createForo(createForoDto: CreateForoDto): Promise<ForoResponse>`
Crea un nuevo foro para una materia con validaciones de 3 niveles:

```
1. Validar que la materia existe
   ├─ Si no existe → HttpException(404)
   
2. Validar slug único
   ├─ Si existe → HttpException(409)
   
3. Validar un foro por materia
   ├─ Si ya existe → HttpException(409)

4. Crear foro en BD
   └─ Retornar ForoResponse con datos
```

**DTO Input:**
```typescript
{
  slug: string;           // URL-friendly identifier
  nombre: string;         // Nombre del foro
  descripcion: string;    // Descripción
  materiaId: number;      // Referencia a materia
}
```

**Validaciones:**
- `slug`: única en toda la tabla de foros
- `materiaId`: debe existir en tabla materias
- Un foro por materia (constraint)

---

#### `listForums(page?: number): Promise<PaginatedForums>`
Lista foros con paginación (20 por página).

```typescript
// Algoritmo
1. Calcular offset: (page - 1) * 20
2. Obtener foros ordenados DESC por createdAt
3. Contar total de registros
4. Calcular totalPages
5. Retornar con metadatos de paginación
```

**Response:**
```typescript
{
  data: ForoResponse[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
```

---

#### `createThread(forumSlug: string, createThreadDto: CreateThreadDto): Promise<HiloResponse>`
Crea un hilo con el primer post en una transacción.

```typescript
// Flujo transaccional
BEGIN TRANSACTION
  1. Validar que foro existe por slug
  2. Crear hilo (thread)
  3. Crear primer post con threadId
  4. Actualizar repliesCount en hilo
COMMIT
```

**DTO Input:**
```typescript
{
  title: string;          // Título del hilo
  slug: string;           // URL-friendly
  content: string;        // Contenido del primer post
  authorId: number;       // Autor del post
}
```

---

#### `createPost(threadId: string, createPostDto: CreatePostDto): Promise<PostResponse>`
Agrega post a un hilo (con soporte para anidamiento opcional).

```typescript
// Lógica
1. Validar que hilo existe
2. Crear post con threadId
3. Si tiene parentId → validar que post padre existe
4. Incrementar repliesCount del hilo
5. Retornar PostResponse
```

---

#### `listThreads(forumSlug: string, page?: number): Promise<PaginatedThreads>`
Lista hilos de un foro con paginación.

---

#### `getThread(threadId: string): Promise<HiloWithPosts>`
Obtiene un hilo con todos sus posts organizados jerárquicamente.

```typescript
// Estructura retornada
{
  thread: {
    id, title, slug, forumId, authorId, repliesCount,
    isPinned, isLocked, views, createdAt, updatedAt
  },
  posts: [
    { id, threadId, parentId, content, authorId, createdAt, updatedAt },
    // Posts anidados si tienen parentId
  ]
}
```

---

### 3. **MensajesService** - Sistema de Mensajería

**Rol:** Gestión de mensajes privados dentro de foros.

**Métodos Principales:**

#### `sendMensaje(forumId: number, createMensajeDto: CreateMensajeDto): Promise<MensajeResponse>`

```typescript
// Validaciones
1. Validar que foro existe
2. Validar que usuario (authorId) existe
3. Validar contenido no vacío
4. Crear mensaje con timestamp
5. Retornar MensajeResponse
```

**DTO Input:**
```typescript
{
  contenido: string;      // Mensaje (trimmed)
  authorId: number;       // Autor del mensaje
}
```

---

#### `listMensajes(forumId: number, page?: number, unreadOnly?: boolean): Promise<PaginatedMensajes>`

```typescript
// Filtrado opcional
if (unreadOnly) {
  WHERE leido = false
}

// Paginación y ordenamiento
ORDER BY createdAt DESC
LIMIT 20 OFFSET (page - 1) * 20
```

---

#### `markAsRead(mensajeId: number): Promise<MensajeResponse>`
Marca un mensaje como leído.

```typescript
UPDATE mensaje
SET leido = true
WHERE id = mensajeId
```

---

#### `getUnreadCount(forumId: number, userId?: number): Promise<number>`
Retorna cantidad de mensajes sin leer en un foro.

```typescript
SELECT COUNT(*)
WHERE forumId = ? AND leido = false
```

---

### 4. **ForosController** - Endpoints REST

**Base URL:** `/api/foros`

#### Endpoints de Foros

| Método | Ruta | Descripción | Código |
|--------|------|-------------|--------|
| `GET` | `/forums` | Listar foros paginados | 200 |
| `POST` | `/forums` | Crear nuevo foro | 201 |

**Ejemplo Request POST:**
```bash
POST /api/foros/forums HTTP/1.1
Content-Type: application/json

{
  "slug": "matematica-basica",
  "nombre": "Matemática Básica",
  "descripcion": "Foro para discutir conceptos básicos de matemática",
  "materiaId": 1
}
```

**Ejemplo Response 201:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Foro creado exitosamente",
  "data": {
    "id": 1,
    "slug": "matematica-basica",
    "nombre": "Matemática Básica",
    "descripcion": "Foro para discutir conceptos básicos de matemática",
    "materiaId": 1,
    "createdAt": "2025-11-28T10:30:00Z"
  },
  "timestamp": "2025-11-28T10:30:00Z"
}
```

---

#### Endpoints de Hilos (Threads)

| Método | Ruta | Descripción | Código |
|--------|------|-------------|--------|
| `POST` | `/forums/:slug/threads` | Crear hilo en foro | 201 |
| `GET` | `/forums/:slug/threads` | Listar hilos de foro | 200 |
| `GET` | `/threads/:id` | Obtener hilo con posts | 200 |

---

#### Endpoints de Posts

| Método | Ruta | Descripción | Código |
|--------|------|-------------|--------|
| `POST` | `/threads/:id/posts` | Agregar post a hilo | 201 |

---

#### Endpoints de Mensajes

| Método | Ruta | Descripción | Código |
|--------|------|-------------|--------|
| `POST` | `/forums/:id/messages` | Enviar mensaje | 201 |
| `GET` | `/forums/:id/messages` | Listar mensajes | 200 |
| `POST` | `/forums/:forumId/messages/:messageId/read` | Marcar como leído | 200 |
| `GET` | `/forums/:id/messages/unread/count` | Contar no leídos | 200 |

---

### 5. **DTOs - Data Transfer Objects**

**Responsabilidad:** Validar estructura de requests antes de llegar a servicios.

#### CreateForoDto
```typescript
@IsString()
@IsNotEmpty()
slug: string;

@IsString()
@IsNotEmpty()
nombre: string;

@IsString()
@IsNotEmpty()
descripcion: string;

@IsNumber()
@IsNotEmpty()
materiaId: number;
```

#### CreateThreadDto
```typescript
@IsString()
@IsNotEmpty()
title: string;

@IsString()
@IsNotEmpty()
slug: string;

@IsString()
@IsNotEmpty()
content: string;

@IsNumber()
@IsNotEmpty()
authorId: number;
```

#### CreatePostDto
```typescript
@IsString()
@IsNotEmpty()
content: string;

@IsNumber()
@IsNotEmpty()
authorId: number;

@IsNumber()
@IsOptional()
parentId?: number;
```

#### CreateMensajeDto
```typescript
@IsString()
@IsNotEmpty()
contenido: string;

@IsNumber()
@IsNotEmpty()
authorId: number;
```

---

### 6. **GlobalExceptionFilter** - Manejo Centralizado de Errores

**Responsabilidad:** Interceptar TODAS las excepciones HTTP y retornarlas en formato estándar.

```typescript
// Flujo
Exception Lanzada
  ↓
GlobalExceptionFilter.catch()
  ├─ Extraer statusCode (default 500)
  ├─ Extraer mensaje
  ├─ Loguear error con contexto
  └─ Retornar ApiResponse.error()
```

**Excepciones Manejadas:**

| Excepción | Status | Ejemplo |
|-----------|--------|---------|
| `HttpException` | Variable | 400, 404, 409, 500 |
| `BadRequestException` | 400 | Validación fallida |
| `NotFoundException` | 404 | Recurso no existe |
| `ConflictException` | 409 | Duplicado, violación de constraint |
| `InternalServerErrorException` | 500 | Error no previsto |

**Response Estándar de Error:**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Ya existe un foro para esta materia",
  "data": null,
  "timestamp": "2025-11-28T10:35:00Z",
  "path": "/api/foros/forums",
  "errors": [
    {
      "field": "materiaId",
      "message": "Un foro por materia"
    }
  ]
}
```

---

### 7. **ApiResponse** - Factory de Respuestas

**Responsabilidad:** Generar respuestas HTTP estandarizadas.

**Métodos Estáticos:**

```typescript
// Éxito
ApiResponse.success(message, data, statusCode?)
ApiResponse.created(message, data)

// Error
ApiResponse.error(message, statusCode, errors?)
ApiResponse.notFound(message)
ApiResponse.conflict(message)
ApiResponse.badRequest(message)
```

**Estructura Estándar:**
```typescript
{
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
  path?: string;
  errors?: ErrorDetail[];
}
```

---

### 8. **ForosMessages** - Centralización de Mensajes

**Responsabilidad:** Almacenar todos los mensajes de negocio en un solo lugar.

**Categorías de Mensajes:**

#### Success (Éxito)
```typescript
FORO_CREATED = 'Foro creado exitosamente';
THREAD_CREATED = 'Hilo creado exitosamente';
POST_CREATED = 'Post creado exitosamente';
MENSAJE_SENT = 'Mensaje enviado exitosamente';
MENSAJE_MARKED_READ = 'Mensaje marcado como leído';
```

#### Errors (Errores)
```typescript
FORO_ALREADY_EXISTS = 'Ya existe un foro para esta materia';
FORO_SLUG_TAKEN = 'El slug ya está en uso';
FORO_NOT_FOUND = 'Foro no encontrado';
MATERIA_NOT_FOUND = 'Materia no encontrada';
THREAD_NOT_FOUND = 'Hilo no encontrado';
POST_NOT_FOUND = 'Post no encontrado';
MENSAJE_NOT_FOUND = 'Mensaje no encontrado';
```

---

## 💾 Modelo de Datos

### Diagrama de Entidades

```
┌─────────────┐
│   materia   │
│  (existente)│
└──────┬──────┘
       │ 1:1
       ↓
┌──────────────────┐
│     foro         │
├──────────────────┤
│ id (PK)          │
│ slug (UNIQUE)    │
│ nombre           │
│ descripcion      │
│ materiaId (FK)   │
│ createdAt        │
│ updatedAt        │
└────────┬─────────┘
         │ 1:M
         ↓
┌──────────────────┐     ┌──────────────────┐
│     hilo         │     │    mensaje       │
├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │
│ title            │     │ forumId (FK)     │
│ slug (UNIQUE)    │     │ authorId (FK)    │
│ forumId (FK) ─────────→│ contenido        │
│ authorId (FK)    │     │ leido            │
│ repliesCount     │     │ createdAt        │
│ isPinned         │     │ updatedAt        │
│ isLocked         │     └──────────────────┘
│ views            │
│ createdAt        │
│ updatedAt        │
└────────┬─────────┘
         │ 1:M
         ↓
┌──────────────────┐
│      post        │
├──────────────────┤
│ id (PK)          │
│ threadId (FK)    │
│ authorId (FK)    │
│ parentId (FK)    │ ← Soporte para anidamiento
│ content          │
│ createdAt        │
│ updatedAt        │
└──────────────────┘
```

### Schema Prisma

```prisma
model foro {
  id          Int      @id @default(autoincrement())
  slug        String   @unique
  nombre      String
  descripcion String
  materiaId   Int      @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  materia     materia  @relation(fields: [materiaId], references: [id], onDelete: Cascade)
  hilos       hilo[]
  mensajes    mensaje[]

  @@index([materiaId])
  @@index([createdAt])
}

model hilo {
  id          Int      @id @default(autoincrement())
  title       String
  slug        String   @unique
  forumId     Int
  authorId    Int
  repliesCount Int    @default(0)
  isPinned    Boolean  @default(false)
  isLocked    Boolean  @default(false)
  views       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  foro        foro     @relation(fields: [forumId], references: [id], onDelete: Cascade)
  usuario     usuarios @relation(fields: [authorId], references: [id], onDelete: Cascade)
  posts       post[]

  @@index([forumId])
  @@index([authorId])
  @@index([createdAt])
}

model post {
  id        Int      @id @default(autoincrement())
  threadId  Int
  authorId  Int
  parentId  Int?     // Soporte para anidamiento
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  hilo      hilo     @relation(fields: [threadId], references: [id], onDelete: Cascade)
  usuario   usuarios @relation(fields: [authorId], references: [id], onDelete: Cascade)
  padre     post?    @relation("posts_parent", fields: [parentId], references: [id], onDelete: Cascade)
  hijos     post[]   @relation("posts_parent")

  @@index([threadId])
  @@index([authorId])
  @@index([parentId])
  @@index([createdAt])
}

model mensaje {
  id        Int      @id @default(autoincrement())
  forumId   Int
  authorId  Int
  contenido String
  leido     Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  foro      foro     @relation(fields: [forumId], references: [id], onDelete: Cascade)
  usuario   usuarios @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([forumId])
  @@index([authorId])
  @@index([leido])
  @@index([createdAt])
}
```

---

## 🎨 Patrones de Arquitectura

### 1. **Patrón MVC (Model-View-Controller)**

```
Request HTTP
    ↓
ForosController (View Layer)
    ↓
Validación con DTOs
    ↓
ForosService (Business Logic)
    ↓
PrismaService (Data Access Layer)
    ↓
Prisma Client
    ↓
PostgreSQL (Base de Datos)
    ↓
Response JSON
```

### 2. **Patrón Service Locator**

El módulo implementa inyección de dependencias con NestJS:

```typescript
@Module({
  providers: [
    ForosService,
    MensajesService
    // ForosService y MensajesService están disponibles
    // en todo el módulo automáticamente
  ]
})
```

### 3. **Patrón Factory**

`ApiResponse` es un factory que crea respuestas:

```typescript
// En lugar de instanciar directamente:
new ApiResponse().success(...) // ❌

// Usamos métodos estáticos:
ApiResponse.success(...) // ✅
```

### 4. **Patrón Interceptor**

`GlobalExceptionFilter` intercepta excepciones:

```typescript
Exception →  GlobalExceptionFilter.catch()  → ApiResponse.error()
```

### 5. **Patrón Validator/DTO**

DTOs validan datos antes de procesamiento:

```typescript
{
  @IsString()
  @IsNotEmpty()
  slug: string; // Validado automáticamente
}
```

---

## 🔄 Flujos de Negocio

### Flujo 1: Crear un Foro

```
1. Usuario envía POST /api/foros/forums
   ├─ DTO valida campos (slug, nombre, descripcion, materiaId)
   
2. Controller recibe request validado
   ├─ Llama a ForosService.createForo()
   
3. Servicio valida reglas de negocio
   ├─ ¿Existe materia? → HttpException(404)
   ├─ ¿Slug único? → HttpException(409)
   ├─ ¿Un foro por materia? → HttpException(409)
   
4. Si validaciones OK → Crear en BD
   ├─ INSERT INTO foro (slug, nombre, ...)
   
5. Servicio retorna ForoResponse
   ├─ Controller retorna response 201
   
6. GlobalExceptionFilter captura cualquier error
   ├─ Retorna ApiResponse.error()
```

### Flujo 2: Crear Hilo en Foro

```
1. Usuario envía POST /api/foros/forums/:slug/threads
   ├─ DTO valida campos

2. Controller valida slug de foro existe
   └─ Llama a ForosService.createThread()

3. Servicio en transacción:
   ├─ BEGIN TRANSACTION
   ├─ Crear hilo (INSERT hilo)
   ├─ Crear primer post (INSERT post)
   ├─ Actualizar repliesCount
   └─ COMMIT

4. Retorna HiloResponse con id

5. Cliente puede agregar más posts al hilo
```

### Flujo 3: Enviar Mensaje en Foro

```
1. Usuario envía POST /api/foros/:id/messages
   ├─ Body: { contenido, authorId }

2. MensajesService.sendMensaje():
   ├─ Validar foro existe
   ├─ Validar usuario existe
   ├─ Validar contenido no vacío
   ├─ INSERT INTO mensaje
   └─ Retorna MensajeResponse

3. Cliente puede:
   ├─ GET /forums/:id/messages → Listar mensajes
   ├─ GET /forums/:id/messages/unread/count → Contar no leídos
   └─ POST /forums/:forumId/messages/:messageId/read → Marcar leído
```

---

## 🔐 Validación y Seguridad

### Validaciones en DTOs

```typescript
// CreateForoDto
@IsString()
@IsNotEmpty()
@MinLength(3)
@MaxLength(50)
slug: string; // Previene strings vacíos o muy largos

@IsNumber()
@IsNotEmpty()
materiaId: number; // Solo acepta números válidos
```

### Validaciones en Servicio

```typescript
// Level 1: Existencia de referencia
const materia = await this.prisma.materia.findUnique({
  where: { id: createForoDto.materiaId }
});
if (!materia) {
  throw new HttpException(
    ForosMessages.MATERIA_NOT_FOUND,
    HttpStatus.NOT_FOUND
  );
}

// Level 2: Unicidad
const existingSlug = await this.prisma.foro.findUnique({
  where: { slug: createForoDto.slug }
});
if (existingSlug) {
  throw new HttpException(
    ForosMessages.FORO_SLUG_TAKEN,
    HttpStatus.CONFLICT
  );
}

// Level 3: Constraint único por materia
const existingForo = await this.prisma.foro.findFirst({
  where: { materiaId: createForoDto.materiaId }
});
if (existingForo) {
  throw new HttpException(
    ForosMessages.FORO_ALREADY_EXISTS,
    HttpStatus.CONFLICT
  );
}
```

### Seguridad de Datos

- **Input Sanitization**: class-transformer trimea strings
- **Validation Layer**: DTOs previenen payload injection
- **Error Handling**: No expone detalles de BD en respuestas
- **Logging**: Registra acciones para auditoría

---

## ⚠️ Manejo de Errores

### Estrategia de Errores

```
Validation Error (DTO)
    ↓
BadRequestException (400)
    ↓
GlobalExceptionFilter
    ↓
ApiResponse.error()
```

### Códigos HTTP Utilizados

| Código | Caso | Mensaje |
|--------|------|---------|
| **201** | Creación exitosa | "Foro creado exitosamente" |
| **200** | Consulta exitosa | "Operación exitosa" |
| **400** | Validación fallida | Detalles del error |
| **404** | Recurso no encontrado | "Materia no encontrada" |
| **409** | Conflicto/Duplicado | "Ya existe un foro..." |
| **500** | Error interno | "Error interno del servidor" |

### Logging de Errores

```typescript
// Cada error loguea:
this.logger.error(
  `Error creating forum: ${error.message}`,
  error.stack,
  'ForosService'
);
```

---

## 🔗 Integración con Otros Módulos

### Dependencias del Módulo

```
ForosModule
  ├─ PrismaModule (BD)
  │   └─ Proporciona PrismaService
  │
  ├─ app.module.ts (Registro)
  │   └─ Importa ForosModule
  │
  └─ GlobalExceptionFilter
      └─ Registrado en main.ts
```

### Relaciones con Otras Entidades

```
foros ←→ materia (relación 1:1)
  └─ Cada foro pertenece a exactamente una materia

hilos ←→ foro (relación 1:M)
  └─ Un foro puede tener múltiples hilos

posts ←→ hilo (relación 1:M)
  └─ Un hilo puede tener múltiples posts

posts ←→ posts (auto-referencia)
  └─ Posts pueden ser respuestas de otros posts

mensaje ←→ foro (relación 1:M)
  └─ Un foro puede tener múltiples mensajes
```

### Integración con Usuarios

```
Las entidades foro, hilo, post, mensaje 
usan authorId para referenciar usuarios.

No existe validación explícita de usuario en ForosService
porque se espera que sea responsabilidad del AuthModule
(futuro) validar que authorId es válido.
```

---

## 🏛️ Decisiones Arquitectónicas

### Decisión 1: Separar Foros de Mensajes en Dos Servicios

**Opción A (Seleccionada):**
- ForosService: Foros, Hilos, Posts
- MensajesService: Mensajes privados

**Opción B (Rechazada):**
- Un único ForosService con todo

**Justificación:**
- ✅ Separación de responsabilidades (SRP)
- ✅ Facilita testing independiente
- ✅ Escalabilidad futura (servicios separados)
- ✅ Código más legible y mantenible

---

### Decisión 2: Usar DTOs para Validación

**Opción A (Seleccionada):**
```typescript
// DTOs con class-validator
@IsString()
@IsNotEmpty()
slug: string;
```

**Opción B (Rechazada):**
```typescript
// Validación manual en servicio
if (!slug || typeof slug !== 'string') { ... }
```

**Justificación:**
- ✅ Código declarativo y limpio
- ✅ Validación automática en controlador
- ✅ Respuestas de error consistentes
- ✅ Documentación automática con Swagger

---

### Decisión 3: Factory Pattern para Respuestas

**Opción A (Seleccionada):**
```typescript
ApiResponse.success(message, data);
ApiResponse.error(message, statusCode);
```

**Opción B (Rechazada):**
```typescript
new ApiResponse().success(message, data);
new ApiResponse().error(message, statusCode);
```

**Justificación:**
- ✅ Evita crear instancias innecesarias
- ✅ Sintaxis más limpia
- ✅ Patrón estándar en la industria
- ✅ Mejor performance

---

### Decisión 4: Global Exception Filter

**Opción A (Seleccionada):**
```typescript
// Un único filtro registrado globalmente en main.ts
app.useGlobalFilters(new GlobalExceptionFilter());
```

**Opción B (Rechazada):**
```typescript
// Filtro en cada controlador
@UseFilters(ExceptionFilter)
```

**Justificación:**
- ✅ Consistencia garantizada en toda la app
- ✅ Evita duplicación
- ✅ Mantenimiento centralizado
- ✅ Debugging simplificado

---

### Decisión 5: Paginación en 20 Items

**Opción A (Seleccionada):** 20 items por página
**Opción B (Rechazada):** 10 items por página
**Opción C (Rechazada):** Configurable por cliente

**Justificación:**
- ✅ Balance entre performance y UX
- ✅ Estándar en redes sociales
- ✅ Evita complejidad innecesaria
- ✅ Puede configurarse después sin breaking change

---

## 📊 Estadísticas de Cobertura

```
Statements: 80.25% ✅
Functions:  86.36% ✅
Branches:   77.06% ✅
Lines:      80.93% ✅

Total Tests: 80 (100% passing)
```

**Cobertura por Componente:**

| Componente | Cobertura | Estado |
|------------|-----------|--------|
| ForosController | 100% | ✅ Perfecto |
| ForosService | 96.36% | ✅ Excelente |
| MensajesService | 90.62% | ✅ Excelente |
| ApiResponse | 92.85% | ✅ Excelente |
| GlobalExceptionFilter | 92.85% | ✅ Excelente |
| DTOs | 100% | ✅ Perfecto |

---

## 🚀 Roadmap Futuro

### Fase 2 (Próxima)
- [ ] Autenticación y autorización
- [ ] Permiso de usuario para crear foros
- [ ] Moderar contenido (delete, edit posts)

### Fase 3
- [ ] WebSocket para mensajes en tiempo real
- [ ] Búsqueda full-text en foros
- [ ] Notificaciones de nuevos posts

### Fase 4
- [ ] Reacciones (emojis) en posts
- [ ] Attachments (imágenes, archivos)
- [ ] Sistema de reputación

### Fase 5
- [ ] Soft deletes
- [ ] Restore de posts eliminados
- [ ] Historial de versiones

---

## 📚 Referencias y Recursos

### Documentación Relacionada
- `UNIT_TESTS.md` - Especificación de tests
- `COVERAGE_REPORT.md` - Análisis de cobertura
- `MENSAJERIA.md` - Sistema de mensajes
- `FOROS.md` - Guía de uso

### Tecnologías Utilizadas
- **Framework**: NestJS 11.0.1
- **ORM**: Prisma 7.0.1
- **Database**: PostgreSQL
- **Language**: TypeScript 5.7.3
- **Testing**: Jest 29.7.0
- **Validation**: class-validator 0.14.0

### Estándares Aplicados
- RESTful API Design
- Domain-Driven Design (DDD)
- SOLID Principles
- Clean Code

---

## 👥 Contribuciones y Soporte

**Autor**: Equipo DOSW  
**Versión**: 1.0  
**Última Actualización**: 28 de Noviembre de 2025  
**Estado**: Producción

Para preguntas o sugerencias sobre la arquitectura, contactar al equipo de desarrollo.

---

**Fin del Documento**
