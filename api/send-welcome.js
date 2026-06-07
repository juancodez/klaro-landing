/* Klaro — POST /api/send-welcome
   Sends a branded welcome email after successful signup via Resend.
   Required env vars:
     RESEND_API_KEY      — from resend.com
     RESEND_FROM_EMAIL   — verified sender, e.g. hola@klaro-es.com
*/

function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildWelcomeHtml(nombre) {
  const name = escHtml(nombre || 'freelancer');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 0;background:#f5ede8;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto">
    <tr><td>

      <!-- Header -->
      <div style="background:#1e1b17;padding:32px;border-radius:12px 12px 0 0;text-align:center">
        <p style="margin:0;font-size:26px;font-weight:700;color:white;letter-spacing:-0.02em">Klaro</p>
        <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,.5);letter-spacing:.08em;text-transform:uppercase">Tu asistente fiscal en Alemania</p>
      </div>

      <!-- Body -->
      <div style="background:#fff8f1;padding:36px 32px;border:1px solid #e0bfb4;border-top:none;border-radius:0 0 12px 12px">

        <h1 style="margin:0 0 8px;font-size:22px;color:#1e1b17;font-weight:700">Bienvenido/a, ${name}.</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#594139;line-height:1.6">
          Tu cuenta en Klaro se ha creado correctamente. Ya puedes gestionar tus facturas, gastos e impuestos en un solo lugar, en tu idioma.
        </p>

        <!-- Steps -->
        <div style="background:#f5ede8;border-radius:10px;padding:20px 24px;margin-bottom:28px">
          <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#a43700;text-transform:uppercase;letter-spacing:.07em">Para empezar</p>

          <div style="display:flex;align-items:flex-start;margin-bottom:12px">
            <span style="background:#a43700;color:white;border-radius:50%;width:22px;height:22px;min-width:22px;text-align:center;line-height:22px;font-size:11px;font-weight:700;margin-right:12px">1</span>
            <p style="margin:0;font-size:14px;color:#1e1b17;line-height:1.5"><strong>Confirma tu email</strong> — revisa tu bandeja de entrada y haz clic en el enlace de activación que Supabase te acaba de enviar.</p>
          </div>

          <div style="display:flex;align-items:flex-start;margin-bottom:12px">
            <span style="background:#a43700;color:white;border-radius:50%;width:22px;height:22px;min-width:22px;text-align:center;line-height:22px;font-size:11px;font-weight:700;margin-right:12px">2</span>
            <p style="margin:0;font-size:14px;color:#1e1b17;line-height:1.5"><strong>Completa tu perfil fiscal</strong> — cuéntanos si eres Freiberufler o Gewerbetreibender. Tarda 2 minutos.</p>
          </div>

          <div style="display:flex;align-items:flex-start">
            <span style="background:#a43700;color:white;border-radius:50%;width:22px;height:22px;min-width:22px;text-align:center;line-height:22px;font-size:11px;font-weight:700;margin-right:12px">3</span>
            <p style="margin:0;font-size:14px;color:#1e1b17;line-height:1.5"><strong>Habla con Clara</strong> — tu asistente fiscal con IA responde tus dudas de impuestos al momento.</p>
          </div>
        </div>

        <!-- CTA -->
        <div style="text-align:center;margin-bottom:28px">
          <a href="https://klaro-es.com/login.html"
             style="display:inline-block;background:#a43700;color:white;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;letter-spacing:-0.01em">
            Ir a mi cuenta
          </a>
        </div>

        <!-- Value props -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
          <tr>
            <td width="33%" style="text-align:center;padding:0 8px">
              <div style="background:#f5ede8;border-radius:8px;padding:14px 8px">
                <p style="margin:0 0 4px;font-size:18px">&#128221;</p>
                <p style="margin:0;font-size:11px;font-weight:700;color:#1e1b17">Facturas</p>
                <p style="margin:2px 0 0;font-size:10px;color:#594139">Crea y envia</p>
              </div>
            </td>
            <td width="33%" style="text-align:center;padding:0 8px">
              <div style="background:#f5ede8;border-radius:8px;padding:14px 8px">
                <p style="margin:0 0 4px;font-size:18px">&#128203;</p>
                <p style="margin:0;font-size:11px;font-weight:700;color:#1e1b17">Gastos</p>
                <p style="margin:2px 0 0;font-size:10px;color:#594139">Registra recibos</p>
              </div>
            </td>
            <td width="33%" style="text-align:center;padding:0 8px">
              <div style="background:#f5ede8;border-radius:8px;padding:14px 8px">
                <p style="margin:0 0 4px;font-size:18px">&#128200;</p>
                <p style="margin:0;font-size:11px;font-weight:700;color:#1e1b17">Impuestos</p>
                <p style="margin:2px 0 0;font-size:10px;color:#594139">EuR y UStVA</p>
              </div>
            </td>
          </tr>
        </table>

        <p style="font-size:13px;color:#594139;margin:0 0 4px;line-height:1.6">
          Si tienes alguna pregunta, responde a este email o habla directamente con Clara dentro de la app.
        </p>
        <p style="font-size:13px;color:#1e1b17;margin:0;font-weight:600">El equipo de Klaro</p>

        <!-- Footer -->
        <hr style="border:none;border-top:1px solid #e0bfb4;margin:24px 0 16px">
        <p style="font-size:10px;color:#a0897f;margin:0;text-align:center;line-height:1.6">
          Recibiste este email porque te registraste en
          <a href="https://klaro-es.com" style="color:#a43700;text-decoration:none">klaro-es.com</a>.
          &middot; Si no fuiste tu, puedes ignorar este mensaje.
        </p>
      </div>

    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, nombre } = req.body || {};

  if (!email) return res.status(400).json({ error: 'email is required' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(500).json({ error: 'Email service not configured (RESEND_API_KEY missing)' });
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const html      = buildWelcomeHtml(nombre);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    `Klaro <${fromEmail}>`,
        to:      [email],
        subject: `Bienvenido/a a Klaro, ${nombre || 'freelancer'}`,
        html,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Resend welcome error:', payload);
      return res.status(502).json({ error: 'Email delivery failed', detail: payload });
    }

    return res.status(200).json({ ok: true, id: payload.id });

  } catch (err) {
    console.error('send-welcome fetch error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
};
