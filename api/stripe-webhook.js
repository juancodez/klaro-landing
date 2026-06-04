const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const crypto = require('crypto');

const sbOpts = { realtime: { transport: WebSocket } };

// Vercel: disable body parser so we get raw bytes for Stripe signature verification
module.exports.config = { api: { bodyParser: false } };

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifyStripeSignature(rawBody, sigHeader, secret) {
  try {
    const parts = {};
    sigHeader.split(',').forEach(p => { const [k, v] = p.split('='); parts[k] = v; });
    const signedPayload = `${parts.t}.${rawBody}`;
    const expected = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(parts.v1, 'hex'));
  } catch { return false; }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(500).json({ error: 'Webhook secret not set' });

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  if (!verifyStripeSignature(rawBody.toString('utf8'), sig, webhookSecret)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(rawBody.toString('utf8'));
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, sbOpts);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (userId) {
      await sb.from('profiles').update({
        plan: 'plus',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      }).eq('id', userId);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const customerId = sub.customer;
    // Find user by stripe_customer_id
    await sb.from('profiles').update({
      plan: 'free',
      stripe_subscription_id: null,
    }).eq('stripe_customer_id', customerId);
  }

  if (event.type === 'invoice.payment_failed') {
    // Optional: could notify user but don't downgrade until subscription actually ends
  }

  return res.status(200).json({ received: true });
};
