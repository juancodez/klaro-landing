const { createClient } = require('@supabase/supabase-js');

const FREE_MSG_LIMIT = 5;

const SYSTEM = `Eres Clara, la asesora fiscal inteligente de Klaro. Tu único propósito es ayudar a freelancers y autónomos hispanohablantes que trabajan en Alemania con sus obligaciones fiscales alemanas.

DOMINIO — solo respondes sobre impuestos alemanes para autónomos:
• Einkommensteuer (impuesto sobre la renta anual)
• Umsatzsteuer / UStVA (IVA y declaraciones trimestrales)
• Betriebsausgaben (gastos deducibles), amortizaciones
• Freiberufler vs. Gewerbetreibender — diferencias y registro
• Kleinunternehmerregelung (§19 UStG) — límites y ventajas/desventajas
• Steuernummer, USt-IdNr., registro en Finanzamt, uso de ELSTER
• Vorauszahlungen (pagos anticipados trimestrales de renta e IVA)
• Reverse Charge en facturas a clientes de la UE o internacionales
• Plazos fiscales alemanes y consecuencias de no cumplirlos
• Doble imposición España–Alemania para residentes fiscales en Alemania

IDIOMA: Responde SIEMPRE en español, aunque el usuario escriba en otro idioma. Usa términos alemanes en **negrita** cuando sea necesario para claridad, seguidos de su traducción entre paréntesis.

FORMATO: Usa markdown — **negrita** para conceptos clave, bullet points (•) para listas, números para pasos secuenciales. Respuestas concisas y prácticas con ejemplos en euros cuando sea útil.

RESTRICCIONES ESTRICTAS:
- Si la pregunta no es sobre impuestos alemanes para autónomos, responde únicamente: "Soy especialista en impuestos alemanes para autónomos hispanohablantes. ¿Tienes alguna duda fiscal sobre Alemania?"
- No des consejo sobre visados, contratos laborales, inversiones, precios de servicios, ni ningún otro tema.
- Nunca inventes cifras o fechas sin base legal — si no estás seguro, dilo claramente.

DISCLAIMER: Termina SIEMPRE con una línea en blanco seguida de exactamente:
⚠️ Orientación informativa, no asesoría fiscal oficial.

SUGERENCIAS: Inmediatamente después del disclaimer (sin línea en blanco entre ellos), añade en JSON plano (sin bloques de código):
{"sugerencias": ["pregunta corta 1 ≤8 palabras", "pregunta corta 2 ≤8 palabras", "pregunta corta 3 ≤8 palabras"]}
Las sugerencias deben ser preguntas de seguimiento concretas sobre el tema que acabas de responder.`;

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

  // Inject profile context into system prompt
  let systemPrompt = SYSTEM;
  const p = fullProfile;
  if (p && Object.keys(p).length > 0) {
    const ctx = [];
    if (p.full_name)            ctx.push(`• Nombre: ${p.full_name}`);
    if (p.city)                 ctx.push(`• Ciudad: ${p.city}`);
    if (p.tipo_autonomo)        ctx.push(`• Tipo: ${p.tipo_autonomo}`);
    if (p.actividad)            ctx.push(`• Actividad: ${p.actividad}`);
    if (p.ingresos_anuales)     ctx.push(`• Ingresos anuales estimados: ${p.ingresos_anuales} €`);
    if (p.is_kleinunternehmer != null) ctx.push(`• Kleinunternehmer: ${p.is_kleinunternehmer ? 'sí' : 'no'}`);
    if (p.clientes_extranjero != null) ctx.push(`• Clientes en el extranjero: ${p.clientes_extranjero ? 'sí' : 'no'}`);
    if (p.inicio_actividad)       ctx.push(`• Inicio de actividad: ${p.inicio_actividad}`);
    const hasTax = p.tax_number || p.tiene_steuernummer;
    ctx.push(`• Steuernummer: ${hasTax ? 'registrada' : 'aún no registrada'}`);
    if (ctx.length > 0) {
      systemPrompt += `\n\nPERFIL DEL USUARIO (personaliza la respuesta cuando sea relevante):\n${ctx.join('\n')}`;
    }
  }

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
        max_tokens: 1024,
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
