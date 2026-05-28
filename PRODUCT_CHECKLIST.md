# Klaro — Product Checklist
> Vision → Reality gap analysis · 2026-05-29 · Caveman QA

---

## ESTADO ACTUAL (lo que existe hoy)

| Página / Feature | Estado |
|---|---|
| Auth (login / signup / reset / guard) | ✅ Done |
| Dashboard — stat cards dinámicas | ✅ Done |
| Dashboard — empty state | ✅ Done |
| Dashboard — bar chart ingresos/gastos | ✅ Done |
| Dashboard — recent invoices list | ✅ Done |
| Facturas — CRUD completo (create/read/update/delete) | ✅ Done |
| Gastos — CRUD completo | ✅ Done |
| Impuestos — IVA desde Supabase (Q actual + anterior) | ✅ Done |
| Impuestos — barra progreso trimestre dinámica | ✅ Done |
| Documentos — upload a Supabase Storage | ✅ Done |
| Clara — chat con Anthropic API real | ✅ Done |
| Clara — modo demo sin API key | ✅ Done |
| Ayuda — 11 FAQs en acordeón | ✅ Done |
| Perfil — read/write desde Supabase | ✅ Done |
| vercel.json — timeout 30s | ✅ Done |
| Autenticación en todas páginas protegidas | ✅ Done |
| Sin datos demo hardcodeados en producción | ✅ Done (post-QA fix) |

---

## P0 — ANTES DE BETA PÚBLICA (bloqueantes UX)

Estos faltan y rompen la experiencia core descrita en la visión.

### 1. Dashboard — Action Center
- [ ] Sección "¿Qué tengo que hacer ahora?" encima de las stat cards
- [ ] Card: UStVA vencida → "Presentar en ELSTER" CTA
- [ ] Card: Factura sin cobrar > 30 días → "Recordar al cliente"
- [ ] Card: Trimestre > 80% → "Preparar declaración"
- [ ] Card: Documentos sin clasificar → "Revisar subida"
- [ ] Prioridad por urgencia (rojo/ámbar/verde)
- [ ] Cada card conecta a la página correspondiente o abre Clara

### 2. Dashboard — Clara recommendations strip
- [ ] Sección dinámica bajo Action Center
- [ ] Al menos 1-2 insights generados desde datos reales del usuario
- [ ] Ejemplos: "Falta declarar €X de IVA", "Subi 0 recibos este mes"
- [ ] CTA "Preguntarle a Clara →" en cada insight

### 3. Documentos — página dedicada (`klaro-documentos.html`)
- [ ] La visión define Documentos como nav item primario — no existe la página
- [ ] Lista de todos los documentos subidos (actualmente solo en klaro-impuestos)
- [ ] Filtro por tipo: facturas / recibos / cartas Finanzamt / declaraciones
- [ ] Estado de procesamiento por documento: pendiente / clasificado / verificado
- [ ] Upload drag-and-drop centralizado
- [ ] Mover la sección de upload desde klaro-impuestos a aquí

### 4. Sidebar — añadir "Documentos" como nav item
- [ ] Agregar `klaro-documentos.html` a sidebar en TODAS las páginas
- [ ] Orden: Inicio · Actividad · **Documentos** · Facturas · Gastos · Impuestos · Clara · Perfil · Ayuda
- [ ] 7 archivos a actualizar: dashboard, clara, facturas, gastos, impuestos, profile, ayuda

### 5. Perfil — campos fiscales obligatorios
- [ ] Steuernummer guardada en Supabase y mostrada al usuario
- [ ] USt-IdNr (número IVA intracomunitario) — campo separado
- [ ] Tipo fiscal: Freiberufler / Gewerbetreibender / Kleinunternehmer
- [ ] Kleinunternehmerregelung toggle (si activo → no calcular IVA)
- [ ] Estos datos hoy no se usan para nada — deben afectar cálculos

### 6. Facturas — generar PDF descargable
- [ ] La visión menciona "PDF generation" explícitamente
- [ ] Usuario crea factura → puede descargar PDF con formato alemán correcto
- [ ] Debe incluir campos legales: Steuernummer, descripción, neto/IVA/bruto
- [ ] Si es Kleinunternehmer → texto §19 UStG en lugar de IVA

### 7. Impuestos — datos residuales de timeline
- [ ] Timeline de declaraciones sigue siendo HTML estático
- [ ] Las fechas y estados deben generarse desde `new Date()` y los datos reales
- [ ] "10 Enero 2026", "10 Abril 2026", etc. hardcodeados — deben ser dinámicos

---

## P1 — PRIMERA SEMANA POST-BETA (experiencia completa)

### 8. Documentos — clasificación AI
- [ ] Al subir documento → llamar a Clara API con texto extraído
- [ ] Clara clasifica: factura / recibo / carta Finanzamt / declaración / otro
- [ ] Extrae: importe, fecha, proveedor, categoría fiscal
- [ ] Muestra al usuario: "Esto parece un gasto de software deducible. ¿Confirmar?"
- [ ] Requiere OCR: usar Supabase Edge Function + Tesseract o Google Vision API

### 9. Clara — embebida en workflows (no solo en su página)
- [ ] Mini-Clara en dashboard (burbuja flotante activa, no solo FAB)
- [ ] En facturas: "¿Necesito cobrar IVA a este cliente?"
- [ ] En gastos: "¿Es este gasto 100% deducible?"
- [ ] En impuestos: "¿Qué pasa si no presento a tiempo?"
- [ ] En documentos: Clara comenta cada upload automáticamente

### 10. Dashboard — Document Timeline (Section 3 de la visión)
- [ ] Feed cronológico de actividad real: facturas creadas, gastos subidos, documentos procesados
- [ ] Cada item muestra: tipo, impacto fiscal, estado
- [ ] Actualmente hay activity feed estático — hacerlo dinámico desde Supabase

### 11. Impuestos — declaraciones reales en timeline
- [ ] Cargar de Supabase las declaraciones que el usuario ha marcado como presentadas
- [ ] Tabla `tax_declarations` en Supabase (hoy no existe en el schema público)
- [ ] Estado: pendiente / presentado / vencido
- [ ] Acción: marcar como presentado → guarda fecha en DB

### 12. Notificaciones / alertas proactivas
- [ ] Sistema de alertas basado en fechas: 10 días antes de cada deadline
- [ ] Puede ser simple: al entrar al dashboard, detectar declaraciones próximas
- [ ] Toast o banner: "Faltan 8 días para la UStVA Q2"
- [ ] No requiere email/push por ahora — solo in-app

---

## P2 — ROADMAP (visión completa)

### 13. OCR real en documents
- [ ] Supabase Edge Function que procesa PDF/imagen al subir
- [ ] Extrae texto → pasa a Clara → genera entity (expense/invoice/reminder)
- [ ] El usuario solo confirma, no tipea
- [ ] Flujo completo: Upload → OCR → AI → Review → Crear entidad

### 14. Generación automática de entidades desde documentos
- [ ] `document_uploaded` event → crea expense/invoice automáticamente
- [ ] Dashboard se actualiza en tiempo real (Supabase realtime subscriptions)
- [ ] Nuevas tareas aparecen en Action Center

### 15. Clara — crear entidades vía chat
- [ ] "Crea una factura de €500 para Acme GmbH"  → Clara hace INSERT
- [ ] "Agrega un gasto de €29 en Figma"  → Clara hace INSERT
- [ ] "¿Cuánto IVA tengo que pagar este trimestre?" → Clara consulta DB
- [ ] Requiere function calling / tool use en la API de Anthropic

### 16. ELSTER pre-fill
- [ ] Generar los campos de la UStVA pre-rellenados con datos de Supabase
- [ ] Exportar como PDF o XML compatible con ELSTER
- [ ] El usuario importa en ELSTER y solo confirma

### 17. Multi-currency
- [ ] Facturas en USD/GBP con tipo de cambio BCE del día
- [ ] Conversión automática a EUR para cálculos fiscales
- [ ] Historial de tipos de cambio

### 18. Steuerberater mode
- [ ] Compartir datos de solo lectura con un asesor fiscal
- [ ] Exportar resumen fiscal en PDF para el Steuerberater
- [ ] Link temporal con acceso limitado

---

## ARQUITECTURA BACKEND PENDIENTE

### Tablas Supabase que faltan

| Tabla | Para qué |
|---|---|
| `tax_declarations` | Historial de declaraciones UStVA/Einkommensteuer |
| `tasks` | Action Center — tareas generadas por el sistema |
| `notifications` | Alertas in-app |
| `user_profiles` | Steuernummer, USt-IdNr, tax_type (hoy en `auth.users` metadata) |
| `document_entities` | Link entre documento subido y entidad creada (expense/invoice) |

### APIs que faltan

| Endpoint | Para qué |
|---|---|
| `api/ocr.js` | Procesar PDF/imagen → texto |
| `api/classify.js` | Texto → clasificación fiscal via Clara |
| `api/declarations.js` | CRUD de tax_declarations |
| `api/tasks.js` | CRUD de tasks / action center |
| `api/generate-invoice-pdf.js` | Generar PDF de factura |

---

## RESUMEN EJECUTIVO

```
LISTO PARA BETA CERRADA (amigos/testers)  ← ESTADO HOY
├── Auth completo
├── CRUD facturas + gastos
├── IVA calculado desde datos reales
├── Clara funciona
└── Sin datos demo

NECESITA P0 ANTES DE BETA PÚBLICA (1-2 semanas de trabajo)
├── Action Center en dashboard
├── Página Documentos dedicada
├── Clara recommendations
├── Sidebar con Documentos
├── Perfil fiscal completo
└── PDF de facturas

VISIÓN COMPLETA (1-2 meses)
├── OCR + clasificación AI
├── Clara embebida en workflows
├── Generación de entidades desde documentos
└── Pre-fill ELSTER
```

**Criterio beta pública: P0 completo (7 items).**
**Criterio product-market fit: P0 + P1 completo (12 items).**
