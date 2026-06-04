const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const sbOpts = { realtime: { transport: WebSocket } };

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: 'Service not configured' });
  }

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, sbOpts);

  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

  // GET /api/tasks — list open tasks for user
  if (req.method === 'GET') {
    const { data, error } = await sb
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'open')
      .order('due_date', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST /api/tasks — create task (internal use / admin)
  if (req.method === 'POST') {
    const { data, error } = await sb
      .from('tasks')
      .insert({ ...req.body, user_id: user.id })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // PATCH /api/tasks/:id — dismiss or complete a task
  if (req.method === 'PATCH') {
    const { id, status } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    if (!['dismissed', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'status must be dismissed or completed' });
    }
    const { data, error } = await sb
      .from('tasks')
      .update({ status })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
