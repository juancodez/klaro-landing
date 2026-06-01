module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileData, fileType } = req.body;
  if (!fileData || !fileType) return res.status(400).json({ error: 'Missing file data' });

  const isImage = fileType.startsWith('image/');
  const isPDF   = fileType === 'application/pdf';
  if (!isImage && !isPDF) return res.status(400).json({ error: 'Tipo de archivo no soportado' });

  // Build the message content block for Anthropic
  const fileBlock = isImage
    ? { type: 'image',    source: { type: 'base64', media_type: fileType, data: fileData } }
    : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileData } };

  const prompt = `Analiza este recibo o factura y extrae la información relevante.
Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin texto extra, sin bloques de código):

{"description":"descripción corta del gasto","amount":12.50,"category":"software"}

Reglas:
- description: nombre del producto/servicio, máximo 60 caracteres, en español
- amount: número decimal con el importe total en euros (sin símbolo €)
- category: una de estas opciones exactas según el tipo de gasto:
    "software"      → apps, suscripciones digitales, hosting, SaaS
    "home"          → oficina en casa, suministros, alquiler proporcional
    "equipamiento"  → hardware, dispositivos, mobiliario de trabajo
    "transporte"    → viajes, tren, vuelos, taxi, combustible
    "formacion"     → cursos, libros, conferencias, certificaciones
    "otros"         → cualquier otro gasto profesional

Si no puedes leer algún valor usa: description="Gasto profesional", amount=0, category="otros"
Responde SOLO el JSON.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 256,
        messages: [{ role: 'user', content: [fileBlock, { type: 'text', text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(500).json({ error: 'Error en la IA' });
    }

    const data   = await response.json();
    const text   = data.content?.[0]?.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    return res.json({
      description: String(parsed.description || '').slice(0, 100),
      amount:      parseFloat(parsed.amount)  || 0,
      category:    ['software','home','equipamiento','transporte','formacion','otros'].includes(parsed.category)
                     ? parsed.category : 'otros',
    });
  } catch (e) {
    console.error('analyze-receipt error:', e);
    return res.status(500).json({ error: 'No se pudo analizar el archivo' });
  }
};
