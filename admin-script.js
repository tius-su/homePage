// Admin Panel JavaScript
let currentUser = null;
let websiteData = {}; // Stores content data
let websiteSettings = {}; // Stores design and visibility settings
let menuItems = [];

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
    setupAdminEventListeners();
    checkAuthentication();
    initializeTinyMCE(); // Initialize TinyMCE early
});

// Check if user is authenticated
function checkAuthentication() {
    // Check if Firebase is initialized or using mock
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.warn("Firebase not initialized. Ensure firebase-config.js is loaded correctly.");
        // Fallback for StackBlitz or similar environments where Firebase might be mocked
        if (window.auth) {
            auth.onAuthStateChanged(user => {
                if (user) {
                    currentUser = user;
                    console.log('Admin logged in (mock):', user.email);
                    loadAdminData();
                } else {
                    console.log('Admin not logged in (mock). Redirecting to index.html.');
                    window.location.href = 'index.html';
                }
            });
        } else {
            console.error("Mock Firebase 'auth' object not found. Cannot check authentication.");
            window.location.href = 'index.html'; // Redirect if no auth mechanism
        }
        return;
    }

    // Actual Firebase authentication check
    const app = firebase.app();
    auth = firebase.auth(app);
    db = firebase.firestore(app);
    storage = firebase.storage(app);

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            console.log('Admin logged in:', user.email);
            loadAdminData();
        } else {
            // Redirect to login if not authenticated
            // Only redirect if the current page is admin.html
            if (window.location.pathname.includes('admin.html')) {
                console.log('Admin not logged in. Redirecting to index.html.');
                window.location.href = 'index.html';
            }
        }
    });
}

// Initialize admin panel
function initializeAdmin() {
    // Initial load of settings will be handled by loadAdminData after auth check
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

    // Auto-save functionality for form inputs
    document.addEventListener('input', debounce(autoSave, 1000));
    document.addEventListener('change', debounce(autoSave, 1000)); // Crucial for checkboxes and selects
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
                autoSave(); // Auto-save on editor content change
            });
            editor.on('init', function() {
                // When editor initializes, try to load its content from websiteData
                const editorId = editor.id;
                const contentKey = editorId.replace('edit-', ''); // e.g., session2-col1-content
                
                // Determine session and column from ID
                const parts = contentKey.split('-');
                if (parts.length >= 3) {
                    const sessionId = parts[0]; // e.g., session2
                    const colKey = parts.slice(1).join('-'); // e.g., col1-content

                    if (websiteData[sessionId] && websiteData[sessionId][colKey]) {
                        editor.setContent(websiteData[sessionId][colKey]);
                    }
                }
            });
        }
    });
}

// Load all admin data (settings, content, images, menu) from Firebase
async function loadAdminData() {
    try {
        // Load settings
        const settingsDoc = await db.collection('website').doc('settings').get();
        if (settingsDoc.exists) {
            websiteSettings = settingsDoc.data();
            applySettingsToAdminPanel(websiteSettings);
        }

        // Load content
        const contentDoc = await db.collection('website').doc('content').get();
        if (contentDoc.exists) {
            websiteData = contentDoc.data();
            // Re-initialize TinyMCE to ensure content is loaded into editors
            tinymce.activeEditor?.setContent(''); // Clear current editor content first
            tinymce.remove('.tinymce-editor'); // Destroy existing instances
            initializeTinyMCE(); // Re-initialize all editors
            loadContentForTab(document.querySelector('.content-tabs .tab-btn.active')?.id || 'session1-content'); // Load content for active tab
        }

        // Load image assignments
        const imagesDoc = await db.collection('website').doc('images').get();
        if (imagesDoc.exists) {
            const images = imagesDoc.data();
            Object.keys(images).forEach(elementId => {
                const preview = document.getElementById(`preview-${elementId}`);
                if (preview) {
                    preview.src = images[elementId];
                }
            });
        }

        // Load menu items
        const menuDoc = await db.collection('website').doc('menu').get();
        if (menuDoc.exists) {
            menuItems = menuDoc.data().items || [];
            renderMenuItems();
        }

        showSuccessMessage('Admin data loaded successfully!');
    } catch (error) {
        console.error('Error loading admin data:', error);
        showErrorMessage('Failed to load admin data: ' + error.message);
    }
}

// Apply loaded settings to the admin panel UI
function applySettingsToAdminPanel(settings) {
    Object.keys(settings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = settings[key];
            } else {
                element.value = settings[key];
            }
        }
    });
}

// Update header color
function updateHeaderColor(color) {
    document.documentElement.style.setProperty('--header-bg-color', color);
    saveSettings();
}

// Update footer color
function updateFooterColor(color) {
    document.documentElement.style.setProperty('--footer-bg-color', color);
    saveSettings();
}

// Update session color
function updateSessionColor(sessionId, color) {
    document.documentElement.style.setProperty(`--${sessionId}-bg-color`, color);
    saveSettings();
}

// Update font size
function updateFontSize(elementId, size) {
    // This directly affects admin panel preview, actual site uses CSS vars
    document.documentElement.style.setProperty(`--${elementId}-font-size`, size);
    saveSettings();
}

// Update section heading size
function updateSectionHeadingSize(size) {
    document.documentElement.style.setProperty('--section-heading-size', size);
    saveSettings();
}

// Update body font
function updateBodyFont(font) {
    document.documentElement.style.setProperty('--body-font', font);
    saveSettings();
}

// Update hero animation
function updateHeroAnimation(animation) {
    saveSettings();
}

// Update card hover effect
function updateCardHover(effect) {
    saveSettings();
}

// Update grid layout for Session 5
function updateGridLayout(columns) {
    saveSettings();
}

// Toggle social media visibility
function toggleSocialMedia(show) {
    saveSettings();
}

// Toggle section visibility (for sessions 6 and 7)
function toggleSection(sectionId, show) {
    saveSettings();
}

// Toggle individual column visibility
function toggleColumnVisibility(columnId, show) {
    saveSettings(); // Save the state of the checkbox
}

// Show content tab and load its data
async function showContentTab(tabId) {
    document.querySelectorAll('.content-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.content-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    
    await loadContentForTab(tabId);
}

// Load content for specific tab into TinyMCE and other inputs
async function loadContentForTab(tabId) {
    const sessionId = tabId.replace('-content', '');
    const sessionContent = websiteData[sessionId] || {};

    // Populate form fields based on loaded data
    // For TinyMCE, use tinymce.get(id)?.setContent()
    // For input/textarea, use .value
    // For checkbox, use .checked

    // Example for Session 2:
    if (sessionId === 'session1') {
        document.getElementById('edit-session1-title1').value = sessionContent.title1 || '';
        document.getElementById('edit-session1-title2').value = sessionContent.title2 || '';
    } else if (sessionId === 'session2') {
        document.getElementById('edit-session2-heading').value = sessionContent.heading || '';
        document.getElementById('edit-session2-col1-heading').value = sessionContent.col1Heading || '';
        tinymce.get('edit-session2-col1-content')?.setContent(sessionContent.col1Content || '');
        document.getElementById('edit-session2-col2-heading').value = sessionContent.col2Heading || '';
        tinymce.get('edit-session2-col2-content')?.setContent(sessionContent.col2Content || '');
        document.getElementById('edit-session2-col3-heading').value = sessionContent.col3Heading || '';
        tinymce.get('edit-session2-col3-content')?.setContent(sessionContent.col3Content || '');
    } else if (sessionId === 'session3') {
        document.getElementById('edit-session3-heading').value = sessionContent.heading || '';
        document.getElementById('edit-session3-col1-heading').value = sessionContent.col1Heading || '';
        tinymce.get('edit-session3-col1-content')?.setContent(sessionContent.col1Content || '');
        document.getElementById('edit-session3-col2-part1-heading').value = sessionContent.col2Part1Heading || '';
        tinymce.get('edit-session3-col2-part1-content')?.setContent(sessionContent.col2Part1Content || '');
        document.getElementById('edit-session3-col2-part2-heading').value = sessionContent.col2Part2Heading || '';
        tinymce.get('edit-session3-col2-part2-content')?.setContent(sessionContent.col2Part2Content || '');
        document.getElementById('edit-session3-col3-heading').value = sessionContent.col3Heading || '';
        tinymce.get('edit-session3-col3-content')?.setContent(sessionContent.col3Content || '');
        document.getElementById('edit-session3-col3-readmore').checked = sessionContent.col3Readmore || false;
    } else if (sessionId === 'session4') {
        document.getElementById('edit-session4-heading').value = sessionContent.heading || '';
        document.getElementById('edit-session4-col1-heading').value = sessionContent.col1Heading || '';
        tinymce.get('edit-session4-col1-content')?.setContent(sessionContent.col1Content || '');
        document.getElementById('edit-session4-col2-heading').value = sessionContent.col2Heading || '';
        tinymce.get('edit-session4-col2-content')?.setContent(sessionContent.col2Content || '');
        document.getElementById('edit-session4-col3-heading').value = sessionContent.col3Heading || '';
        tinymce.get('edit-session4-col3-content')?.setContent(sessionContent.col3Content || '');
        document.getElementById('edit-session4-col3-readmore').checked = sessionContent.col3Readmore || false;
    } else if (sessionId === 'session5') {
        document.getElementById('edit-session5-heading').value = sessionContent.heading || '';
        document.getElementById('edit-session5-col1-heading').value = sessionContent.col1Heading || '';
        tinymce.get('edit-session5-col1-content')?.setContent(sessionContent.col1Content || '');
        document.getElementById('edit-session5-col2-heading').value = sessionContent.col2Heading || '';
        tinymce.get('edit-session5-col2-content')?.setContent(sessionContent.col2Content || '');
        document.getElementById('edit-session5-col3-heading').value = sessionContent.col3Heading || '';
        tinymce.get('edit-session5-col3-content')?.setContent(sessionContent.col3Content || '');
        document.getElementById('edit-session5-col4-heading').value = sessionContent.col4Heading || '';
        tinymce.get('edit-session5-col4-content')?.setContent(sessionContent.col4Content || '');
    } else if (sessionId === 'session6') {
        document.getElementById('edit-session6-heading').value = sessionContent.heading || '';
        renderGalleryItems('session6', sessionContent.items || []);
    } else if (sessionId === 'session7') {
        document.getElementById('edit-session7-heading').value = sessionContent.heading || '';
        renderGalleryItems('session7', sessionContent.items || []);
    }
}

// Save session content to websiteData object and then to Firebase
async function saveSessionContent(sessionId) {
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
            contentData.col3Heading = document.getElementById('edit-session3-col3-heading').value;
            contentData.col3Content = tinymce.get('edit-session3-col3-content')?.getContent() || '';
            contentData.col3Readmore = document.getElementById('edit-session3-col3-readmore').checked;
            break;
        case 'session4':
            contentData.heading = document.getElementById('edit-session4-heading').value;
            contentData.col1Heading = document.getElementById('edit-session4-col1-heading').value;
            contentData.col1Content = tinymce.get('edit-session4-col1-content')?.getContent() || '';
            contentData.col2Heading = document.getElementById('edit-session4-col2-heading').value;
            contentData.col2Content = tinymce.get('edit-session4-col2-content')?.getContent() || '';
            contentData.col3Heading = document.getElementById('edit-session4-col3-heading').value;
            contentData.col3Content = tinymce.get('edit-session4-col3-content')?.getContent() || '';
            contentData.col3Readmore = document.getElementById('edit-session4-col3-readmore').checked;
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
            contentData.items = websiteData.session6?.items || []; // Use existing items in websiteData
            break;
        case 'session7': // Video Gallery
            contentData.heading = document.getElementById('edit-session7-heading').value;
            contentData.items = websiteData.session7?.items || []; // Use existing items in websiteData
            break;
    }
    
    // Update local websiteData object
    websiteData[sessionId] = contentData;

    // Save to Firebase
    await saveContentToFirebase(sessionId, contentData);
    
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
            websiteData[sessionId] = { items: [] }; // Initialize if not exists
        }
        websiteData[sessionId].items.push({ url: url, type: type });
        renderGalleryItems(sessionId, websiteData[sessionId].items);
        document.getElementById(urlInputId).value = ''; // Clear input
        saveSessionContent(sessionId); // Save updated gallery to Firebase
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
    // Using a custom confirmation instead of window.confirm
    const confirmRemove = (callback) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;
            z-index: 10000;
        `;
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                <p>Are you sure you want to delete this menu item?</p>
                <button id="confirmYes" style="margin: 10px; padding: 8px 15px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">Yes</button>
                <button id="confirmNo" style="margin: 10px; padding: 8px 15px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">No</button>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('confirmYes').onclick = () => {
            modal.remove();
            callback(true);
        };
        document.getElementById('confirmNo').onclick = () => {
            modal.remove();
            callback(false);
        };
    };

    confirmRemove((result) => {
        if (result) {
            if (websiteData[sessionId] && websiteData[sessionId].items) {
                websiteData[sessionId].items.splice(index, 1);
                renderGalleryItems(sessionId, websiteData[sessionId].items);
                saveSessionContent(sessionId); // Save changes to Firebase
                showSuccessMessage('Gallery item removed successfully!');
            }
        }
    });
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
            
            // Update preview in admin panel
            const preview = document.getElementById(`preview-${elementId}`);
            if (preview) {
                preview.src = url;
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
        // This only sets the URL in the admin panel, actual embedding happens on index.html via Firebase data
        // For now, we'll just save it to a placeholder in settings or content if needed
        // For simplicity, this function might just be a UI action without direct Firebase save
        showSuccessMessage('YouTube video URL noted. Assign it via gallery sections if needed.');
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
    // Using a custom confirmation instead of window.confirm
    const confirmDelete = (callback) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;
            z-index: 10000;
        `;
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                <p>Are you sure you want to delete this menu item?</p>
                <button id="confirmYes" style="margin: 10px; padding: 8px 15px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">Yes</button>
                <button id="confirmNo" style="margin: 10px; padding: 8px 15px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">No</button>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('confirmYes').onclick = () => {
            modal.remove();
            callback(true);
        };
        document.getElementById('confirmNo').onclick = () => {
            modal.remove();
            callback(false);
        };
    };

    confirmDelete((result) => {
        if (result) {
            menuItems = menuItems.filter(item => item.id !== id);
            saveMenuItems();
            renderMenuItems();
            showSuccessMessage('Menu item deleted successfully!');
        }
    });
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

// Save all settings from the admin panel to Firebase
function saveSettings() {
    const settings = {
        'header-bg-color': document.getElementById('header-bg-color')?.value,
        'footer-bg-color': document.getElementById('footer-bg-color')?.value,
        'session1-bg-color': document.getElementById('session1-bg-color')?.value,
        'session2-bg-color': document.getElementById('session2-bg-color')?.value,
        'session3-bg-color': document.getElementById('session3-bg-color')?.value,
        'session4-bg-color': document.getElementById('session4-bg-color')?.value,
        'session5-bg-color': document.getElementById('session5-bg-color')?.value,
        'session6-bg-color': document.getElementById('session6-bg-color')?.value,
        'session7-bg-color': document.getElementById('session7-bg-color')?.value,
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
        'show-session3-col3': document.getElementById('show-session3-col3')?.checked,
        'show-session4-col1': document.getElementById('show-session4-col1')?.checked,
        'show-session4-col2': document.getElementById('show-session4-col2')?.checked,
        'show-session4-col3': document.getElementById('show-session4-col3')?.checked,
        'show-session5-col1': document.getElementById('show-session5-col1')?.checked,
        'show-session5-col2': document.getElementById('show-session5-col2')?.checked,
        'show-session5-col3': document.getElementById('show-session5-col3')?.checked,
        'show-session5-col4': document.getElementById('show-session5-col4')?.checked,
    };
    
    // Update local websiteSettings object
    websiteSettings = settings;

    // Save to Firebase
    if (currentUser) {
        db.collection('website').doc('settings').set(settings).catch(console.error);
    }
}

// Auto-save functionality
function autoSave() {
    saveSettings();
    // Also save content if any TinyMCE editor is active
    if (tinymce.activeEditor) {
        const activeTabButton = document.querySelector('.content-tabs .tab-btn.active');
        if (activeTabButton) {
            const sessionId = activeTabButton.id.replace('-content', '');
            saveSessionContent(sessionId);
        }
    }
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
    }).catch(error => {
        console.error('Error logging out:', error);
        showErrorMessage('Failed to log out: ' + error.message);
    });
}
