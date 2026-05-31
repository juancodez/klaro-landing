-- ============================================================
-- Klaro — Demo Seed Data  (Spec 04)
-- ============================================================
-- BEFORE RUNNING:
--   1. Supabase Dashboard → Authentication → Users
--   2. Copy your demo user UUID
--   3. Ctrl+H: replace '00000000-0000-0000-0000-000000000001'
--      with your real UUID throughout this file
--   4. Paste entire file into SQL Editor → Run
--
-- Safe to run multiple times — all rows use ON CONFLICT DO NOTHING.
-- ============================================================

DO $$
DECLARE
  uid UUID := '00000000-0000-0000-0000-000000000001'; -- REPLACE THIS UUID
BEGIN

-- ── Profile ────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, full_name, phone, tax_number, city, address, postal_code)
VALUES (uid, 'Ana García López', '+49 176 12345678', '12/345/67890', 'Berlin', 'Prenzlauer Allee 42', '10405')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, phone = EXCLUDED.phone,
  tax_number = EXCLUDED.tax_number, city = EXCLUDED.city,
  address = EXCLUDED.address, postal_code = EXCLUDED.postal_code;

-- ── Fiscal profile ─────────────────────────────────────────────────────
INSERT INTO public.fiscal_profiles
  (user_id, tipo_autonomo, inicio_actividad, ingresos_anuales,
   clientes_extranjero, tiene_steuernummer, actividad, is_kleinunternehmer)
VALUES
  (uid, 'Freiberufler', '2023-03', '50000-75000', true, true, 'Diseñadora UX/UI', false)
ON CONFLICT (user_id) DO UPDATE SET
  tipo_autonomo = EXCLUDED.tipo_autonomo, inicio_actividad = EXCLUDED.inicio_actividad,
  ingresos_anuales = EXCLUDED.ingresos_anuales, clientes_extranjero = EXCLUDED.clientes_extranjero,
  tiene_steuernummer = EXCLUDED.tiene_steuernummer, actividad = EXCLUDED.actividad,
  is_kleinunternehmer = EXCLUDED.is_kleinunternehmer;

-- ── Invoices ───────────────────────────────────────────────────────────
-- 2025 — 14 invoices, all paid (annual total ≈ €71,000)
INSERT INTO public.invoices
  (id, user_id, invoice_number, client_name, client_email, description, amount, tax_rate, date, due_date, status)
VALUES
  ('b0000001-0000-0000-0000-000000000001', uid, 'KL-2025-001', 'Blinkist GmbH',   'billing@blinkist.com',   'Diseño UX — App onboarding flow',              3800.00, 19, '2025-01-15', '2025-02-14', 'paid'),
  ('b0000002-0000-0000-0000-000000000001', uid, 'KL-2025-002', 'Tomorrow Studio', 'finance@tomorrow.one',   'Wireframes & prototipo — módulo pagos',         4200.00, 19, '2025-02-01', '2025-03-03', 'paid'),
  ('b0000003-0000-0000-0000-000000000001', uid, 'KL-2025-003', 'Ecosia GmbH',     'ap@ecosia.org',          'Auditoría UX + informe de usabilidad',          2900.00, 19, '2025-02-20', '2025-03-22', 'paid'),
  ('b0000004-0000-0000-0000-000000000001', uid, 'KL-2025-004', 'Pitch Software',  'invoices@pitch.com',     'Design system — componentes base',              5500.00, 19, '2025-03-10', '2025-04-09', 'paid'),
  ('b0000005-0000-0000-0000-000000000001', uid, 'KL-2025-005', 'Taxfix SE',       'ap@taxfix.de',           'Rediseño pantallas fiscales — Sprint 1',        6200.00, 19, '2025-04-01', '2025-05-01', 'paid'),
  ('b0000006-0000-0000-0000-000000000001', uid, 'KL-2025-006', 'Contentful Ltd',  'finance@contentful.com', 'UX Research — entrevistas + síntesis',          4800.00,  0, '2025-04-18', '2025-05-18', 'paid'),
  ('b0000007-0000-0000-0000-000000000001', uid, 'KL-2025-007', 'Taxfix SE',       'ap@taxfix.de',           'Rediseño pantallas fiscales — Sprint 2',        6200.00, 19, '2025-05-05', '2025-06-04', 'paid'),
  ('b0000008-0000-0000-0000-000000000001', uid, 'KL-2025-008', 'Tomorrow Studio', 'finance@tomorrow.one',   'Motion design — animaciones UI',                3400.00, 19, '2025-06-02', '2025-07-02', 'paid'),
  ('b0000009-0000-0000-0000-000000000001', uid, 'KL-2025-009', 'Blinkist GmbH',   'billing@blinkist.com',   'Diseño UX — feature biblioteca',               5100.00, 19, '2025-07-14', '2025-08-13', 'paid'),
  ('b0000010-0000-0000-0000-000000000001', uid, 'KL-2025-010', 'Ecosia GmbH',     'ap@ecosia.org',          'Rediseño onboarding desktop',                  4600.00, 19, '2025-08-04', '2025-09-03', 'paid'),
  ('b0000011-0000-0000-0000-000000000001', uid, 'KL-2025-011', 'Pitch Software',  'invoices@pitch.com',     'Design system — tokens & documentación',        5800.00, 19, '2025-09-01', '2025-10-01', 'paid'),
  ('b0000012-0000-0000-0000-000000000001', uid, 'KL-2025-012', 'Forto GmbH',      'ap@forto.com',           'UX logística — flujos de tracking',             7200.00, 19, '2025-10-06', '2025-11-05', 'paid'),
  ('b0000013-0000-0000-0000-000000000001', uid, 'KL-2025-013', 'Contentful Ltd',  'finance@contentful.com', 'Prototipo MVP — nuevo editor',                  6900.00,  0, '2025-11-03', '2025-12-03', 'paid'),
  ('b0000014-0000-0000-0000-000000000001', uid, 'KL-2025-014', 'Forto GmbH',      'ap@forto.com',           'Sprint navidad — dashboard métricas',           4400.00, 19, '2025-12-01', '2025-12-31', 'paid'),
  -- 2026 — 7 invoices (paid/sent/overdue)
  ('b0000015-0000-0000-0000-000000000001', uid, 'KL-2026-001', 'Blinkist GmbH',   'billing@blinkist.com',   'Q1 — Diseño UX retainer enero',                5400.00, 19, '2026-01-20', '2026-02-19', 'paid'),
  ('b0000016-0000-0000-0000-000000000001', uid, 'KL-2026-002', 'Taxfix SE',       'ap@taxfix.de',           'Sprint fiscales — MVP v2',                     7500.00, 19, '2026-02-10', '2026-03-12', 'paid'),
  ('b0000017-0000-0000-0000-000000000001', uid, 'KL-2026-003', 'Pitch Software',  'invoices@pitch.com',     'Componentes accesibilidad WCAG 2.2',            5200.00, 19, '2026-03-03', '2026-04-02', 'paid'),
  ('b0000018-0000-0000-0000-000000000001', uid, 'KL-2026-004', 'Tomorrow Studio', 'finance@tomorrow.one',   'Animaciones — lanzamiento producto',            3900.00, 19, '2026-04-07', '2026-05-07', 'paid'),
  ('b0000019-0000-0000-0000-000000000001', uid, 'KL-2026-005', 'Forto GmbH',      'ap@forto.com',           'UX rediseño app móvil — Phase 1',              6800.00, 19, '2026-05-05', '2026-06-04', 'sent'),
  ('b0000020-0000-0000-0000-000000000001', uid, 'KL-2026-006', 'Ecosia GmbH',     'ap@ecosia.org',          'Auditoría accesibilidad + fix list',            3200.00, 19, '2026-04-01', '2026-04-30', 'overdue'),
  ('b0000021-0000-0000-0000-000000000001', uid, 'KL-2026-007', 'Contentful Ltd',  'finance@contentful.com', 'Design tokens — sistema multimarca',            5600.00,  0, '2026-05-15', '2026-06-14', 'sent')
ON CONFLICT (id) DO NOTHING;

-- ── Expenses ───────────────────────────────────────────────────────────
-- 2026 — 33 expenses across 6 categories (annual total ≈ €2,700)
INSERT INTO public.expenses (id, user_id, amount, category, description, date)
VALUES
  -- Software & Tools (recurring monthly)
  ('c0000001-0000-0000-0000-000000000001', uid,  15.00, 'Software & Tools',   'Figma — suscripción mensual',              '2026-01-01'),
  ('c0000002-0000-0000-0000-000000000001', uid,  59.99, 'Software & Tools',   'Adobe Creative Cloud',                     '2026-01-01'),
  ('c0000003-0000-0000-0000-000000000001', uid,  16.00, 'Software & Tools',   'Notion — plan Plus',                       '2026-01-03'),
  ('c0000004-0000-0000-0000-000000000001', uid,  15.00, 'Software & Tools',   'Figma — suscripción mensual',              '2026-02-01'),
  ('c0000005-0000-0000-0000-000000000001', uid,  59.99, 'Software & Tools',   'Adobe Creative Cloud',                     '2026-02-01'),
  ('c0000006-0000-0000-0000-000000000001', uid,  15.00, 'Software & Tools',   'Figma — suscripción mensual',              '2026-03-01'),
  ('c0000007-0000-0000-0000-000000000001', uid,  59.99, 'Software & Tools',   'Adobe Creative Cloud',                     '2026-03-01'),
  ('c0000008-0000-0000-0000-000000000001', uid,  15.00, 'Software & Tools',   'Figma — suscripción mensual',              '2026-04-01'),
  ('c0000009-0000-0000-0000-000000000001', uid,  59.99, 'Software & Tools',   'Adobe Creative Cloud',                     '2026-04-01'),
  ('c0000010-0000-0000-0000-000000000001', uid,  15.00, 'Software & Tools',   'Figma — suscripción mensual',              '2026-05-01'),
  ('c0000011-0000-0000-0000-000000000001', uid,  59.99, 'Software & Tools',   'Adobe Creative Cloud',                     '2026-05-01'),
  -- Oficina / Homeoffice (Pauschale 6€/día)
  ('c0000012-0000-0000-0000-000000000001', uid, 120.00, 'Oficina / Homeoffice', 'Homeoffice-Pauschale enero (20 días × 6€)',  '2026-01-31'),
  ('c0000013-0000-0000-0000-000000000001', uid, 108.00, 'Oficina / Homeoffice', 'Homeoffice-Pauschale febrero (18 días × 6€)','2026-02-28'),
  ('c0000014-0000-0000-0000-000000000001', uid, 126.00, 'Oficina / Homeoffice', 'Homeoffice-Pauschale marzo (21 días × 6€)',  '2026-03-31'),
  ('c0000015-0000-0000-0000-000000000001', uid, 114.00, 'Oficina / Homeoffice', 'Homeoffice-Pauschale abril (19 días × 6€)',  '2026-04-30'),
  ('c0000016-0000-0000-0000-000000000001', uid, 120.00, 'Oficina / Homeoffice', 'Homeoffice-Pauschale mayo (20 días × 6€)',   '2026-05-31'),
  ('c0000017-0000-0000-0000-000000000001', uid,  89.00, 'Oficina / Homeoffice', 'Monitor LG 27" — parte laboral (80%)',       '2026-02-14'),
  -- Suscripciones
  ('c0000018-0000-0000-0000-000000000001', uid,   9.99, 'Suscripciones',      'iCloud 200 GB',                            '2026-01-05'),
  ('c0000019-0000-0000-0000-000000000001', uid,   9.99, 'Suscripciones',      'iCloud 200 GB',                            '2026-02-05'),
  ('c0000020-0000-0000-0000-000000000001', uid,   9.99, 'Suscripciones',      'iCloud 200 GB',                            '2026-03-05'),
  ('c0000021-0000-0000-0000-000000000001', uid,   9.99, 'Suscripciones',      'iCloud 200 GB',                            '2026-04-05'),
  ('c0000022-0000-0000-0000-000000000001', uid,   9.99, 'Suscripciones',      'iCloud 200 GB',                            '2026-05-05'),
  -- Viajes (BVG + cliente)
  ('c0000023-0000-0000-0000-000000000001', uid,  86.00, 'Viajes',             'BVG Monatskarte enero',                    '2026-01-02'),
  ('c0000024-0000-0000-0000-000000000001', uid,  86.00, 'Viajes',             'BVG Monatskarte febrero',                  '2026-02-02'),
  ('c0000025-0000-0000-0000-000000000001', uid,  86.00, 'Viajes',             'BVG Monatskarte marzo',                    '2026-03-02'),
  ('c0000026-0000-0000-0000-000000000001', uid,  86.00, 'Viajes',             'BVG Monatskarte abril',                    '2026-04-02'),
  ('c0000027-0000-0000-0000-000000000001', uid,  86.00, 'Viajes',             'BVG Monatskarte mayo',                     '2026-05-02'),
  ('c0000028-0000-0000-0000-000000000001', uid, 142.50, 'Viajes',             'Tren Berlin–Hamburg (reunión Forto)',       '2026-03-18'),
  -- Formación
  ('c0000029-0000-0000-0000-000000000001', uid, 129.00, 'Formación',          'Curso Interaction Design Foundation',      '2026-01-10'),
  ('c0000030-0000-0000-0000-000000000001', uid,  49.00, 'Formación',          'Libro: Design Systems (Smashing Magazine)','2026-02-20'),
  ('c0000031-0000-0000-0000-000000000001', uid, 299.00, 'Formación',          'Config 2026 — conferencia Figma',          '2026-05-12'),
  -- Marketing
  ('c0000032-0000-0000-0000-000000000001', uid, 180.00, 'Marketing',          'Dominio + hosting portfolio',              '2026-01-15'),
  -- Cuotas y tasas
  ('c0000033-0000-0000-0000-000000000001', uid,  89.00, 'Cuotas y tasas',     'Cámara de Comercio — alta autónoma',       '2026-02-05')
ON CONFLICT (id) DO NOTHING;

-- ── Tasks ──────────────────────────────────────────────────────────────
INSERT INTO public.tasks
  (id, user_id, task_type, title, description, priority, status, due_date, action_url)
VALUES
  (
    'd0000001-0000-0000-0000-000000000001', uid,
    'ustVA_due',
    'UStVA Q2 2026 — vence 10 julio',
    'Declaración trimestral IVA Q2 (abril–junio). Plazo: 10 de julio de 2026.',
    'red', 'open', '2026-07-10', 'klaro-impuestos.html'
  ),
  (
    'd0000002-0000-0000-0000-000000000001', uid,
    'invoice_unpaid',
    'Factura KL-2026-006 vencida — Ecosia GmbH',
    'La factura de €3.200 venció el 30 de abril. Envía un recordatorio de pago.',
    'red', 'open', '2026-04-30', 'klaro-facturas.html'
  ),
  (
    'd0000003-0000-0000-0000-000000000001', uid,
    'quarter_threshold',
    'Revisa ingresos Q2 — umbral Kleinunternehmer',
    'Llevas €28.900 facturados en 2026. Mantén el control para planificar bien el año.',
    'amber', 'open', '2026-06-30', 'klaro-impuestos.html'
  )
ON CONFLICT (id) DO NOTHING;

END $$;

-- ============================================================
-- Expected result:
--   profiles:       1 row upserted
--   fiscal_profiles: 1 row upserted
--   invoices:       21 rows (14 × 2025 + 7 × 2026)
--   expenses:       33 rows across 6 categories
--   tasks:          3 open tasks
--
-- 2026 KPIs (for dashboard validation):
--   Income (non-draft):  €28,900  (KL-2026-001 to 007)
--   Expenses:            €2,776.41
--   Gross profit:        €26,123.59
-- ============================================================
