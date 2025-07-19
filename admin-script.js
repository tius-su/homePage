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
            window.location.href = 'index.html';
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
        }
    });
}

// Load current website settings
function loadCurrentSettings() {
    // Load color settings
    const headerBgColor = getComputedStyle(document.documentElement).getPropertyValue('--header-bg-color') || '#2c3e50';
    document.getElementById('header-bg-color').value = headerBgColor;
    
    // Load other settings from localStorage or Firebase
    loadSettingsFromStorage();
}

// Load settings from storage
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
            element.value = settings[key];
        }
    });
}

// Update header color
function updateHeaderColor(color) {
    document.documentElement.style.setProperty('--header-bg-color', color);
    saveSettings();
    
    // Apply to main website if in iframe or popup
    if (window.opener) {
        window.opener.postMessage({
            type: 'updateStyle',
            selector: '.header',
            property: 'background-color',
            value: color
        }, '*');
    }
}

// Update footer color
function updateFooterColor(color) {
    document.documentElement.style.setProperty('--footer-bg-color', color);
    saveSettings();
    
    if (window.opener) {
        window.opener.postMessage({
            type: 'updateStyle',
            selector: '.footer',
            property: 'background-color',
            value: color
        }, '*');
    }
}

// Update session color
function updateSessionColor(sessionId, color) {
    document.documentElement.style.setProperty(`--${sessionId}-bg-color`, color);
    saveSettings();
    
    if (window.opener) {
        window.opener.postMessage({
            type: 'updateStyle',
            selector: `.${sessionId}`,
            property: 'background-color',
            value: color
        }, '*');
    }
}

// Update font size
function updateFontSize(elementId, size) {
    document.documentElement.style.setProperty(`--${elementId}-font-size`, size);
    saveSettings();
    
    if (window.opener) {
        window.opener.postMessage({
            type: 'updateStyle',
            selector: `#${elementId}`,
            property: 'font-size',
            value: size
        }, '*');
    }
}

// Update section heading size
function updateSectionHeadingSize(size) {
    document.documentElement.style.setProperty('--section-heading-size', size);
    saveSettings();
    
    if (window.opener) {
        window.opener.postMessage({
            type: 'updateStyle',
            selector: '.section-heading',
            property: 'font-size',
            value: size
        }, '*');
    }
}

// Update body font
function updateBodyFont(font) {
    document.documentElement.style.setProperty('--body-font', font);
    saveSettings();
    
    if (window.opener) {
        window.opener.postMessage({
            type: 'updateStyle',
            selector: 'body',
            property: 'font-family',
            value: font
        }, '*');
    }
}

// Update hero animation
function updateHeroAnimation(animation) {
    saveSettings();
    
    if (window.opener) {
        window.opener.postMessage({
            type: 'updateAnimation',
            selector: '.hero-image',
            animation: animation
        }, '*');
    }
}

// Update card hover effect
function updateCardHover(effect) {
    saveSettings();
    
    if (window.opener) {
        window.opener.postMessage({
            type: 'updateHover',
            selector: '.card',
            effect: effect
        }, '*');
    }
}

// Update grid layout
function updateGridLayout(columns) {
    saveSettings();
    
    if (window.opener) {
        window.opener.postMessage({
            type: 'updateGridLayout',
            columns: columns
        }, '*');
    }
}

// Toggle social media visibility
function toggleSocialMedia(show) {
    saveSettings();
    
    if (window.opener) {
        window.opener.postMessage({
            type: 'toggleElement',
            selector: '.social-icons',
            show: show
        }, '*');
    }
}

// Toggle section visibility
function toggleSection(sectionId, show) {
    saveSettings();
    
    if (window.opener) {
        window.opener.postMessage({
            type: 'toggleElement',
            selector: `#${sectionId}`,
            show: show
        }, '*');
    }
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
function loadContentForTab(tabId) {
    const sessionNumber = tabId.replace('-content', '');
    
    // Load current content from main website
    if (sessionNumber === 'session1') {
        loadSession1Content();
    } else if (sessionNumber === 'session2') {
        loadSession2Content();
    }
    // Add more session content loaders as needed
}

// Load Session 1 content
function loadSession1Content() {
    // This would typically load from Firebase or the main website
    // For now, we'll use placeholder values
    document.getElementById('edit-session1-title1').value = 'Welcome to Our Professional Website';
    document.getElementById('edit-session1-title2').value = 'Your Success is Our Priority';
}

// Load Session 2 content
function loadSession2Content() {
    document.getElementById('edit-session2-heading').value = 'Our Services';
    document.getElementById('edit-session2-col1-heading').value = 'Web Development';
    document.getElementById('edit-session2-col2-heading').value = 'Digital Marketing';
    document.getElementById('edit-session2-col3-heading').value = 'Consulting';
    
    // Load TinyMCE content
    tinymce.get('edit-session2-col1-content')?.setContent('Professional web development services with modern technologies and responsive design.');
    tinymce.get('edit-session2-col2-content')?.setContent('Comprehensive digital marketing strategies to grow your business online.');
    tinymce.get('edit-session2-col3-content')?.setContent('Expert business consulting to help you make informed decisions.');
}

// Save session content
function saveSessionContent(sessionId) {
    const contentData = {};
    
    if (sessionId === 'session1') {
        contentData.title1 = document.getElementById('edit-session1-title1').value;
        contentData.title2 = document.getElementById('edit-session1-title2').value;
    } else if (sessionId === 'session2') {
        contentData.heading = document.getElementById('edit-session2-heading').value;
        contentData.col1Heading = document.getElementById('edit-session2-col1-heading').value;
        contentData.col2Heading = document.getElementById('edit-session2-col2-heading').value;
        contentData.col3Heading = document.getElementById('edit-session2-col3-heading').value;
        contentData.col1Content = tinymce.get('edit-session2-col1-content')?.getContent() || '';
        contentData.col2Content = tinymce.get('edit-session2-col2-content')?.getContent() || '';
        contentData.col3Content = tinymce.get('edit-session2-col3-content')?.getContent() || '';
    }
    
    // Save to Firebase
    saveContentToFirebase(sessionId, contentData);
    
    // Update main website
    updateMainWebsite(sessionId, contentData);
    
    showSuccessMessage('Content saved successfully!');
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
            if (window.opener) {
                window.opener.postMessage({
                    type: 'updateImage',
                    elementId: elementId,
                    url: url
                }, '*');
            }
            
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
        if (window.opener) {
            window.opener.postMessage({
                type: 'embedVideo',
                url: url,
                containerId: 'session2-video-container'
            }, '*');
        }
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
        loadWebsiteData();
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

// Load website data
async function loadWebsiteData() {
    try {
        const doc = await db.collection('website').doc('content').get();
        if (doc.exists) {
            websiteData = doc.data();
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

// Update main website
function updateMainWebsite(sessionId, contentData) {
    if (window.opener) {
        window.opener.postMessage({
            type: 'updateContent',
            sessionId: sessionId,
            data: contentData
        }, '*');
    }
}

// Save settings
function saveSettings() {
    const settings = {
        'header-bg-color': document.getElementById('header-bg-color')?.value,
        'footer-bg-color': document.getElementById('footer-bg-color')?.value,
        'session1-bg-color': document.getElementById('session1-bg-color')?.value,
        'session2-bg-color': document.getElementById('session2-bg-color')?.value,
        'main-title-size': document.getElementById('main-title-size')?.value,
        'section-heading-size': document.getElementById('section-heading-size')?.value,
        'body-font': document.getElementById('body-font')?.value,
        'hero-animation': document.getElementById('hero-animation')?.value,
        'card-hover': document.getElementById('card-hover')?.value,
        'session5-layout': document.getElementById('session5-layout')?.value,
        'show-social': document.getElementById('show-social')?.checked,
        'show-session6': document.getElementById('show-session6')?.checked,
        'show-session7': document.getElementById('show-session7')?.checked
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