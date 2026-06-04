const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const ORIGIN = 'https://klaro-es.com';
const sbOpts = { realtime: { transport: WebSocket } };

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: 'Stripe not configured' });

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, sbOpts);
  const { data: profile } = await sb.from('profiles').select('stripe_customer_id').eq('id', userId).maybeSingle();

  if (!profile?.stripe_customer_id) {
    return res.status(404).json({ error: 'No Stripe customer found' });
  }

  const stripeAuth = `Basic ${Buffer.from(stripeKey + ':').toString('base64')}`;

  const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: { 'Authorization': stripeAuth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      'customer': profile.stripe_customer_id,
      'return_url': `${ORIGIN}/klaro-profile.html`,
    }).toString(),
  });
  const portal = await portalRes.json();
  if (portal.error) return res.status(500).json({ error: portal.error.message });

  return res.status(200).json({ url: portal.url });
};
