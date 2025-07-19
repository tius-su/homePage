// Custom Page JavaScript
let customPageId = null;

// Initialize custom page
document.addEventListener('DOMContentLoaded', function() {
    initializeCustomPage();
    setupCustomEventListeners();
    loadCustomPage();
});

// Initialize custom page
function initializeCustomPage() {
    // Get page ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    customPageId = urlParams.get('id');
    
    if (!customPageId) {
        showError('Page not found');
        return;
    }
}

// Setup event listeners
function setupCustomEventListeners() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
        });
    }
}

// Load custom page content
async function loadCustomPage() {
    try {
        const doc = await db.collection('customPages').doc(customPageId).get();
        
        if (doc.exists) {
            const pageData = doc.data();
            displayCustomPage(pageData.content);
        } else {
            showError('Custom page not found');
        }
    } catch (error) {
        console.error('Error loading custom page:', error);
        showError('Failed to load custom page');
    }
}

// Display custom page content
function displayCustomPage(content) {
    const customContent = document.getElementById('custom-content');
    
    // Create a temporary container to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Extract title from the content if available
    const titleElement = tempDiv.querySelector('title');
    if (titleElement) {
        document.title = titleElement.textContent;
    }
    
    // Extract and apply styles
    const styleElements = tempDiv.querySelectorAll('style');
    styleElements.forEach(style => {
        const styleTag = document.createElement('style');
        styleTag.textContent = style.textContent;
        document.head.appendChild(styleTag);
    });
    
    // Extract and set body content
    const bodyElement = tempDiv.querySelector('body');
    if (bodyElement) {
        customContent.innerHTML = bodyElement.innerHTML;
    } else {
        customContent.innerHTML = content;
    }
    
    // Extract and execute scripts
    const scriptElements = tempDiv.querySelectorAll('script');
    scriptElements.forEach(script => {
        const scriptTag = document.createElement('script');
        if (script.src) {
            scriptTag.src = script.src;
        } else {
            scriptTag.textContent = script.textContent;
        }
        document.body.appendChild(scriptTag);
    });
    
    // Hide loading message
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.style.display = 'none';
    }
}

// Show error message
function showError(message) {
    const customContent = document.getElementById('custom-content');
    customContent.innerHTML = `
        <div class="container">
            <div style="text-align: center; padding: 4rem 0;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c; margin-bottom: 1rem;"></i>
                <h2 style="color: #2c3e50; margin-bottom: 1rem;">Error</h2>
                <p style="color: #6c757d; font-size: 1.1rem;">${message}</p>
                <a href="index.html" style="display: inline-block; margin-top: 2rem; padding: 0.75rem 1.5rem; background: #3498db; color: white; text-decoration: none; border-radius: 5px;">Go Back Home</a>
            </div>
        </div>
    `;
}