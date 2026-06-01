# CLAUDE.md — Klaro
> Lee este archivo completo antes de tocar cualquier archivo del proyecto.

---

## Qué es este proyecto

**Klaro** es una app de asesoría fiscal para freelancers hispanohablantes en Alemania.
Está deployed en producción en `klaro-landing.vercel.app`.
El repo contiene usuarios reales — cualquier bug o dato hardcodeado es un problema inmediato.

---

## Stack — no lo cambies sin permiso explícito

- **Frontend:** Vanilla HTML + Tailwind CSS via CDN. No hay framework. No hay bundler.
- **Backend:** Vercel Serverless Functions (`/api/*.js`)
- **Base de datos:** Supabase (PostgreSQL + Auth)
- **IA:** Anthropic API — modelo `claude-haiku-4-5` para el chat de Clara
- **Auth:** Supabase Auth — el cliente se inicializa en `auth.js`. Reutiliza esa instancia siempre.
- **Deploy:** Vercel — el deploy es automático desde GitHub

**NUNCA:**
- Instales npm packages ni generes package.json si no te lo pido explícitamente
- Crees componentes React o JSX
- Cambies Tailwind CDN por una build de Tailwind
- Importes librerías externas sin preguntarme primero
- Ejecutes `npm run dev`, `npm run build`, ni ningún comando de terminal sin mi permiso

---

## Estructura de archivos

```
/
├── index.html                  ← Landing pública
├── login.html
├── signup.html
├── reset.html
├── new-password.html
├── klaro-dashboard.html        ← App protegida — home
├── klaro-clara.html            ← Chat con Clara (IA)
├── klaro-facturas.html
├── klaro-gastos.html
├── klaro-impuestos.html
├── klaro-profile.html
├── klaro-ayuda.html
├── imprint.html                ← Impressum (legal DE)
├── auth.js                     ← Supabase Auth — cliente compartido
├── api/
│   └── clara.js                ← Vercel serverless function → Anthropic API
└── CLAUDE.md                   ← Este archivo
```

---

## Reglas críticas — datos de usuario

El app tiene usuarios reales. Estas reglas no son opcionales:

1. **Nunca hardcodees datos en HTML.** Ningún `value="Ana"`, `value="García"`, ningún `€18.100` estático, ningún nombre, email, ni cifra fiscal en el HTML. Los datos vienen siempre de Supabase vía JS.
2. **Estado inicial de los elementos dinámicos:** Stats cards → `—`. Progress bars → `width: 0%`. Fechas → `—`. El JS los rellena después del fetch.
3. **Siempre verifica RLS.** Si escribes queries de Supabase, asegúrate de que usan `user_id` del usuario autenticado. Nunca hagas queries sin filtrar por `auth.uid()`.

---

## Cómo funciona Clara (el agente de IA)

```
klaro-clara.html (frontend)
    → POST /api/clara.js (Vercel serverless)
        → fetch fiscal_profile de Supabase (por userId)
        → llama a Anthropic API con system prompt enriquecido
        → guarda el exchange en tabla conversations de Supabase
    → devuelve respuesta al frontend
```

La Anthropic API key vive en `process.env.ANTHROPIC_API_KEY` — ya está configurada en Vercel. Nunca la escribas en el código.

---

## Tablas de Supabase

```sql
fiscal_profiles   -- perfil fiscal del usuario (output del Diagnóstico)
conversations     -- historial de chat con Clara
deadlines         -- plazos fiscales por usuario
invoices          -- facturas
expenses          -- gastos
profiles          -- datos personales del usuario
```

Todas tienen `user_id UUID REFERENCES auth.users`. Siempre filtra por `user_id = auth.uid()`.

---

## Sistema de diseño

| Token | Valor |
|---|---|
| Naranja principal | `#E8622A` |
| Ámbar | `#FFB830` |
| Navy | `#1A1D2E` |
| Crema (fondo) | `#FFF8F0` |
| Tipografía headings | DM Serif Display |
| Tipografía body | DM Sans |

El tono visual es cálido y premium. No frío, no minimalista genérico.

---

## Variables de entorno (Vercel)

| Variable | Dónde se usa |
|---|---|
| `ANTHROPIC_API_KEY` | `/api/clara.js` |
| `SUPABASE_URL` | Supabase client |
| `SUPABASE_ANON_KEY` | Supabase client (pública) |

Nunca las expongas en el HTML ni en el cliente JS directamente (excepto `SUPABASE_ANON_KEY` que es pública por diseño).

---

## Cómo trabajamos

- Ciclos cortos: construye → yo reviso → iteramos
- Si algo es ambiguo, pregunta antes de asumir
- Cuando termines una tarea, resume exactamente qué cambiaste y por qué
- Si ves un bug que no te pedí que arreglara, señálalo pero no lo toques sin permiso
- La prioridad ahora es **lanzar**, no refactorizar ni optimizar
