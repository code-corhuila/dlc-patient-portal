import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const MIME = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.ico': 'image/x-icon' };

function assetPath(root, url) {
  const path = decodeURIComponent(url.split('?')[0]);
  if (/%2f|%5c/i.test(url) || path.includes('\\') || path.includes('\0')) return null;
  const parts = path.split('/');
  if (parts.some(part => part === '.' || part === '..')) return null;
  if (!/^\/portals\/patient\/[A-Za-z0-9._-]+\/.+/.test(path)) return null;
  const file = resolve(root, '.' + path);
  return file.startsWith(root + sep) ? file : null;
}

export function createDemoServer(directory) {
  const root = resolve(directory);
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
    }
    try {
      const file = assetPath(root, request.url);
      if (!file) { response.writeHead(404); response.end('Not found'); return; }
      const content = await readFile(file);
      response.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      response.writeHead(['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code) || error instanceof URIError ? 404 : 500);
      response.end('Asset unavailable');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PATIENT_DEMO_PORT ?? 4178);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('INVALID_PORT');
  const server = createDemoServer('dist/demo');
  server.listen(port, '127.0.0.1', () => console.log(`Patient assets: http://127.0.0.1:${port}/portals/patient/`));
  for (const event of ['SIGINT', 'SIGTERM']) process.once(event, () => {
    server.close(); server.closeAllConnections();
  });
}
