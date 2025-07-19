// Main Website JavaScript
let websiteData = {};
let websiteSettings = {};

document.addEventListener('DOMContentLoaded', function() {
    loadWebsiteData();
    setupEventListeners();
    listenForAdminMessages();
});

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
        });
    }

    // Read More functionality
    document.querySelectorAll('.content-editor').forEach(editorDiv => {
        const fullContent = editorDiv.innerHTML;
        const readMoreBtn = editorDiv.nextElementSibling; // Assuming button is next sibling

        if (readMoreBtn && readMoreBtn.classList.contains('read-more-btn')) {
            // Check if content is longer than a certain height to enable read more
            if (editorDiv.scrollHeight > editorDiv.clientHeight || editorDiv.textContent.length > 200) { // Simple check
                editorDiv.classList.add('collapsed');
                readMoreBtn.style.display = 'block'; // Show button
                readMoreBtn.onclick = () => {
                    editorDiv.classList.toggle('collapsed');
                    readMoreBtn.textContent = editorDiv.classList.contains('collapsed') ? 'Read More' : 'Read Less';
                };
            } else {
                readMoreBtn.style.display = 'none'; // Hide button if content is short
            }
        }
    });
}

// Load website data from Firebase
async function loadWebsiteData() {
    try {
        // Load content data
        const contentDoc = await db.collection('website').doc('content').get();
        if (contentDoc.exists) {
            websiteData = contentDoc.data();
            applyWebsiteContent(websiteData);
        }

        // Load settings data
        const settingsDoc = await db.collection('website').doc('settings').get();
        if (settingsDoc.exists) {
            websiteSettings = settingsDoc.data();
            applyWebsiteSettings(websiteSettings);
        }

        // Load image assignments
        const imagesDoc = await db.collection('website').doc('images').get();
        if (imagesDoc.exists) {
            const images = imagesDoc.data();
            applyImageAssignments(images);
        }

        // Load menu items
        const menuDoc = await db.collection('website').doc('menu').get();
        if (menuDoc.exists) {
            const menuItems = menuDoc.data().items || [];
            updateMenu(menuItems);
        }

    } catch (error) {
        console.error('Error loading website data:', error);
    }
}

// Apply website content
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
    document.getElementById('session5-col1-heading').textContent = data.session5?.col1Heading || 'Project Alpha';
    document.getElementById('session5-col1-content').innerHTML = data.session5?.col1Content || 'Innovative web application development.';
    document.getElementById('session5-col2-heading').textContent = data.session5?.col2Heading || 'Project Beta';
    document.getElementById('session5-col2-content').innerHTML = data.session5?.col2Content || 'Mobile app development and deployment.';
    document.getElementById('session5-col3-heading').textContent = data.session5?.col3Heading || 'Project Gamma';
    document.getElementById('session5-col3-content').innerHTML = data.session5?.col3Content || 'E-commerce platform optimization.';
    document.getElementById('session5-col4-heading').textContent = data.session5?.col4Heading || 'Project Delta';
    document.getElementById('session5-col4-content').innerHTML = data.session5?.col4Content || 'Digital marketing campaign success.';

    // Session 6 (Photo Gallery)
    document.getElementById('session6').querySelector('.section-heading').textContent = data.session6?.heading || 'Photo Gallery';
    renderGallery('photo-gallery-grid', data.session6?.items || [], 'image');

    // Session 7 (Video Gallery)
    document.getElementById('session7').querySelector('.section-heading').textContent = data.session7?.heading || 'Video Gallery';
    renderGallery('video-gallery-grid', data.session7?.items || [], 'video');
}

// Apply website settings (colors, fonts, etc.)
function applyWebsiteSettings(settings) {
    // Apply colors
    document.documentElement.style.setProperty('--header-bg-color', settings['header-bg-color'] || '#2c3e50');
    document.documentElement.style.setProperty('--footer-bg-color', settings['footer-bg-color'] || '#2c3e50');
    document.documentElement.style.setProperty('--session1-bg-color', settings['session1-bg-color'] || '#667eea');
    document.documentElement.style.setProperty('--session2-bg-color', settings['session2-bg-color'] || '#f8f9fa');
    document.documentElement.style.setProperty('--session3-bg-color', settings['session3-bg-color'] || '#ffffff'); // Added
    document.documentElement.style.setProperty('--session4-bg-color', settings['session4-bg-color'] || '#f8f9fa'); // Added
    document.documentElement.style.setProperty('--session5-bg-color', settings['session5-bg-color'] || '#ffffff'); // Added
    document.documentElement.style.setProperty('--session6-bg-color', settings['session6-bg-color'] || '#f8f9fa'); // Added
    document.documentElement.style.setProperty('--session7-bg-color', settings['session7-bg-color'] || '#ffffff'); // Added

    // Apply font sizes
    document.documentElement.style.setProperty('--main-title-size', settings['main-title-size'] || '3rem');
    document.documentElement.style.setProperty('--section-heading-size', settings['section-heading-size'] || '2.5rem');
    document.documentElement.style.setProperty('--body-font', settings['body-font'] || "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif");

    // Apply animation and hover effects (these need more complex JS/CSS handling)
    // For now, simple class toggling or style application
    const heroImage = document.querySelector('.hero-image');
    if (heroImage) {
        heroImage.style.animation = settings['hero-animation'] !== 'none' ? `${settings['hero-animation']} 1s ease-out` : 'none';
    }
    document.querySelectorAll('.card').forEach(card => {
        card.style.transform = settings['card-hover'] || 'translateY(-5px)';
    });

    // Apply grid layout for Session 5
    updateSession5GridLayout(settings['session5-layout']);

    // Toggle social media visibility
    toggleElementVisibility('.social-icons', settings['show-social']);

    // Toggle section visibility
    toggleElementVisibility('#session6', settings['show-session6']);
    toggleElementVisibility('#session7', settings['show-session7']);

    // Apply column visibility for Sessions 2-7
    toggleElementVisibility('#session2-col1', settings['show-session2-col1']);
    toggleElementVisibility('#session2-col2', settings['show-session2-col2']);
    toggleElementVisibility('#session2-col3', settings['show-session2-col3']);

    toggleElementVisibility('#session3-col1', settings['show-session3-col1']);
    toggleElementVisibility('#session3-col2', settings['show-session3-col2']);
    toggleElementVisibility('#session3-col3', settings['show-session3-col3']); // New column

    toggleElementVisibility('#session4-col1', settings['show-session4-col1']);
    toggleElementVisibility('#session4-col2', settings['show-session4-col2']);
    toggleElementVisibility('#session4-col3', settings['show-session4-col3']); // New column

    toggleElementVisibility('#session5-col1', settings['show-session5-col1']);
    toggleElementVisibility('#session5-col2', settings['show-session5-col2']);
    toggleElementVisibility('#session5-col3', settings['show-session5-col3']);
    toggleElementVisibility('#session5-col4', settings['show-session5-col4']);

    toggleElementVisibility('#session6-gallery', settings['show-session6-gallery']);
    toggleElementVisibility('#session7-gallery', settings['show-session7-gallery']);
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


// Listen for messages from the admin panel
function listenForAdminMessages() {
    window.addEventListener('message', function(event) {
        // Ensure the message is from a trusted origin if deployed
        // if (event.origin !== "your_admin_panel_origin") return;

        const message = event.data;
        switch (message.type) {
            case 'updateStyle':
                document.documentElement.style.setProperty(message.property, message.value);
                break;
            case 'updateImage':
                const imgElement = document.getElementById(message.elementId);
                if (imgElement) {
                    imgElement.src = message.url;
                }
                break;
            case 'embedVideo':
                const videoContainer = document.getElementById(message.containerId);
                if (videoContainer) {
                    const iframe = videoContainer.querySelector('iframe');
                    if (iframe) {
                        iframe.src = message.url.replace("watch?v=", "embed/"); // Basic YouTube embed
                        videoContainer.style.display = 'block';
                        const heroImage = videoContainer.previousElementSibling;
                        if (heroImage && heroImage.tagName === 'IMG') {
                            heroImage.style.display = 'none';
                        }
                    }
                }
                break;
            case 'updateAnimation':
                const animElement = document.querySelector(message.selector);
                if (animElement) {
                    animElement.style.animation = message.animation !== 'none' ? `${message.animation} 1s ease-out` : 'none';
                }
                break;
            case 'updateHover':
                // This is more complex and typically handled via CSS classes
                // For simplicity, we'll just apply a style directly for now
                document.querySelectorAll(message.selector).forEach(el => {
                    el.style.transform = message.effect;
                });
                break;
            case 'updateGridLayout':
                updateSession5GridLayout(message.columns);
                break;
            case 'toggleElement':
                toggleElementVisibility(message.selector, message.show);
                break;
            case 'updateContent':
                // Update specific content based on session ID
                if (message.sessionId === 'session1') {
                    document.getElementById('session1-title1').textContent = message.data.title1;
                    document.getElementById('session1-title2').textContent = message.data.title2;
                } else if (message.sessionId === 'session2') {
                    document.getElementById('session2-heading').textContent = message.data.heading;
                    document.getElementById('session2-col1-heading').textContent = message.data.col1Heading;
                    document.getElementById('session2-col1-content').innerHTML = message.data.col1Content;
                    document.getElementById('session2-col2-heading').textContent = message.data.col2Heading;
                    document.getElementById('session2-col2-content').innerHTML = message.data.col2Content;
                    document.getElementById('session2-col3-heading').textContent = message.data.col3Heading;
                    document.getElementById('session2-col3-content').innerHTML = message.data.col3Content;
                } else if (message.sessionId === 'session3') {
                    document.getElementById('session3-col1-heading').textContent = message.data.col1Heading;
                    document.getElementById('session3-col1-content').innerHTML = message.data.col1Content;
                    document.getElementById('session3-col2-part1-heading').textContent = message.data.col2Part1Heading;
                    document.getElementById('session3-col2-part1-content').innerHTML = message.data.col2Part1Content;
                    document.getElementById('session3-col2-part2-heading').textContent = message.data.col2Part2Heading;
                    document.getElementById('session3-col2-part2-content').innerHTML = message.data.col2Part2Content;
                    document.getElementById('session3-col3-heading').textContent = message.data.col3Heading; // New column
                    document.getElementById('session3-col3-content').innerHTML = message.data.col3Content; // New column
                    applyReadMore('session3-col3-content', message.data.col3Readmore); // Apply readmore for new column
                } else if (message.sessionId === 'session4') {
                    document.getElementById('session4-col1-heading').textContent = message.data.col1Heading;
                    document.getElementById('session4-col1-content').innerHTML = message.data.col1Content;
                    document.getElementById('session4-col2-heading').textContent = message.data.col2Heading;
                    document.getElementById('session4-col2-content').innerHTML = message.data.col2Content;
                    document.getElementById('session4-col3-heading').textContent = message.data.col3Heading; // New column
                    document.getElementById('session4-col3-content').innerHTML = message.data.col3Content; // New column
                    applyReadMore('session4-col3-content', message.data.col3Readmore); // Apply readmore for new column
                } else if (message.sessionId === 'session5') {
                    document.getElementById('session5-col1-heading').textContent = message.data.col1Heading;
                    document.getElementById('session5-col1-content').innerHTML = message.data.col1Content;
                    document.getElementById('session5-col2-heading').textContent = message.data.col2Heading;
                    document.getElementById('session5-col2-content').innerHTML = message.data.col2Content;
                    document.getElementById('session5-col3-heading').textContent = message.data.col3Heading;
                    document.getElementById('session5-col3-content').innerHTML = message.data.col3Content;
                    document.getElementById('session5-col4-heading').textContent = message.data.col4Heading;
                    document.getElementById('session5-col4-content').innerHTML = message.data.col4Content;
                } else if (message.sessionId === 'session6') {
                    document.getElementById('session6').querySelector('.section-heading').textContent = message.data.heading;
                    renderGallery('photo-gallery-grid', message.data.items || [], 'image');
                } else if (message.sessionId === 'session7') {
                    document.getElementById('session7').querySelector('.section-heading').textContent = message.data.heading;
                    renderGallery('video-gallery-grid', message.data.items || [], 'video');
                }
                break;
            case 'updateMenu':
                updateMenu(message.menuItems);
                break;
        }
    }, false);
}

// Generic function to toggle element visibility
function toggleElementVisibility(selector, show) {
    const element = document.querySelector(selector);
    if (element) {
        element.style.display = show ? '' : 'none';
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
    if (!readMoreBtn || !readMoreBtn.classList.contains('read-more-btn')) {
        readMoreBtn = document.createElement('button');
        readMoreBtn.className = 'read-more-btn';
        contentDiv.parentNode.insertBefore(readMoreBtn, contentDiv.nextElementSibling);
    }

    if (enableReadMore) {
        const fullContent = contentDiv.innerHTML;
        const shortContent = fullContent.substring(0, 200) + '...'; // Adjust length as needed

        if (fullContent.length > 200) { // Only apply if content is actually long
            contentDiv.innerHTML = shortContent;
            contentDiv.classList.add('collapsed');
            readMoreBtn.textContent = 'Read More';
            readMoreBtn.style.display = 'block';
            readMoreBtn.onclick = () => {
                if (contentDiv.classList.contains('collapsed')) {
                    contentDiv.innerHTML = fullContent;
                    contentDiv.classList.remove('collapsed');
                    readMoreBtn.textContent = 'Read Less';
                } else {
                    contentDiv.innerHTML = shortContent;
                    contentDiv.classList.add('collapsed');
                    readMoreBtn.textContent = 'Read More';
                }
            };
        } else {
            contentDiv.classList.remove('collapsed');
            readMoreBtn.style.display = 'none';
        }
    } else {
        contentDiv.classList.remove('collapsed');
        readMoreBtn.style.display = 'none';
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
            const iframe = document.createElement('iframe');
            iframe.src = item.url.includes('youtube.com') ? item.url.replace("watch?v=", "embed/") : item.url; // Basic YouTube embed
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', '');
            galleryItemDiv.appendChild(iframe);
        }
        // You can add a title or description if your gallery items have them
        // const title = document.createElement('div');
        // title.className = 'title';
        // title.textContent = item.title || ''; // Assuming a title property
        // galleryItemDiv.appendChild(title);

        container.appendChild(galleryItemDiv);
    });
}
