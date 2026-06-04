# GitHub Copilot Instructions

## Project Overview

Personal portfolio website (GitHub Pages) featuring a blog, photo gallery, and project showcase. Static HTML/CSS/JS stack with a Node.js build tool for blog post synchronization.

## Architecture & Key Patterns

### Blog System (Core Feature)

- **Data Source**: HTML files in `blog/` directory + `blog/posts.json` (generated metadata index)
- **Sync Workflow**: `npm run sync` → `scripts/sync-blog-posts.js` parses each HTML file using `cheerio` to extract:
  - Title from `<title>` tag (before " - ")
  - Date from `.blog-date` element, normalized to `YYYY-MM-DD`
  - Excerpt from `<meta name="description">`
  - Tags from `.blog-tags a` links
- **Runtime**: `js/blog.js` fetches `posts.json`, sorts by date (newest first), renders cards to `#blog-posts-container`
- **Important**: Always update `blog/posts.json` by running `npm run sync` after adding/modifying blog posts—don't edit JSON manually

### Page Structure & CSS

- **CSS Layers**: `normalize.css` → `main.css` → `style.css` (cascading overrides)
- **Design System**: CSS custom properties in `:root` for colors, typography, spacing (`--accent: #0b72ff`, `--text-primary: #111827`)
- **Navigation**: Consistent `<nav><ul>` on all pages; mark current page with `class="active"`

### JavaScript Conventions

- **Global Functions**: Avoid module syntax—functions like `showFullScreenImage()` attached to `window` for HTML inline handlers
- **Common Features** (`js/main.js`):
  - Current year in footer via `#currentYear` element
  - Back-to-top button with scroll threshold (300px)
  - Full-screen photo viewer with ESC key support
- **Blog Module** (`js/blog.js`): Async fetch pattern, DOM rendering via template literals, date formatting utility

## Developer Workflows

### Adding/Updating Blog Posts

1. Create or edit HTML file in `blog/` directory
2. Ensure HTML includes: `<title>Post Title - Benjamin Hallock</title>`, `<meta name="description" content="...">`, `.blog-date` element, `.blog-tags a` tags
3. Run `npm run sync` to regenerate `blog/posts.json`
4. Verify changes on `blog.html` page

### Dependencies

- **Runtime**: None (pure browser—no frameworks)
- **Dev Tools**: `cheerio` (HTML parsing), `parcel-bundler` (unused currently but available)
- **Install**: `npm install` (minimal setup)

## File Organization

- `*.html` pages: All pages follow consistent structure (meta tags, nav, CSS imports, deferred scripts)
- `css/`: `normalize.css` (browser defaults), `main.css` (base), `style.css` (project-specific design)
- `js/`: `plugins.js` (vendor utilities), `main.js` (global), `blog.js` (blog-specific)
- `scripts/`: Node build tools (currently only `sync-blog-posts.js`)

## Important Quirks & Gotchas

- **Blog Metadata Required**: If blog HTML is missing `.blog-date`, sync script uses today's date as fallback—set explicit dates
- **Static Site Limitation**: No server-side rendering; all dynamic content via client-side JS and JSON
- **Images**: Gallery uses simple grid + lightbox overlay; images in `img/` directory
- **Mobile First**: Responsive design via CSS; no JavaScript breakpoints—use CSS media queries

## When Modifying

- **CSS Changes**: Add to `css/style.css`, not inline styles (except critical cases)
- **New Features**: Attach to `window` if interactive; export as deferred script in HTML
- **Blog Posts**: Follow existing HTML structure; ensure metadata elements present before syncing
