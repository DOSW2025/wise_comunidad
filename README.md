# EciWise Comunidad - Microservicio

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  <strong>Microservicio central de gestión educativa comunitaria</strong><br>
  Construido con <a href="http://nodejs.org" target="_blank">Node.js</a> y <a href="https://nestjs.com" target="_blank">NestJS</a>
</p>

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Módulos Disponibles](#módulos-disponibles)
  - [Módulo Chat](#módulo-chat)
  - [Módulo Foros](#módulo-foros)
  - [Módulo Hilos](#módulo-hilos)
  - [Módulo Respuestas](#módulo-respuestas)
  - [Módulo Votos](#módulo-votos)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Ejecución](#ejecución)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración](#configuración)
- [Base de Datos](#base-de-datos)
- [Enlaces Relevantes](#enlaces-relevantes)

---

## Descripción General

**EciWise Comunidad** es el microservicio central de la plataforma EciWise que gestiona todas las funcionalidades comunitarias y educativas. Proporciona APIs y servicios de comunicación en tiempo real para que estudiantes y tutores colaboren efectivamente.

### Responsabilidades del Microservicio

- Gestión centralizada de usuarios, roles y autenticación
- Administración de materias, temas y contenido educativo
- Sistema de tutorías entre estudiantes y tutores
- Notificaciones en tiempo real
- Integración de módulos especializados (Chat, Foros, Hilos)

---

## Módulos Disponibles

### Módulo Chat

El módulo **Chat** proporciona comunicación en tiempo real entre usuarios:

- **Mensajería en tiempo real**: Comunicación bidireccional con WebSockets (Socket.IO)
- **Gestión de conversaciones**: Crear, actualizar y eliminar chats
- **Usuarios conectados**: Seguimiento de estado de conexión
- **Historial de mensajes**: Persistencia de conversaciones en base de datos
- **Autenticación y autorización**: Protección de endpoints mediante JWT
- **Validación de datos**: DTOs con class-validator

**Ubicación**: `src/chats/`

**Características Técnicas**:
- WebSockets con `@nestjs/websockets` y `Socket.IO`
- Autenticación JWT con `@nestjs/jwt` y `passport`
- Base de datos PostgreSQL con Prisma
- Documentación automática con Swagger

### Módulo Hilos

El módulo **Hilos** maneja conversaciones dentro de foros:

- **Crear hilos**: Iniciar nuevas conversaciones en foros
- **Gestión de hilos**: Editar, eliminar y archivar hilos
- **Estados**: Open (abierto), Closed (cerrado), Archived (archivado)
- **Pinned threads**: Fijar hilos importantes
- **Contador de respuestas**: Seguimiento automático
- **Contador de vistas**: Métricas de interés
- **Timestamps**: Registro de creación y actualización

**Ubicación**: `src/threads/`

**Modelo de Datos**:
- `id`: Identificador único (UUID)
- `author_id`: Referencia al usuario autor
- `title`: Título del hilo
- `content`: Contenido del hilo
- `status`: Estado (open/closed/archived)
- `replies_count`: Contador de respuestas
- `views_count`: Contador de vistas
- `pinned`: Indicador si está fijado
- `created_at`, `updated_at`, `deleted_at`: Timestamps

### Módulo Respuestas

El módulo **Respuestas** gestiona las replies (respuestas) dentro de los hilos:

- **Crear respuestas**: Agregar respuestas a hilos existentes
- **Marcar como útil**: Opción de marcar respuestas como solución
- **Gestión de respuestas**: Editar y eliminar respuestas
- **Validación**: DTOs con class-validator
- **Autenticación**: Protección mediante JWT

**Ubicación**: `src/responses/`

**Modelo de Datos**:
- `id`: Identificador único (UUID)
- `thread_id`: Referencia al hilo
- `author_id`: Referencia al usuario autor
- `content`: Contenido de la respuesta
- `is_accepted`: Indicador si es la respuesta aceptada
- `created_at`, `updated_at`, `deleted_at`: Timestamps

### Módulo Votos

El módulo **Votos** implementa sistema de votación en tiempo real:

- **Upvotes/Downvotes**: Sistema de valoración en tiempo real
- **WebSocket Events**: Actualización instantánea de votos (Socket.IO)
- **Contadores dinámicos**: Cambios en vivo
- **Autenticación**: Solo usuarios autenticados pueden votar
- **Prevención de duplicados**: Un voto por usuario

**Ubicación**: `src/votes/`

**Características Técnicas**:
- Gateway WebSocket para actualizaciones en tiempo real
- Integración con Socket.IO (como en Chat)
- Validación de datos con DTOs

---

## Requisitos Previos

Antes de empezar, asegúrate de tener instalados los siguientes componentes:

### Software Requerido

| Componente | Versión | Descripción |
|-----------|---------|------------|
| **Node.js** | v22.10.7 o superior | Runtime de JavaScript |
| **npm** | v10+ | Gestor de paquetes |
| **PostgreSQL** | v12 o superior | Base de datos |
| **TypeScript** | v5.7.3 | Lenguaje de tipado |
| **Docker** (opcional) | Latest | Para ejecutar en contenedores |

### Dependencias Principales

- **@nestjs/core** (v11.0.1): Framework principal
- **@nestjs/platform-socket.io** (v11.1.9): Soporte para WebSockets con Socket.IO
- **@nestjs/websockets** (v11.1.9): Gateway de WebSockets
- **@nestjs/jwt** (v11.0.1): Autenticación JWT
- **@nestjs/passport** (v11.0.5): Integración con Passport.js
- **@nestjs/swagger** (v11.2.3): Documentación API automática
- **@prisma/client** (v7.0.1): ORM para base de datos
- **pg** (v8.16.3): Driver de PostgreSQL
- **socket.io-client** (v4.8.1): Cliente de Socket.IO
- **passport-jwt** (v4.0.1): Estrategia JWT para Passport

---

## Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/DOSW2025/wise_comunidad.git
cd wise_comunidad
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Base de Datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/wise_comunidad"

# Aplicación
NODE_ENV="development"
PORT=3000

# JWT (si aplica)
JWT_SECRET="tu_secret_aqui"

# Otros servicios
```

### 4. Inicializar la Base de Datos

```bash
# Generar cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate
```

---

## Ejecución

### Desarrollo

```bash
npm run start:dev
```

La aplicación estará disponible en `http://localhost:3000`

### Modo Debug

```bash
npm run start:debug
```

### Producción
```
wise_comunidad/
├── src/
│   ├── main.ts                           # Punto de entrada principal
│   ├── app.module.ts                     # Módulo raíz que integra todos los módulos
│   ├── app.controller.ts                 # Controlador raíz
│   ├── config/
│   │   ├── envs.ts                      # Validación y carga de variables de entorno
│   │   └── index.ts                     # Exportación de configuración
│   ├── prisma/
│   │   ├── prisma.module.ts             # Módulo de Prisma
│   │   └── prisma.service.ts            # Servicio de Prisma para inyección de dependencias
│   ├── auth/
│   │   ├── auth.module.ts               # Módulo de autenticación
│   │   ├── auth.service.ts              # Lógica de autenticación
│   │   ├── jwt.strategy.ts              # Estrategia de validación JWT
│   │   ├── jwt-auth.guard.ts            # Guard de protección JWT
│   │   └── dto/                         # Data Transfer Objects
│   ├── chats/
│   │   ├── chats.module.ts              # Módulo de chats
│   │   ├── chats.controller.ts          # Controlador REST de chats
│   │   ├── chats.gateway.ts             # Gateway de WebSockets para mensajería real-time
│   │   ├── chats.service.ts             # Lógica de negocio de chats
│   │   ├── dto/                         # Data Transfer Objects para chats
│   │   └── documents/                   # Esquemas y documentación
│   ├── threads/
│   │   ├── threads.module.ts            # Módulo de hilos
│   │   ├── threads.controller.ts        # Controlador REST de hilos
│   │   ├── threads.service.ts           # Lógica de negocio de hilos
│   │   ├── dto/                         # Data Transfer Objects para hilos
│   │   └── utils/                       # Utilidades de hilos
│   ├── responses/
│   │   ├── responses.module.ts          # Módulo de respuestas
│   │   ├── responses.controller.ts      # Controlador REST de respuestas
│   │   ├── responses.service.ts         # Lógica de negocio de respuestas
│   │   └── dto/                         # Data Transfer Objects para respuestas
│   ├── votes/
│   │   ├── votes.module.ts              # Módulo de votos
│   │   ├── votes.controller.ts          # Controlador REST de votos
│   │   ├── votes.gateway.ts             # Gateway de WebSockets para votos en tiempo real
│   │   ├── votes.service.ts             # Lógica de negocio de votos
│   │   └── dto/                         # Data Transfer Objects para votos
│   ├── types/
│   │   └── *.ts                         # Tipos globales del proyecto
│   └── responses/ (utils)
│       └── *.ts                         # Utilidades de respuesta
├── prisma/
│   └── schema.prisma                    # Definición del esquema de base de datos
├── test/
│   ├── app.e2e-spec.ts                  # Tests E2E de la aplicación
│   └── jest-e2e.json                    # Configuración de Jest para E2E
├── .github/
│   └── workflows/
│       └── main_wise-comunidad.yml      # CI/CD pipeline
├── package.json                         # Dependencias y scripts
├── tsconfig.json                        # Configuración de TypeScript
├── tsconfig.build.json                  # Configuración de TypeScript para build
├── eslint.config.mjs                    # Configuración de ESLint
├── nest-cli.json                        # Configuración de NestJS CLI
├── Dockerfile                           # Configuración para Docker
└── README.md                            # Este archivo
``` │   └── prisma.service.ts            # Servicio de Prisma para inyección de dependencias
│   ├── auth/
│   │   ├── auth.module.ts               # Módulo de autenticación
│   │   ├── auth.service.ts              # Lógica de autenticación
│   │   ├── jwt.strategy.ts              # Estrategia de validación JWT
│   │   ├── jwt-auth.guard.ts            # Guard de protección JWT
│   │   └── dto/                         # Data Transfer Objects
│   ├── chats/
│   │   ├── chats.module.ts              # Módulo de chats
│   │   ├── chats.controller.ts          # Controlador REST de chats
│   │   ├── chats.gateway.ts             # Gateway de WebSockets para mensajería real-time
│   │   ├── chats.service.ts             # Lógica de negocio de chats
│   │   ├── dto/                         # Data Transfer Objects para chats
│   │   └── documents/                   # Esquemas y documentación
│   ├── forums/
│   │   ├── forums.module.ts             # Módulo de foros
│   │   ├── forums.controller.ts         # Controlador REST de foros
│   │   ├── forums.service.ts            # Lógica de negocio de foros
│   │   ├── dto/                         # Data Transfer Objects para foros
│   │   └── documents/                   # Esquemas y documentación
│   └── threads/
│       ├── threads.module.ts            # Módulo de hilos
│       ├── threads.controller.ts        # Controlador REST de hilos
│       ├── threads.service.ts           # Lógica de negocio de hilos
│       ├── dto/                         # Data Transfer Objects para hilos
│       └── documents/                   # Esquemas y documentación
├── prisma/
│   └── schema.prisma                    # Definición del esquema de base de datos
├── test/
│   ├── app.e2e-spec.ts                  # Tests E2E de la aplicación
│   └── jest-e2e.json                    # Configuración de Jest para E2E
├── .github/
│   └── workflows/
│       └── main_wise-comunidad.yml      # CI/CD pipeline
├── package.json                         # Dependencias y scripts
├── tsconfig.json                        # Configuración de TypeScript
├── tsconfig.build.json                  # Configuración de TypeScript para build
├── eslint.config.mjs                    # Configuración de ESLint
├── nest-cli.json                        # Configuración de NestJS CLI
├── Dockerfile                           # Configuración para Docker
└── README.md                            # Este archivo
``` package.json                         # Dependencias y scripts
├── tsconfig.json                        # Configuración de TypeScript
├── tsconfig.build.json                  # Configuración de TypeScript para build
├── eslint.config.mjs                    # Configuración de ESLint
├── nest-cli.json                        # Configuración de NestJS CLI
├── Dockerfile                           # Configuración para Docker
└── README.md                            # Este archivo
```

---

## Configuración

### Variables de Entorno

El proyecto utiliza la validación de variables de entorno con Joi. Consulta `src/config/envs.ts` para ver todas las variables disponibles:

```typescript
// src/config/envs.ts
export interface EnvConfig {
  DATABASE_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  // ...más variables
}
```

### TypeScript

Las opciones de compilación se definen en:
- `tsconfig.json` - Configuración general
- `tsconfig.build.json` - Configuración específica para builds de producción

### ESLint y Prettier

El código se valida y formatea automáticamente. Para ejecutar manualmente:

```bash
npm run lint       # Valida y corrige el código
npm run format     # Formatea con Prettier
```

---

## Base de Datos

### Modelos Principales

El proyecto utiliza **Prisma** como ORM. Los modelos definidos en `prisma/schema.prisma` incluyen:

- **usuarios**: Información de usuarios con estados y roles
- **estados_usuario**: Estados disponibles para usuarios
- **roles**: Roles disponibles en el sistema
- **notifications**: Notificaciones del sistema
- **materia**: Materias disponibles
- **tema**: Temas dentro de cada materia
- **tutoria**: Sesiones de tutoría
- **tutor_materia**: Relación entre tutores y materias
- **tutor_profile**: Perfil de tutores con reputación
- **rating**: Calificaciones de tutorías
- **usuario_curso**: Inscripción de usuarios en cursos
- **chats** (Módulo Chats): Conversaciones entre usuarios
- **messages** (Módulo Chats): Mensajes dentro de conversaciones

### Comandos de Prisma

```bash
# Ver la base de datos visualmente
npm run prisma:studio

# Crear una nueva migración
npm run prisma:migrate

# Generar cliente de Prisma (después de cambios en schema)
npm run prisma:generate

# Sincronizar schema con BD (sin historial de migraciones)
npm run prisma:push

# Sembrar datos iniciales
npm run prisma:seed
```

---

## Enlaces Relevantes

| Recurso | Descripción |
|---------|------------|
| [NestJS Docs](https://docs.nestjs.com) | Documentación oficial de NestJS |
| [Prisma Docs](https://www.prisma.io/docs) | Documentación oficial de Prisma |
| [PostgreSQL Docs](https://www.postgresql.org/docs) | Documentación de PostgreSQL |
| [TypeScript Docs](https://www.typescriptlang.org/docs) | Documentación de TypeScript |
| [Swagger/OpenAPI](https://swagger.io/tools/swagger-ui/) | Documentación interactiva de APIs |
| [Jest Testing](https://jestjs.io) | Framework de testing |

---

## Guía de Módulos

### Trabajar con Gestión Centralizada

El microservicio proporciona APIs base para:

1. **Autenticación**: Iniciar sesión y generar tokens JWT
2. **Gestión de Usuarios**: Crear, actualizar y listar usuarios
3. **Tutorías**: Gestionar sesiones de tutoría
4. **Materias**: Administrar materias y temas
5. **Notificaciones**: Crear notificaciones para usuarios

**Ejemplo de uso**:
```bash
# Obtener lista de usuarios
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/usuarios

# Crear una nueva materia
curl -X POST http://localhost:3000/api/materias \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Matemáticas", "codigo": "MAT-101"}'
```

### Trabajar con el Módulo Chat

El módulo **Chat** implementa comunicación en tiempo real usando WebSockets (Socket.IO):

1. **REST API**: CRUD de conversaciones
2. **WebSockets**: Conexión real-time para mensajería (solo para Chat)
3. **Autenticación**: Todas las operaciones requieren token JWT

**Endpoints REST**:
```
GET  /api/chats              - Obtener todas las conversaciones del usuario
GET  /api/chats/:id         - Obtener detalles de una conversación
POST /api/chats             - Crear nueva conversación
PUT  /api/chats/:id         - Actualizar conversación
DELETE /api/chats/:id       - Eliminar conversación
```

**WebSocket Events (Socket.IO - Solo Chat)**:
```typescript
// Conectar a WebSocket
socket.emit('connection')

// Enviar mensaje
socket.emit('sendMessage', {
  chatId: 'id-del-chat',
  content: 'Contenido del mensaje',
  senderId: 'id-del-usuario'
})

// Recibir mensaje
socket.on('messageReceived', (message) => {
  console.log('Nuevo mensaje:', message)
})

// Desconectar
socket.disconnect()
```

**Ejemplo de Cliente Socket.IO (Chat)**:
```typescript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000', {
  auth: {
    token: 'tu-jwt-token-aqui'
  }
})

socket.on('connect', () => {
  console.log('Conectado al servidor de Chat')
})

socket.emit('sendMessage', {
  chatId: 'chat-123',
  content: 'Hola, este es mi mensaje',
  senderId: 'user-456'
})

socket.on('disconnect', () => {
  console.log('Desconectado del servidor')
})
```

### Trabajar con el Módulo Hilos

El módulo **Hilos** gestiona conversaciones dentro de foros:

**Endpoints**:
```
GET  /api/threads                - Obtener todos los hilos
GET  /api/threads/:id           - Obtener detalles de un hilo
POST /api/threads               - Crear nuevo hilo
PUT  /api/threads/:id           - Actualizar hilo
DELETE /api/threads/:id         - Eliminar hilo
GET  /api/threads/:id/replies   - Obtener respuestas de un hilo
```

### Trabajar con el Módulo Respuestas

El módulo **Respuestas** gestiona las replies dentro de hilos:

**Endpoints**:
```
GET  /api/responses              - Obtener todas las respuestas
GET  /api/responses/:id         - Obtener detalles de una respuesta
POST /api/responses             - Crear nueva respuesta
PUT  /api/responses/:id         - Actualizar respuesta
DELETE /api/responses/:id       - Eliminar respuesta
POST /api/responses/:id/accept  - Marcar respuesta como aceptada
```

### Trabajar con el Módulo Votos

El módulo **Votos** implementa sistema de votación en tiempo real (WebSockets - Solo para Votos):

**Endpoints REST**:
```
GET  /api/votes                  - Obtener votos de un hilo/respuesta
POST /api/votes                  - Crear voto
DELETE /api/votes/:id           - Eliminar voto
```

**WebSocket Events (Socket.IO - Solo Votos)**:
```typescript
// Conectar a WebSocket
socket.emit('connection')

// Enviar voto
socket.emit('vote', {
  threadId: 'id-del-hilo',
  type: 'upvote' | 'downvote',
  userId: 'id-del-usuario'
})

// Recibir actualización de votos
socket.on('voteUpdated', (voteData) => {
  console.log('Votos actualizados:', voteData)
})

// Desconectar
socket.disconnect()
```

**Ejemplo de Cliente Socket.IO (Votos)**:
```typescript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000', {
  auth: {
    token: 'tu-jwt-token-aqui'
  }
})

socket.on('connect', () => {
  console.log('Conectado al servidor de Votos')
})

socket.emit('vote', {
  threadId: 'thread-123',
  type: 'upvote',
  userId: 'user-456'
})

socket.on('voteUpdated', (data) => {
  console.log('Nuevo conteo de votos:', data)
})

socket.on('disconnect', () => {
  console.log('Desconectado del servidor')
})
```

---

## Consejos para Nuevos Desarrolladores

1. **Primera vez**: Ejecuta `npm run start:dev` para iniciar en modo desarrollo
2. **Base de datos**: Usa `npm run prisma:studio` para visualizar y manipular datos fácilmente
3. **Testing**: Escribe tests junto al código usando `*.spec.ts`
4. **Commits**: Asegúrate de pasar `npm run lint` antes de hacer commit
5. **Migraciones**: Siempre crea migraciones nuevas con `npm run prisma:migrate`, no uses `prisma:push` en producción
6. **Variables de entorno**: Nunca hagas commit del archivo `.env`, usa `.env.example`
7. **WebSockets**: Solo los módulos Chat y Votos usan Socket.IO para comunicación en tiempo real
8. **Documentación**: La documentación de API está disponible en `/api/docs` con Swagger

---

## Solución de Problemas

### Error de conexión a BD
```bash
# Verifica que PostgreSQL esté corriendo
# Comprueba la DATABASE_URL en .env
npm run prisma:migrate  # Intenta aplicar migraciones
```

### Problemas con dependencias
```bash
# Limpia cache de npm
npm cache clean --force
rm -r node_modules package-lock.json
npm install
```

### Errores de TypeScript
```bash
# Regenera el cliente de Prisma
npm run prisma:generate
# Verifica la configuración de tsconfig.json
```

---

## Notas Importantes

- El proyecto está construido con **NestJS v11.0.1** y **Prisma v7.0.1**
- Se requiere **PostgreSQL** para la persistencia de datos
- El código sigue estándares de **ESLint** y **Prettier**
- Todos los cambios deben incluir tests correspondientes
- Solo los módulos **Chat** y **Votos** utilizan **Socket.IO** para comunicación en tiempo real
- La autenticación se realiza mediante **JWT** con Passport.js
- Documentación de API disponible en `/api/docs` (Swagger)
- Estado actual: Comunidad + Chat + Hilos + Respuestas + Votos implementados, Foros en desarrollo

---

**Última actualización**: Diciembre 2025  
**Versión**: 0.0.2 (Comunidad + Chat + Hilos + Respuestas + Votos)  
**Licencia**: UNLICENSED
