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

  // Replace nav
  $('nav').replaceWith(templateNav)

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
  console.log(`Updated ${filePath}`)
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
