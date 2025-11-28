# Guía de creación de foros - Nuevas funcionalidades

## 🎯 Funcionalidades implementadas

✅ **Formulario de creación de foro** (nombre + materia)
✅ **Validación de existencia de materia**
✅ **Creación automática en BD**
✅ **Detección de foros duplicados**
✅ **Mensajes de confirmación y manejo de excepciones**

---

## 📋 Endpoint: Crear Foro

### **POST** `/forums`

**Status esperado:** `201 Created`

### Request body

```json
{
  "slug": "general",
  "nombre": "Foro General",
  "descripcion": "Discusiones generales de la comunidad",
  "materiaId": "MAT101"
}
```

**Campos requeridos:**
- `slug` (String) - Identificador único amigable para URL
- `nombre` (String) - Nombre del foro
- `materiaId` (String) - ID de la materia (DEBE EXISTIR)

**Campos opcionales:**
- `descripcion` (String) - Descripción del foro

---

## 🧪 Ejemplos de testing

### Ejemplo 1: Crear foro exitosamente

**Request PowerShell:**
```powershell
$body = @{
    slug = "algebra-2025"
    nombre = "Foro de Álgebra"
    descripcion = "Espacio para discutir temas de álgebra"
    materiaId = "MAT101"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/forums" `
  -Method Post `
  -Body $body `
  -ContentType "application/json" | ConvertTo-Json
```

**Response exitosa (201):**
```json
{
  "success": true,
  "message": "✅ Foro \"Foro de Álgebra\" creado exitosamente para la materia \"Álgebra I\".",
  "data": {
    "id": 1,
    "slug": "algebra-2025",
    "nombre": "Foro de Álgebra",
    "descripcion": "Espacio para discutir temas de álgebra",
    "activo": true,
    "materiaId": "MAT101",
    "created_at": "2025-11-27T10:30:00.000Z",
    "updated_at": "2025-11-27T10:30:00.000Z",
    "materia": {
      "id": "MAT101",
      "nombre": "Álgebra I",
      "codigo": "MAT101"
    }
  }
}
```

### Ejemplo 2: Error - Materia no existe

**Request PowerShell:**
```powershell
$body = @{
    slug = "fake-math"
    nombre = "Foro Fake"
    materiaId = "NOEXISTE999"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/forums" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

**Response error (404):**
```json
{
  "statusCode": 404,
  "message": "La materia con ID \"NOEXISTE999\" no existe. Por favor, verifica el ID.",
  "error": "Not Found"
}
```

### Ejemplo 3: Error - Slug duplicado

**Request PowerShell** (ejecutar el Ejemplo 1 primero, luego repetir):
```powershell
$body = @{
    slug = "algebra-2025"
    nombre = "Otro foro"
    materiaId = "MAT102"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/forums" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

**Response error (409 Conflict):**
```json
{
  "statusCode": 409,
  "message": "Un foro con el slug \"algebra-2025\" ya existe. Por favor, usa otro slug único.",
  "error": "Conflict"
}
```

### Ejemplo 4: Error - Foro duplicado para la misma materia

**Request PowerShell** (ejecutar el Ejemplo 1 primero, luego):
```powershell
$body = @{
    slug = "algebra-otro-slug"
    nombre = "Otro foro de álgebra"
    materiaId = "MAT101"  # MISMA MATERIA
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/forums" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

**Response error (409 Conflict):**
```json
{
  "statusCode": 409,
  "message": "Ya existe un foro para la materia \"Álgebra I\". No se pueden crear foros duplicados.",
  "error": "Conflict"
}
```

---

## ✅ Validaciones implementadas

| Validación | Status | Mensaje |
|-----------|--------|---------|
| Materia no existe | ❌ 404 | "La materia con ID [...] no existe" |
| Slug duplicado | ❌ 409 | "Un foro con el slug [...] ya existe" |
| Foro duplicado en materia | ❌ 409 | "Ya existe un foro para la materia [...]" |
| Foro creado exitosamente | ✅ 201 | "Foro [...] creado exitosamente para la materia [...]" |

---

## 🔗 Relación BD

```
Materia (1) ─────── (N) Foro
  ├─ id (PK)       ├─ id (PK)
  ├─ nombre        ├─ slug (UNIQUE)
  ├─ codigo        ├─ nombre
  └─ ...           ├─ materiaId (FK → materia.id)
                   ├─ created_at
                   ├─ updated_at
                   └─ ...
```

---

## 🔧 Archivos modificados

- `prisma/schema.prisma` - Agregado `materiaId` a modelo `foro`
- `src/foros/foros.service.ts` - Implementado método `createForo()` con validaciones
- `src/foros/foros.controller.ts` - Agregado endpoint `POST /forums`
- `src/foros/dto/create-foro.dto.ts` - Nuevo DTO con validación

---

## 📝 Notas

- El campo `slug` debe ser único globalmente
- Un foro por materia (para evitar duplicados)
- Toda materia debe existir en la BD antes de crear un foro
- Las excepciones retornan mensajes descriptivos en español
- El método retorna un objeto con `success`, `message`, y `data`

---

**Creado:** 27 de Noviembre, 2025  
**Estado:** ✅ LISTO PARA USAR
