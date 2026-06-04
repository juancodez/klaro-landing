/* Klaro — POST /api/send-invoice
   Sends the invoice as a formatted HTML email via Resend.
   Required env vars:
     RESEND_API_KEY      — from resend.com
     RESEND_FROM_EMAIL   — verified sender address, e.g. facturas@yourdomain.com
*/

function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtEur(n) {
  return Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function fmtDateDE(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}.${m}.${y}`;
}

function buildHtml({ clientName, clientCompany, clientAddress, invoiceNumber, description,
                     amount, taxRate, dueDate, date, companyName, companyService, stNr }) {
  const net   = parseFloat(amount)  || 0;
  const tax   = parseFloat(taxRate) || 0;
  const vat   = net * tax / 100;
  const gross = net + vat;

  const dueDateStr = fmtDateDE(dueDate);
  const invDateStr = fmtDateDE(date);
  const from = escHtml(companyName || 'Klaro Facturas');
  const svc  = companyService ? `<p style="color:rgba(255,255,255,.7);margin:4px 0 0;font-size:12px">${escHtml(companyService)}</p>` : '';

  const clientMeta = [clientCompany, clientAddress].filter(Boolean)
    .map(v => `<span>${escHtml(v)}</span>`).join('<br>');

  const vatRow = tax > 0
    ? `<tr>
         <td style="padding:6px 16px;font-size:12px;color:#594139">MwSt. ${tax}%</td>
         <td style="padding:6px 16px;text-align:right;font-size:12px;color:#594139">${fmtEur(vat)}</td>
       </tr>`
    : (tax === 0
        ? `<tr><td colspan="2" style="padding:6px 16px;font-size:11px;color:#594139">Gemäß §19 UStG wird keine Umsatzsteuer berechnet.</td></tr>`
        : '');

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 0;background:#f5ede8;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto">
    <tr><td>

      <!-- Header -->
      <div style="background:#1e1b17;padding:28px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:22px;letter-spacing:-0.02em">${from}</h1>
        ${svc}
        ${stNr ? `<p style="color:rgba(255,255,255,.4);font-size:11px;margin:8px 0 0">St.-Nr.: ${escHtml(stNr)}</p>` : ''}
      </div>

      <!-- Body -->
      <div style="background:#fff8f1;padding:32px;border:1px solid #e0bfb4;border-top:none;border-radius:0 0 12px 12px">

        <!-- Greeting -->
        <p style="margin:0 0 8px;font-size:15px;color:#1e1b17">
          Sehr geehrte/r <strong>${escHtml(clientName || 'Kunde')}</strong>${clientCompany ? ` (${escHtml(clientCompany)})` : ''},
        </p>
        <p style="margin:0 0 28px;font-size:14px;color:#594139;line-height:1.6">
          vielen Dank für Ihre Zusammenarbeit${companyName ? ` mit <strong>${escHtml(companyName)}</strong>` : ''}.
          Anbei erhalten Sie Ihre Rechnung. Bitte begleichen Sie den offenen Betrag bis zum angegebenen Fälligkeitsdatum.
        </p>

        <!-- Invoice meta -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-radius:8px;overflow:hidden;border:1px solid #e0bfb4">
          <tr style="background:#a43700">
            <th style="padding:10px 16px;text-align:left;color:white;font-size:11px;font-weight:600;letter-spacing:.05em">RECHNUNGSNUMMER</th>
            <th style="padding:10px 16px;text-align:right;color:white;font-size:11px;font-weight:600;letter-spacing:.05em">DATUM</th>
          </tr>
          <tr style="background:white">
            <td style="padding:12px 16px;font-weight:bold;color:#1e1b17">${escHtml(invoiceNumber)}</td>
            <td style="padding:12px 16px;text-align:right;color:#594139">${invDateStr}</td>
          </tr>
        </table>

        <!-- Line items -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-radius:8px;overflow:hidden;border:1px solid #e0bfb4">
          <tr style="background:#f5ede8">
            <th style="padding:10px 16px;text-align:left;font-size:11px;color:#594139;font-weight:600;letter-spacing:.05em">BESCHREIBUNG</th>
            <th style="padding:10px 16px;text-align:right;font-size:11px;color:#594139;font-weight:600;letter-spacing:.05em">NETTOBETRAG</th>
          </tr>
          <tr style="background:white">
            <td style="padding:12px 16px;color:#1e1b17">${escHtml(description || 'Servicios profesionales')}</td>
            <td style="padding:12px 16px;text-align:right;color:#1e1b17">${fmtEur(net)}</td>
          </tr>
          ${vatRow}
          <tr style="background:#a43700">
            <td style="padding:14px 16px;color:white;font-weight:bold;font-size:14px">Gesamtbetrag</td>
            <td style="padding:14px 16px;text-align:right;color:white;font-weight:bold;font-size:18px">${fmtEur(gross)}</td>
          </tr>
        </table>

        <!-- Due date callout -->
        <div style="background:#fff3e6;border:1.5px solid #a43700;border-radius:10px;padding:16px 20px;margin-bottom:24px">
          <p style="margin:0 0 4px;font-size:11px;color:#a43700;font-weight:600;letter-spacing:.05em;text-transform:uppercase">Zahlungsziel</p>
          <p style="margin:0;font-size:16px;font-weight:bold;color:#1e1b17">${dueDateStr} <span style="font-weight:normal;font-size:13px;color:#594139">(14 Tage nach Rechnungsdatum)</span></p>
        </div>

        <p style="font-size:13px;color:#594139;margin:0 0 24px;line-height:1.6">
          Bitte überweisen Sie den Betrag von <strong>${fmtEur(gross)}</strong> bis zum <strong>${dueDateStr}</strong>.
          Bei Fragen stehen wir Ihnen gerne zur Verfügung.
        </p>

        <p style="font-size:13px;color:#1e1b17;margin:0 0 4px">Mit freundlichen Grüßen,</p>
        <p style="font-size:14px;font-weight:bold;color:#1e1b17;margin:0">${from}</p>
        ${companyService ? `<p style="font-size:12px;color:#594139;margin:2px 0 0">${escHtml(companyService)}</p>` : ''}

        <!-- Footer -->
        <hr style="border:none;border-top:1px solid #e0bfb4;margin:24px 0 16px">
        <p style="font-size:10px;color:#a0897f;margin:0;text-align:center">
          Erstellt mit <a href="https://klaro-es.com" style="color:#a43700;text-decoration:none">Klaro</a>
          · Fiskalassistenz für Freelancer in Deutschland
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

  const {
    clientEmail, clientName, clientCompany, clientAddress,
    invoiceNumber, description, amount, taxRate,
    dueDate, date, companyName, companyService, stNr,
  } = req.body || {};

  if (!clientEmail) return res.status(400).json({ error: 'clientEmail is required' });
  if (!invoiceNumber) return res.status(400).json({ error: 'invoiceNumber is required' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clientEmail)) {
    return res.status(400).json({ error: 'Invalid clientEmail' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(500).json({ error: 'Email service not configured (RESEND_API_KEY missing)' });
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const fromLabel = companyName || 'Klaro Facturas';
  const subject   = `Ihre Rechnung ${invoiceNumber}${companyName ? ' von ' + companyName : ''}`;
  const html      = buildHtml({ clientName, clientCompany, clientAddress, invoiceNumber,
                                description, amount, taxRate, dueDate, date,
                                companyName, companyService, stNr });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    `${fromLabel} <${fromEmail}>`,
        to:      [clientEmail],
        subject,
        html,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Resend error:', payload);
      return res.status(502).json({ error: 'Email delivery failed', detail: payload });
    }

    return res.status(200).json({ ok: true, id: payload.id });

  } catch (err) {
    console.error('send-invoice fetch error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
};
