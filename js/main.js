// Common JavaScript functionality for all pages

// Hamburger menu functionality
const hamburger = document.querySelector('.hamburger')
const navMenu = document.querySelector('nav ul')

if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active')
    navMenu.classList.toggle('active')
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : ''
  })

  // Close menu when clicking a link
  document.querySelectorAll('nav a').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active')
      navMenu.classList.remove('active')
      document.body.style.overflow = ''
    })
  })
}

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
backToTopButton.addEventListener('click', (e) => {
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
      message
    )}`
    window.open(mailtoLink, '_blank').focus()

    // Reset form
    contactForm.reset()
  })
}

// Interactive Modal
const modalTriggers = document.querySelectorAll('[data-modal-trigger]')
if (modalTriggers.length > 0) {
  modalTriggers.forEach((trigger) => {
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
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('visible')
            document.body.style.overflow = ''
          }
        })
      }
    })
  })
}
