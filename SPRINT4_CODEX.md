# SPRINT 4 — Codex Task: Build `klaro-documentos.html`

## Context
Klaro is a static HTML fiscal assistant for Spanish-speaking freelancers in Germany.
Stack: vanilla HTML + Tailwind CDN + inline JS + Supabase JS client (CDN).
No build step. Deployed on Vercel. All pages are self-contained HTML files.

## Your job
Create `C:\Users\tn\klaro-landing\klaro-documentos.html` — a new app page for document management.

---

## Copy sidebar + head EXACTLY from `klaro-gastos.html`

Read `klaro-gastos.html` first. Copy:
1. The entire `<head>` block (fonts, Tailwind CDN, tailwind.config, CSS styles)
2. The entire `<aside>` sidebar — change the active nav item to "Documentos"
3. The Supabase CDN script: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`
4. The `<script src="auth.js"></script>` tag

Update `<title>` to: `Documentos — Klaro · Gestión de archivos`

In the sidebar nav, the "Documentos" link (`klaro-documentos.html`) must have the active style:
`class="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm nav-active"`

All other nav items use the non-active style (same as in gastos.html).

---

## Supabase setup

Copy the Supabase `createClient` initialization from `klaro-gastos.html`. The variable is `sb`.
The auth guard from `auth.js` runs automatically.

Documents table: `documents` in Supabase (may already exist).
If it doesn't exist yet, still write the code — wrap queries in try/catch.

Document row shape:
```js
{
  id: uuid,
  user_id: uuid,
  name: string,           // original filename
  file_url: string,       // Supabase Storage public URL
  file_path: string,      // storage path for deletion
  doc_type: string,       // 'factura' | 'recibo' | 'carta_finanzamt' | 'declaracion' | 'otro'
  status: string,         // 'pendiente' | 'clasificado' | 'verificado'
  size_bytes: number,
  uploaded_at: timestamptz
}
```

---

## Page layout

Main content area (right of sidebar), full height, cream background `#f4ede5`.

### Header bar (top, same style as other pages)
- Left: title "Documentos" (font-bold, #1e1b17) + subtitle "Tus archivos fiscales"
- Right: Upload button — orange pill button "＋ Subir archivo" that opens the hidden file input

### Upload zone (drag-and-drop area)
- Dashed border, rounded-2xl, centered text
- Icon: cloud upload SVG
- Text: "Arrastra tus documentos aquí" (large) + "PDF, imagen o Excel · Máx. 10 MB" (small, muted)
- Hidden `<input type="file" id="file-input" accept=".pdf,.jpg,.jpeg,.png,.xlsx" multiple>`
- Clicking the zone OR the header button triggers `document.getElementById('file-input').click()`
- On file select → call `uploadFiles(files)`
- Drag over → highlight zone (border color changes to #a43700)

### Filter tabs
Pill tabs below the upload zone:
`Todos` | `Facturas` | `Recibos` | `Finanzamt` | `Declaraciones` | `Otros`

Active tab: `background:#a43700; color:white`
Inactive: `background:rgba(164,55,0,0.07); color:#594139`

Clicking a tab filters the displayed documents.

### Documents list (`id="docs-list"`)
Each document row is a card with:
- Left: file type icon (PDF = red, image = blue, excel = green) + filename + size
- Center: doc_type badge (colored pill) + status badge
- Right: "Abrir" link button + delete button (trash icon)

Status badge colors:
- `pendiente` → amber `#FFB830` background
- `clasificado` → orange `#a43700` text, light background
- `verificado` → green background

Empty state (no docs): centered illustration area with text "Sin documentos subidos aún" + upload CTA button.

### doc_type selector (appears per row or in upload flow)
After upload, show a small dropdown on the new row to classify:
`Factura` | `Recibo` | `Carta Finanzamt` | `Declaración` | `Otro`
On change → UPDATE `doc_type` in Supabase for that document id.

---

## JavaScript functions to implement

```js
// Init — runs on auth ready
async function loadDocs(filter = 'all') { ... }
// Query: sb.from('documents').select('*').eq('user_id', userId).order('uploaded_at', { ascending: false })
// Filter by doc_type when filter !== 'all'
// Render each doc as a card row in #docs-list

async function uploadFiles(files) {
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) { showToast('Archivo demasiado grande (máx 10 MB)', 'error'); continue; }
    const path = `${userId}/${Date.now()}_${file.name}`;
    // 1. Upload to Supabase Storage bucket 'documents'
    const { data: storageData, error: storageErr } = await sb.storage.from('documents').upload(path, file);
    if (storageErr) { showToast('Error subiendo ' + file.name, 'error'); continue; }
    // 2. Get public URL
    const { data: { publicUrl } } = sb.storage.from('documents').getPublicUrl(path);
    // 3. Insert row in documents table
    await sb.from('documents').insert({
      user_id: userId,
      name: file.name,
      file_url: publicUrl,
      file_path: path,
      doc_type: 'otro',
      status: 'pendiente',
      size_bytes: file.size,
      uploaded_at: new Date().toISOString()
    });
    showToast(file.name + ' subido ✓', 'success');
  }
  loadDocs(currentFilter);
}

async function deleteDoc(id, filePath) {
  if (!confirm('¿Eliminar este documento?')) return;
  await sb.storage.from('documents').remove([filePath]);
  await sb.from('documents').delete().eq('id', id);
  loadDocs(currentFilter);
}

async function updateDocType(id, docType) {
  await sb.from('documents').update({ doc_type: docType, status: 'clasificado' }).eq('id', id);
  loadDocs(currentFilter);
}

function showToast(msg, type = 'success') { /* same pattern as gastos.html */ }
function formatBytes(bytes) { /* e.g. 1.2 MB */ }
function formatDate(iso) { /* e.g. 29 may 2026 */ }
```

---

## Design rules (must match rest of app)

- Colors: orange `#a43700`, cream `#fff8f1`, dark `#1e1b17`, muted `#594139`, soft `#e0bfb4`
- Background: `#f4ede5`
- Font: Plus Jakarta Sans (already loaded)
- Cards: `background:#fff8f1; border:1px solid rgba(164,55,0,0.07); border-radius:1rem`
- Hover on cards: `box-shadow:0 4px 16px rgba(164,55,0,.08); transform:translateY(-1px)`
- Buttons: orange fill `#a43700`, white text, `border-radius:100px`
- All user-facing text in **Spanish**

---

## Supabase bucket
The bucket name is `documents`. It may or may not have been created yet.
If upload returns a storage error, show a toast: "Configura el bucket 'documents' en Supabase Storage primero."

---

## What NOT to do
- Do not use React, Vue, or any framework
- Do not add a build step
- Do not add any CSS frameworks other than Tailwind CDN (already in head)
- Do not invent new color tokens — use the ones listed above
- Do not change any other file in the repo — ONLY create `klaro-documentos.html`

---

## Verification
After writing the file, confirm:
1. `<script src="auth.js"></script>` is present → auth guard active
2. Supabase client initializes correctly (copy exact pattern from gastos.html)
3. `uploadFiles()` handles multiple files
4. Filter tabs actually filter the displayed list
5. Delete works (removes from storage AND from table)
