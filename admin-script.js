// Admin Panel JavaScript
let currentUser = null;
let websiteData = {};
let menuItems = [];

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
    setupAdminEventListeners();
    checkAuthentication();
    loadWebsiteData();
    initializeTinyMCE();
});

// Check if user is authenticated
function checkAuthentication() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            console.log('Admin logged in:', user.email);
            loadAdminData();
        } else {
            // Redirect to login if not authenticated
            // Ensure this is 'index.html' for the login page, not 'admin.html'
            // If admin.html is accessed directly, and user is not logged in, redirect to index.html
            if (window.location.pathname.includes('admin.html')) {
                window.location.href = 'index.html';
            }
        }
    });
}

// Initialize admin panel
function initializeAdmin() {
    // Load current website data into form fields
    loadCurrentSettings();
}

// Setup event listeners
function setupAdminEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            if (section) {
                showSection(section);
                setActiveNavLink(link);
            }
        });
    });

    // Auto-save functionality
    document.addEventListener('input', debounce(autoSave, 1000));
    document.addEventListener('change', debounce(autoSave, 1000)); // Add change listener for checkboxes/selects
}

// Show specific admin section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Set active navigation link
function setActiveNavLink(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Initialize TinyMCE editors
function initializeTinyMCE() {
    tinymce.init({
        selector: '.tinymce-editor',
        height: 300,
        menubar: false,
        plugins: [
            'advlist autolink lists link image charmap print preview anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table paste code help wordcount'
        ],
        toolbar: 'undo redo | formatselect | bold italic backcolor | \
                 alignleft aligncenter alignright alignjustify | \
                 bullist numlist outdent indent | removeformat | help',
        setup: function(editor) {
            editor.on('change', function() {
                autoSave();
            });
            editor.on('init', function() {
                // Load initial content for TinyMCE fields
                const id = editor.id;
                const content = websiteData.content?.[id]; // Assuming content is stored by element ID
                if (content) {
                    editor.setContent(content);
                }
            });
        }
    });
}

// Load current website settings
async function loadCurrentSettings() {
    // Load color settings
    // This part might need to fetch from Firebase first
    // For now, it loads from localStorage or defaults
    loadSettingsFromStorage();

    if (currentUser) {
        try {
            const settingsDoc = await db.collection('website').doc('settings').get();
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                applySettings(settings);
            }
        } catch (error) {
            console.error('Error loading settings from Firebase:', error);
        }
    }
}

// Load settings from storage (localStorage fallback)
function loadSettingsFromStorage() {
    const savedSettings = localStorage.getItem('websiteSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        applySettings(settings);
    }
}

// Apply settings to the interface
function applySettings(settings) {
    Object.keys(settings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = settings[key];
            } else {
                element.value = settings[key];
            }
            // Trigger change for immediate visual update
            if (element.onchange) {
                element.onchange();
            }
        }
    });
}

// Update header color
function updateHeaderColor(color) {
    document.documentElement.style.setProperty('--header-bg-color', color);
    saveSettings();
    postMessageToMainWebsite({
        type: 'updateStyle',
        selector: '.header',
        property: 'background-color',
        value: color
    });
}

// Update footer color
function updateFooterColor(color) {
    document.documentElement.style.setProperty('--footer-bg-color', color);
    saveSettings();
    postMessageToMainWebsite({
        type: 'updateStyle',
        selector: '.footer',
        property: 'background-color',
        value: color
    });
}

// Update session color
function updateSessionColor(sessionId, color) {
    document.documentElement.style.setProperty(`--${sessionId}-bg-color`, color);
    saveSettings();
    postMessageToMainWebsite({
        type: 'updateStyle',
        selector: `.${sessionId}`,
        property: 'background-color',
        value: color
    });
}

// Update font size
function updateFontSize(elementId, size) {
    document.documentElement.style.setProperty(`--${elementId}-font-size`, size);
    saveSettings();
    postMessageToMainWebsite({
        type: 'updateStyle',
        selector: `#${elementId}`,
        property: 'font-size',
        value: size
    });
}

// Update section heading size
function updateSectionHeadingSize(size) {
    document.documentElement.style.setProperty('--section-heading-size', size);
    saveSettings();
    postMessageToMainWebsite({
        type: 'updateStyle',
        selector: '.section-heading',
        property: 'font-size',
        value: size
    });
}

// Update body font
function updateBodyFont(font) {
    document.documentElement.style.setProperty('--body-font', font);
    saveSettings();
    postMessageToMainWebsite({
        type: 'updateStyle',
        selector: 'body',
        property: 'font-family',
        value: font
    });
}

// Update hero animation
function updateHeroAnimation(animation) {
    saveSettings();
    postMessageToMainWebsite({
        type: 'updateAnimation',
        selector: '.hero-image',
        animation: animation
    });
}

// Update card hover effect
function updateCardHover(effect) {
    saveSettings();
    postMessageToMainWebsite({
        type: 'updateHover',
        selector: '.card',
        effect: effect
    });
}

// Update grid layout for Session 5
function updateGridLayout(columns) {
    saveSettings();
    postMessageToMainWebsite({
        type: 'updateGridLayout',
        sessionId: 'session5',
        columns: columns
    });
}

// Toggle social media visibility
function toggleSocialMedia(show) {
    saveSettings();
    postMessageToMainWebsite({
        type: 'toggleElement',
        selector: '.social-icons',
        show: show
    });
}

// Toggle section visibility (for sessions 6 and 7)
function toggleSection(sectionId, show) {
    saveSettings();
    postMessageToMainWebsite({
        type: 'toggleElement',
        selector: `#${sectionId}`,
        show: show
    });
}

// Toggle individual column visibility
function toggleColumnVisibility(columnId, show) {
    saveSettings(); // Save the state of the checkbox
    postMessageToMainWebsite({
        type: 'toggleElement',
        selector: `#${columnId}`,
        show: show
    });
}

// Show content tab
function showContentTab(tabId) {
    // Hide all content tabs
    document.querySelectorAll('.content-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.content-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Set active tab button
    event.target.classList.add('active');
    
    // Load content for the tab
    loadContentForTab(tabId);
}

// Load content for specific tab
async function loadContentForTab(tabId) {
    const sessionId = tabId.replace('-content', '');
    
    // Fetch content from Firebase first
    if (currentUser) {
        try {
            const doc = await db.collection('website').doc('content').get();
            if (doc.exists) {
                websiteData = doc.data();
            }
        } catch (error) {
            console.error('Error loading website data for tab:', error);
        }
    }

    // Populate form fields based on loaded data
    const sessionContent = websiteData[sessionId] || {};

    switch (sessionId) {
        case 'session1':
            document.getElementById('edit-session1-title1').value = sessionContent.title1 || 'Welcome to Our Professional Website';
            document.getElementById('edit-session1-title2').value = sessionContent.title2 || 'Your Success is Our Priority';
            break;
        case 'session2':
            document.getElementById('edit-session2-heading').value = sessionContent.heading || 'Our Services';
            document.getElementById('edit-session2-col1-heading').value = sessionContent.col1Heading || 'Web Development';
            tinymce.get('edit-session2-col1-content')?.setContent(sessionContent.col1Content || 'Professional web development services with modern technologies and responsive design.');
            document.getElementById('edit-session2-col2-heading').value = sessionContent.col2Heading || 'Digital Marketing';
            tinymce.get('edit-session2-col2-content')?.setContent(sessionContent.col2Content || 'Comprehensive digital marketing strategies to grow your business online.');
            document.getElementById('edit-session2-col3-heading').value = sessionContent.col3Heading || 'Consulting';
            tinymce.get('edit-session2-col3-content')?.setContent(sessionContent.col3Content || 'Expert business consulting to help you make informed decisions.');
            break;
        case 'session3':
            document.getElementById('edit-session3-heading').value = sessionContent.heading || 'About Our Company';
            document.getElementById('edit-session3-col1-heading').value = sessionContent.col1Heading || 'About Our Company';
            tinymce.get('edit-session3-col1-content')?.setContent(sessionContent.col1Content || 'We are a leading company in providing innovative solutions for businesses worldwide. Our team of experts is dedicated to delivering exceptional results.');
            document.getElementById('edit-session3-col2-part1-heading').value = sessionContent.col2Part1Heading || 'Our Mission';
            tinymce.get('edit-session3-col2-part1-content')?.setContent(sessionContent.col2Part1Content || 'To empower businesses with cutting-edge technology and strategic insights.');
            document.getElementById('edit-session3-col2-part2-heading').value = sessionContent.col2Part2Heading || 'Our Vision';
            tinymce.get('edit-session3-col2-part2-content')?.setContent(sessionContent.col2Part2Content || 'To be the global leader in digital transformation and business innovation.');
            document.getElementById('edit-session3-col3-heading').value = sessionContent.col3Heading || 'Our Values'; // New column
            tinymce.get('edit-session3-col3-content')?.setContent(sessionContent.col3Content || 'Integrity, innovation, and customer satisfaction are at the core of everything we do. We believe in building lasting relationships with our clients.'); // New column
            document.getElementById('edit-session3-col3-readmore').checked = sessionContent.col3Readmore || false; // New column readmore
            break;
        case 'session4':
            document.getElementById('edit-session4-heading').value = sessionContent.heading || 'Our Expertise';
            document.getElementById('edit-session4-col1-heading').value = sessionContent.col1Heading || 'Our Expertise';
            tinymce.get('edit-session4-col1-content')?.setContent(sessionContent.col1Content || 'With years of experience in the industry, we have developed expertise in various domains including technology, marketing, and business strategy.');
            document.getElementById('edit-session4-col2-heading').value = sessionContent.col2Heading || 'Why Choose Us';
            tinymce.get('edit-session4-col2-content')?.setContent(sessionContent.col2Content || 'We offer personalized solutions, 24/7 support, and proven results. Our client-centric approach ensures your success is our top priority.');
            document.getElementById('edit-session4-col3-heading').value = sessionContent.col3Heading || 'Our Process'; // New column
            tinymce.get('edit-session4-col3-content')?.setContent(sessionContent.col3Content || 'Our streamlined process ensures efficient project delivery from conception to completion, keeping you informed every step of the way.'); // New column
            document.getElementById('edit-session4-col3-readmore').checked = sessionContent.col3Readmore || false; // New column readmore
            break;
        case 'session5':
            document.getElementById('edit-session5-heading').value = sessionContent.heading || 'Our Portfolio';
            document.getElementById('edit-session5-col1-heading').value = sessionContent.col1Heading || 'Project Alpha';
            tinymce.get('edit-session5-col1-content')?.setContent(sessionContent.col1Content || 'Innovative web application development.');
            document.getElementById('edit-session5-col2-heading').value = sessionContent.col2Heading || 'Project Beta';
            tinymce.get('edit-session5-col2-content')?.setContent(sessionContent.col2Content || 'Mobile app development and deployment.');
            document.getElementById('edit-session5-col3-heading').value = sessionContent.col3Heading || 'Project Gamma';
            tinymce.get('edit-session5-col3-content')?.setContent(sessionContent.col3Content || 'E-commerce platform optimization.');
            document.getElementById('edit-session5-col4-heading').value = sessionContent.col4Heading || 'Project Delta';
            tinymce.get('edit-session5-col4-content')?.setContent(sessionContent.col4Content || 'Digital marketing campaign success.');
            break;
        case 'session6': // Photo Gallery
            document.getElementById('edit-session6-heading').value = sessionContent.heading || 'Our Photo Gallery';
            renderGalleryItems('session6', sessionContent.items || []);
            break;
        case 'session7': // Video Gallery
            document.getElementById('edit-session7-heading').value = sessionContent.heading || 'Our Video Gallery';
            renderGalleryItems('session7', sessionContent.items || []);
            break;
    }
}

// Save session content
function saveSessionContent(sessionId) {
    const contentData = {};
    
    switch (sessionId) {
        case 'session1':
            contentData.title1 = document.getElementById('edit-session1-title1').value;
            contentData.title2 = document.getElementById('edit-session1-title2').value;
            break;
        case 'session2':
            contentData.heading = document.getElementById('edit-session2-heading').value;
            contentData.col1Heading = document.getElementById('edit-session2-col1-heading').value;
            contentData.col1Content = tinymce.get('edit-session2-col1-content')?.getContent() || '';
            contentData.col2Heading = document.getElementById('edit-session2-col2-heading').value;
            contentData.col2Content = tinymce.get('edit-session2-col2-content')?.getContent() || '';
            contentData.col3Heading = document.getElementById('edit-session2-col3-heading').value;
            contentData.col3Content = tinymce.get('edit-session2-col3-content')?.getContent() || '';
            break;
        case 'session3':
            contentData.heading = document.getElementById('edit-session3-heading').value;
            contentData.col1Heading = document.getElementById('edit-session3-col1-heading').value;
            contentData.col1Content = tinymce.get('edit-session3-col1-content')?.getContent() || '';
            contentData.col2Part1Heading = document.getElementById('edit-session3-col2-part1-heading').value;
            contentData.col2Part1Content = tinymce.get('edit-session3-col2-part1-content')?.getContent() || '';
            contentData.col2Part2Heading = document.getElementById('edit-session3-col2-part2-heading').value;
            contentData.col2Part2Content = tinymce.get('edit-session3-col2-part2-content')?.getContent() || '';
            contentData.col3Heading = document.getElementById('edit-session3-col3-heading').value; // New column
            contentData.col3Content = tinymce.get('edit-session3-col3-content')?.getContent() || ''; // New column
            contentData.col3Readmore = document.getElementById('edit-session3-col3-readmore').checked; // New column readmore
            break;
        case 'session4':
            contentData.heading = document.getElementById('edit-session4-heading').value;
            contentData.col1Heading = document.getElementById('edit-session4-col1-heading').value;
            contentData.col1Content = tinymce.get('edit-session4-col1-content')?.getContent() || '';
            contentData.col2Heading = document.getElementById('edit-session4-col2-heading').value;
            contentData.col2Content = tinymce.get('edit-session4-col2-content')?.getContent() || '';
            contentData.col3Heading = document.getElementById('edit-session4-col3-heading').value; // New column
            contentData.col3Content = tinymce.get('edit-session4-col3-content')?.getContent() || ''; // New column
            contentData.col3Readmore = document.getElementById('edit-session4-col3-readmore').checked; // New column readmore
            break;
        case 'session5':
            contentData.heading = document.getElementById('edit-session5-heading').value;
            contentData.col1Heading = document.getElementById('edit-session5-col1-heading').value;
            contentData.col1Content = tinymce.get('edit-session5-col1-content')?.getContent() || '';
            contentData.col2Heading = document.getElementById('edit-session5-col2-heading').value;
            contentData.col2Content = tinymce.get('edit-session5-col2-content')?.getContent() || '';
            contentData.col3Heading = document.getElementById('edit-session5-col3-heading').value;
            contentData.col3Content = tinymce.get('edit-session5-col3-content')?.getContent() || '';
            contentData.col4Heading = document.getElementById('edit-session5-col4-heading').value;
            contentData.col4Content = tinymce.get('edit-session5-col4-content')?.getContent() || '';
            break;
        case 'session6': // Photo Gallery
            contentData.heading = document.getElementById('edit-session6-heading').value;
            contentData.items = websiteData.session6?.items || []; // Get current items
            break;
        case 'session7': // Video Gallery
            contentData.heading = document.getElementById('edit-session7-heading').value;
            contentData.items = websiteData.session7?.items || []; // Get current items
            break;
    }
    
    // Save to Firebase
    saveContentToFirebase(sessionId, contentData);
    
    // Update main website
    updateMainWebsite(sessionId, contentData);
    
    showSuccessMessage('Content saved successfully!');
}

// Add gallery item (image or video URL)
function addGalleryItem(sessionId) {
    let urlInputId = '';
    let type = '';
    if (sessionId === 'session6') {
        urlInputId = 'session6-image-url';
        type = 'image';
    } else if (sessionId === 'session7') {
        urlInputId = 'session7-video-url';
        type = 'video';
    }

    const url = document.getElementById(urlInputId).value;
    if (url) {
        if (!websiteData[sessionId]) {
            websiteData[sessionId] = { items: [] };
        }
        websiteData[sessionId].items.push({ url: url, type: type });
        renderGalleryItems(sessionId, websiteData[sessionId].items);
        document.getElementById(urlInputId).value = ''; // Clear input
        showSuccessMessage('Gallery item added!');
    } else {
        showErrorMessage('Please enter a valid URL.');
    }
}

// Render gallery items in admin panel
function renderGalleryItems(sessionId, items) {
    const galleryList = document.getElementById(`${sessionId}-gallery-list`);
    galleryList.innerHTML = '';
    items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'gallery-item';
        itemDiv.innerHTML = `
            <span>${item.url} (${item.type})</span>
            <button class="btn btn-danger btn-small" onclick="removeGalleryItem('${sessionId}', ${index})">Remove</button>
        `;
        galleryList.appendChild(itemDiv);
    });
}

// Remove gallery item
function removeGalleryItem(sessionId, index) {
    if (confirm('Are you sure you want to remove this item?')) {
        if (websiteData[sessionId] && websiteData[sessionId].items) {
            websiteData[sessionId].items.splice(index, 1);
            renderGalleryItems(sessionId, websiteData[sessionId].items);
            saveSessionContent(sessionId); // Save changes to Firebase
            showSuccessMessage('Gallery item removed!');
        }
    }
}


// Show media tab
function showMediaTab(tabId) {
    document.querySelectorAll('.media-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.media-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

// Handle image upload
async function handleImageUpload(files) {
    for (let file of files) {
        try {
            const url = await uploadImageToFirebase(file);
            console.log('Image uploaded:', url);
            showSuccessMessage('Image uploaded successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            showErrorMessage('Failed to upload image: ' + error.message);
        }
    }
}

// Assign image to element
async function assignImage(input, elementId) {
    const file = input.files[0];
    if (file) {
        try {
            const url = await uploadImageToFirebase(file);
            
            // Update preview
            const preview = document.getElementById(`preview-${elementId}`);
            if (preview) {
                preview.src = url;
            }
            
            // Update main website
            postMessageToMainWebsite({
                type: 'updateImage',
                elementId: elementId,
                url: url
            });
            
            // Save to Firebase
            await saveImageAssignment(elementId, url);
            
            showSuccessMessage('Image assigned successfully!');
        } catch (error) {
            console.error('Error assigning image:', error);
            showErrorMessage('Failed to assign image: ' + error.message);
        }
    }
}

// Upload image to Firebase Storage
async function uploadImageToFirebase(file) {
    const storageRef = storage.ref().child(`images/${Date.now()}_${file.name}`);
    const snapshot = await storageRef.put(file);
    return await snapshot.ref.getDownloadURL();
}

// Save image assignment to Firebase
async function saveImageAssignment(elementId, url) {
    await db.collection('website').doc('images').set({
        [elementId]: url
    }, { merge: true });
}

// Embed YouTube video
function embedYouTubeVideo() {
    const url = document.getElementById('youtube-url').value;
    if (url) {
        postMessageToMainWebsite({
            type: 'embedVideo',
            url: url,
            containerId: 'session2-video-container'
        });
        showSuccessMessage('YouTube video embedded successfully!');
    }
}

// Handle video upload
async function handleVideoUpload(file) {
    try {
        const url = await uploadVideoToFirebase(file);
        console.log('Video uploaded:', url);
        showSuccessMessage('Video uploaded successfully!');
    } catch (error) {
        console.error('Video upload error:', error);
        showErrorMessage('Failed to upload video: ' + error.message);
    }
}

// Upload video to Firebase Storage
async function uploadVideoToFirebase(file) {
    const storageRef = storage.ref().child(`videos/${Date.now()}_${file.name}`);
    const snapshot = await storageRef.put(file);
    return await snapshot.ref.getDownloadURL();
}

// Show code tab
function showCodeTab(tabId) {
    document.querySelectorAll('.code-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.code-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

// Save custom code
async function saveCustomCode() {
    const htmlCode = document.getElementById('custom-html').value;
    const cssCode = document.getElementById('custom-css').value;
    const jsCode = document.getElementById('custom-js').value;
    
    try {
        await db.collection('website').doc('customCode').set({
            html: htmlCode,
            css: cssCode,
            javascript: jsCode,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showSuccessMessage('Custom code saved successfully!');
    } catch (error) {
        console.error('Error saving custom code:', error);
        showErrorMessage('Failed to save custom code: ' + error.message);
    }
}

// Preview custom code
function previewCustomCode() {
    const htmlCode = document.getElementById('custom-html').value;
    const cssCode = document.getElementById('custom-css').value;
    const jsCode = document.getElementById('custom-js').value;
    
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Custom Code Preview</title>
            <style>${cssCode}</style>
        </head>
        <body>
            ${htmlCode}
            <script>${jsCode}</script>
        </body>
        </html>
    `);
}

// Generate custom page
async function generateCustomPage() {
    const htmlCode = document.getElementById('custom-html').value;
    const cssCode = document.getElementById('custom-css').value;
    const jsCode = document.getElementById('custom-js').value;
    
    const pageId = 'custom-' + Date.now();
    const pageContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Custom Page</title>
            <style>${cssCode}</style>
        </head>
        <body>
            ${htmlCode}
            <script>${jsCode}</script>
        </body>
        </html>
    `;
    
    try {
        await db.collection('customPages').doc(pageId).set({
            content: pageContent,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const pageUrl = `custom.html?id=${pageId}`;
        showSuccessMessage(`Custom page generated! URL: ${pageUrl}`);
        
        // Open the generated page
        window.open(pageUrl, '_blank');
    } catch (error) {
        console.error('Error generating custom page:', error);
        showErrorMessage('Failed to generate custom page: ' + error.message);
    }
}

// Add menu item
function addMenuItem() {
    const name = prompt('Enter menu item name:');
    const url = prompt('Enter menu item URL:');
    
    if (name && url) {
        const menuItem = {
            id: Date.now().toString(),
            name: name,
            url: url,
            order: menuItems.length
        };
        
        menuItems.push(menuItem);
        saveMenuItems();
        renderMenuItems();
        showSuccessMessage('Menu item added successfully!');
    }
}

// Render menu items
function renderMenuItems() {
    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = '';
    
    menuItems.forEach(item => {
        const menuItemDiv = document.createElement('div');
        menuItemDiv.className = 'menu-item';
        menuItemDiv.innerHTML = `
            <div class="menu-item-content">
                <strong>${item.name}</strong>
                <br>
                <small>${item.url}</small>
            </div>
            <div class="menu-item-actions">
                <button onclick="editMenuItem('${item.id}')" class="btn btn-primary">Edit</button>
                <button onclick="deleteMenuItem('${item.id}')" class="btn btn-danger">Delete</button>
            </div>
        `;
        menuList.appendChild(menuItemDiv);
    });
}

// Edit menu item
function editMenuItem(id) {
    const item = menuItems.find(item => item.id === id);
    if (item) {
        const newName = prompt('Enter new name:', item.name);
        const newUrl = prompt('Enter new URL:', item.url);
        
        if (newName && newUrl) {
            item.name = newName;
            item.url = newUrl;
            saveMenuItems();
            renderMenuItems();
            showSuccessMessage('Menu item updated successfully!');
        }
    }
}

// Delete menu item
function deleteMenuItem(id) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        menuItems = menuItems.filter(item => item.id !== id);
        saveMenuItems();
        renderMenuItems();
        showSuccessMessage('Menu item deleted successfully!');
    }
}

// Save menu items to Firebase
async function saveMenuItems() {
    try {
        await db.collection('website').doc('menu').set({
            items: menuItems
        });
        postMessageToMainWebsite({
            type: 'updateMenu',
            menuItems: menuItems
        });
    } catch (error) {
        console.error('Error saving menu items:', error);
    }
}

// Load admin data
async function loadAdminData() {
    try {
        // Load menu items
        const menuDoc = await db.collection('website').doc('menu').get();
        if (menuDoc.exists) {
            menuItems = menuDoc.data().items || [];
            renderMenuItems();
        }
        
        // Load other admin data
        await loadWebsiteData(); // Ensure websiteData is loaded before applying settings
        await loadCurrentSettings(); // This will apply all settings including column visibility
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

// Load website data (content)
async function loadWebsiteData() {
    try {
        const doc = await db.collection('website').doc('content').get();
        if (doc.exists) {
            websiteData = doc.data();
            // After loading websiteData, re-initialize TinyMCE to populate content
            initializeTinyMCE();
        }
    } catch (error) {
        console.error('Error loading website data:', error);
    }
}

// Save content to Firebase
async function saveContentToFirebase(sessionId, contentData) {
    try {
        await db.collection('website').doc('content').set({
            [sessionId]: contentData
        }, { merge: true });
    } catch (error) {
        console.error('Error saving content to Firebase:', error);
        throw error;
    }
}

// Post message to main website (index.html)
function postMessageToMainWebsite(message) {
    if (window.opener) {
        window.opener.postMessage(message, '*');
    }
}

// Save all settings from the admin panel
function saveSettings() {
    const settings = {
        'header-bg-color': document.getElementById('header-bg-color')?.value,
        'footer-bg-color': document.getElementById('footer-bg-color')?.value,
        'session1-bg-color': document.getElementById('session1-bg-color')?.value,
        'session2-bg-color': document.getElementById('session2-bg-color')?.value,
        'session3-bg-color': document.getElementById('session3-bg-color')?.value, // Added
        'session4-bg-color': document.getElementById('session4-bg-color')?.value, // Added
        'session5-bg-color': document.getElementById('session5-bg-color')?.value, // Added
        'session6-bg-color': document.getElementById('session6-bg-color')?.value, // Added
        'session7-bg-color': document.getElementById('session7-bg-color')?.value, // Added
        'main-title-size': document.getElementById('main-title-size')?.value,
        'section-heading-size': document.getElementById('section-heading-size')?.value,
        'body-font': document.getElementById('body-font')?.value,
        'hero-animation': document.getElementById('hero-animation')?.value,
        'card-hover': document.getElementById('card-hover')?.value,
        'session5-layout': document.getElementById('session5-layout')?.value,
        'show-social': document.getElementById('show-social')?.checked,
        'show-session6': document.getElementById('show-session6')?.checked,
        'show-session7': document.getElementById('show-session7')?.checked,
        // Column visibility settings
        'show-session2-col1': document.getElementById('show-session2-col1')?.checked,
        'show-session2-col2': document.getElementById('show-session2-col2')?.checked,
        'show-session2-col3': document.getElementById('show-session2-col3')?.checked,
        'show-session3-col1': document.getElementById('show-session3-col1')?.checked,
        'show-session3-col2': document.getElementById('show-session3-col2')?.checked,
        'show-session3-col3': document.getElementById('show-session3-col3')?.checked, // New column
        'show-session4-col1': document.getElementById('show-session4-col1')?.checked,
        'show-session4-col2': document.getElementById('show-session4-col2')?.checked,
        'show-session4-col3': document.getElementById('show-session4-col3')?.checked, // New column
        'show-session5-col1': document.getElementById('show-session5-col1')?.checked,
        'show-session5-col2': document.getElementById('show-session5-col2')?.checked,
        'show-session5-col3': document.getElementById('show-session5-col3')?.checked,
        'show-session5-col4': document.getElementById('show-session5-col4')?.checked,
        'show-session6-gallery': document.getElementById('show-session6-gallery')?.checked,
        'show-session7-gallery': document.getElementById('show-session7-gallery')?.checked,
    };
    
    localStorage.setItem('websiteSettings', JSON.stringify(settings));
    
    // Also save to Firebase
    if (currentUser) {
        db.collection('website').doc('settings').set(settings).catch(console.error);
    }
}

// Auto-save functionality
function autoSave() {
    saveSettings();
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show success message
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Show error message
function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Logout function
function logout() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
}
