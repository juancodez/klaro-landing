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
  const priceId  = process.env.STRIPE_PRICE_ID;
  if (!stripeKey || !priceId) return res.status(500).json({ error: 'Stripe not configured' });

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, sbOpts);

  // Get user email
  const { data: authData } = await sb.auth.admin.getUserById(userId);
  const email = authData?.user?.email;
  if (!email) return res.status(404).json({ error: 'User not found' });

  // Get or create Stripe customer
  const { data: profile } = await sb.from('profiles').select('stripe_customer_id, plan').eq('id', userId).maybeSingle();

  if (profile?.plan === 'plus') {
    return res.status(409).json({ error: 'Already subscribed', alreadyPlus: true });
  }

  const stripeAuth = `Basic ${Buffer.from(stripeKey + ':').toString('base64')}`;

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const custRes = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: { 'Authorization': stripeAuth, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email, 'metadata[user_id]': userId }).toString(),
    });
    const cust = await custRes.json();
    if (cust.error) return res.status(500).json({ error: cust.error.message });
    customerId = cust.id;
    await sb.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
  }

  // Create Stripe Checkout Session (hosted payment page)
  const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { 'Authorization': stripeAuth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      'mode': 'subscription',
      'customer': customerId,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': `${ORIGIN}/klaro-profile.html?payment=success`,
      'cancel_url': `${ORIGIN}/klaro-profile.html`,
      'allow_promotion_codes': 'true',
      'metadata[user_id]': userId,
    }).toString(),
  });
  const session = await sessionRes.json();
  if (session.error) return res.status(500).json({ error: session.error.message });

  return res.status(200).json({ url: session.url });
};
