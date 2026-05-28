# Klaro — QA Report
> Fecha: 2026-05-28 · Generado por: Claude Code QA Agent

## Resumen ejecutivo
- ❌ Bloqueantes: 2
- ⚠️ Advertencias: 8
- ✅ OK: 32
- 🚦 Estado: NECESITA FIXES ANTES DE LANZAR

---

## Bloqueantes críticos

1. **❌ `klaro-impuestos.html` — Dato hardcodeado en timeline sin ID dinámico**
   El HTML estático contiene `<p class="text-xs">IVA trimestral · €1.254,50</p>` en la sección de timeline de declaraciones pasadas. Este nodo no tiene ID ni es regenerado por JavaScript. Un usuario real verá ese dato de ejemplo permanentemente, sin importar sus datos reales.

2. **❌ `klaro-profile.html` — Valores demo hardcodeados en atributos `value` de inputs**
   Los inputs del formulario de perfil tienen valores hardcodeados: `value="Ana"`, `value="García"`, `value="+49 176 12345678"`, `value="Berlin"`, `value="12/345/67890"`, `value="ana.garcia@mail.com"`. Aunque el script los sobreescribe con datos de Supabase una vez que la sesión carga, cualquier usuario cuyo perfil esté incompleto o cuyo fetch falle verá datos de otra persona. El `data-user-email` también contiene el texto estático `ana.garcia@mail.com` en el DOM antes de ser reemplazado.

---

## Advertencias

1. **⚠️ `klaro-dashboard.html` — Valores placeholder en stat cards visibles brevemente**
   Los elementos `#stat-ingresos`, `#stat-gastos`, `#stat-beneficio`, `#stat-iva` contienen valores como `€18.100` y `€17.110` en el HTML inicial. JS los reemplaza al cargar, pero hay un flash visible. Usar `—` o `€0` como placeholder inicial.

2. **⚠️ `klaro-impuestos.html` — Timeline de declaraciones es 100% estático**
   Más allá del dato bloqueante en §1, toda la sección de "historial de declaraciones" es HTML estático. No refleja declaraciones reales del usuario. Debería renderizarse dinámicamente desde Supabase.

3. **⚠️ `klaro-impuestos.html` — Progress bar con `style="width:45%"` en HTML inicial**
   Aunque JS reemplaza el ancho, la barra arranca con 45% visible durante la carga. Usar `width:0%` como estado inicial.

4. **⚠️ Credenciales Supabase hardcodeadas en HTML/JS del cliente**
   La URL y la clave anon de Supabase están embebidas en `auth.js`, `klaro-facturas.html`, `klaro-gastos.html`, `klaro-impuestos.html`, `klaro-profile.html`, `klaro-clara.html`, etc. Esto es aceptable con RLS activo, pero debe verificarse que RLS esté habilitado en todas las tablas (`invoices`, `expenses`, `chat_messages`, `profiles`, `documents`).

5. **⚠️ `klaro-clara.html` — Modal de API key visible para usuarios finales**
   El botón para abrir el modal de API key es visible en la UI. El usuario final no debería gestionar claves de API. El flujo actual funciona en modo demo sin clave, pero la existencia del modal crea confusión. Considerar ocultarlo para usuarios no-admin.

6. **⚠️ `api/clara.js` — El GET devuelve `{ status: 'ok', hasKey: ... }`, no `{ ok: true, hasKey: ... }`**
   `klaro-clara.html` verifica `data.hasKey` (correcto) pero ignora `data.status`. No es un bug funcional porque `hasKey` está presente en ambos lados, pero si en el futuro se verifica `data.ok` (como dice la documentación), fallará. Documentar el contrato de la API.

7. **⚠️ `klaro-profile.html` — Split de `full_name` asume nombre simple**
   El código hace `parts[0]` para nombre y `parts.slice(1).join(' ')` para apellido. Nombres como "María José García López" producirán resultados incorrectos en el campo apellido.

8. **⚠️ `index.html` — Integración con Gemini API en la landing**
   La landing pública tiene lógica de llamada a `generativelanguage.googleapis.com` (Gemini) para el widget de Clara de demostración. Una clave API de Gemini expuesta o faltante puede romper la demo pública sin afectar la app autenticada, pero es una dependencia no documentada.

---

## Todo en orden

**Bloque 1 — Estructura:**
1. ✅ `index.html` existe
2. ✅ `login.html` existe
3. ✅ `signup.html` existe
4. ✅ `reset.html` existe
5. ✅ `auth.js` existe
6. ✅ `klaro-dashboard.html` existe
7. ✅ `klaro-clara.html` existe
8. ✅ `klaro-facturas.html` existe
9. ✅ `klaro-gastos.html` existe
10. ✅ `klaro-impuestos.html` existe
11. ✅ `klaro-profile.html` existe
12. ✅ `klaro-ayuda.html` existe (alias `klaro-help.html` → 404, correcto porque todos los links usan `klaro-ayuda.html`)
13. ✅ `api/clara.js` existe
14. ✅ `vercel.json` existe

**Bloque 2 — Auth:**
15. ✅ `auth.js` inicializa Supabase con `createClient()` expuesto como `_sb`
16. ✅ Session guard redirige a `login.html` sin sesión activa
17. ✅ Puebla `[data-user-name]`, `[data-user-email]`, `[data-user-initials]`, `[data-user-city]`
18. ✅ `logout()` global llama a `_sb.auth.signOut()` y redirige a login
19. ✅ Todas las páginas protegidas importan `auth.js`
20. ✅ Páginas públicas (`index.html`, `login.html`, `signup.html`, `reset.html`) NO importan `auth.js`

**Bloque 3 — Registro y login:**
21. ✅ `signup.html`: 4 campos (nombre, email, contraseña, repetir contraseña), validación de coincidencia, `signUp()` con `full_name`, éxito en español ("¡Revisa tu email!"), errores en español, link a `login.html`
22. ✅ `login.html`: `signInWithPassword()`, redirige a `klaro-dashboard.html`, links a `signup.html` y `reset.html`, errores en español
23. ✅ `reset.html`: `resetPasswordForEmail()`, éxito en español

**Bloque 4 — Dashboard:**
24. ✅ `id="empty-state-banner"` presente, oculto con `class="hidden"`, JS lo muestra cuando `!inv.length && !exp.length`, links a `klaro-facturas.html` y `klaro-gastos.html`
25. ✅ Stat cards con IDs dinámicos (`#stat-ingresos`, `#stat-gastos`, `#stat-beneficio`, `#stat-iva`)
26. ✅ Queries reales a `invoices` y `expenses` con filtro por `user_id`
27. ✅ Beneficio calculado como ingresos − gastos
28. ✅ IVA calculado dinámicamente
29. ✅ `data-bar="ing"` y `data-bar="gas"` presentes, alturas recalculadas por JS
30. ✅ Lista de facturas recientes en `#recent-invoices-list` poblada dinámicamente

**Bloque 5 — Facturas y Gastos:**
31. ✅ `klaro-facturas.html`: query filtrada por `user_id`, INSERT, cambio de estado (draft/sent/paid/overdue), DELETE, empty state, campos completos (cliente, importe, fecha, descripción, estado)
32. ✅ `klaro-gastos.html`: query filtrada por `user_id`, INSERT, DELETE, 6 categorías correctas, empty state

**Bloque 6 — Impuestos:**
33. ✅ Queries a `invoices` Y `expenses` filtradas por fechas de trimestre
34. ✅ Múltiples IDs dinámicos para IVA neto, resumen, Vorsteuer
35. ✅ Lógica de trimestre correcta (Q1 ene-mar, Q2 abr-jun, Q3 jul-sep, Q4 oct-dic)
36. ✅ Trimestre anterior calculado correctamente con manejo de año anterior cuando Q=1

**Bloque 7 — Clara AI:**
37. ✅ `api/clara.js` maneja OPTIONS (CORS preflight → 200)
38. ✅ GET devuelve `{ status: 'ok', hasKey: !!process.env.ANTHROPIC_API_KEY }`
39. ✅ POST lee `req.body.messages`, envía a Anthropic con últimas 10 mensajes
40. ✅ Modelo: `claude-haiku-4-5-20251001`
41. ✅ System prompt en español ("Eres Clara, la asesora fiscal inteligente de Klaro...")
42. ✅ `max_tokens: 1024`
43. ✅ 401 con `{ needsKey: true }` cuando no hay API key
44. ✅ `Access-Control-Allow-Origin: '*'`
45. ✅ `checkApiConnection()` llama a `GET /api/clara` y verifica `data.hasKey`
46. ✅ `useRealApi = true` cuando `data.hasKey` es truthy
47. ✅ Con `useRealApi` se llama endpoint real; sin clave se usa respuesta de demo
48. ✅ Chat funciona en modo demo sin clave (no bloquea al usuario)
49. ✅ `savePair()` inserta en `chat_messages` en Supabase con `user_id`, `role`, `content`

**Bloque 8 — Ayuda y Navegación:**
50. ✅ `klaro-ayuda.html` importa `auth.js` y tiene mismo sidebar
51. ✅ 11 preguntas en acordeón `<details>/<summary>` (supera el mínimo de 8)
52. ✅ Temas cubiertos: UStVA, Einkommensteuer, gastos deducibles, ELSTER
53. ✅ CTA final enlaza a `klaro-clara.html`
54. ✅ Todos los links de sidebar apuntan a `klaro-ayuda.html` (correcto)
55. ✅ Botón "Cerrar sesión" llama a `logout()`
56. ✅ `vercel.json` configura `api/clara.js` con `maxDuration: 30`

---

## Hallazgos por bloque

### Bloque 1 — Estructura
Todos los archivos MVP requeridos están presentes. `klaro-help.html` devuelve 404, pero es el alias incorrecto — el archivo real es `klaro-ayuda.html` y todos los links en el proyecto apuntan a ese nombre. No es un problema.

### Bloque 2 — Auth
`auth.js` implementa correctamente el guard de sesión via `onAuthStateChange`, puebla los 4 data-attrs y expone `logout()` global. Todas las páginas protegidas lo importan. Las páginas públicas están limpias. Sin hallazgos bloqueantes.

### Bloque 3 — Registro y login
Flujo completo y correcto. `signup.html` valida coincidencia de contraseñas en cliente antes de llamar a Supabase. Mensajes de éxito y error están en español. `reset.html` dirige a `/new-password.html` tras el envío (correcto).

### Bloque 4 — Dashboard
**Hallazgo ⚠️:** Los stat cards contienen valores como `€18.100` como texto inicial en el DOM, creando un flash de datos falsos antes de que JS cargue los datos reales. Reemplazar con `—` o `€0`.

El empty-state-banner está correctamente implementado: oculto por defecto, mostrado via JS cuando no hay datos, con links a facturas y gastos. Los gráficos de barra son dinámicos. La lista de facturas recientes es un contenedor vacío poblado por JS — sin datos hardcodeados.

No se encontró "Ana García" como texto estático en el dashboard. Los valores demo están dentro de elementos con IDs dinámicos que JS sobreescribe.

### Bloque 5 — Facturas y Gastos
Implementación CRUD completa en ambas páginas. `klaro-facturas.html` soporta 4 estados (draft, sent, paid, overdue) y cicla entre ellos. `klaro-gastos.html` implementa las 6 categorías requeridas con iconos emoji y filtrado por categoría. Ambas páginas tienen empty state funcional.

### Bloque 6 — Impuestos
**Hallazgo ❌:** El texto `"IVA trimestral · €1.254,50"` está hardcodeado en un `<p>` sin ID dentro de la sección de timeline de declaraciones pasadas. Este valor es visible para todos los usuarios en producción.

**Hallazgo ⚠️:** La sección completa de timeline/historial es HTML estático. No refleja declaraciones reales.

**Hallazgo ⚠️:** La barra de progreso tiene `style="width:45%"` en el HTML inicial; JS la corrige al cargar.

Los cálculos de IVA trimestral son dinámicos y correctos. La lógica de trimestres es correcta incluyendo el manejo del Q1 (año anterior para previous quarter).

### Bloque 7 — Clara AI
`api/clara.js` está bien implementada. CORS correcto, manejo de OPTIONS, GET con health check, POST con truncación a 10 mensajes, 401 apropiado. El modelo es `claude-haiku-4-5-20251001` y el system prompt es en español.

**Hallazgo ⚠️:** El contrato GET devuelve `{ status: 'ok', hasKey: ... }` pero la documentación del prompt del auditor esperaba `{ ok: true, hasKey: ... }`. Funcionalmente no hay bug porque `klaro-clara.html` solo verifica `data.hasKey`. Documentar el contrato exacto.

`klaro-clara.html` funciona en demo sin bloquear al usuario. El chat persiste en Supabase `chat_messages`. La integración está completa.

### Bloque 8 — Ayuda y Navegación
`klaro-ayuda.html` supera los requisitos con 11 FAQs en 4 categorías. El CTA final enlaza a Clara. El sidebar es consistente con las demás páginas. `vercel.json` configura `maxDuration: 30` correctamente.

---

## Próximos pasos recomendados

**Antes del lanzamiento beta (❌ críticos):**

1. **`klaro-impuestos.html` — Eliminar o hacer dinámico el texto hardcodeado en el timeline**
   Opción A: Borrar las entradas del timeline estático y reemplazar con un mensaje "Sin declaraciones anteriores" o renderizado dinámico desde Supabase.
   Opción B: Añadir un ID al `<p>` y que JS lo limpie en `onLoad` antes de renderizar.

2. **`klaro-profile.html` — Reemplazar `value="..."` hardcodeados por `value=""`**
   Todos los inputs deben tener `value=""` como estado inicial. El script ya hace el fetch correcto; solo hay que eliminar los valores demo del HTML. También limpiar el texto estático `ana.garcia@mail.com` del nodo `[data-user-email]`.

**Primera semana post-lanzamiento (⚠️ advertencias):**

3. Cambiar valores placeholder de stat cards en dashboard a `€0` o `—` para eliminar el flash de datos falsos.
4. Cambiar `style="width:45%"` del progress bar de impuestos a `width:0%` como estado inicial.
5. Implementar el historial de declaraciones en `klaro-impuestos.html` como lista dinámica desde Supabase (tabla `tax_filings` o similar).
6. Verificar que RLS esté habilitado en todas las tablas de Supabase (`invoices`, `expenses`, `chat_messages`, `profiles`, `documents`).
7. Considerar ocultar el modal de API key de `klaro-clara.html` para usuarios finales (moverlo a un panel de admin o config avanzada).
8. Documentar el contrato exacto de `GET /api/clara` en un comentario del archivo o en README.

---

## Nota sobre empty state del dashboard

Para un **usuario nuevo sin datos**, el comportamiento es el siguiente:

1. `auth.js` verifica sesión — si no hay sesión, redirige a `login.html`.
2. Con sesión activa, el dashboard hace queries a `invoices` y `expenses` filtradas por `user_id`.
3. Ambas queries devuelven arrays vacíos.
4. El script ejecuta: `if (!inv.length && !exp.length) { banner.classList.remove('hidden'); }`
5. El banner `#empty-state-banner` se muestra con CTAs: `+ Factura` → `klaro-facturas.html` y `+ Gasto` → `klaro-gastos.html`.
6. Los stat cards muestran `€0` (tras reemplazar los valores hardcodeados — ver fix pendiente).
7. El gráfico de barras muestra barras en altura 0.
8. La sección de "facturas recientes" muestra el empty state de la lista.

El flujo de usuario nuevo está correctamente implementado en lógica JS. Solo requiere limpiar los valores placeholder del HTML inicial para evitar el flash de datos demo durante la carga.
