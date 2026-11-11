/* ==========================================================================
   doc.js — small behaviours for the standalone document pages
   (blog posts, blog archive, projects, photos, 404)
   No animation library, no layout rewriting.
   ========================================================================== */
(function () {
  'use strict'

  const year = document.getElementById('currentYear')
  if (year) year.textContent = new Date().getFullYear()

  /* back to top ---------------------------------------------------------- */
  const toTop = document.getElementById('backToTop')
  if (toTop) {
    const onScroll = () => {
      toTop.classList.toggle('is-visible', window.scrollY > 400)
      toTop.classList.toggle('visible', window.scrollY > 400) // legacy alias
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    toTop.addEventListener('click', e => {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
    onScroll()
  }

  /* full screen photo viewer --------------------------------------------- */
  const viewer = document.getElementById('fullScreenImage')
  if (viewer) {
    const viewerImg = viewer.querySelector('img')
    const close = () => {
      viewer.classList.remove('is-open')
      viewer.style.display = 'none'
      document.body.style.overflow = ''
    }

    window.showFullScreenImage = el => {
      const img = el.querySelector('img')
      if (!img || !viewerImg) return
      viewerImg.src = img.currentSrc || img.src
      viewer.classList.add('is-open')
      viewer.style.display = 'flex'
      document.body.style.overflow = 'hidden'
    }

    viewer.addEventListener('click', close)
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close()
    })
  }

  /* contact form (if present) -------------------------------------------- */
  const form = document.getElementById('contactForm')
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault()
      const name = (document.getElementById('name') || {}).value || ''
      const message = (document.getElementById('message') || {}).value || ''
      if (!name || !message) {
        alert('Please fill in all fields.')
        return
      }
      if (message.length < 10) {
        alert('Message must be at least 10 characters long.')
        return
      }
      const link = `mailto:benjaminhallock@gmail.com?subject=${encodeURIComponent(
        `Contact form — ${name}`,
      )}&body=${encodeURIComponent(message)}`
      window.open(link, '_blank')
      form.reset()
    })
  }

  /* blog archive listing -------------------------------------------------- */
  const list = document.getElementById('blog-posts-container')
  if (list) {
    fetch('/blog/posts.json')
      .then(r => (r.ok ? r.json() : []))
      .then(posts => {
        if (!posts.length) {
          list.innerHTML = '<p class="empty">No posts yet.</p>'
          return
        }
        posts.sort((a, b) => new Date(b.date) - new Date(a.date))
        return Promise.all(posts.map(async post => {
          const response = await fetch(post.url)
          if (!response.ok) throw new Error(`Could not load ${post.url}`)
          const html = await response.text()
          const document = new DOMParser().parseFromString(html, 'text/html')
          const content = document.querySelector('.blog-content')
          if (!content) throw new Error(`No article body in ${post.url}`)
          return { post, content: content.innerHTML }
        }))
      })
      .then(entries => {
        list.innerHTML = entries
          .map(({ post, content }) => `<article class="blog-post-card">
            <div class="blog-post-date">${fmt(post.date)}</div>
            <h2><a href="${post.url}">${post.title}</a></h2>
            <div class="blog-content">${content}</div>
            <a class="read-more" href="${post.url}">Open standalone article →</a>
          </article>`)
          .join('')
      })
      .catch(() => {
        list.innerHTML = '<p class="empty">Could not load posts.</p>'
      })
  }

  function fmt(value) {
    // A bare YYYY-MM-DD is read as UTC midnight, which renders as the day
    // before anywhere west of UTC. Pin it to midday local time instead.
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value
    const d = new Date(iso)
    return Number.isNaN(d.getTime())
      ? value
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }
})()
