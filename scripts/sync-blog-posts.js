const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

const BLOG_DIR = path.join(__dirname, '..', 'blog');
const OUTPUT_FILE = path.join(BLOG_DIR, 'posts.json');

/** Local-time YYYY-MM-DD, so a date never shifts across a UTC boundary. */
const localISO = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function syncBlogPosts() {
  try {
    // Get all HTML files from the blog directory
    const files = await fs.readdir(BLOG_DIR);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    const posts = [];

    // Process each HTML file
    for (const file of htmlFiles) {
      const filePath = path.join(BLOG_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Use cheerio to parse HTML content
      const $ = cheerio.load(content);
      
      // Extract metadata
      const id = path.basename(file, '.html');
      const title = $('title').text().split(' - ')[0].trim();
      const excerpt = $('meta[name="description"]').attr('content') || '';
      
      // Extract date from the blog post
      const rawDate = $('.blog-date').text().trim();
      // Build the ISO date from local parts. Round tripping through
      // toISOString() reads the date as UTC and shifts the day east of UTC.
      const parsedDate = rawDate ? new Date(rawDate) : new Date();
      if (rawDate && Number.isNaN(parsedDate.getTime())) {
        console.warn(`Could not parse date for ${file}: ${rawDate}`);
      }
      const date = localISO(
        Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate
      );
      
      // Extract tags
      const tags = [];
      $('.blog-tags a').each((i, el) => {
        tags.push($(el).text().trim());
      });
      
      // Create post object
      const post = {
        id,
        title,
        date,
        excerpt,
        url: `/blog/${file}`,
        tags: tags.length ? tags : []
      };
      
      posts.push(post);
    }
    
    // Sort posts by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Write to posts.json
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(posts, null, 2));
    
    console.log(`Successfully synchronized ${posts.length} posts to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error synchronizing blog posts:', error);
  }
}

// Run the synchronization
syncBlogPosts();