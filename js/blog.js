// Blog functionality

// Function to fetch blog posts
async function fetchBlogPosts() {
  try {
    const response = await fetch('/blog/posts.json');
    if (!response.ok) {
      throw new Error('Could not fetch blog posts');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading blog posts:', error);
    return [];
  }
}

// Function to render blog posts
async function renderBlogPosts() {
  const blogContainer = document.getElementById('blog-posts-container');
  if (!blogContainer) return;
  
  const posts = await fetchBlogPosts();
  
  // Sort posts by date (newest first)
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (posts.length === 0) {
    blogContainer.innerHTML = '<p>No blog posts found.</p>';
    return;
  }
  
  // Generate HTML for each post
  const postsHTML = posts.map(post => `
    <article class="blog-post">
      <div class="blog-post-date">${formatDate(post.date)}</div>
      <h3><a href="${post.url}">${post.title}</a></h3>
      <p>${post.excerpt}</p>
      <a href="${post.url}" class="read-more">Read more →</a>
    </article>
  `).join('');
  
  blogContainer.innerHTML = postsHTML;
}

// Helper function to format dates
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Initialize blog posts when the DOM is ready
document.addEventListener('DOMContentLoaded', renderBlogPosts);
