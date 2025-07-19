// Global variables
let currentUser = null;
let websiteData = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadWebsiteData();
});

// Initialize application
function initializeApp() {
    // Check authentication state
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            console.log('User logged in:', user.email);
            showAdminFeatures();
        } else {
            console.log('User logged out');
            hideAdminFeatures();
            // Check for mock user in localStorage
            const mockUser = localStorage.getItem('mockUser');
            if (mockUser) {
                currentUser = JSON.parse(mockUser);
                showAdminFeatures();
            }
        }
    });
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('login-form').reset();
        
        // Show success message
        alert('Login successful! You can now access admin features.');
        
        // Show admin features
        showAdminFeatures();
    } catch (error) {
        alert('Login failed: ' + error.message + '\n\nFor demo, use:\nEmail: admin@example.com\nPassword: admin123');
    }
}

// Load website data from localStorage
async function loadWebsiteData() {
    try {
        // Try to load from mock database first
        const doc = await db.collection('website').doc('content').get();
        if (doc.exists) {
            websiteData = doc.data();
            applyWebsiteData();
            console.log('Website data loaded from mock database');
        } else {
            // Load from localStorage as fallback
            const savedData = localStorage.getItem('websiteData');
            if (savedData) {
                websiteData = JSON.parse(savedData);
                applyWebsiteData();
                console.log('Website data loaded from localStorage');
            }
        }
    } catch (error) {
        console.log('Loading from localStorage fallback');
        // Load from localStorage as fallback
        const mockUser = localStorage.getItem('mockUser');
        if (mockUser) {
            const savedData = localStorage.getItem('websiteData');
            if (savedData) {
                websiteData = JSON.parse(savedData);
                applyWebsiteData();
                console.log('Website data loaded from localStorage fallback');
            }
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    
    mobileMenuToggle.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
    });

    // Login modal
    const loginModal = document.getElementById('login-modal');
    const closeBtn = loginModal.querySelector('.close');
    const loginForm = document.getElementById('login-form');

    closeBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    // Login form submission
    loginForm.addEventListener('submit', handleLogin);

    // Smooth scrolling for navigation links
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

// Show login modal
function showLogin() {
    document.getElementById('login-modal').style.display = 'block';
}

// Show admin features
function showAdminFeatures() {
    // Add edit buttons to content areas
    addEditButtons();
}

// Hide admin features
function hideAdminFeatures() {
    // Remove edit buttons
    removeEditButtons();
}

// Add edit buttons to content areas
function addEditButtons() {
    const editableElements = [
        'session1-title1', 'session1-title2', 'session2-heading',
        'session2-col1-heading', 'session2-col1-content',
        'session2-col2-heading', 'session2-col2-content',
        'session2-col3-heading', 'session2-col3-content',
        'session3-col1-heading', 'session3-col1-content',
        'session3-col2-part1-heading', 'session3-col2-part1-content',
        'session3-col2-part2-heading', 'session3-col2-part2-content',
        'session4-col1-heading', 'session4-col1-content',
        'session4-col2-heading', 'session4-col2-content',
        'footer-text'
    ];

    editableElements.forEach(id => {
        const element = document.getElementById(id);
        if (element && !element.querySelector('.edit-btn')) {
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.onclick = () => editContent(id);
            element.style.position = 'relative';
            element.appendChild(editBtn);
        }
    });
}

// Remove edit buttons
function removeEditButtons() {
    document.querySelectorAll('.edit-btn').forEach(btn => btn.remove());
}

// Edit content
function editContent(elementId) {
    const element = document.getElementById(elementId);
    const currentContent = element.innerHTML.replace(/<button.*?<\/button>/g, '');
    
    const newContent = prompt('Edit content:', currentContent);
    if (newContent !== null) {
        element.innerHTML = newContent;
        saveWebsiteData();
    }
}

// Apply website data to elements
function applyWebsiteData() {
    Object.keys(websiteData).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (key.includes('image') || key.includes('logo')) {
                element.src = websiteData[key];
            } else {
                element.innerHTML = websiteData[key];
            }
        }
    });
}

// Save website data to localStorage
async function saveWebsiteData() {
    try {
        // Collect current content
        const contentElements = [
            'session1-title1', 'session1-title2', 'session2-heading',
            'session2-col1-heading', 'session2-col1-content',
            'session2-col2-heading', 'session2-col2-content',
            'session2-col3-heading', 'session2-col3-content',
            'session3-col1-heading', 'session3-col1-content',
            'session3-col2-part1-heading', 'session3-col2-part1-content',
            'session3-col2-part2-heading', 'session3-col2-part2-content',
            'session4-col1-heading', 'session4-col1-content',
            'session4-col2-heading', 'session4-col2-content',
            'footer-text'
        ];

        const imageElements = [
            'header-logo', 'footer-logo', 'session2-main-image',
            'session2-col1-image', 'session2-col2-image', 'session2-col3-image',
            'session3-col1-image', 'session4-col1-image',
            'session5-col1-image', 'session5-col2-image',
            'session5-col3-image', 'session5-col4-image'
        ];

        const data = {};

        contentElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                data[id] = element.innerHTML.replace(/<button.*?<\/button>/g, '');
            }
        });

        imageElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                data[id] = element.src;
            }
        });

        // Save to mock database
        await db.collection('website').doc('content').set(data);
        console.log('Website data saved to mock database successfully');
        
        // Also save to localStorage for offline access
        localStorage.setItem('websiteData', JSON.stringify(data));
    } catch (error) {
        console.log('Error saving to mock database, using localStorage:', error);
        // Fallback to localStorage
        localStorage.setItem('websiteData', JSON.stringify(data));
        console.log('Saved to localStorage as fallback');
    }
}

// Open detail page
function openDetail(slug) {
    window.location.href = `detail.html?id=${slug}`;
}

// Logout function
function logout() {
    auth.signOut().then(() => {
        localStorage.removeItem('mockUser');
        window.location.href = 'index.html';
    });
}

// Upload image function
async function uploadImage(file, path) {
    const storageRef = storage.ref().child(`images/${path}/${file.name}`);
    const snapshot = await storageRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();
    return downloadURL;
}

// YouTube video embed function
function embedYouTubeVideo(url, containerId) {
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        const container = document.getElementById(containerId);
        const iframe = container.querySelector('iframe');
        if (iframe) {
            iframe.src = embedUrl;
            container.style.display = 'block';
            // Hide image if video is shown
            const imageContainer = document.getElementById(containerId.replace('video', 'image'));
            if (imageContainer) {
                imageContainer.style.display = 'none';
            }
        }
    }
}

// Extract YouTube video ID from URL
function extractYouTubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Animation functions
function animateElement(elementId, animationType) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.animation = `${animationType} 1s ease-out`;
    }
}

// Toggle section visibility
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
    }
}

// Change grid layout for session 5
function changeGridLayout(columns) {
    const grid = document.getElementById('session5-grid');
    if (grid) {
        grid.className = `four-columns grid-${columns}`;
    }
}