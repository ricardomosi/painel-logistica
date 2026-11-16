import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { handleResolveMapsRequest } from './src/lib/mapsLinkResolverCore.js';

function attachMapsResolverMiddleware(middlewares) {
  middlewares.use('/api/resolve-maps-link', async (req, res, next) => {
    try {
      const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
      if (req.method === 'GET') {
        const result = await handleResolveMapsRequest({
          url: reqUrl.searchParams.get('url') || '',
          reverseGeocode: reqUrl.searchParams.get('reverse') !== '0',
        });
        res.statusCode = result.ok ? 200 : 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(result));
        return;
      }

      if (req.method === 'POST') {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
            const result = await handleResolveMapsRequest(parsed);
            res.statusCode = result.ok ? 200 : 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(result));
          } catch (err) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, error: err?.message || 'Payload inválido' }));
          }
        });
        return;
      }

      next();
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: err?.message || 'Erro no middleware' }));
    }
  });
}

function localMapsResolverPlugin() {
  return {
    name: 'local-maps-resolver-api',
    configureServer(server) {
      attachMapsResolverMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMapsResolverMiddleware(server.middlewares);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localMapsResolverPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
    host: true,
  },
});
