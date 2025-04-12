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

// Get all blog posts
const blogDir = path.join(__dirname, '..', 'blog')
const blogFiles = fs.readdirSync(blogDir).filter((file) => file.endsWith('.html'))

// Process each blog post
blogFiles.forEach((file) => {
  const filePath = path.join(blogDir, file)
  const content = fs.readFileSync(filePath, 'utf8')
  const $ = cheerio.load(content)

  // Replace nav
  $('nav').replaceWith(templateNav)

  // Replace footer
  $('footer').replaceWith(templateFooter)

  // Replace back to top button
  $('.back-to-top').replaceWith(templateBackToTop)

  // Replace main script
  $('script[src="/js/main.js"]').replaceWith(templateScripts)

  // Write the updated content back to file
  fs.writeFileSync(filePath, $.html())
  console.log(`Updated ${file}`)
})

console.log('Header and footer sync complete!')
