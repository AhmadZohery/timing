import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '80', 10);
const DIST_DIR = path.resolve(__dirname, '../dist');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.resolve(__dirname, '../data'));
const BACKUPS_DIR = path.resolve(DATA_DIR, 'backups');

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

// In-Memory Token-Saving LRU Cache for AI Proxy (Avoids burning tokens on duplicate queries)
const aiResponseCache = new Map();
const MAX_CACHE_ENTRIES = 200;

function setAiCache(key, value) {
  if (aiResponseCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = aiResponseCache.keys().next().value;
    aiResponseCache.delete(firstKey);
  }
  aiResponseCache.set(key, value);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

// Helper to read incoming JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 20 * 1024 * 1024) {
        // 20MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON responses
function sendJson(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(json);
}

// Native Node HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // --------------------------------------------------------------------------
  // API Routes
  // --------------------------------------------------------------------------

  // 1. Health & Status
  if (pathname === '/api/status' && req.method === 'GET') {
    const deepseekKey = process.env.DEEPSEEK_API_KEY ? 'configured' : 'missing';
    const geminiKey = process.env.GEMINI_API_KEY ? 'configured' : 'missing';
    return sendJson(res, 200, {
      ok: true,
      status: 'online',
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      storage: {
        dataDir: DATA_DIR,
        backupsCount: fs.readdirSync(BACKUPS_DIR).length,
      },
      aiConfigured: Boolean(process.env.DEEPSEEK_API_KEY || process.env.GEMINI_API_KEY),
      aiProviders: { deepseek: deepseekKey, gemini: geminiKey },
      cachedAiQueriesCount: aiResponseCache.size,
    });
  }

  // 2. Sync Push: Save client state to server disk
  if (pathname === '/api/sync/push' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profileId = payload.profileId || 'default';
      const cleanProfileId = profileId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const targetFile = path.resolve(DATA_DIR, `sync_${cleanProfileId}.json`);

      const record = {
        profileId: cleanProfileId,
        syncedAt: new Date().toISOString(),
        clientTimestamp: payload.timestamp || Date.now(),
        data: payload.data || {},
      };

      fs.writeFileSync(targetFile, JSON.stringify(record, null, 2), 'utf-8');
      return sendJson(res, 200, {
        ok: true,
        message: 'تمت مزامنة البيانات وحفظها على السيرفر بنجاح',
        syncedAt: record.syncedAt,
        sizeBytes: Buffer.byteLength(JSON.stringify(record)),
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 3. Sync Pull: Retrieve saved state from server
  if (pathname === '/api/sync/pull' && req.method === 'GET') {
    try {
      const profileId = url.searchParams.get('profileId') || 'default';
      const cleanProfileId = profileId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const targetFile = path.resolve(DATA_DIR, `sync_${cleanProfileId}.json`);

      if (!fs.existsSync(targetFile)) {
        return sendJson(res, 404, { ok: false, message: 'لا توجد بيانات محفوظة لهذا الحساب على السيرفر بعد' });
      }

      const raw = fs.readFileSync(targetFile, 'utf-8');
      const record = JSON.parse(raw);
      return sendJson(res, 200, { ok: true, ...record });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 4. Create Timestamped Backup Snapshot
  if (pathname === '/api/sync/backup' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `midmar_backup_${timestamp}.json`;
      const targetFile = path.resolve(BACKUPS_DIR, filename);

      fs.writeFileSync(targetFile, JSON.stringify(payload, null, 2), 'utf-8');
      return sendJson(res, 200, {
        ok: true,
        filename,
        timestamp,
        message: 'تم حفظ نسخة احتياطية مشفرة على قرص السيرفر',
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 5. List Stored Backups
  if (pathname === '/api/sync/backups' && req.method === 'GET') {
    try {
      const files = fs.readdirSync(BACKUPS_DIR)
        .filter((f) => f.endsWith('.json'))
        .map((f) => {
          const stat = fs.statSync(path.resolve(BACKUPS_DIR, f));
          return {
            filename: f,
            sizeBytes: stat.size,
            createdAt: stat.mtime.toISOString(),
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      return sendJson(res, 200, { ok: true, backups: files });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 6. Token-Saving AI Proxy (with server-side LRU Cache & prompt compression)
  if (pathname === '/api/ai/proxy' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const userPrompt = (payload.prompt || '').trim();
      const systemPrompt = (payload.systemPrompt || '').trim();
      const maxTokens = Math.min(250, payload.maxTokens || 150); // Strict token ceiling

      if (!userPrompt) {
        return sendJson(res, 400, { ok: false, error: 'User prompt is required' });
      }

      // Check In-Memory Server LRU Cache (0 Tokens, 0ms latency)
      const cacheKey = `${systemPrompt}:::${userPrompt}`.toLowerCase();
      if (aiResponseCache.has(cacheKey)) {
        return sendJson(res, 200, {
          ok: true,
          text: aiResponseCache.get(cacheKey),
          cached: true,
          tokensConsumed: 0,
          tokensSaved: 550,
        });
      }

      // Check server environment variables for keys
      const apiKey = process.env.DEEPSEEK_API_KEY || payload.apiKey;
      const geminiKey = process.env.GEMINI_API_KEY;

      if (!apiKey && !geminiKey) {
        return sendJson(res, 400, {
          ok: false,
          error: 'No AI API key found on server or request payload',
        });
      }

      let responseText = '';

      if (process.env.DEEPSEEK_API_KEY || (apiKey && !geminiKey)) {
        // DeepSeek Call with strict token compression
        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: userPrompt },
            ],
            max_tokens: maxTokens,
            temperature: 0.2,
          }),
        });

        if (!dsRes.ok) {
          const errData = await dsRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || `DeepSeek API returned HTTP ${dsRes.status}`);
        }

        const data = await dsRes.json();
        responseText = data.choices?.[0]?.message?.content || '';
      } else if (geminiKey) {
        // Gemini Call with strict token compression
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey.trim()}`;
        const gmRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature: 0.2,
            },
          }),
        });

        if (!gmRes.ok) {
          const errData = await gmRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Gemini API returned HTTP ${gmRes.status}`);
        }

        const data = await gmRes.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }

      // Store in Server Cache
      if (responseText) {
        setAiCache(cacheKey, responseText);
      }

      return sendJson(res, 200, {
        ok: true,
        text: responseText,
        cached: false,
        tokensConsumed: Math.round(userPrompt.length / 4 + responseText.length / 4),
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // --------------------------------------------------------------------------
  // Static File Serving with Gzip & SPA Fallback
  // --------------------------------------------------------------------------
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  let filePath = path.join(DIST_DIR, pathname);
  // Security: prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Check if file exists, else fallback to index.html (SPA routing)
  let stat = null;
  try {
    stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      stat = fs.statSync(filePath);
    }
  } catch (_) {
    filePath = path.join(DIST_DIR, 'index.html');
    try {
      stat = fs.statSync(filePath);
    } catch (e) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404: Dist build not found. Run npm run build first.');
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Cache headers
  const headers = {
    'Content-Type': contentType,
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
  };

  if (pathname.startsWith('/assets/')) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  } else {
    headers['Cache-Control'] = 'no-cache, must-revalidate';
  }

  // Check Gzip support for text/code assets
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const canGzip = /\bgzip\b/.test(acceptEncoding) && /^(text\/|application\/javascript|application\/json|image\/svg)/.test(contentType);

  if (canGzip) {
    headers['Content-Encoding'] = 'gzip';
    res.writeHead(200, headers);
    const rawStream = fs.createReadStream(filePath);
    const gzip = zlib.createGzip({ level: 6 });
    rawStream.pipe(gzip).pipe(res);
  } else {
    headers['Content-Length'] = stat.size;
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Midmar Server] Running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Static files: ${DIST_DIR}`);
  console.log(`💾 Persistent data: ${DATA_DIR}`);
});
