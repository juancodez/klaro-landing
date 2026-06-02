-- ============================================================
-- Klaro — Demo Seed Data
-- ============================================================
-- BEFORE RUNNING:
--   1. Supabase Dashboard → Authentication → Users
--   2. Copy your demo user UUID
--   3. Ctrl+H: replace '00000000-0000-0000-0000-000000000001'
--      with your real UUID throughout this file
--   4. Paste entire file into SQL Editor → Run
--
-- Safe to run multiple times — all rows use ON CONFLICT DO NOTHING
-- or ON CONFLICT DO UPDATE where idempotency requires overwrite.
-- ============================================================

DO $$
DECLARE
  uid UUID := '00000000-0000-0000-0000-000000000001'; -- REPLACE THIS UUID
BEGIN

-- ── Profile ────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, full_name, phone, tax_number, steuernummer, city, address, postal_code, iban, bic, bank_name)
VALUES (uid, 'Ana García López', '+49 176 12345678', '12/345/67890', '12/345/67890', 'Berlin', 'Prenzlauer Allee 42', '10405', 'DE89 3704 0044 0532 0130 00', 'COBADEFFXXX', 'Commerzbank')
ON CONFLICT (id) DO UPDATE SET
  full_name    = EXCLUDED.full_name,
  phone        = EXCLUDED.phone,
  tax_number   = EXCLUDED.tax_number,
  steuernummer = EXCLUDED.steuernummer,
  city         = EXCLUDED.city,
  address      = EXCLUDED.address,
  postal_code  = EXCLUDED.postal_code,
  iban         = EXCLUDED.iban,
  bic          = EXCLUDED.bic,
  bank_name    = EXCLUDED.bank_name;

-- ── Fiscal profile ─────────────────────────────────────────────────────
INSERT INTO public.fiscal_profiles
  (user_id, tipo_autonomo, inicio_actividad, ingresos_anuales,
   clientes_extranjero, tiene_steuernummer, actividad, is_kleinunternehmer)
VALUES
  (uid, 'Freiberufler', '2023-03', '50000-75000', true, true, 'Diseñadora UX/UI', false)
ON CONFLICT (user_id) DO UPDATE SET
  tipo_autonomo        = EXCLUDED.tipo_autonomo,
  inicio_actividad     = EXCLUDED.inicio_actividad,
  ingresos_anuales     = EXCLUDED.ingresos_anuales,
  clientes_extranjero  = EXCLUDED.clientes_extranjero,
  tiene_steuernummer   = EXCLUDED.tiene_steuernummer,
  actividad            = EXCLUDED.actividad,
  is_kleinunternehmer  = EXCLUDED.is_kleinunternehmer;

-- ── Invoices ───────────────────────────────────────────────────────────
-- 2025 — 14 invoices paid (total ≈ €71,000)
-- 2026 — 7 invoices: 4 paid, 1 sent, 1 overdue, 1 sent (2026 paid ≈ €22,000)
-- tax_rate 0 = Reverse Charge (EU clients: Contentful London, Tomorrow Studio)
INSERT INTO public.invoices
  (id, user_id, invoice_number, client_name, client_email, description, amount, tax_rate, date, due_date, status)
VALUES
  -- 2025
  ('b0000001-0000-0000-0000-000000000001', uid, 'KL-2025-001', 'Blinkist GmbH',   'billing@blinkist.com',   'Diseño UX — App onboarding flow',              3800.00, 19, '2025-01-15', '2025-02-14', 'paid'),
  ('b0000002-0000-0000-0000-000000000001', uid, 'KL-2025-002', 'Tomorrow Studio', 'finance@tomorrow.one',   'Wireframes & prototipo — módulo pagos',         4200.00,  0, '2025-02-01', '2025-03-03', 'paid'),
  ('b0000003-0000-0000-0000-000000000001', uid, 'KL-2025-003', 'Ecosia GmbH',     'ap@ecosia.org',          'Auditoría UX + informe de usabilidad',          2900.00, 19, '2025-02-20', '2025-03-22', 'paid'),
  ('b0000004-0000-0000-0000-000000000001', uid, 'KL-2025-004', 'Pitch Software',  'invoices@pitch.com',     'Design system — componentes base',              5500.00, 19, '2025-03-10', '2025-04-09', 'paid'),
  ('b0000005-0000-0000-0000-000000000001', uid, 'KL-2025-005', 'Taxfix SE',       'ap@taxfix.de',           'Rediseño pantallas fiscales — Sprint 1',        6200.00, 19, '2025-04-01', '2025-05-01', 'paid'),
  ('b0000006-0000-0000-0000-000000000001', uid, 'KL-2025-006', 'Contentful Ltd',  'finance@contentful.com', 'UX Research — entrevistas + síntesis',          4800.00,  0, '2025-04-18', '2025-05-18', 'paid'),
  ('b0000007-0000-0000-0000-000000000001', uid, 'KL-2025-007', 'Taxfix SE',       'ap@taxfix.de',           'Rediseño pantallas fiscales — Sprint 2',        6200.00, 19, '2025-05-05', '2025-06-04', 'paid'),
  ('b0000008-0000-0000-0000-000000000001', uid, 'KL-2025-008', 'Tomorrow Studio', 'finance@tomorrow.one',   'Motion design — animaciones UI',                3400.00,  0, '2025-06-02', '2025-07-02', 'paid'),
  ('b0000009-0000-0000-0000-000000000001', uid, 'KL-2025-009', 'Blinkist GmbH',   'billing@blinkist.com',   'Diseño UX — feature biblioteca',               5100.00, 19, '2025-07-14', '2025-08-13', 'paid'),
  ('b0000010-0000-0000-0000-000000000001', uid, 'KL-2025-010', 'Ecosia GmbH',     'ap@ecosia.org',          'Rediseño onboarding desktop',                  4600.00, 19, '2025-08-04', '2025-09-03', 'paid'),
  ('b0000011-0000-0000-0000-000000000001', uid, 'KL-2025-011', 'Pitch Software',  'invoices@pitch.com',     'Design system — tokens & documentación',        5800.00, 19, '2025-09-01', '2025-10-01', 'paid'),
  ('b0000012-0000-0000-0000-000000000001', uid, 'KL-2025-012', 'Forto GmbH',      'ap@forto.com',           'UX logística — flujos de tracking',             7200.00, 19, '2025-10-06', '2025-11-05', 'paid'),
  ('b0000013-0000-0000-0000-000000000001', uid, 'KL-2025-013', 'Contentful Ltd',  'finance@contentful.com', 'Prototipo MVP — nuevo editor',                  6900.00,  0, '2025-11-03', '2025-12-03', 'paid'),
  ('b0000014-0000-0000-0000-000000000001', uid, 'KL-2025-014', 'Forto GmbH',      'ap@forto.com',           'Sprint navidad — dashboard métricas',           4400.00, 19, '2025-12-01', '2025-12-31', 'paid'),
  -- 2026
  ('b0000015-0000-0000-0000-000000000001', uid, 'KL-2026-001', 'Blinkist GmbH',   'billing@blinkist.com',   'Q1 — Diseño UX retainer enero',                5400.00, 19, '2026-01-20', '2026-02-19', 'paid'),
  ('b0000016-0000-0000-0000-000000000001', uid, 'KL-2026-002', 'Taxfix SE',       'ap@taxfix.de',           'Sprint fiscales — MVP v2',                     7500.00, 19, '2026-02-10', '2026-03-12', 'paid'),
  ('b0000017-0000-0000-0000-000000000001', uid, 'KL-2026-003', 'Pitch Software',  'invoices@pitch.com',     'Componentes accesibilidad WCAG 2.2',            5200.00, 19, '2026-03-03', '2026-04-02', 'paid'),
  ('b0000018-0000-0000-0000-000000000001', uid, 'KL-2026-004', 'Tomorrow Studio', 'finance@tomorrow.one',   'Animaciones — lanzamiento producto',            3900.00,  0, '2026-04-07', '2026-05-07', 'paid'),
  ('b0000019-0000-0000-0000-000000000001', uid, 'KL-2026-005', 'Forto GmbH',      'ap@forto.com',           'UX rediseño app móvil — Phase 1',              6800.00, 19, '2026-05-05', '2026-06-04', 'sent'),
  ('b0000020-0000-0000-0000-000000000001', uid, 'KL-2026-006', 'Ecosia GmbH',     'ap@ecosia.org',          'Auditoría accesibilidad + fix list',            3200.00, 19, '2026-04-01', '2026-04-30', 'overdue'),
  ('b0000021-0000-0000-0000-000000000001', uid, 'KL-2026-007', 'Contentful Ltd',  'finance@contentful.com', 'Design tokens — sistema multimarca',            5600.00,  0, '2026-05-15', '2026-06-14', 'sent')
ON CONFLICT (id) DO NOTHING;

-- ── Expenses ───────────────────────────────────────────────────────────
-- Categories must match app keys: software | home | equipamiento | transporte | formacion | otros
-- 2026 — 34 expenses across all 6 categories (total ≈ €2,900)
INSERT INTO public.expenses (id, user_id, amount, category, description, date)
VALUES
  -- software (Figma, Adobe CC, iCloud — recurring)
  ('c0000001-0000-0000-0000-000000000001', uid,  15.00, 'software', 'Figma — suscripción mensual',          '2026-01-01'),
  ('c0000002-0000-0000-0000-000000000001', uid,  59.99, 'software', 'Adobe Creative Cloud',                  '2026-01-01'),
  ('c0000003-0000-0000-0000-000000000001', uid,   9.99, 'software', 'iCloud 200 GB',                         '2026-01-05'),
  ('c0000004-0000-0000-0000-000000000001', uid,  15.00, 'software', 'Figma — suscripción mensual',          '2026-02-01'),
  ('c0000005-0000-0000-0000-000000000001', uid,  59.99, 'software', 'Adobe Creative Cloud',                  '2026-02-01'),
  ('c0000006-0000-0000-0000-000000000001', uid,   9.99, 'software', 'iCloud 200 GB',                         '2026-02-05'),
  ('c0000007-0000-0000-0000-000000000001', uid,  16.00, 'software', 'Notion — plan Plus',                    '2026-02-10'),
  ('c0000008-0000-0000-0000-000000000001', uid,  15.00, 'software', 'Figma — suscripción mensual',          '2026-03-01'),
  ('c0000009-0000-0000-0000-000000000001', uid,  59.99, 'software', 'Adobe Creative Cloud',                  '2026-03-01'),
  ('c0000010-0000-0000-0000-000000000001', uid,   9.99, 'software', 'iCloud 200 GB',                         '2026-03-05'),
  ('c0000011-0000-0000-0000-000000000001', uid,  15.00, 'software', 'Figma — suscripción mensual',          '2026-04-01'),
  ('c0000012-0000-0000-0000-000000000001', uid,  59.99, 'software', 'Adobe Creative Cloud',                  '2026-04-01'),
  ('c0000013-0000-0000-0000-000000000001', uid,   9.99, 'software', 'iCloud 200 GB',                         '2026-04-05'),
  ('c0000014-0000-0000-0000-000000000001', uid,  15.00, 'software', 'Figma — suscripción mensual',          '2026-05-01'),
  ('c0000015-0000-0000-0000-000000000001', uid,  59.99, 'software', 'Adobe Creative Cloud',                  '2026-05-01'),
  ('c0000016-0000-0000-0000-000000000001', uid,   9.99, 'software', 'iCloud 200 GB',                         '2026-05-05'),
  -- home (Homeoffice-Pauschale 6€/día)
  ('c0000017-0000-0000-0000-000000000001', uid, 120.00, 'home', 'Homeoffice-Pauschale enero (20 días × 6€)', '2026-01-31'),
  ('c0000018-0000-0000-0000-000000000001', uid, 108.00, 'home', 'Homeoffice-Pauschale febrero (18 días × 6€)','2026-02-28'),
  ('c0000019-0000-0000-0000-000000000001', uid, 126.00, 'home', 'Homeoffice-Pauschale marzo (21 días × 6€)', '2026-03-31'),
  ('c0000020-0000-0000-0000-000000000001', uid, 114.00, 'home', 'Homeoffice-Pauschale abril (19 días × 6€)', '2026-04-30'),
  ('c0000021-0000-0000-0000-000000000001', uid, 120.00, 'home', 'Homeoffice-Pauschale mayo (20 días × 6€)',  '2026-05-31'),
  -- equipamiento (hardware deducible)
  ('c0000022-0000-0000-0000-000000000001', uid,  89.00, 'equipamiento', 'Monitor LG 27" — parte laboral (80%)',      '2026-02-14'),
  ('c0000023-0000-0000-0000-000000000001', uid, 149.00, 'equipamiento', 'Teclado Apple Magic Keyboard',              '2026-03-05'),
  ('c0000024-0000-0000-0000-000000000001', uid,  79.00, 'equipamiento', 'Ratón Logitech MX Master — parte laboral',  '2026-04-12'),
  -- transporte (BVG + viaje cliente)
  ('c0000025-0000-0000-0000-000000000001', uid,  86.00, 'transporte', 'BVG Monatskarte enero',               '2026-01-02'),
  ('c0000026-0000-0000-0000-000000000001', uid,  86.00, 'transporte', 'BVG Monatskarte febrero',             '2026-02-02'),
  ('c0000027-0000-0000-0000-000000000001', uid,  86.00, 'transporte', 'BVG Monatskarte marzo',               '2026-03-02'),
  ('c0000028-0000-0000-0000-000000000001', uid,  86.00, 'transporte', 'BVG Monatskarte abril',               '2026-04-02'),
  ('c0000029-0000-0000-0000-000000000001', uid,  86.00, 'transporte', 'BVG Monatskarte mayo',                '2026-05-02'),
  ('c0000030-0000-0000-0000-000000000001', uid, 142.50, 'transporte', 'Tren Berlin–Hamburg (reunión Forto)', '2026-03-18'),
  -- formacion (cursos, libros, conferencias)
  ('c0000031-0000-0000-0000-000000000001', uid, 129.00, 'formacion', 'Curso Interaction Design Foundation', '2026-01-10'),
  ('c0000032-0000-0000-0000-000000000001', uid,  49.00, 'formacion', 'Libro: Design Systems (Smashing Magazine)', '2026-02-20'),
  ('c0000033-0000-0000-0000-000000000001', uid, 299.00, 'formacion', 'Config 2026 — conferencia Figma',     '2026-05-12'),
  -- otros (dominio, alta autónoma)
  ('c0000034-0000-0000-0000-000000000001', uid, 180.00, 'otros', 'Dominio + hosting portfolio',             '2026-01-15'),
  ('c0000035-0000-0000-0000-000000000001', uid,  89.00, 'otros', 'Cámara de Comercio — alta autónoma',      '2026-02-05')
ON CONFLICT (id) DO NOTHING;

-- ── Tax declarations ────────────────────────────────────────────────────
-- 2025: Q1–Q4 all filed. 2026: Q1 filed (deadline 10 Apr passed), Q2 pending.
-- IVA figures based on 2025 invoices with tax_rate 19 (Contentful/Tomorrow at 0).
INSERT INTO public.tax_declarations
  (id, user_id, declaration_type, quarter, year,
   period_start, period_end, due_date, status, filed_at,
   iva_facturado, vorsteuer, neto_pagar)
VALUES
  -- 2025 Q1: Blinkist 3800×19% + Ecosia 2900×19% + Pitch 5500×19% = 2318 (Tomorrow 4200 = 0)
  ('e0000001-0000-0000-0000-000000000001', uid, 'ustVA', 1, 2025,
   '2025-01-01', '2025-03-31', '2025-04-10', 'filed', '2025-04-08 10:23:00+00',
   2318.00, 180.00, 2138.00),
  -- 2025 Q2: Taxfix 6200×19% + Taxfix 6200×19% = 2356 (Contentful 4800 = 0)
  ('e0000002-0000-0000-0000-000000000001', uid, 'ustVA', 2, 2025,
   '2025-04-01', '2025-06-30', '2025-07-10', 'filed', '2025-07-07 09:11:00+00',
   2356.00, 215.00, 2141.00),
  -- 2025 Q3: Blinkist 5100×19% + Ecosia 4600×19% = 1843 (Tomorrow 3400 = 0)
  ('e0000003-0000-0000-0000-000000000001', uid, 'ustVA', 3, 2025,
   '2025-07-01', '2025-09-30', '2025-10-10', 'filed', '2025-10-09 14:55:00+00',
   1843.00, 192.00, 1651.00),
  -- 2025 Q4: Pitch 5800×19% + Forto 7200×19% + Forto 4400×19% = 3268 (Contentful 6900 = 0)
  ('e0000004-0000-0000-0000-000000000001', uid, 'ustVA', 4, 2025,
   '2025-10-01', '2025-12-31', '2026-01-10', 'filed', '2026-01-09 11:30:00+00',
   3268.00, 240.00, 3028.00),
  -- 2026 Q1: Blinkist 5400×19% + Taxfix 7500×19% + Pitch 5200×19% = 3439 (Tomorrow 3900 = 0)
  ('e0000005-0000-0000-0000-000000000001', uid, 'ustVA', 1, 2026,
   '2026-01-01', '2026-03-31', '2026-04-10', 'filed', '2026-04-09 16:04:00+00',
   3439.00, 280.00, 3159.00),
  -- 2026 Q2: pending (deadline 10 Jul 2026 — not yet filed)
  ('e0000006-0000-0000-0000-000000000001', uid, 'ustVA', 2, 2026,
   '2026-04-01', '2026-06-30', '2026-07-10', 'pending', NULL,
   0.00, 0.00, 0.00)
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
    'Revisa ingresos Q2 — llevas €22.000 facturados',
    'Llevas €22.000 facturados en 2026 (sólo pagados). Hay €15.600 pendiente de cobro. Buen ritmo.',
    'amber', 'open', '2026-06-30', 'klaro-impuestos.html'
  )
ON CONFLICT (id) DO NOTHING;

END $$;

-- ============================================================
-- Expected result:
--   profiles:          1 row upserted
--   fiscal_profiles:   1 row upserted
--   invoices:          21 rows (14 × 2025 + 7 × 2026)
--   expenses:          35 rows across 6 categories (software/home/equipamiento/transporte/formacion/otros)
--   tax_declarations:  6 rows (Q1–Q4 2025 filed + Q1 2026 filed + Q2 2026 pending)
--   tasks:             3 open tasks
--
-- 2026 dashboard KPIs:
--   Ingresos cobrados (paid):   €22,000  (KL-2026-001 to 004)
--   Pendiente de cobro (sent):  €12,400  (KL-2026-005 + 007)
--   Vencida (overdue):          €3,200   (KL-2026-006)
--   Gastos 2026:                ≈ €2,955
--   Beneficio neto:             ≈ €19,045
--
-- Expense category keys (must match app):
--   software | home | equipamiento | transporte | formacion | otros
-- ============================================================
