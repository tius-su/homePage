// Detail Page JavaScript
let currentArticleId = null;
let currentArticleData = null;

// Initialize detail page
document.addEventListener('DOMContentLoaded', function() {
    initializeDetailPage();
    setupDetailEventListeners();
    loadArticleFromURL();
});

// Initialize detail page
function initializeDetailPage() {
    // Get article ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentArticleId = urlParams.get('id');
    
    if (!currentArticleId) {
        showError('Article not found');
        return;
    }
    
    // Show loading overlay
    showLoadingOverlay();
}

// Setup event listeners
function setupDetailEventListeners() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
        });
    }
    
    // Comment form submission
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmission);
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Load article from URL
async function loadArticleFromURL() {
    try {
        // First, try to load from predefined content
        const predefinedContent = getPredefinedContent(currentArticleId);
        
        if (predefinedContent) {
            displayArticle(predefinedContent);
        } else {
            // Try to load from Firebase
            await loadArticleFromFirebase(currentArticleId);
        }
        
        // Load related articles
        await loadRelatedArticles();
        
        // Load comments
        await loadComments();
        
    } catch (error) {
        console.error('Error loading article:', error);
        showError('Failed to load article content');
    } finally {
        hideLoadingOverlay();
    }
}

// Get predefined content for demo purposes
function getPredefinedContent(articleId) {
    const predefinedArticles = {
        'service1': {
            title: 'Web Development Services',
            content: `
                <h2>Professional Web Development</h2>
                <p>Our web development services encompass everything from simple websites to complex web applications. We use the latest technologies and best practices to ensure your website is fast, secure, and user-friendly.</p>
                
                <h3>Our Approach</h3>
                <p>We follow a comprehensive development process that includes:</p>
                <ul>
                    <li>Requirements analysis and planning</li>
                    <li>UI/UX design and prototyping</li>
                    <li>Frontend and backend development</li>
                    <li>Testing and quality assurance</li>
                    <li>Deployment and maintenance</li>
                </ul>
                
                <h3>Technologies We Use</h3>
                <p>Our team is proficient in a wide range of technologies including:</p>
                <ul>
                    <li>HTML5, CSS3, and JavaScript</li>
                    <li>React, Vue.js, and Angular</li>
                    <li>Node.js, Python, and PHP</li>
                    <li>MySQL, PostgreSQL, and MongoDB</li>
                    <li>AWS, Google Cloud, and Azure</li>
                </ul>
                
                <blockquote>
                    "A well-designed website is not just about looks; it's about functionality, user experience, and achieving your business goals."
                </blockquote>
                
                <h3>Why Choose Our Web Development Services?</h3>
                <p>With years of experience in the industry, we have successfully delivered hundreds of projects for clients ranging from startups to enterprise-level organizations. Our commitment to quality and customer satisfaction sets us apart.</p>
            `,
            image: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
            date: '2025-01-15',
            category: 'Web Development',
            tags: ['Web Development', 'Frontend', 'Backend', 'Full Stack']
        },
        'service2': {
            title: 'Digital Marketing Solutions',
            content: `
                <h2>Comprehensive Digital Marketing</h2>
                <p>In today's digital age, having a strong online presence is crucial for business success. Our digital marketing services help you reach your target audience, increase brand awareness, and drive conversions.</p>
                
                <h3>Our Services Include</h3>
                <ul>
                    <li>Search Engine Optimization (SEO)</li>
                    <li>Pay-Per-Click (PPC) Advertising</li>
                    <li>Social Media Marketing</li>
                    <li>Content Marketing</li>
                    <li>Email Marketing</li>
                    <li>Analytics and Reporting</li>
                </ul>
                
                <h3>SEO Strategy</h3>
                <p>Our SEO approach focuses on both technical optimization and content strategy. We conduct thorough keyword research, optimize your website structure, and create high-quality content that ranks well in search engines.</p>
                
                <h3>Social Media Management</h3>
                <p>We help you build and maintain a strong social media presence across all major platforms. Our team creates engaging content, manages your social media accounts, and runs targeted advertising campaigns.</p>
                
                <blockquote>
                    "Digital marketing is not just about being online; it's about being found by the right people at the right time."
                </blockquote>
            `,
            image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
            date: '2025-01-14',
            category: 'Digital Marketing',
            tags: ['SEO', 'PPC', 'Social Media', 'Content Marketing']
        },
        'service3': {
            title: 'Business Consulting',
            content: `
                <h2>Strategic Business Consulting</h2>
                <p>Our business consulting services help organizations optimize their operations, improve efficiency, and achieve sustainable growth. We work closely with our clients to understand their unique challenges and develop tailored solutions.</p>
                
                <h3>Areas of Expertise</h3>
                <ul>
                    <li>Business Strategy Development</li>
                    <li>Process Optimization</li>
                    <li>Digital Transformation</li>
                    <li>Change Management</li>
                    <li>Performance Improvement</li>
                    <li>Risk Management</li>
                </ul>
                
                <h3>Our Methodology</h3>
                <p>We follow a proven methodology that ensures successful project delivery:</p>
                <ol>
                    <li><strong>Assessment:</strong> We analyze your current situation and identify opportunities for improvement.</li>
                    <li><strong>Strategy:</strong> We develop a comprehensive strategy aligned with your business objectives.</li>
                    <li><strong>Implementation:</strong> We work with your team to implement the recommended solutions.</li>
                    <li><strong>Monitoring:</strong> We track progress and make adjustments as needed to ensure success.</li>
                </ol>
                
                <blockquote>
                    "Success in business requires training and discipline and hard work. But if you're not frightened by these things, the opportunities are just as great today as they ever were." - David Rockefeller
                </blockquote>
            `,
            image: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
            date: '2025-01-13',
            category: 'Business Consulting',
            tags: ['Strategy', 'Consulting', 'Business', 'Optimization']
        },
        'mission': {
            title: 'Our Mission',
            content: `
                <h2>Empowering Businesses Through Innovation</h2>
                <p>Our mission is to empower businesses with cutting-edge technology and strategic insights that drive growth, efficiency, and success in the digital age.</p>
                
                <h3>What Drives Us</h3>
                <p>We believe that every business, regardless of size, deserves access to world-class technology solutions and strategic guidance. Our mission is built on three core principles:</p>
                
                <ul>
                    <li><strong>Innovation:</strong> We constantly explore new technologies and methodologies to provide our clients with the most advanced solutions.</li>
                    <li><strong>Excellence:</strong> We maintain the highest standards of quality in everything we do, from project planning to final delivery.</li>
                    <li><strong>Partnership:</strong> We view our clients as partners and work collaboratively to achieve their business objectives.</li>
                </ul>
                
                <h3>Our Commitment</h3>
                <p>We are committed to delivering exceptional value to our clients through:</p>
                <ul>
                    <li>Personalized solutions tailored to specific business needs</li>
                    <li>Transparent communication throughout the project lifecycle</li>
                    <li>Continuous support and maintenance</li>
                    <li>Knowledge transfer and training</li>
                </ul>
            `,
            image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
            date: '2025-01-12',
            category: 'About Us',
            tags: ['Mission', 'Values', 'Company']
        },
        'vision': {
            title: 'Our Vision',
            content: `
                <h2>Leading the Future of Digital Transformation</h2>
                <p>Our vision is to be the global leader in digital transformation and business innovation, helping organizations worldwide adapt and thrive in an increasingly digital world.</p>
                
                <h3>The Future We Envision</h3>
                <p>We envision a future where:</p>
                <ul>
                    <li>Every business has access to cutting-edge technology solutions</li>
                    <li>Digital transformation is accessible and affordable for all</li>
                    <li>Innovation drives sustainable business growth</li>
                    <li>Technology serves humanity and creates positive impact</li>
                </ul>
                
                <h3>Our Role in Shaping the Future</h3>
                <p>As we work towards our vision, we focus on:</p>
                <ul>
                    <li>Developing innovative solutions that address real-world challenges</li>
                    <li>Building long-term partnerships with our clients</li>
                    <li>Investing in research and development</li>
                    <li>Contributing to the global technology community</li>
                </ul>
                
                <blockquote>
                    "The best way to predict the future is to create it." - Peter Drucker
                </blockquote>
            `,
            image: 'https://images.pexels.com/photos/3184317/pexels-photo-3184317.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
            date: '2025-01-11',
            category: 'About Us',
            tags: ['Vision', 'Future', 'Innovation']
        }
    };
    
    return predefinedArticles[articleId] || null;
}

// Load article from Firebase
async function loadArticleFromFirebase(articleId) {
    try {
        const doc = await db.collection('articles').doc(articleId).get();
        if (doc.exists) {
            const articleData = doc.data();
            displayArticle(articleData);
        } else {
            showError('Article not found');
        }
    } catch (error) {
        console.error('Error loading article from Firebase:', error);
        throw error;
    }
}

// Display article content
function displayArticle(articleData) {
    currentArticleData = articleData;
    
    // Update page title
    document.title = articleData.title + ' - Professional Website';
    
    // Update breadcrumb
    document.getElementById('breadcrumb-current').textContent = articleData.title;
    
    // Update article content
    document.getElementById('detail-title').textContent = articleData.title;
    document.getElementById('detail-content').innerHTML = articleData.content;
    
    // Update meta information
    if (articleData.date) {
        document.getElementById('detail-date').textContent = formatDate(articleData.date);
    }
    
    if (articleData.category) {
        document.getElementById('detail-category').textContent = articleData.category;
    }
    
    // Update featured image or video
    if (articleData.image) {
        const imageElement = document.getElementById('detail-image');
        imageElement.src = articleData.image;
        imageElement.alt = articleData.title;
        imageElement.style.display = 'block';
    }
    
    if (articleData.video) {
        const videoContainer = document.getElementById('detail-video-container');
        const videoElement = document.getElementById('detail-video');
        videoElement.src = articleData.video;
        videoContainer.style.display = 'block';
    }
    
    // Update tags
    if (articleData.tags) {
        displayTags(articleData.tags);
    }
    
    // Update meta tags for SEO
    updateMetaTags(articleData);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Display tags
function displayTags(tags) {
    const tagsContainer = document.getElementById('detail-tags');
    tagsContainer.innerHTML = '';
    
    tags.forEach(tag => {
        const tagElement = document.createElement('a');
        tagElement.href = `#tag-${tag.toLowerCase().replace(/\s+/g, '-')}`;
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        tagsContainer.appendChild(tagElement);
    });
}

// Update meta tags for SEO
function updateMetaTags(articleData) {
    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
    }
    
    // Extract first paragraph as description
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = articleData.content;
    const firstParagraph = tempDiv.querySelector('p');
    const description = firstParagraph ? firstParagraph.textContent.substring(0, 160) + '...' : articleData.title;
    metaDescription.content = description;
    
    // Update or create Open Graph tags
    updateOrCreateMetaTag('property', 'og:title', articleData.title);
    updateOrCreateMetaTag('property', 'og:description', description);
    updateOrCreateMetaTag('property', 'og:image', articleData.image || '');
    updateOrCreateMetaTag('property', 'og:url', window.location.href);
    updateOrCreateMetaTag('property', 'og:type', 'article');
    
    // Update or create Twitter Card tags
    updateOrCreateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateOrCreateMetaTag('name', 'twitter:title', articleData.title);
    updateOrCreateMetaTag('name', 'twitter:description', description);
    updateOrCreateMetaTag('name', 'twitter:image', articleData.image || '');
}

// Helper function to update or create meta tags
function updateOrCreateMetaTag(attribute, value, content) {
    let metaTag = document.querySelector(`meta[${attribute}="${value}"]`);
    if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute(attribute, value);
        document.head.appendChild(metaTag);
    }
    metaTag.content = content;
}

// Load related articles
async function loadRelatedArticles() {
    const relatedContainer = document.getElementById('related-articles');
    
    // For demo purposes, show some predefined related articles
    const relatedArticles = [
        {
            id: 'service1',
            title: 'Web Development Services',
            excerpt: 'Professional web development with modern technologies.',
            image: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop'
        },
        {
            id: 'service2',
            title: 'Digital Marketing Solutions',
            excerpt: 'Comprehensive digital marketing strategies for growth.',
            image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop'
        },
        {
            id: 'mission',
            title: 'Our Mission',
            excerpt: 'Empowering businesses through innovation and technology.',
            image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop'
        }
    ];
    
    // Filter out current article
    const filteredArticles = relatedArticles.filter(article => article.id !== currentArticleId);
    
    relatedContainer.innerHTML = '';
    
    filteredArticles.slice(0, 3).forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.className = 'related-article';
        articleElement.innerHTML = `
            <img src="${article.image}" alt="${article.title}">
            <div class="related-article-content">
                <h4>${article.title}</h4>
                <p>${article.excerpt}</p>
                <a href="detail.html?id=${article.id}" class="read-more">Read More</a>
            </div>
        `;
        relatedContainer.appendChild(articleElement);
    });
}

// Load comments
async function loadComments() {
    try {
        const commentsSnapshot = await db.collection('comments')
            .where('articleId', '==', currentArticleId)
            .orderBy('createdAt', 'desc')
            .get();
        
        const commentsList = document.getElementById('comments-list');
        commentsList.innerHTML = '';
        
        if (commentsSnapshot.empty) {
            commentsList.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
            return;
        }
        
        commentsSnapshot.forEach(doc => {
            const comment = doc.data();
            displayComment(comment);
        });
    } catch (error) {
        console.error('Error loading comments:', error);
        document.getElementById('comments-list').innerHTML = '<p>Unable to load comments at this time.</p>';
    }
}

// Display comment
function displayComment(comment) {
    const commentsList = document.getElementById('comments-list');
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    
    const createdAt = comment.createdAt ? comment.createdAt.toDate() : new Date();
    
    commentElement.innerHTML = `
        <div class="comment-header">
            <span class="comment-author">${escapeHtml(comment.name)}</span>
            <span class="comment-date">${formatDate(createdAt.toISOString())}</span>
        </div>
        <div class="comment-content">
            ${escapeHtml(comment.message)}
        </div>
    `;
    
    commentsList.appendChild(commentElement);
}

// Handle comment submission
async function handleCommentSubmission(e) {
    e.preventDefault();
    
    const name = document.getElementById('comment-name').value.trim();
    const email = document.getElementById('comment-email').value.trim();
    const message = document.getElementById('comment-message').value.trim();
    
    if (!name || !email || !message) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        // Save comment to Firebase
        await db.collection('comments').add({
            articleId: currentArticleId,
            name: name,
            email: email,
            message: message,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            approved: false // Comments need approval
        });
        
        // Clear form
        document.getElementById('comment-form').reset();
        
        // Show success message
        alert('Thank you for your comment! It will be published after review.');
        
        // Reload comments
        await loadComments();
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Failed to submit comment. Please try again.');
    }
}

// Social sharing functions
function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(currentArticleData?.title || document.title);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&t=${title}`, '_blank', 'width=600,height=400');
}

function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(currentArticleData?.title || document.title);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank', 'width=600,height=400');
}

function shareOnLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(currentArticleData?.title || document.title);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank', 'width=600,height=400');
}

function shareOnWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(currentArticleData?.title || document.title);
    window.open(`https://wa.me/?text=${title} ${url}`, '_blank');
}

// Utility functions
function showLoadingOverlay() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoadingOverlay() {
    document.getElementById('loading-overlay').style.display = 'none';
}

function showError(message) {
    document.getElementById('detail-title').textContent = 'Error';
    document.getElementById('detail-content').innerHTML = `<p class="error-message">${message}</p>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}