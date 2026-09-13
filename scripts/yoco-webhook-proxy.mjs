// Local development only: expose this port through a tunnel, never the full API.
import http from 'node:http';

const port = Number(process.env.YOCO_PROXY_PORT || 4012);
const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/api/webhooks/yoco') {
    res.writeHead(404).end(); req.resume(); return;
  }
  if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json'
    || req.headers['content-encoding']) {
    res.writeHead(415).end(); req.resume(); return;
  }
  let size = 0;
  const chunks = [];
  req.on('data', chunk => {
    size += chunk.length;
    if (size > 65536) { if (!res.headersSent) res.writeHead(413).end(); }
    else chunks.push(chunk);
  });
  req.on('end', () => {
    if (res.writableEnded) return;
    const body = Buffer.concat(chunks);
    const headers = { 'content-type': 'application/json', 'content-length': body.length };
    for (const name of ['webhook-id', 'webhook-timestamp', 'webhook-signature']) {
      if (typeof req.headers[name] !== 'string' || !req.headers[name]) { res.writeHead(401).end(); return; }
      headers[name] = req.headers[name];
    }
    const upstream = http.request({ hostname: '127.0.0.1', port: 4001,
      path: '/api/webhooks/yoco', method: 'POST', headers, timeout: 15000 }, response => {
      // Relay only the outcome, never API response bodies or headers.
      response.resume();
      res.writeHead(response.statusCode || 502).end();
    });
    upstream.on('timeout', () => upstream.destroy());
    upstream.on('error', () => { if (!res.headersSent) res.writeHead(502).end(); });
    upstream.end(body);
  });
  req.on('error', () => { if (!res.headersSent) res.writeHead(400).end(); });
});
server.requestTimeout = 20000;
server.headersTimeout = 10000;
server.listen(port, '127.0.0.1', () => console.log(`Yoco webhook-only proxy listening on 127.0.0.1:${port}`));
