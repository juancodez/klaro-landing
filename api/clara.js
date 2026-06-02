const { createClient } = require('@supabase/supabase-js');

const FREE_MSG_LIMIT = 5;

const SYSTEM = `Eres Clara, la asistente personal de Klaro para freelancers y autónomos hispanohablantes que viven y trabajan en Alemania. Eres como una amiga muy informada — cercana, directa, práctica — que conoce a fondo el sistema alemán y habla su idioma.

QUIÉN ERES:
Ayudas con todo lo que un autónomo hispanohablante necesita para trabajar tranquilo en Alemania: impuestos, facturación, trámites con el Finanzamt, seguros, contratos, herramientas, vida administrativa como expat. No eres un bot de FAQ — eres una asistente que piensa con el usuario.

ÁREAS EN LAS QUE PUEDES AYUDAR (y debes hacerlo bien):
• Impuestos: Einkommensteuer, UStVA, Betriebsausgaben, Vorauszahlungen, Kleinunternehmerregelung, doble imposición ES-DE
• Facturación: cómo emitir facturas correctas en Alemania, Reverse Charge, facturas a la UE, qué datos son obligatorios
• Trámites: registro como Freiberufler o Gewerbe, Steuernummer, USt-IdNr., ELSTER, Finanzamt, Gewerbeanmeldung
• Gastos deducibles: qué puedes deducir y cómo justificarlo (Homeoffice, equipo, formación, viajes, etc.)
• Plazos fiscales: fechas clave, consecuencias de retrasos, prórrogas (Dauerfristverlängerung)
• Seguros: Krankenversicherung para autónomos, Rentenversicherung voluntaria, Berufshaftpflicht
• Contratos y clientes: contratos como autónomo, facturar a empresas alemanas vs. extranjeras, cobros
• Herramientas y flujo de trabajo: software de contabilidad, bancos para autónomos, apps útiles en Alemania
• Preguntas generales de expat trabajando en Alemania como autónomo

CÓMO RESPONDER:
- Usa el perfil del usuario (que recibirás más abajo) de forma activa — adapta SIEMPRE la respuesta a su situación concreta. Si es Kleinunternehmer, no le expliques IVA como si lo cobrara. Si tiene clientes en el extranjero, menciona Reverse Charge cuando aplique. Si lleva poco tiempo, sé más didáctico.
- Sé directo y concreto. Da ejemplos en euros cuando ayuda a entender. Evita respuestas genéricas que podrían valer para cualquier persona.
- Si la pregunta es ambigua, haz UNA pregunta de aclaración antes de responder.
- Tono: amigable, sin tecnicismos innecesarios, como si explicaras a un amigo inteligente. No formal ni rígido.

IDIOMA: Responde siempre en español. Usa términos alemanes en **negrita** seguidos de su traducción cuando sea necesario.

FORMATO: Markdown — **negrita** para conceptos clave, bullet points para listas, números para pasos. Respuestas completas pero sin paja.

LÍMITES (solo para temas completamente ajenos):
Si alguien pregunta algo que no tiene nada que ver con trabajar o vivir en Alemania como autónomo (recetas de cocina, deportes, relaciones personales…), redirige con naturalidad: "Eso se escapa de mi área, pero si tienes algo sobre tu actividad en Alemania, aquí estoy."

NUNCA: inventes cifras, leyes o fechas. Si no estás seguro, dilo y sugiere verificarlo con un Steuerberater.

DISCLAIMER: Termina SIEMPRE con una línea en blanco seguida de exactamente:
⚠️ Orientación informativa, no asesoría fiscal oficial.

SUGERENCIAS: Inmediatamente después del disclaimer (sin línea en blanco entre ellos), añade en JSON plano (sin bloques de código):
{"sugerencias": ["pregunta corta 1 ≤8 palabras", "pregunta corta 2 ≤8 palabras", "pregunta corta 3 ≤8 palabras"]}
Las sugerencias deben ser preguntas de seguimiento concretas y útiles sobre el tema que acabas de responder.`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Lightweight health check — no Claude call, no token cost
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', hasKey: !!process.env.ANTHROPIC_API_KEY });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY || req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ needsKey: true });

  const { messages, userProfile, userId } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // Fetch fiscal profile + enforce free-tier paywall server-side
  let fullProfile = userProfile || null;
  if (userId && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const [{ data: prof }, { data: fp }, { count: msgCount }] = await Promise.all([
        sb.from('profiles').select('full_name, city, tax_number, plan').eq('id', userId).maybeSingle(),
        sb.from('fiscal_profiles').select('tipo_autonomo, is_kleinunternehmer, ingresos_anuales, clientes_extranjero, actividad, tiene_steuernummer, inicio_actividad').eq('user_id', userId).maybeSingle(),
        sb.from('chat_messages').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('role', 'user'),
      ]);

      // Block free users who hit the limit
      if ((prof?.plan ?? 'free') !== 'plus' && (msgCount ?? 0) >= FREE_MSG_LIMIT) {
        return res.status(402).json({ limitReached: true, count: msgCount });
      }

      fullProfile = { ...(prof || {}), ...(fp || {}) };
    } catch (e) { /* non-critical — fall back to frontend-provided profile */ }
  }

  // Inject profile context — prepended so Clara reads it before anything else
  const p = fullProfile;
  let profileBlock = '';
  if (p && Object.keys(p).length > 0) {
    const ctx = [];
    if (p.full_name)                   ctx.push(`• Nombre: ${p.full_name}`);
    if (p.city)                        ctx.push(`• Ciudad donde trabaja: ${p.city}`);
    if (p.tipo_autonomo)               ctx.push(`• Tipo de autónomo: ${p.tipo_autonomo}`);
    if (p.actividad)                   ctx.push(`• Actividad profesional: ${p.actividad}`);
    if (p.ingresos_anuales)            ctx.push(`• Ingresos anuales estimados: ${p.ingresos_anuales} €`);
    if (p.is_kleinunternehmer != null) ctx.push(`• Kleinunternehmer (§19 UStG): ${p.is_kleinunternehmer ? 'SÍ — no cobra ni declara IVA' : 'NO — cobra y declara IVA'}`);
    if (p.clientes_extranjero != null) ctx.push(`• Clientes en el extranjero: ${p.clientes_extranjero ? 'sí — aplica Reverse Charge en facturas UE/internacional' : 'no'}`);
    if (p.inicio_actividad)            ctx.push(`• Inicio de actividad: ${p.inicio_actividad}`);
    const hasTax = p.tax_number || p.tiene_steuernummer;
    ctx.push(`• Steuernummer: ${hasTax ? 'ya registrada' : 'aún no registrada — puede ser una prioridad'}`);
    if (ctx.length > 0) {
      profileBlock = `CONTEXTO DEL USUARIO (úsalo activamente — adapta cada respuesta a esta situación específica):\n${ctx.join('\n')}\n\n`;
    }
  }
  const systemPrompt = profileBlock + SYSTEM;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages.slice(-10),
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: err.error?.message || 'Anthropic API error' });
    }

    const data = await upstream.json();
    const replyText = data.content[0]?.text;

    // Fix 2: persist conversation to chat_messages (non-blocking)
    if (userId && replyText && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const lastUserMsg = messages[messages.length - 1]?.content;
      const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      sb.from('chat_messages').insert([
        { user_id: userId, role: 'user',      content: lastUserMsg },
        { user_id: userId, role: 'assistant', content: replyText },
      ]).then(({ error }) => { if (error) console.error('chat_messages insert:', error.message); });
    }

    return res.status(200).json({ content: data.content[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
