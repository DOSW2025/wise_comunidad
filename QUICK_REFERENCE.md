# 📖 Guía de Referencia Rápida - Módulo de Foros

**Documento de Ayuda Rápida para Desarrolladores**  
**Actualizado**: 28 de Noviembre de 2025

---

## 🚀 Quick Start

### Estructura de Carpetas
```
src/foros/
  ├── foros.module.ts          ← Importar en app.module.ts
  ├── foros.service.ts         ← Lógica de foros
  ├── foros.controller.ts      ← Endpoints REST
  ├── mensajes.service.ts      ← Lógica de mensajes
  └── dto/
      ├── create-foro.dto.ts
      ├── create-thread.dto.ts
      ├── create-post.dto.ts
      └── create-mensaje.dto.ts
```

### Pasos para Usar el Módulo

1️⃣ **Importar en app.module.ts**
```typescript
import { ForosModule } from './foros/foros.module';

@Module({
  imports: [
    PrismaModule,
    ForosModule,  // ← Agregar aquí
  ],
})
export class AppModule {}
```

2️⃣ **Ejecutar migraciones de Prisma**
```bash
npx prisma migrate dev --name add_foros
npx prisma generate
```

3️⃣ **Iniciar servidor**
```bash
npm run start:dev
```

4️⃣ **Probar endpoints** (ver sección de Endpoints)

---

## 📡 Endpoints Rápida

### Foros

```bash
# Crear foro
POST /api/foros/forums
{
  "slug": "matematica",
  "nombre": "Matemática",
  "descripcion": "Foro de matemática",
  "materiaId": 1
}

# Listar foros
GET /api/foros/forums?page=1
```

### Hilos

```bash
# Crear hilo en foro
POST /api/foros/forums/matematica/threads
{
  "title": "¿Cómo resolver ecuaciones?",
  "slug": "ecuaciones",
  "content": "Contenido del primer post...",
  "authorId": 1
}

# Listar hilos de foro
GET /api/foros/forums/matematica/threads?page=1

# Obtener hilo con posts
GET /api/foros/threads/1
```

### Posts

```bash
# Crear post en hilo
POST /api/foros/threads/1/posts
{
  "content": "Contenido del post",
  "authorId": 2,
  "parentId": null  // opcional, para respuestas anidadas
}
```

### Mensajes

```bash
# Enviar mensaje en foro
POST /api/foros/forums/1/messages
{
  "contenido": "Hola, ¿cómo estás?",
  "authorId": 1
}

# Listar mensajes
GET /api/foros/forums/1/messages?page=1

# Listar solo sin leer
GET /api/foros/forums/1/messages?page=1&unreadOnly=true

# Marcar como leído
POST /api/foros/forums/1/messages/5/read

# Contar mensajes sin leer
GET /api/foros/forums/1/messages/unread/count
```

---

## 🔍 Validaciones Importantes

### CreateForoDto
```typescript
// Requisitos:
✓ slug: string, no vacío, único en BD
✓ nombre: string, no vacío
✓ descripcion: string, no vacío
✓ materiaId: número, materia debe existir

// Validaciones adicionales en servicio:
✓ Un foro por materia (no pueden haber 2 foros para la misma materia)
✓ Slug único globalmente
```

### CreateThreadDto
```typescript
✓ title: string, no vacío
✓ slug: string, no vacío
✓ content: string, no vacío
✓ authorId: número
```

### CreatePostDto
```typescript
✓ content: string, no vacío
✓ authorId: número
✓ parentId: número (opcional, para respuestas anidadas)
```

### CreateMensajeDto
```typescript
✓ contenido: string, no vacío
✓ authorId: número
```

---

## ⚠️ Códigos HTTP

| Código | Significado | Cuándo |
|--------|-------------|--------|
| **200** | OK | GET exitoso |
| **201** | Created | POST exitoso (crear recurso) |
| **400** | Bad Request | Validación DTO fallida |
| **404** | Not Found | Recurso no existe |
| **409** | Conflict | Duplicado, violación de constraint |
| **500** | Server Error | Error no previsto |

---

## 🗂️ Estructura de Response

### Respuesta Exitosa (201 Created)
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Foro creado exitosamente",
  "data": {
    "id": 1,
    "slug": "matematica",
    "nombre": "Matemática",
    "descripcion": "Foro de matemática",
    "materiaId": 1,
    "createdAt": "2025-11-28T10:30:00Z",
    "updatedAt": "2025-11-28T10:30:00Z"
  },
  "timestamp": "2025-11-28T10:30:00Z"
}
```

### Respuesta Error (409 Conflict)
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

## 🧪 Testing

### Ejecutar todos los tests
```bash
npm test
```

### Ejecutar tests de foros
```bash
npm test -- foros.service
npm test -- foros.controller
npm test -- mensajes.service
```

### Generar reporte de cobertura
```bash
npm test -- --coverage
```

### Ver detalles de cobertura
```bash
npm test -- --coverage --verbose
```

---

## 🐛 Debugging

### Ver logs en consola
```typescript
// En el servicio:
this.logger.log('Mensaje de debug');
this.logger.error('Error:', error.message);
```

### Activar logs de Prisma
```bash
# En .env
DATABASE_URL="postgresql://user:password@localhost:5432/db?schema=public"
```

### Acceder a Prisma Studio
```bash
npx prisma studio
```

---

## 📊 Flujos Típicos

### Crear un Foro (Éxito)
```
1. POST /api/foros/forums
   ↓
2. DTO valida estructura
   ↓
3. ForosService.createForo()
   ├─ Validar materia existe ✓
   ├─ Validar slug único ✓
   ├─ Validar un foro por materia ✓
   ↓
4. Crear en BD
   ↓
5. Retornar 201 + datos del foro
```

### Crear un Hilo en Foro (Éxito)
```
1. POST /api/foros/forums/slug/threads
   ↓
2. DTO valida estructura
   ↓
3. ForosService.createThread()
   ├─ Validar foro existe ✓
   ├─ BEGIN TRANSACTION
   ├─ Crear hilo
   ├─ Crear primer post
   ├─ Actualizar repliesCount
   └─ COMMIT
   ↓
4. Retornar 201 + datos del hilo
```

### Enviar Mensaje en Foro (Éxito)
```
1. POST /api/foros/forums/1/messages
   ↓
2. DTO valida estructura
   ↓
3. MensajesService.sendMensaje()
   ├─ Validar foro existe ✓
   ├─ Validar usuario existe ✓
   ├─ Validar contenido no vacío ✓
   ↓
4. Crear en BD
   ↓
5. Retornar 201 + datos del mensaje
```

---

## ❌ Errores Comunes

### Error 409: Ya existe un foro
**Causa**: Intentas crear otro foro para la misma materia.  
**Solución**: Usa la materia de un foro existente o crea en diferente materia.

```bash
# ❌ Error: materia 1 ya tiene foro
POST /api/foros/forums
{
  "slug": "otra-matematica",
  "nombre": "Otra Matemática",
  "descripcion": "...",
  "materiaId": 1  ← Ya tiene foro
}

# ✅ OK: usar materia diferente
{
  "materiaId": 2  ← Nueva materia
}
```

### Error 404: Materia no encontrada
**Causa**: El materiaId no existe en la BD.  
**Solución**: Verifica que la materia existe primero.

```bash
# Primero consulta materias disponibles
GET /api/materias

# Luego usa ID válido
POST /api/foros/forums
{
  "materiaId": 1  ← Debe existir en materias
}
```

### Error 400: Validación fallida
**Causa**: Falta campo obligatorio o tipo incorrecto.  
**Solución**: Revisa el error response y completa todos los campos requeridos.

```json
// Error response indica qué falta:
{
  "statusCode": 400,
  "message": "Validación fallida",
  "errors": [
    {
      "field": "slug",
      "message": "slug should not be empty"
    }
  ]
}
```

---

## 🔧 Modificar el Código

### Agregar validación nueva en DTO
```typescript
// archivo: src/foros/dto/create-foro.dto.ts
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateForoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)  // ← Agregar esto
  @MaxLength(50)  // ← Agregar esto
  slug: string;
  
  // ... resto
}
```

### Agregar validación nueva en Servicio
```typescript
// archivo: src/foros/foros.service.ts
export class ForosService {
  async createForo(createForoDto: CreateForoDto) {
    // ... validaciones existentes
    
    // Agregar validación nueva:
    if (createForoDto.nombre.toLowerCase().includes('test')) {
      throw new HttpException(
        'Nombres con "test" no permitidos',
        HttpStatus.BAD_REQUEST
      );
    }
    
    // ... resto
  }
}
```

### Agregar nuevo endpoint
```typescript
// archivo: src/foros/foros.controller.ts
export class ForosController {
  // Endpoint nuevo
  @Get('/search/:query')
  searchForums(@Param('query') query: string) {
    return this.forosService.searchForums(query);
  }
}

// Y en ForosService:
async searchForums(query: string) {
  return this.prisma.foro.findMany({
    where: {
      nombre: { contains: query, mode: 'insensitive' }
    }
  });
}
```

---

## 📚 Documentación Relacionada

| Documento | Contenido |
|-----------|----------|
| `ARQUITECTURA_FOROS.md` | Arquitectura completa y patrones |
| `ARQUITECTURA_DIAGRAMAS.md` | Diagramas visuales y flujos |
| `UNIT_TESTS.md` | Especificación de 80 tests |
| `COVERAGE_REPORT.md` | Análisis de cobertura |
| `MENSAJERIA.md` | Sistema de mensajes detallado |
| `FOROS.md` | Especificación de requisitos |

---

## 🎯 Checklist para Nueva Feature

- [ ] Crear DTO en `dto/`
- [ ] Agregar método en Service
- [ ] Agregar endpoint en Controller
- [ ] Actualizar schema Prisma si es necesario
- [ ] Crear tests para método
- [ ] Crear tests para endpoint
- [ ] Ejecutar `npm test` → debe pasar
- [ ] Generar cobertura: `npm test -- --coverage`
- [ ] Actualizar documentación
- [ ] Testear manualmente con Postman/curl

---

## 💡 Pro Tips

### 1. Usar Prisma Studio para Ver Datos
```bash
npx prisma studio
# Se abre en http://localhost:5555
# Puedes ver y editar datos en tiempo real
```

### 2. Ver Logs de Prisma
```typescript
// En PrismaService:
this.prisma.$on('query', (e) => {
  console.log('Query:', e.query);
  console.log('Duration:', e.duration + 'ms');
});
```

### 3. Resetear BD en Desarrollo
```bash
npx prisma migrate reset
# Borra todo y re-ejecuta migraciones
```

### 4. Testear un Endpoint con curl
```bash
curl -X POST http://localhost:3000/api/foros/forums \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "test",
    "nombre": "Test",
    "descripcion": "Test",
    "materiaId": 1
  }'
```

### 5. Ver Diferencias en Schema
```bash
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-stdin
```

---

## 🆘 Soporte y Contacto

**Preguntas sobre arquitectura:**  
Ver `ARQUITECTURA_FOROS.md`

**Preguntas sobre tests:**  
Ver `UNIT_TESTS.md`

**Problemas de cobertura:**  
Ver `COVERAGE_REPORT.md`

---

**Última actualización**: 28 de Noviembre de 2025  
**Versión**: 1.0  
**Estado**: Producción ✅
