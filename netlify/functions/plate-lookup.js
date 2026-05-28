exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ message: 'Metodo nao permitido.' }),
    };
  }

  const query = event.queryStringParameters || {};
  const plate = String(query.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
  const token = String(query.token || process.env.CAMPS_API_TOKEN || '').trim();

  if (plate.length < 7) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ message: 'Placa invalida.' }),
    };
  }

  if (!token) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ message: 'Token nao informado.' }),
    };
  }

  const upstreamUrl = `https://wdapi2.com.br/consulta/${encodeURIComponent(plate)}/${encodeURIComponent(token)}`;

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const bodyText = await upstreamResponse.text();

    return {
      statusCode: upstreamResponse.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
      body: bodyText,
    };
  } catch {
    return {
      statusCode: 502,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ message: 'Falha ao consultar API de placas.' }),
    };
  }
};
