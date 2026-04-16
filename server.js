const http = require('http');
const fs = require('fs');
const path = require('path');

const NOTION_KEY = process.env.NOTION_KEY || '';
const PORT = 3030;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Serve index.html
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // POST /api/leave → Notion
  if (req.method === 'POST' && req.url === '/api/leave') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { default: fetch } = await import('node-fetch').catch(() => ({ default: globalThis.fetch }));

        const notionRes = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NOTION_KEY}`,
            'Notion-Version': '2025-09-03',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await notionRes.json();
        res.writeHead(notionRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`✅ Leave app running at http://localhost:${PORT}`);
  console.log(`   Local network: http://192.168.0.8:${PORT}`);
});
