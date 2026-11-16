import { handleResolveMapsRequest } from '../src/lib/mapsLinkResolverCore.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const rawUrl = req.query?.url || '';
      const result = await handleResolveMapsRequest({ url: rawUrl, reverseGeocode: true });
      res.statusCode = result.ok ? 200 : 400;
      res.end(JSON.stringify(result));
      return;
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body || '{}');
      }
      const { url, urls, reverseGeocode = true } = body || {};
      const result = await handleResolveMapsRequest({ url, urls, reverseGeocode });
      res.statusCode = result.ok ? 200 : 400;
      res.end(JSON.stringify(result));
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: err?.message || 'Erro interno no resolvedor.' }));
  }
}
