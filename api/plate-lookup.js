export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Metodo nao permitido.' });
    return;
  }

  const plate = String(req.query?.placa || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
  const token = String(req.query?.token || process.env.CAMPS_API_TOKEN || '').trim();

  if (plate.length < 7) {
    res.status(400).json({ message: 'Placa invalida.' });
    return;
  }

  if (!token) {
    res.status(400).json({ message: 'Token nao informado.' });
    return;
  }

  const upstreamUrl = `https://wdapi2.com.br/consulta/${encodeURIComponent(plate)}/${encodeURIComponent(token)}`;

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const responseText = await upstreamResponse.text();

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(upstreamResponse.status).send(responseText);
  } catch {
    res.status(502).json({ message: 'Falha ao consultar API de placas.' });
  }
}
