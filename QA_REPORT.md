# Klaro — QA Report
> Fecha: 2026-06-01 · Generado por: Claude Code QA Agent (klaro-qa skill)
> Commit: 70615c3 · Branch: main

---

## Resumen ejecutivo
- ❌ Bloqueantes: 1
- ⚠️ Advertencias: 2
- ✅ OK: 44
- 🚦 Estado: **CASI LISTO — 1 acción del owner + 3 config de Vercel/Supabase**

---

## ❌ Bloqueante crítico

### 1. `imprint.html` — placeholders legales sin rellenar
Obligatorio por §5 TMG (ley alemana). Contiene texto de marcador de posición:
- Línea 79: `Vor- und Nachname`
- Línea 80: `Straße und Hausnummer`
- Línea 81: `PLZ Ort`
- Línea 92: `XX/XXX/XXXXX` (Steuernummer)
- Línea 93: `Finanzamt [Stadt]`

**Acción:** El owner rellena con sus datos reales. No es tarea de código.

---

## ⚠️ Advertencias

### W1. Env vars en Vercel — no verificables desde código
`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` deben estar en Vercel → Settings → Environment Variables. Sin ellas: Clara genérica, envío de facturas falla con 500.

### W2. Migration 006 pendiente en Supabase
`supabase/migrations/006_invoices_cancelled.sql` — ejecutar en Supabase SQL Editor para añadir columnas faltantes a `invoices` y el estado `cancelled`.

---

## ✅ Todo en orden (44 checks)

### Bloque 1 — Estructura
1. ✅ 21/21 archivos requeridos presentes — incluyendo `klaro-documentos.html` (nuevo)
2. ✅ `vercel.json` — 5 funciones con maxDuration configurado

### Bloque 2 — Autenticación
3. ✅ `auth.js` — `_sb` global, `_PUBLIC_PAGES` evita redirect-loop en páginas de auth
4. ✅ `onAuthStateChange(INITIAL_SESSION)` — maneja tokens de email confirmation
5. ✅ 8/8 páginas protegidas cargan `auth.js`
6. ✅ `logout()` global — `signOut()` + redirect a `login.html`
7. ✅ Populación de `[data-user-name]`, `[data-user-email]`, `[data-user-initials]`, `[data-user-city]`
8. ✅ Fetch de perfil desde `profiles` con fallback a session metadata

### Bloque 3 — Registro y login
9. ✅ `signup.html` — `signUp()`, validación contraseñas, éxito en español
10. ✅ `login.html` — `signInWithPassword()`, redirect a dashboard, errores en español
11. ✅ `reset.html` — `resetPasswordForEmail()`, éxito en español
12. ✅ `new-password.html` — token recovery del hash URL, `updateUser()`

### Bloque 4 — Dashboard
13. ✅ Stat cards dinámicas — `stat-ingresos`, `stat-gastos`, `stat-beneficio`, `stat-iva` (valor inicial `—`)
14. ✅ `stat-ingresos-pending` — línea de cobros pendientes dinámica
15. ✅ Queries reales — `from('invoices')` + `from('expenses')` con `.eq('user_id', uid)`
16. ✅ Sin hardcoded — "Ana García", "€18.100", "€17.110" no encontrados en HTML
17. ✅ Empty state (`#empty-state-banner`) — oculto por defecto, visible sin datos
18. ✅ Gráfico dinámico — `_renderChart()` calcula desde datos reales
19. ✅ Lista facturas reciente — dinámica con `loadRecentInvoices()`
20. ✅ Action Center — `loadActionCenter()` + `loadTasks()` wired
21. ✅ Overdue auto-mark — ejecuta en bootstrap
22. ✅ Documentos en sidebar — ✅

### Bloque 5 — Facturas y Gastos
23. ✅ Facturas CRUD — select/insert/update/delete a `invoices`
24. ✅ Ciclo de estado — draft→sent→paid→overdue→cancelled→draft
25. ✅ PDF download — jsPDF bilingual ES/DE, §19 Kleinunternehmer
26. ✅ Envío email — `POST /api/send-invoice` wired, HTML email template profesional
27. ✅ Gastos CRUD — select/insert/delete a `expenses`
28. ✅ OCR recibos — `POST /api/analyze-receipt` + Anthropic vision
29. ✅ Empty states en ambas páginas

### Bloque 6 — Impuestos
30. ✅ Queries reales a `invoices` y `expenses` por trimestre
31. ✅ IDs dinámicos: `iva-big-card`, `iva-q-prev-amount`, `iva-q-curr-amount`
32. ✅ Sin "€1.254,50" hardcodeado — eliminado previamente

### Bloque 7 — Clara AI
33. ✅ CORS — `Access-Control-Allow-Origin: *`, OPTIONS handler
34. ✅ GET `{ status: 'ok', hasKey: !!ANTHROPIC_API_KEY }` — health check sin costo de tokens
35. ✅ 401 con `{ needsKey: true }` sin API key
36. ✅ Modelo — `claude-haiku-4-5-20251001`
37. ✅ `max_tokens: 1024`
38. ✅ System prompt en español, domain-scoped (solo impuestos DE)
39. ✅ `useRealApi = true` cuando `data.hasKey === true`
40. ✅ Historial en `chat_messages` — `savePair()` + `loadHistory()`
41. ✅ Modal "Añadir API key" eliminado — mensaje limpio modo demo

### Bloque 8 — Ayuda y Navegación
42. ✅ `klaro-ayuda.html` — 20 elementos `<details>/<summary>` (mínimo: 8)
43. ✅ Documentos nav item en 9/9 sidebars (incluyendo impuestos + profile fix)
44. ✅ `klaro-documentos.html` — upload zone, filter tabs, CRUD, stats, mobile nav

---

## Próximos pasos ordenados por impacto

```
OWNER — hoy (sin código, ~45 min total):
  1. [ ] Rellenar imprint.html — nombre, dirección, Steuernummer, Finanzamt  [15 min]
  2. [ ] Vercel → añadir SUPABASE_SERVICE_ROLE_KEY                           [5 min]
  3. [ ] Vercel → añadir RESEND_API_KEY + RESEND_FROM_EMAIL (resend.com)     [10 min]
  4. [ ] Supabase SQL Editor → ejecutar 006_invoices_cancelled.sql            [5 min]

SMOKE TEST después del deploy:
  5. [ ] GET https://klaro-landing.vercel.app/api/clara → { hasKey: true }
  6. [ ] Signup → confirmar email → login → dashboard muestra datos vacíos
  7. [ ] Crear factura → enviar por email → verificar recepción
  8. [ ] Subir documento → aparece en klaro-documentos.html
  9. [ ] Clara → pregunta fiscal → respuesta personalizada con perfil
```

---

## Nota sobre empty state para usuario nuevo

Un usuario nuevo sin datos verá:
- Stat cards con `—` (no valores falsos)
- Banner con CTAs a Facturas y Gastos
- Gráfico: "Sin datos este año — añade facturas para ver la gráfica"
- Lista de facturas: "No hay facturas aún. Añadir primera factura →"
- Action Center con tareas de deadline (UStVA) generadas automáticamente

Comportamiento correcto y honesto.
