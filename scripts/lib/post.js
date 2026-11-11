'use strict'

/**
 * Shared post-creation logic for the blog.
 *
 * Used by scripts/studio.js (the local publishing server behind
 * create-post.html) and scripts/new-post.js (the command line).
 *
 * Creating a post does three things:
 *   1. writes blog/<slug>.html from the same template the older posts use
 *   2. rebuilds the generated indexes (blog/posts.json, js/content.js)
 *   3. stages and commits ONLY the files it wrote
 *
 * Point 3 matters: the repository often has unrelated work in progress, so a
 * publish never runs `git add -A`. It touches exactly the paths it owns.
 */

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const ROOT = path.join(__dirname, '..', '..')
const BLOG_DIR = path.join(ROOT, 'blog')
const SITE = 'https://benjaminhallock.github.io'

/** The only paths a publish is ever allowed to stage. */
const GENERATED_FILES = ['blog/posts.json', 'js/content.js']

/** An error we can show the user as-is, rather than a stack trace. */
class PostError extends Error {
  constructor (message, status = 400) {
    super(message)
    this.name = 'PostError'
    this.status = status
  }
}

/* --- small helpers ------------------------------------------------------- */

/** Today as YYYY-MM-DD in local time (toISOString would use UTC and shift). */
function localDate (date = new Date()) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function slugify (title) {
  return String(title)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

const escapeHtml = value =>
  String(value).replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  )

/** "2026-11-11" -> "November 11, 2026", without a timezone round trip. */
function humanDate (iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Be forgiving about how the body is written. If it already contains HTML we
 * use it verbatim; if it is plain text we treat blank lines as paragraphs.
 */
function normalizeContent (input) {
  const value = String(input || '').trim()
  if (!value) return ''
  if (/<\/?[a-z][^>]*>/i.test(value)) return value
  return value
    .split(/\n{2,}/)
    .map(block => `<p>${escapeHtml(block.trim()).replace(/\n/g, '<br />')}</p>`)
    .join('\n')
}

function normalizeTags (input) {
  const list = Array.isArray(input) ? input : String(input || '').split(',')
  return list.map(t => String(t).trim()).filter(Boolean).slice(0, 12)
}

/* --- the post template --------------------------------------------------- */

/**
 * Renders a post using the same markup as the existing posts in blog/, so the
 * stylesheet, scripts/sync-blog-posts.js and js/doc.js all keep working.
 * Keep this in step with the copy in create-post.html (used for offline
 * downloads when the studio server is not running).
 */
function renderPost ({ title, excerpt, tags, content, date, slug }) {
  const tagsBlock = tags.length
    ? `\n            <span class="blog-tags">\n${tags
        .map(tag => `              <a href="/blog.html">${escapeHtml(tag)}</a>`)
        .join(',\n')}\n            </span>`
    : ''

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} - Benjamin Hallock</title>
    <meta
      name="description"
      content="${escapeHtml(excerpt)}" />
    <link rel="canonical" href="${SITE}/blog/${slug}.html" />
    <link
      rel="icon"
      href="/favicon.ico"
      type="image/x-icon" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,500;1,400&display=swap"
      rel="stylesheet" />
    <link rel="stylesheet" href="/css/site.css" />
  </head>
  <body class="is-document-page">
    <nav class="doc-nav" aria-label="Primary">
      <a class="doc-brand" href="/index.html">Benjamin Hallock</a>
      <ul>
        <li><a href="/index.html">Index</a></li>
        <li><a href="/projects.html">Projects</a></li>
        <li><a href="/photos.html">Photos</a></li>
        <li><a href="/blog.html" aria-current="page">Writing</a></li>
      </ul>
    </nav>

    <main class="doc-main">
      <article class="blog-post-full">
        <header class="blog-header">
          <h1>${escapeHtml(title)}</h1>
          <div class="blog-meta">
            <span class="blog-date">${humanDate(date)}</span>${tagsBlock}
          </div>
        </header>

        <div class="blog-content">
${content}
        </div>

        <div class="blog-footer">
          <div class="blog-author">
            <img
              src="/img/bengi.webp"
              alt="Benjamin Hallock"
              class="author-image" />
            <div class="author-info">
              <h3>Written by Benjamin Hallock</h3>
              <p>
                Web developer and photographer with a passion for clean design and usable
                interfaces.
              </p>
            </div>
          </div>
        </div>
      </article>
    </main>

    <footer class="doc-footer">
      <p>&copy; <span id="currentYear"></span> Benjamin Hallock. All rights reserved.</p>
    </footer>

    <a href="#" class="back-to-top" id="backToTop">↑</a>
    <script src="/js/doc.js"></script>
  </body>
</html>
`
}

/* --- build + git --------------------------------------------------------- */

function run (command, args) {
  return execFileSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function git (args) {
  try {
    return run('git', args)
  } catch (err) {
    const detail = (err.stderr || err.stdout || err.message || '').toString().trim()
    throw new PostError(`git ${args.join(' ')} failed:\n${detail}`, 500)
  }
}

/** Rebuild blog/posts.json and js/content.js from the sources. */
function rebuild () {
  try {
    run(process.execPath, [path.join(ROOT, 'scripts', 'sync-blog-posts.js')])
    run(process.execPath, [path.join(ROOT, 'scripts', 'build-content.js')])
  } catch (err) {
    const detail = (err.stderr || err.stdout || err.message || '').toString().trim()
    throw new PostError(`The build step failed:\n${detail}`, 500)
  }
}

/* --- the public entry point ---------------------------------------------- */

/**
 * @param {object} input
 * @param {string} input.title      required
 * @param {string} input.content    required — HTML, or plain text
 * @param {string} [input.excerpt]  meta description
 * @param {string|string[]} [input.tags]
 * @param {string} [input.date]     YYYY-MM-DD, defaults to today
 * @param {boolean} [input.push]    push to origin after committing
 * @param {boolean} [input.dryRun]  render only, write nothing
 */
function createPost (input = {}) {
  const title = String(input.title || '').trim()
  if (!title) throw new PostError('A title is required.')

  const content = normalizeContent(input.content)
  if (!content) throw new PostError('Post content is required.')

  const excerpt = String(input.excerpt || '').trim()
  const tags = normalizeTags(input.tags)
  const date = /^\d{4}-\d{2}-\d{2}$/.test(input.date || '') ? input.date : localDate()
  const push = Boolean(input.push)

  const slug = slugify(title)
  if (!slug) throw new PostError('That title has no characters usable in a filename.')

  const relative = `blog/${slug}.html`
  const file = path.join(ROOT, relative)

  if (fs.existsSync(file)) {
    throw new PostError(`${relative} already exists. Change the title, or delete the old file.`, 409)
  }

  const html = renderPost({ title, excerpt, tags, content, date, slug })

  if (input.dryRun) {
    return { slug, file: relative, url: `/blog/${slug}.html`, html, dryRun: true }
  }

  fs.writeFileSync(file, html)
  rebuild()

  const staged = [relative, ...GENERATED_FILES.filter(f => fs.existsSync(path.join(ROOT, f)))]
  git(['add', '--', ...staged])
  git(['commit', '-m', `post: ${title}`])
  const commit = git(['rev-parse', '--short', 'HEAD']).trim()

  let pushed = false
  let pushError = null
  if (push) {
    try {
      git(['push'])
      pushed = true
    } catch (err) {
      pushError = err.message
    }
  }

  return {
    slug,
    file: relative,
    url: `/blog/${slug}.html`,
    title,
    date,
    commit,
    staged,
    pushed,
    pushError,
    dryRun: false,
  }
}

module.exports = { createPost, renderPost, slugify, normalizeContent, normalizeTags, localDate, humanDate, PostError, ROOT, BLOG_DIR }
