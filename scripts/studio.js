#!/usr/bin/env node
'use strict'

/**
 * The blog studio — a tiny local server.
 *
 *   npm run studio
 *
 * It does two jobs:
 *   1. serves the site from the repository root, so every absolute path
 *      (/css/site.css, /blog/posts.json, /js/doc.js) resolves the way it does
 *      on GitHub Pages
 *   2. accepts POST /api/posts, which writes blog/<slug>.html, rebuilds the
 *      indexes, and commits (and optionally pushes) — see scripts/lib/post.js
 *
 * It listens on loopback only. There is no authentication because there is no
 * network exposure: nothing outside this machine can reach it. It is a
 * development tool, not something to deploy.
 */

const http = require('http')
const fs = require('fs')
const path = require('path')
const { createPost, PostError, ROOT } = require('./lib/post')

const HOST = process.env.HOST || '127.0.0.1'
const PORT = Number(process.env.PORT || 4000)
const BODY_LIMIT = 2 * 1024 * 1024 // 2 MB of post content is plenty

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

/* --- helpers ------------------------------------------------------------- */

function sendJson (res, status, payload) {
  const body = JSON.stringify(payload, null, 2)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function readBody (req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', chunk => {
      size += chunk.length
      if (size > BODY_LIMIT) {
        reject(new PostError('That post is too large (2 MB limit).', 413))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function isLocalHost (req) {
  const host = String(req.headers.host || '').split(':')[0]
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1'
}

/* --- static files -------------------------------------------------------- */

function serveStatic (req, res) {
  let pathname
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  } catch {
    res.writeHead(400).end('Bad request')
    return
  }

  // The studio page gets a friendlier URL.
  if (pathname === '/studio' || pathname === '/studio/') pathname = '/create-post.html'
  if (pathname.endsWith('/')) pathname += 'index.html'

  const filePath = path.normalize(path.join(ROOT, pathname))

  // Never serve anything outside the repository, and keep internals private.
  const inside = filePath === ROOT || filePath.startsWith(ROOT + path.sep)
  const blocked = pathname.split('/').some(part => part === '.git' || part === 'node_modules')
  if (!inside || blocked) {
    res.writeHead(403).end('Forbidden')
    return
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Not found')
      return
    }

    const target = stats.isDirectory() ? path.join(filePath, 'index.html') : filePath

    fs.readFile(target, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Not found')
        return
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream',
        'Content-Length': data.length,
        'Cache-Control': 'no-store',
      })
      res.end(data)
    })
  })
}

/* --- the server ---------------------------------------------------------- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')

  if (!url.pathname.startsWith('/api/')) {
    serveStatic(req, res)
    return
  }

  // Defensive: a browser on another origin should not be able to reach this.
  if (!isLocalHost(req)) {
    sendJson(res, 403, { error: 'The studio only answers requests from localhost.' })
    return
  }

  if (url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true, root: ROOT, studio: true })
    return
  }

  if (url.pathname !== '/api/posts') {
    sendJson(res, 404, { error: `No such endpoint: ${url.pathname}` })
    return
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    sendJson(res, 405, { error: 'Use POST to create a post.' })
    return
  }

  let payload
  try {
    const raw = await readBody(req)
    payload = raw ? JSON.parse(raw) : {}
  } catch (err) {
    const status = err instanceof PostError ? err.status : 400
    sendJson(res, status, { error: err instanceof PostError ? err.message : 'Malformed JSON body.' })
    return
  }

  try {
    const result = createPost(payload)
    console.log(`  ✓ ${result.file}  →  commit ${result.commit}${result.pushed ? ' (pushed)' : ''}`)
    sendJson(res, 201, result)
  } catch (err) {
    const status = err instanceof PostError ? err.status : 500
    console.error(`  ✗ ${err.message}`)
    sendJson(res, status, { error: err.message })
  }
})

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already in use.`)
    console.error(`  Either a studio is already running, or try: PORT=4001 npm run studio\n`)
  } else {
    console.error(`\n  Studio failed to start: ${err.message}\n`)
  }
  process.exit(1)
})

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}/studio`
  console.log(`
  ┌──────────────────────────────────────────────┐
  │  blog studio                                 │
  └──────────────────────────────────────────────┘

  Serving   ${ROOT}
  Open      ${url}

  Write a post, hit Publish, and it will be written to blog/,
  rebuilt into the indexes, and committed. Stop with Ctrl+C.
`)

  if (process.env.STUDIO_NO_OPEN !== '1') {
    const opener = process.platform === 'darwin' ? 'open' : 'xdg-open'
    try {
      require('child_process').spawn(opener, [url], { detached: true, stdio: 'ignore' }).unref()
    } catch {
      /* opening a browser is a nicety, never a failure */
    }
  }
})
