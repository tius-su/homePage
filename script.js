// Main Website JavaScript
let websiteData = {};
let websiteSettings = {};
let db, auth; // Declare Firebase variables

document.addEventListener('DOMContentLoaded', function() {
    initializeFirebaseAndLoadData();
    setupEventListeners();
});

// Initialize Firebase and set up listeners
async function initializeFirebaseAndLoadData() {
    // Firebase config is globally available from firebase-config.js
    const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : null);
    
    if (firebaseConfig) {
        const app = firebase.initializeApp(firebaseConfig);
        db = app.firestore();
        auth = app.auth();

        // Sign in anonymously if no initial auth token, or use custom token
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        if (initialAuthToken) {
            try {
                await auth.signInWithCustomToken(initialAuthToken);
                console.log("Signed in with custom token.");
            } catch (error) {
                console.error("Error signing in with custom token:", error);
                await auth.signInAnonymously(); // Fallback to anonymous
                console.log("Signed in anonymously due to custom token error.");
            }
        } else {
            await auth.signInAnonymously();
            console.log("Signed in anonymously.");
        }

        // Once authenticated, set up real-time listeners
        auth.onAuthStateChanged(user => {
            if (user) {
                console.log("Firebase Auth state changed. User:", user.uid);
                setupFirestoreListeners();
            } else {
                console.log("Firebase Auth state changed. No user.");
                // Optionally handle UI for logged out state or anonymous
            }
        });
    } else {
        console.warn("Firebase config not found. Using mock Firebase services.");
        // Fallback to mock services if firebaseConfig is null (e.g., StackBlitz demo)
        // Ensure mock services are globally available from firebase-config.js
        db = window.db; 
        auth = window.auth;
        setupFirestoreListeners(); // Still try to load data with mock services
    }
}

// Setup Firestore real-time listeners
function setupFirestoreListeners() {
    // Listen for website settings changes
    db.collection('website').doc('settings').onSnapshot(doc => {
        if (doc.exists) {
            websiteSettings = doc.data();
            applyWebsiteSettings(websiteSettings);
            console.log("Website settings updated from Firebase.");
        } else {
            console.log("No website settings found in Firebase.");
        }
    }, error => {
        console.error("Error listening to settings:", error);
    });

    // Listen for website content changes
    db.collection('website').doc('content').onSnapshot(doc => {
        if (doc.exists) {
            websiteData = doc.data();
            applyWebsiteContent(websiteData);
            console.log("Website content updated from Firebase.");
        } else {
            console.log("No website content found in Firebase.");
        }
    }, error => {
        console.error("Error listening to content:", error);
    });

    // Listen for image assignments
    db.collection('website').doc('images').onSnapshot(doc => {
        if (doc.exists) {
            const images = doc.data();
            applyImageAssignments(images);
            console.log("Image assignments updated from Firebase.");
        } else {
            console.log("No image assignments found in Firebase.");
        }
    }, error => {
        console.error("Error listening to images:", error);
    });

    // Listen for menu item changes
    db.collection('website').doc('menu').onSnapshot(doc => {
        if (doc.exists) {
            const menuItems = doc.data().items || [];
            updateMenu(menuItems);
            console.log("Menu items updated from Firebase.");
        } else {
            console.log("No menu items found in Firebase.");
        }
    }, error => {
        console.error("Error listening to menu:", error);
    });
}

// Setup event listeners for UI interactions
function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
        });
    }
}

// Apply website content to the DOM
function applyWebsiteContent(data) {
    // Session 1
    document.getElementById('session1-title1').textContent = data.session1?.title1 || 'Welcome to Our Professional Website';
    document.getElementById('session1-title2').textContent = data.session1?.title2 || 'Your Success is Our Priority';

    // Session 2
    document.getElementById('session2-heading').textContent = data.session2?.heading || 'Our Services';
    document.getElementById('session2-col1-heading').textContent = data.session2?.col1Heading || 'Web Development';
    document.getElementById('session2-col1-content').innerHTML = data.session2?.col1Content || 'Professional web development services with modern technologies and responsive design.';
    document.getElementById('session2-col2-heading').textContent = data.session2?.col2Heading || 'Digital Marketing';
    document.getElementById('session2-col2-content').innerHTML = data.session2?.col2Content || 'Comprehensive digital marketing strategies to grow your business online.';
    document.getElementById('session2-col3-heading').textContent = data.session2?.col3Heading || 'Consulting';
    document.getElementById('session2-col3-content').innerHTML = data.session2?.col3Content || 'Expert business consulting to help you make informed decisions.';

    // Session 3
    document.getElementById('session3-col1-heading').textContent = data.session3?.col1Heading || 'About Our Company';
    document.getElementById('session3-col1-content').innerHTML = data.session3?.col1Content || 'We are a leading company in providing innovative solutions for businesses worldwide. Our team of experts is dedicated to delivering exceptional results.';
    document.getElementById('session3-col2-part1-heading').textContent = data.session3?.col2Part1Heading || 'Our Mission';
    document.getElementById('session3-col2-part1-content').innerHTML = data.session3?.col2Part1Content || 'To empower businesses with cutting-edge technology and strategic insights.';
    document.getElementById('session3-col2-part2-heading').textContent = data.session3?.col2Part2Heading || 'Our Vision';
    document.getElementById('session3-col2-part2-content').innerHTML = data.session3?.col2Part2Content || 'To be the global leader in digital transformation and business innovation.';
    document.getElementById('session3-col3-heading').textContent = data.session3?.col3Heading || 'Our Values'; // New column
    document.getElementById('session3-col3-content').innerHTML = data.session3?.col3Content || 'Integrity, innovation, and customer satisfaction are at the core of everything we do. We believe in building lasting relationships with our clients.'; // New column
    applyReadMore('session3-col3-content', data.session3?.col3Readmore); // Apply readmore for new column

    // Session 4
    document.getElementById('session4-col1-heading').textContent = data.session4?.col1Heading || 'Our Expertise';
    document.getElementById('session4-col1-content').innerHTML = data.session4?.col1Content || 'With years of experience in the industry, we have developed expertise in various domains including technology, marketing, and business strategy.';
    document.getElementById('session4-col2-heading').textContent = data.session4?.col2Heading || 'Why Choose Us';
    document.getElementById('session4-col2-content').innerHTML = data.session4?.col2Content || 'We offer personalized solutions, 24/7 support, and proven results. Our client-centric approach ensures your success is our top priority.';
    document.getElementById('session4-col3-heading').textContent = data.session4?.col3Heading || 'Our Process'; // New column
    document.getElementById('session4-col3-content').innerHTML = data.session4?.col3Content || 'Our streamlined process ensures efficient project delivery from conception to completion, keeping you informed every step of the way.'; // New column
    applyReadMore('session4-col3-content', data.session4?.col3Readmore); // Apply readmore for new column

    // Session 5
    document.getElementById('session5-heading').textContent = data.session5?.heading || 'Our Portfolio';
    document.getElementById('session5-col1-heading').textContent = data.session5?.col1Heading || 'Project Alpha';
    document.getElementById('session5-col1-content').innerHTML = data.session5?.col1Content || 'Innovative web application development.';
    document.getElementById('session5-col2-heading').textContent = data.session5?.col2Heading || 'Project Beta';
    document.getElementById('session5-col2-content').innerHTML = data.session5?.col2Content || 'Mobile app development and deployment.';
    document.getElementById('session5-col3-heading').textContent = data.session5?.col3Heading || 'Project Gamma';
    document.getElementById('session5-col3-content').innerHTML = data.session5?.col3Content || 'E-commerce platform optimization.';
    document.getElementById('session5-col4-heading').textContent = data.session5?.col4Heading || 'Project Delta';
    document.getElementById('session5-col4-content').innerHTML = data.session5?.col4Content || 'Digital marketing campaign success.';

    // Session 6 (Photo Gallery)
    document.getElementById('session6-heading').textContent = data.session6?.heading || 'Photo Gallery';
    renderGallery('photo-gallery-grid', data.session6?.items || [], 'image');

    // Session 7 (Video Gallery)
    document.getElementById('session7-heading').textContent = data.session7?.heading || 'Video Gallery';
    renderGallery('video-gallery-grid', data.session7?.items || [], 'video');
}

// Apply website settings (colors, fonts, visibility, etc.)
function applyWebsiteSettings(settings) {
    // Apply colors
    document.documentElement.style.setProperty('--header-bg-color', settings['header-bg-color'] || '#2c3e50');
    document.documentElement.style.setProperty('--footer-bg-color', settings['footer-bg-color'] || '#2c3e50');
    document.documentElement.style.setProperty('--session1-bg-color', settings['session1-bg-color'] || '#667eea');
    document.documentElement.style.setProperty('--session2-bg-color', settings['session2-bg-color'] || '#f8f9fa');
    document.documentElement.style.setProperty('--session3-bg-color', settings['session3-bg-color'] || '#ffffff');
    document.documentElement.style.setProperty('--session4-bg-color', settings['session4-bg-color'] || '#f8f9fa');
    document.documentElement.style.setProperty('--session5-bg-color', settings['session5-bg-color'] || '#ffffff');
    document.documentElement.style.setProperty('--session6-bg-color', settings['session6-bg-color'] || '#f8f9fa');
    document.documentElement.style.setProperty('--session7-bg-color', settings['session7-bg-color'] || '#ffffff');

    // Apply font sizes
    document.documentElement.style.setProperty('--main-title-size', settings['main-title-size'] || '3rem');
    document.documentElement.style.setProperty('--section-heading-size', settings['section-heading-size'] || '2.5rem');
    document.documentElement.style.setProperty('--body-font', settings['body-font'] || "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif");

    // Apply animation and hover effects
    const heroImage = document.querySelector('.hero-image');
    if (heroImage) {
        heroImage.style.animation = settings['hero-animation'] && settings['hero-animation'] !== 'none' ? `${settings['hero-animation']} 1s ease-out` : 'none';
    }
    document.querySelectorAll('.card').forEach(card => {
        card.style.transform = settings['card-hover'] || 'translateY(0)'; // Default to no transform if 'none' or not set
    });

    // Apply grid layout for Session 5
    updateSession5GridLayout(settings['session5-layout']);

    // Toggle social media visibility
    toggleElementVisibility('#social-icons', settings['show-social']);

    // Toggle section visibility
    toggleElementVisibility('#session6', settings['show-session6']);
    toggleElementVisibility('#session7', settings['show-session7']);

    // Apply column visibility for Sessions 2-7
    toggleElementVisibility('#session2-col1', settings['show-session2-col1']);
    toggleElementVisibility('#session2-col2', settings['show-session2-col2']);
    toggleElementVisibility('#session2-col3', settings['show-session2-col3']);

    toggleElementVisibility('#session3-col1', settings['show-session3-col1']);
    toggleElementVisibility('#session3-col2', settings['show-session3-col2']);
    toggleElementVisibility('#session3-col3', settings['show-session3-col3']);

    toggleElementVisibility('#session4-col1', settings['show-session4-col1']);
    toggleElementVisibility('#session4-col2', settings['show-session4-col2']);
    toggleElementVisibility('#session4-col3', settings['show-session4-col3']);

    toggleElementVisibility('#session5-col1', settings['show-session5-col1']);
    toggleElementVisibility('#session5-col2', settings['show-session5-col2']);
    toggleElementVisibility('#session5-col3', settings['show-session5-col3']);
    toggleElementVisibility('#session5-col4', settings['show-session5-col4']);
}

// Apply image assignments
function applyImageAssignments(images) {
    Object.keys(images).forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.src = images[elementId];
        }
    });
}

// Update menu items
function updateMenu(items) {
    const desktopMenu = document.getElementById('menu-items');
    const mobileMenu = document.getElementById('mobile-menu-items');
    
    if (desktopMenu) {
        desktopMenu.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = item.url;
            a.textContent = item.name;
            li.appendChild(a);
            desktopMenu.appendChild(li);
        });
    }

    if (mobileMenu) {
        mobileMenu.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = item.url;
            a.textContent = item.name;
            li.appendChild(a);
            mobileMenu.appendChild(li);
        });
    }
}

// Generic function to toggle element visibility
function toggleElementVisibility(selector, show) {
    const element = document.querySelector(selector);
    if (element) {
        element.style.display = show ? '' : 'none'; // Use empty string to revert to default display
    }
}

// Update Session 5 grid layout
function updateSession5GridLayout(columns) {
    const session5Grid = document.getElementById('session5-grid');
    if (session5Grid) {
        // Remove existing column classes
        session5Grid.classList.remove('grid-2-cols', 'grid-3-cols', 'grid-4-cols');
        // Add the new column class
        if (columns === '2') {
            session5Grid.classList.add('grid-2-cols');
        } else if (columns === '3') {
            session5Grid.classList.add('grid-3-cols');
        } else if (columns === '4') {
            session5Grid.classList.add('grid-4-cols');
        }
    }
}

// Apply read more functionality
function applyReadMore(contentId, enableReadMore) {
    const contentDiv = document.getElementById(contentId);
    if (!contentDiv) return;

    let readMoreBtn = contentDiv.nextElementSibling;
    // Create read more button if it doesn't exist or is not the correct button
    if (!readMoreBtn || !readMoreBtn.classList.contains('read-more-btn')) {
        readMoreBtn = document.createElement('button');
        readMoreBtn.className = 'read-more-btn';
        readMoreBtn.textContent = 'Read More';
        contentDiv.parentNode.insertBefore(readMoreBtn, contentDiv.nextElementSibling);
    }

    const fullContent = websiteData[contentId.split('-')[0]]?.[contentId.split('-')[1]] || ''; // Get original content from websiteData
    
    if (enableReadMore && fullContent.length > 200) { // Only apply if content is long and readmore is enabled
        contentDiv.innerHTML = fullContent.substring(0, 200) + '...'; // Set initial collapsed content
        contentDiv.classList.add('collapsed');
        readMoreBtn.textContent = 'Read More';
        readMoreBtn.style.display = 'block';
        readMoreBtn.onclick = () => {
            if (contentDiv.classList.contains('collapsed')) {
                contentDiv.innerHTML = fullContent;
                contentDiv.classList.remove('collapsed');
                readMoreBtn.textContent = 'Read Less';
            } else {
                contentDiv.innerHTML = fullContent.substring(0, 200) + '...';
                contentDiv.classList.add('collapsed');
                readMoreBtn.textContent = 'Read More';
            }
        };
    } else {
        contentDiv.innerHTML = fullContent; // Show full content
        contentDiv.classList.remove('collapsed');
        readMoreBtn.style.display = 'none'; // Hide button
    }
}


// Render gallery items on the main website
function renderGallery(containerId, items, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ''; // Clear existing items

    items.forEach(item => {
        const galleryItemDiv = document.createElement('div');
        galleryItemDiv.className = 'gallery-item';

        if (type === 'image') {
            const img = document.createElement('img');
            img.src = item.url;
            img.alt = 'Gallery Image';
            galleryItemDiv.appendChild(img);
        } else if (type === 'video') {
            // Extract video ID for YouTube/Vimeo embeds
            let embedUrl = item.url;
            if (item.url.includes('youtube.com/watch?v=')) {
                const videoId = item.url.split('v=')[1]?.split('&')[0];
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
            } else if (item.url.includes('vimeo.com/')) {
                const videoId = item.url.split('vimeo.com/')[1]?.split('?')[0];
                embedUrl = `https://player.vimeo.com/video/${videoId}`;
            }

            const iframe = document.createElement('iframe');
            iframe.src = embedUrl;
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('loading', 'lazy'); // Optimize loading
            galleryItemDiv.appendChild(iframe);
        }
        container.appendChild(galleryItemDiv);
    });
}

// Function to open detail page (existing functionality)
function openDetail(id) {
    window.location.href = `detail.html?id=${id}`;
}
