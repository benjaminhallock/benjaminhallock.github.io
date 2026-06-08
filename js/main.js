// Common JavaScript functionality for all pages

// Set current year in footer
document.getElementById('currentYear').textContent = new Date().getFullYear()

// Back to top button functionality
const backToTopButton = document.getElementById('backToTop')

// Show button when scrolling down
window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTopButton.classList.add('visible')
  } else {
    backToTopButton.classList.remove('visible')
  }
})

// Scroll to top when button is clicked
backToTopButton.addEventListener('click', e => {
  e.preventDefault()
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
})

// Full screen image functionality for photo gallery
const fullScreenImage = document.getElementById('fullScreenImage')
if (fullScreenImage) {
  const fullScreenImageImg = fullScreenImage.querySelector('img')

  // Function to show full screen image
  window.showFullScreenImage = function (imgPreview) {
    fullScreenImageImg.src = imgPreview.querySelector('img').src
    fullScreenImage.style.display = 'flex'
    document.body.style.overflow = 'hidden' // Prevent scrolling when viewing images
  }

  // Close full screen image when clicked
  fullScreenImage.addEventListener('click', function () {
    fullScreenImage.style.display = 'none'
    document.body.style.overflow = '' // Restore scrolling
  })

  // Close full screen image when ESC key is pressed
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && fullScreenImage.style.display === 'flex') {
      fullScreenImage.style.display = 'none'
      document.body.style.overflow = ''
    }
  })
}

// Handle contact form submission
const contactForm = document.getElementById('contactForm')
if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault()

    // Get form values
    const name = document.getElementById('name').value
    const email = 'benjaminhallock@gmail.com' // Hardcoded email for testing
    const message = document.getElementById('message').value

    // Validate form values (basic validation)
    if (!name || !message) {
      alert('Please fill in all fields.')
      return
    }
    if (message.length < 10) {
      alert('Message must be at least 10 characters long.')
      return
    }
    // Open email client and populate fields
    const mailtoLink = `mailto:${email}?subject=Contact Form Submission from ${name}&body=${encodeURIComponent(
      message,
    )}`
    window.open(mailtoLink, '_blank').focus()

    // Reset form
    contactForm.reset()
  })
}

// Animated Skill Bars
const skillBars = document.querySelectorAll('.skill-bar-progress')
if (skillBars.length > 0) {
  // Function to check if element is in viewport
  function isInViewport(element) {
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }

  // Function to animate skill bars when visible
  function animateSkillBars() {
    skillBars.forEach(bar => {
      if (isInViewport(bar) && !bar.classList.contains('animated')) {
        const percentage = bar.getAttribute('data-width')
        bar.style.width = percentage
        bar.classList.add('animated')
      }
    })
  }

  // Check on scroll and initial page load
  window.addEventListener('scroll', animateSkillBars)
  animateSkillBars() // Initial check
}

// Interactive Modal
const modalTriggers = document.querySelectorAll('[data-modal-trigger]')
if (modalTriggers.length > 0) {
  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const modalId = trigger.getAttribute('data-modal-trigger')
      const modal = document.getElementById(modalId)

      if (modal) {
        modal.classList.add('visible')
        document.body.style.overflow = 'hidden'

        // Close button functionality
        const closeBtn = modal.querySelector('.modal-close')
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            modal.classList.remove('visible')
            document.body.style.overflow = ''
          })
        }

        // Close on outside click
        modal.addEventListener('click', e => {
          if (e.target === modal) {
            modal.classList.remove('visible')
            document.body.style.overflow = ''
          }
        })
      }
    })
  })
}

// GSAP Animations
if (typeof gsap !== 'undefined') {
  // Register ScrollTrigger if available
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger)

    // Deep parallax effect for the homepage background
    const parallaxBg = document.querySelector('.parallax-bg')
    if (parallaxBg) {
      gsap.to(parallaxBg, {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: '.parallax-wrapper',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
    }

    // Smooth fade-in cards strictly as they scroll into view
    const cards = document.querySelectorAll('.glass-panel')
    if (cards.length > 0) {
      cards.forEach(card => {
        gsap.from(card, {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: 'sine.out',
          scrollTrigger:
            typeof ScrollTrigger !== 'undefined'
              ? {
                  trigger: card,
                  start: 'top 85%',
                  toggleActions: 'play none none reverse',
                }
              : null,
          delay: typeof ScrollTrigger !== 'undefined' ? 0 : 0.3,
        })
      })
    }
  }
}

// --- Slideshow Logic ---
function initSlideshow() {
  const slideshowContainer = document.getElementById('bg-slideshow')
  if (!slideshowContainer) return

  const totalImages = 15
  let currentIdx = 1
  const slide1 = slideshowContainer.querySelector('#slide-1')
  const slide2 = slideshowContainer.querySelector('#slide-2')

  // Ensure both slides exist before starting
  if (!slide1 || !slide2) {
    console.error('Slideshow container is missing #slide-1 or #slide-2 elements.')
    return
  }

  setInterval(() => {
    currentIdx = (currentIdx % totalImages) + 1
    const newImgUrl = `url('img/${currentIdx}.jpeg')`

    if (slide1 && slide2 && slide1.classList.contains('active')) {
      slide2.style.backgroundImage = newImgUrl
      slide2.classList.add('active')
      slide1.classList.remove('active')
    } else if (slide1 && slide2) {
      slide1.style.backgroundImage = newImgUrl
      slide1.classList.add('active')
      slide2.classList.remove('active')
    }
  }, 6000) // Crossfade every 6 seconds
}

// Initialize slideshow on pages that have it from the start (like index.html)
if (document.getElementById('bg-slideshow')) {
  initSlideshow()
}

// Sidebar Active Link Highlighting on Scroll
const sections = document.querySelectorAll('section.content-section')
const navLinks = document.querySelectorAll('.sidebar ul li a')
if (sections.length > 0 && navLinks.length > 0) {
  window.addEventListener('scroll', () => {
    let current = ''
    sections.forEach(section => {
      const sectionTop = section.offsetTop
      const sectionHeight = section.clientHeight
      if (scrollY >= sectionTop - sectionHeight / 3) {
        current = section.getAttribute('id')
      }
    })

    navLinks.forEach(link => {
      link.parentElement.classList.remove('active')
      if (link.getAttribute('href').includes(current)) {
        link.parentElement.classList.add('active')
      }
    })
  })
}

// --- Dynamic styling for individual blog posts in /blog/ ---
const currentPath = window.location.pathname
if (currentPath.includes('/blog/') && !currentPath.endsWith('blog.html')) {
  document.body.classList.add('blog-post-view')

  // 1. Rewrite Navbar to Sidebar with just Home & Back to Blog
  const nav = document.querySelector('nav')
  if (nav) {
    nav.className = 'sidebar'
    nav.innerHTML = `
      <div class="sidebar-header">
        <h2>Bengi</h2>
      </div>
      <ul>
        <li><a href="/index.html">Home</a></li>
        <li><a href="/index.html#blog">Back to Blog</a></li>
      </ul>
    `
  }

  // 2. Setup Background Slideshow
  if (!document.getElementById('bg-slideshow')) {
    const bg = document.createElement('div')
    bg.id = 'bg-slideshow'
    bg.innerHTML = `
      <div class="earthy-overlay"></div>
      <div id="slide-1" class="slide active" style="background-image: url('/img/15.jpeg')"></div>
      <div id="slide-2" class="slide"></div>
    `
    document.body.prepend(bg)
    // Now that the element is in the DOM, initialize the slideshow for it
    initSlideshow()
  }

  // 3. Wrap main content into a glass panel
  const main = document.querySelector('main')
  if (main) {
    main.className = 'main-content single-page-layout'
    const wrapper = document.createElement('section')
    wrapper.className = 'content-section'
    const glassPanel = document.createElement('article')
    glassPanel.className = 'glass-panel post-glass-panel'
    while (main.firstChild) {
      glassPanel.appendChild(main.firstChild)
    }
    wrapper.appendChild(glassPanel)
    main.appendChild(wrapper)
  }
}
