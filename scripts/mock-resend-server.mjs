import http from 'node:http';

const messages = [];
const server = http.createServer((request, response) => {
  if (request.method === 'POST' && request.url === '/emails') {
    const chunks = [];
    request.on('data', chunk => chunks.push(chunk));
    request.on('end', () => {
      messages.push(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ id: `mock-email-${messages.length}` }));
    });
    return;
  }
  if (request.method === 'GET' && request.url === '/messages') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(messages));
    return;
  }
  response.writeHead(404).end();
});

server.listen(Number(process.env.MOCK_RESEND_PORT || 4016), '127.0.0.1', () => console.log('Mock Resend ready'));
