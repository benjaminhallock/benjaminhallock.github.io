# benjaminhallock.github.io

Personal site: a numbered index of projects, writing and photography, served by GitHub Pages.

## How it works

The home page is a profile-style index. The left rail lists every post by title, with its
number as a quiet prefix (`01`–`21`); selecting one scrolls that post into view with a
quick snap. The rail can be hidden to see the photography full-bleed, and filtered by type
(Projects / Writing / Photos) — numbers renumber per filter, so Photos starts at `01`.

All content comes from one generated manifest, `js/content.js`, which is built from:

| Source                  | What it holds                          |
| ----------------------- | -------------------------------------- |
| `content/projects.json` | project entries (hand written)         |
| `content/photos.json`   | photo list (hand written)              |
| `blog/posts.json`       | blog metadata (generated from the HTML)|

Numbering is assigned at build time, so the rail can never drift from the content.

## Commands

```bash
npm install          # once — installs cheerio
npm run sync         # rebuild blog/posts.json from blog/*.html
npm run content      # rebuild js/content.js from the three sources
npm run build        # both of the above
npm run serve        # local preview at http://localhost:4000
```

`npm run serve` is needed for the blog archive page, which fetches `posts.json`.
The home page itself works from `file://` too.

## Adding content

- **A post** — drop an HTML file in `blog/` (or use `create-post.html`), then `npm run build`.
- **A project** — add an entry to `content/projects.json`, then `npm run content`.
- **A photo** — add the WebP to `img/` and an entry to `content/photos.json`, then `npm run content`.

## Files

```
index.html            the numbered profile index
css/site.css          one stylesheet, all tokens
js/site.js            rail, filters, keyboard/wheel navigation, snap scroller
js/doc.js             small behaviours for the standalone pages
js/content.js         GENERATED — do not edit by hand
content/              hand-written project and photo data
blog/                 posts (HTML) + posts.json (generated)
img/                  WebP images
scripts/              build-content.js, sync-blog-posts.js
```

## Notes

- Images are WebP, resized to a 1800px maximum. Keep new uploads in that range.
- Motion respects `prefers-reduced-motion`.
- Keyboard: `↑`/`↓` or `j`/`k` to move, `1`–`9` to jump, `[` to toggle the rail.
