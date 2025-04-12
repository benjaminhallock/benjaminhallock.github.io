const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

// Read the index.html file to get the template header and footer
const indexPath = path.join(__dirname, '..', 'index.html')
const indexContent = fs.readFileSync(indexPath, 'utf8')
const $index = cheerio.load(indexContent)

// Extract header (nav) and footer
const templateNav = $index('nav').toString()
const templateFooter = $index('footer').toString()
const templateBackToTop = $index('.back-to-top').toString()
const templateScripts = $index('script[src="/js/main.js"]').toString()

// Function to process HTML files
function processHtmlFile(filePath) {
  const fileName = path.basename(filePath)

  // Skip index.html since it's our source template
  if (fileName === 'index.html') {
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const $ = cheerio.load(content)

  // Get the nav from the template but modify it to set the active class
  const $navTemplate = cheerio.load(templateNav)

  // Remove active class from all nav items
  $navTemplate('li').removeClass('active')

  // Set active class based on current file
  const currentPage = fileName.toLowerCase()

  // Match the current page with the corresponding nav item
  $navTemplate('li a').each((i, el) => {
    const href = $navTemplate(el).attr('href')
    if (href) {
      const linkPage = path.basename(href).toLowerCase()
      if (linkPage === currentPage) {
        $navTemplate(el).parent().addClass('active')
      } else if (currentPage.includes('blog') && href.includes('blog')) {
        // Special case for blog pages
        $navTemplate(el).parent().addClass('active')
      } else if (currentPage === 'index.html' && (href === '/' || href.includes('index'))) {
        // Special case for home page
        $navTemplate(el).parent().addClass('active')
      }
    }
  })

  // Replace nav with modified version
  $('nav').replaceWith($navTemplate.html())

  // Replace footer
  $('footer').replaceWith(templateFooter)

  // Replace back to top button if it exists
  if ($('.back-to-top').length) {
    $('.back-to-top').replaceWith(templateBackToTop)
  } else {
    // If there's no back-to-top button, append it before the scripts at the end of body
    $('body').append(templateBackToTop)
  }

  // Replace main script if it exists
  if ($('script[src="/js/main.js"]').length) {
    $('script[src="/js/main.js"]').replaceWith(templateScripts)
  } else {
    // If there's no main script, append it at the end of body
    $('body').append(templateScripts)
  }

  // Write the updated content back to file
  fs.writeFileSync(filePath, $.html())
  console.log(`Updated ${filePath} - Set active nav for ${currentPage}`)
}

// Get all HTML files in the root directory
const rootDir = path.join(__dirname, '..')
const rootFiles = fs
  .readdirSync(rootDir)
  .filter((file) => file.endsWith('.html'))
  .map((file) => path.join(rootDir, file))

// Get all blog posts
const blogDir = path.join(rootDir, 'blog')
const blogFiles = fs
  .readdirSync(blogDir)
  .filter((file) => file.endsWith('.html'))
  .map((file) => path.join(blogDir, file))

// Combine all HTML files to process
const allHtmlFiles = [...rootFiles, ...blogFiles]

// Process each HTML file
allHtmlFiles.forEach(processHtmlFile)

console.log('Header and footer sync complete!')
