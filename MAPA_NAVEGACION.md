# 🗺️ Mapa de Navegación - Documentación de Foros

**Guía Visual para Encontrar lo que Necesitas**  
**Última Actualización**: 28 de Noviembre de 2025

---

## 🎯 ¿Qué Necesitas? → Ve A...

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUNTO DE INICIO                              │
│              Tienes 2 minutos para empezar                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                  COMIENZA AQUÍ 👇
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
    ┌──────────────────┐      ┌─────────────────┐
    │ Eres Nuevo       │      │ Ya Conoces      │
    │ en el proyecto   │      │ el proyecto     │
    └────────┬─────────┘      └────────┬────────┘
             │                        │
             ▼                        ▼
    QUICK_REFERENCE.md    ARQUITECTURA_FOROS.md
       (5 minutos)            (20 minutos)
```

---

## 📚 Búsqueda por Pregunta

### "¿Cómo creo un foro?"
```
Pregunta exacta: ¿Cuál es el endpoint para crear un foro?

Respuesta: POST /api/foros/forums

Documentos relevantes:
├─ QUICK_REFERENCE.md
│  └─ Sección: "Endpoints Rápida" → Foros
├─ ARQUITECTURA_FOROS.md
│  └─ Sección: "ForosController" → POST /forums
└─ CREAR_FORO.md
   └─ Paso a paso completo

Endpoint:
┌─────────────────────────────────────────────────────────┐
│ POST /api/foros/forums                                  │
│                                                          │
│ Body:                                                   │
│ {                                                       │
│   "slug": "matematica-basica",                         │
│   "nombre": "Matemática Básica",                       │
│   "descripcion": "Foro para matemática",               │
│   "materiaId": 1                                       │
│ }                                                       │
│                                                          │
│ Response: 201 Created                                   │
└─────────────────────────────────────────────────────────┘
```

### "¿Qué es la arquitectura del módulo?"
```
Pregunta exacta: ¿Cómo está organizado el código?

Respuesta: Arquitectura MVC con 5 componentes principales

Documentos relevantes:
├─ ARQUITECTURA_FOROS.md
│  └─ Sección: "Componentes Principales"
├─ ARQUITECTURA_DIAGRAMAS.md
│  └─ Sección: "Diagrama en Capas"
└─ INDICE_MAESTRO.md
   └─ Sección: "Conceptos Clave"

Estructura:
┌────────────────────────────────┐
│ ForosController (REST)          │ ← Recibe requests
└─────────────┬──────────────────┘
              │
┌─────────────┴──────────────────┐
│ ForosService + MensajesService  │ ← Lógica de negocio
└─────────────┬──────────────────┘
              │
┌─────────────┴──────────────────┐
│ PrismaService (BD)              │ ← Acceso a datos
└─────────────┬──────────────────┘
              │
┌─────────────┴──────────────────┐
│ PostgreSQL                      │ ← Base de datos
└────────────────────────────────┘
```

### "¿Cuáles son los errores comunes?"
```
Pregunta exacta: ¿Qué errores puedo obtener?

Respuesta: 6 tipos principales de errores

Documentos relevantes:
├─ QUICK_REFERENCE.md
│  └─ Sección: "Errores Comunes" ⭐
├─ ARQUITECTURA_FOROS.md
│  └─ Sección: "Manejo de Errores"
└─ ARQUITECTURA_DIAGRAMAS.md
   └─ Sección: "Flujo de Manejo de Excepciones"

Errores comunes:
┌─────────────────────────────────────────┐
│ 409 Conflict                            │
│ "Ya existe un foro para esta materia"   │
│ Causa: Segundo foro en misma materia    │
│ Solución: Usar materia diferente        │
├─────────────────────────────────────────┤
│ 404 Not Found                           │
│ "Materia no encontrada"                 │
│ Causa: materiaId no existe              │
│ Solución: Verificar ID de materia       │
├─────────────────────────────────────────┤
│ 400 Bad Request                         │
│ "Validación fallida"                    │
│ Causa: Falta campo obligatorio          │
│ Solución: Completar todos los campos    │
└─────────────────────────────────────────┘
```

### "¿Cómo escribo tests?"
```
Pregunta exacta: ¿Cómo crear tests para el módulo?

Respuesta: Usar Jest con mocking

Documentos relevantes:
├─ UNIT_TESTS.md
│  └─ Especificación de 80 tests ⭐
├─ QUICK_REFERENCE.md
│  └─ Sección: "Testing"
└─ ARQUITECTURA_FOROS.md
   └─ Sección: "Manejo de Errores"

Pasos:
1. Crear archivo: src/foros/nuevo.spec.ts
2. Mock de PrismaService
3. Crear suite: describe('NombreServicio', () => {})
4. Escribir test: it('debe...', () => {})
5. Ejecutar: npm test
```

### "¿Cuál es la cobertura actual?"
```
Pregunta exacta: ¿Qué porcentaje de código está testeado?

Respuesta: 80.25% (excepcional)

Documentos relevantes:
├─ COVERAGE_REPORT.md ⭐
│  └─ Análisis completo de cobertura
├─ coverage_report.html
│  └─ Reporte visual interactivo
└─ QUICK_REFERENCE.md
   └─ Sección: "Testing"

Cobertura:
┌──────────────────────────────────┐
│ Overall: 80.25%                  │
│ ├─ Statements: 80.25% ✅        │
│ ├─ Branches: 77.06% ✅          │
│ ├─ Functions: 86.36% ✅         │
│ └─ Lines: 80.93% ✅             │
├──────────────────────────────────┤
│ Componentes:                     │
│ ├─ ForosController: 100% ⭐      │
│ ├─ ForosService: 96.36% ✅       │
│ ├─ MensajesService: 90.62% ✅    │
│ ├─ ApiResponse: 92.85% ✅        │
│ ├─ GlobalExceptionFilter: 92.85% │
│ └─ DTOs: 100% ⭐                 │
└──────────────────────────────────┘
```

### "¿Qué es el sistema de mensajes?"
```
Pregunta exacta: ¿Cómo funciona la mensajería del foro?

Respuesta: 4 operaciones principales

Documentos relevantes:
├─ MENSAJERIA.md ⭐
│  └─ Especificación completa
├─ QUICK_REFERENCE.md
│  └─ Sección: "Endpoints" → Mensajes
└─ ARQUITECTURA_FOROS.md
   └─ Sección: "MensajesService"

Operaciones:
1. POST /forums/:id/messages        → Enviar mensaje
2. GET /forums/:id/messages         → Listar mensajes
3. POST /messages/:id/read          → Marcar como leído
4. GET /forums/:id/messages/unread  → Contar sin leer
```

### "¿Cuáles son los patrones usados?"
```
Pregunta exacta: ¿Qué patrones de diseño se implementan?

Respuesta: 5 patrones principales

Documentos relevantes:
├─ ARQUITECTURA_FOROS.md
│  └─ Sección: "Patrones de Arquitectura" ⭐
└─ INDICE_MAESTRO.md
   └─ Sección: "Conceptos Clave"

Patrones:
┌────────────────┬──────────────────────────────────┐
│ MVC            │ Separación presentación/lógica   │
├────────────────┼──────────────────────────────────┤
│ DI             │ Inyección de dependencias        │
├────────────────┼──────────────────────────────────┤
│ Factory        │ ApiResponse.success() etc.       │
├────────────────┼──────────────────────────────────┤
│ Interceptor    │ GlobalExceptionFilter            │
├────────────────┼──────────────────────────────────┤
│ DTO/Validator  │ class-validator                  │
└────────────────┴──────────────────────────────────┘
```

---

## 🗺️ Mapa Mental por Rol

### 👨‍💻 DESARROLLADOR NUEVO

```
INICIO
  │
  ▼
¿Necesitas...?
  │
  ├─→ Empezar rápido
  │    ├─ QUICK_REFERENCE.md (5 min)
  │    └─ Ejemplo: Ver endpoints
  │
  ├─→ Entender arquitectura
  │    ├─ ARQUITECTURA_FOROS.md (20 min)
  │    ├─ ARQUITECTURA_DIAGRAMAS.md (10 min)
  │    └─ Entendí? → Crear feature
  │
  ├─→ Escribir tests
  │    ├─ UNIT_TESTS.md (10 min)
  │    └─ Copiar patrón existente
  │
  └─→ Debuggear error
       ├─ QUICK_REFERENCE.md → "Errores comunes"
       ├─ ARQUITECTURA_DIAGRAMAS.md → Flujos
       └─ Ejecutar: npm test -- --coverage
```

### 👨‍💼 GERENTE / STAKEHOLDER

```
INICIO
  │
  ▼
¿Necesitas...?
  │
  ├─→ Entender requisitos
  │    └─ FOROS.md
  │
  ├─→ Ver progreso
  │    ├─ coverage_report.html
  │    └─ COVERAGE_REPORT.md
  │
  ├─→ Conocer estado
  │    └─ INDICE_MAESTRO.md → "Logros"
  │
  └─→ Próximos pasos
       └─ INDICE_MAESTRO.md → "Roadmap"
```

### 🔍 CODE REVIEWER

```
INICIO
  │
  ▼
¿Revisar...?
  │
  ├─→ Arquitectura
  │    ├─ ARQUITECTURA_FOROS.md
  │    └─ Validar principios SOLID
  │
  ├─→ Cobertura
  │    ├─ COVERAGE_REPORT.md
  │    └─ npm test -- --coverage
  │
  ├─→ Errores
  │    ├─ ARQUITECTURA_DIAGRAMAS.md
  │    └─ GlobalExceptionFilter
  │
  └─→ Testing
       ├─ UNIT_TESTS.md
       └─ Validar 80%+ cobertura
```

### 🐛 DEBUGGER

```
INICIO
  │
  ▼
¿Error qué?
  │
  ├─→ 409 Conflict
  │    ├─ QUICK_REFERENCE.md → "Errores comunes"
  │    └─ Solución: Usar materia diferente
  │
  ├─→ 404 Not Found
  │    ├─ QUICK_REFERENCE.md → "Errores comunes"
  │    └─ Solución: Verificar IDs
  │
  ├─→ 400 Bad Request
  │    ├─ Ver response errors
  │    └─ Completar campos
  │
  └─→ Lógica incorrecta
       ├─ ARQUITECTURA_DIAGRAMAS.md
       ├─ Ver flujos
       └─ Agregar tests para caso
```

---

## 📖 Documentos por Longitud

### ⚡ Rápido (< 5 min)
- `QUICK_REFERENCE.md` (11 KB)
- `CREAR_FORO.md` (5 KB)
- `FOROS_IMPLEMENTATION.md` (4 KB)

### 📖 Medio (5-20 min)
- `ARQUITECTURA_FOROS.md` (28 KB)
- `INDICE_MAESTRO.md` (11 KB)
- `COVERAGE_REPORT.md` (11 KB)
- `UNIT_TESTS.md` (7 KB)
- `MENSAJERIA.md` (9 KB)

### 📚 Completo (20+ min)
- `ARQUITECTURA_DIAGRAMAS.md` (32 KB)
- `FOROS.md` (7 KB) + `TESTING.md` (6 KB)

### 👁️ Visual
- `coverage_report.html` (21 KB)

---

## 🔗 Relaciones Entre Documentos

```
                    INDICE_MAESTRO.md
                    (Mapa de todo)
                            ▲
                            │
    ┌───────────────────────┼───────────────────────┐
    │                       │                       │
    ▼                       ▼                       ▼
QUICK_REF    ARQUITECTURA   DIAGRAMAS    TESTING
(Rápido)     (Completo)     (Visual)     (Specs)
    │              │            │            │
    │              │            │            │
    ├──────────────┼────────────┤            │
    │              │            │            │
    ▼              ▼            ▼            ▼
Errores      Patrones      Flujos      80 Tests
Comunes      Decisiones    Transaciones Cobertura

                            ▼
                      COVERAGE_REPORT
                    (Resumen calidad)
```

---

## 🎓 Rutas de Aprendizaje

### Ruta A: Rápida (15 minutos)
```
1. QUICK_REFERENCE.md (5 min)
   └─ Entiendes: Endpoints básicos
   
2. ARQUITECTURA_FOROS.md intro (5 min)
   └─ Entiendes: Componentes principales
   
3. QUICK_REFERENCE.md checklist (5 min)
   └─ Estás listo para: Crear feature simple
```

### Ruta B: Estándar (45 minutos)
```
1. QUICK_REFERENCE.md (10 min)
   
2. ARQUITECTURA_FOROS.md (20 min)
   
3. ARQUITECTURA_DIAGRAMAS.md (10 min)
   
4. UNIT_TESTS.md (5 min)
   └─ Estás listo para: Desarrollar features complejas
```

### Ruta C: Completa (120 minutos)
```
1. Ruta B completa (45 min)

2. COVERAGE_REPORT.md (15 min)

3. MENSAJERIA.md (15 min)

4. INDICE_MAESTRO.md (15 min)

5. Coverage report HTML (10 min)

6. Revisar tests: UNIT_TESTS.md (20 min)
   └─ Eres experto en: Arquitectura del módulo
```

---

## 📍 Ubicación de Archivos

### En el Proyecto
```
wise_comunidad/
├── QUICK_REFERENCE.md ← Inicio rápido
├── ARQUITECTURA_FOROS.md ← Arquitectura
├── ARQUITECTURA_DIAGRAMAS.md ← Diagramas
├── INDICE_MAESTRO.md ← Este mapa
├── UNIT_TESTS.md ← Tests
├── COVERAGE_REPORT.md ← Cobertura
├── MENSAJERIA.md ← Mensajes
├── coverage_report.html ← Visual
│
├── src/foros/
│   ├── foros.controller.ts ← Endpoints
│   ├── foros.service.ts ← Lógica
│   ├── mensajes.service.ts ← Mensajes
│   └── dto/ ← Validación
│
└── prisma/
    └── schema.prisma ← Base de datos
```

---

## ✅ Checklist de Lectura

### Para Comenzar
- [ ] Leí `QUICK_REFERENCE.md`
- [ ] Entiendo estructura básica
- [ ] Conozco los endpoints

### Para Desarrollar
- [ ] Leí `ARQUITECTURA_FOROS.md`
- [ ] Entiendo componentes
- [ ] Conozco patrones usados

### Para Mantener
- [ ] Leí `UNIT_TESTS.md`
- [ ] Entiendo testing
- [ ] Sé escribir tests

### Para Auditar
- [ ] Revisé `COVERAGE_REPORT.md`
- [ ] Conozco cobertura actual
- [ ] Identifiqué gaps

---

**🎯 RESUMEN: Comienza en QUICK_REFERENCE.md y sigue el mapa según necesites**

*Última actualización: 28 de Noviembre de 2025*
