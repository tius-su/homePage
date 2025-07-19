// Admin Panel JavaScript
let currentUser = null;
let websiteData = {}; // Menyimpan data konten
let websiteSettings = {}; // Menyimpan pengaturan desain dan visibilitas
let menuItems = [];

// Variabel auth, db, storage akan diakses langsung dari objek global 'firebase'
// Tidak perlu mendeklarasikannya di sini karena SDK compat sudah membuatnya global

// Konfigurasi Cloudinary (Ganti dengan milik Anda)
const CLOUDINARY_CLOUD_NAME = 'dyvoydnx8'; // Ganti ini
const CLOUDINARY_UPLOAD_PRESET = 'Yhome-pages'; // Ganti ini (unsigned preset)

document.addEventListener('DOMContentLoaded', function() {
    console.log("admin-script.js: DOMContentLoaded fired. Showing loading overlay.");
    showLoadingOverlay();
    initializeTinyMCE(); 
    setupAdminEventListeners();
    checkAuthentication();
});

async function checkAuthentication() {
    console.log("admin-script.js: checkAuthentication called.");
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error("admin-script.js: Objek Firebase global tidak ditemukan atau tidak diinisialisasi. Pastikan firebase-config.js dimuat dengan benar.");
        if (window.auth && window.db && window.storage) {
            console.warn("admin-script.js: Menggunakan layanan mock Firebase.");
            window.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    currentUser = user;
                    console.log('admin-script.js: Admin logged in (mock):', user.email);
                    await loadAdminData();
                    hideLoadingOverlay();
                    showSection('dashboard');
                    setActiveNavLink(document.querySelector('.nav-link[data-section="dashboard"]'));
                } else {
                    console.log('admin-script.js: Admin not logged in (mock). Redirecting to index.html.');
                    hideLoadingOverlay();
                    if (window.location.pathname.includes('admin.html')) {
                        window.location.href = 'index.html'; 
                    }
                }
            });
            return;
        } else {
            console.error("admin-script.js: Layanan Firebase (mock atau asli) tidak tersedia. Tidak dapat melanjutkan autentikasi.");
            showErrorMessage("Layanan Firebase tidak tersedia. Harap periksa firebase-config.js Anda.");
            hideLoadingOverlay();
            window.location.href = 'index.html'; 
            return;
        }
    } else {
        console.log("admin-script.js: Firebase global object found. Proceeding with authentication.");
    }

    try {
        const user = await new Promise(resolve => {
            const unsubscribe = firebase.auth().onAuthStateChanged(user => {
                unsubscribe();
                resolve(user);
            });
        });

        if (user) {
            currentUser = user;
            console.log('admin-script.js: Admin logged in:', user.email);
            await loadAdminData();
            hideLoadingOverlay();
            showSection('dashboard');
            setActiveNavLink(document.querySelector('.nav-link[data-section="dashboard"]'));
        } else {
            console.log('admin-script.js: Admin not logged in. Redirecting to index.html.');
            hideLoadingOverlay();
            if (window.location.pathname.includes('admin.html')) {
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
        console.error('admin-script.js: Kesalahan selama pemeriksaan autentikasi atau pemuatan data:', error);
        showErrorMessage('Autentikasi gagal atau data tidak dapat dimuat: ' + error.message);
        hideLoadingOverlay();
        window.location.href = 'index.html';
    }
}

function showLoadingOverlay() {
    const overlay = document.getElementById('admin-loading-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('admin-loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function setupAdminEventListeners() {
    console.log("admin-script.js: setupAdminEventListeners dipanggil.");
    const navLinks = document.querySelectorAll('.nav-link');
    console.log("admin-script.js: Tautan navigasi ditemukan:", navLinks.length);
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            console.log("admin-script.js: Tautan navigasi diklik. Bagian:", section);
            if (section) {
                showSection(section);
                setActiveNavLink(link);
            }
        });
    });

    document.addEventListener('input', debounce(autoSave, 1000));
    document.addEventListener('change', debounce(autoSave, 1000));
    console.log("admin-script.js: Listener auto-save terpasang.");
}

function showSection(sectionName) {
    console.log("admin-script.js: showSection dipanggil untuk:", sectionName);
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
        console.log(`admin-script.js: Bagian ${sectionName}-section sekarang aktif.`);
    } else {
        console.warn(`admin-script.js: Bagian ${sectionName}-section tidak ditemukan.`);
    }
}

function setActiveNavLink(activeLink) {
    console.log("admin-script.js: setActiveNavLink dipanggil untuk:", activeLink.getAttribute('data-section'));
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

function initializeTinyMCE() {
    if (tinymce.activeEditor) {
        tinymce.remove('.tinymce-editor');
    }
    
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
        readonly: false, 
        setup: function(editor) {
            editor.on('change', function() {
                autoSave();
            });
            editor.on('init', function() {
                const editorId = editor.id;
                const contentKey = editorId.replace('edit-', '');
                const parts = contentKey.split('-');
                if (parts.length >= 3) {
                    const sessionId = parts[0];
                    const colKey = parts.slice(1).join('-');
                    if (websiteData[sessionId] && websiteData[sessionId][colKey]) {
                        editor.setContent(websiteData[sessionId][colKey]);
                    }
                }
            });
        }
    });
}

async function loadAdminData() {
    if (typeof firebase.firestore === 'undefined') {
        console.error("admin-script.js: Objek Firebase Firestore tidak diinisialisasi. Tidak dapat memuat data admin.");
        return;
    }

    try {
        const db = firebase.firestore();
        const settingsDoc = await db.collection('website').doc('settings').get();
        if (settingsDoc.exists) {
            websiteSettings = settingsDoc.data();
            applySettingsToAdminPanel(websiteSettings);
            console.log("admin-script.js: Admin: Pengaturan dimuat.", websiteSettings);
        } else {
            websiteSettings = {};
            console.log("admin-script.js: Admin: Tidak ada pengaturan ditemukan, menggunakan default.");
        }

        const contentDoc = await db.collection('website').doc('content').get();
        if (contentDoc.exists) {
            websiteData = contentDoc.data();
            console.log("admin-script.js: Admin: Konten dimuat.", websiteData);
            initializeTinyMCE(); 
            loadContentForTab(document.querySelector('.content-tabs .tab-btn.active')?.id || 'session1-content');
        } else {
            websiteData = {};
            console.log("admin-script.js: Admin: Tidak ada konten ditemukan, menggunakan default.");
        }

        // --- Perubahan di sini: Memuat URL gambar dari Firestore ke input URL ---
        const imagesDoc = await db.collection('website').doc('images').get();
        if (imagesDoc.exists) {
            const images = imagesDoc.data();
            console.log("admin-script.js: Admin: Gambar dimuat.", images);
            Object.keys(images).forEach(elementId => {
                const inputElement = document.getElementById(`${elementId}-url`); // Ambil input URL
                const preview = document.getElementById(`preview-${elementId}`);
                if (inputElement) {
                    inputElement.value = images[elementId]; // Set nilai input URL
                }
                if (preview) {
                    preview.src = images[elementId];
                }
            });
        } else {
            console.log("admin-script.js: Admin: Tidak ada gambar ditemukan.");
        }
        // --- Akhir perubahan ---

        const menuDoc = await db.collection('website').doc('menu').get();
        if (menuDoc.exists) {
            menuItems = menuDoc.data().items || [];
            console.log("admin-script.js: Admin: Item menu dimuat.", menuItems);
            renderMenuItems();
        } else {
            console.log("admin-script.js: Admin: Tidak ada item menu ditemukan.");
        }

        showSuccessMessage('Data admin berhasil dimuat!');
    } catch (error) {
        console.error('admin-script.js: Kesalahan saat memuat data admin:', error);
        showErrorMessage('Gagal memuat data admin: ' + error.message);
        throw error; 
    }
}

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

function updateHeaderColor(color) {
    document.documentElement.style.setProperty('--header-bg-color', color);
    saveSettings();
}

function updateFooterColor(color) {
    document.documentElement.style.setProperty('--footer-bg-color', color);
    saveSettings();
}

function updateSessionColor(sessionId, color) {
    document.documentElement.style.setProperty(`--${sessionId}-bg-color`, color);
    saveSettings();
}

function updateFontSize(elementId, size) {
    document.documentElement.style.setProperty(`--${elementId}-font-size`, size);
    saveSettings();
}

function updateSectionHeadingSize(size) {
    document.documentElement.style.setProperty('--section-heading-size', size);
    saveSettings();
}

function updateBodyFont(font) {
    document.documentElement.style.setProperty('--body-font', font);
    saveSettings();
}

function updateHeroAnimation(animation) {
    saveSettings();
}

function updateCardHover(effect) {
    saveSettings();
}

function updateGridLayout(columns) {
    saveSettings();
}

function toggleSocialMedia(show) {
    saveSettings();
}

function toggleSection(sectionId, show) {
    saveSettings();
}

function toggleColumnVisibility(columnId, show) {
    saveSettings();
}

async function showContentTab(tabId) {
    document.querySelectorAll('.content-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.content-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    
    initializeTinyMCE(); 
    await loadContentForTab(tabId);
}

async function loadContentForTab(tabId) {
    const sessionId = tabId.replace('-content', '');
    const sessionContent = websiteData[sessionId] || {};

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
        case 'session6': // Galeri Foto
            contentData.heading = document.getElementById('edit-session6-heading').value;
            contentData.items = websiteData.session6?.items || [];
            break;
        case 'session7': // Galeri Video
            contentData.heading = document.getElementById('edit-session7-heading').value;
            contentData.items = websiteData.session7?.items || [];
            break;
    }
    
    websiteData[sessionId] = contentData;

    if (currentUser && firebase.firestore()) {
        await firebase.firestore().collection('website').doc('content').set({
            [sessionId]: contentData
        }, { merge: true });
    } else {
        console.warn("admin-script.js: Not saving content to Firebase: User not logged in or DB not initialized.");
    }
    
    showSuccessMessage('Konten berhasil disimpan!');
}

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
        document.getElementById(urlInputId).value = '';
        saveSessionContent(sessionId);
        showSuccessMessage('Item galeri ditambahkan!');
    } else {
        showErrorMessage('Harap masukkan URL yang valid.');
    }
}

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

function removeGalleryItem(sessionId, index) {
    const confirmRemove = (callback) => {
        const modal = document.createElement('div');
        modal.className = 'loading-overlay';
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                <p>Apakah Anda yakin ingin menghapus item ini?</p>
                <button id="confirmYes" class="btn btn-success" style="margin: 10px;">Ya</button>
                <button id="confirmNo" class="btn btn-danger" style="margin: 10px;">Tidak</button>
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
                saveSessionContent(sessionId);
                showSuccessMessage('Item galeri berhasil dihapus!');
            }
        }
    });
}

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

// --- Perubahan di sini: Fungsi unggah Cloudinary ---
async function handleCloudinaryUpload(files, resourceType = 'image') {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        showErrorMessage("Konfigurasi Cloudinary tidak lengkap. Harap masukkan Cloud Name dan Upload Preset.");
        return;
    }

    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
        formData.append('resource_type', resourceType); // 'image' atau 'video'

        try {
            showSuccessMessage(`Mengunggah ${file.name} ke Cloudinary...`);
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Unggahan Cloudinary gagal: ${errorData.error.message}`);
            }

            const data = await response.json();
            const imageUrl = data.secure_url;
            console.log('Gambar/Video diunggah ke Cloudinary:', imageUrl);
            showSuccessMessage(`Berhasil mengunggah ${file.name}! URL: ${imageUrl}`);

            // Opsional: Anda bisa secara otomatis mengisi URL ke input yang relevan di sini
            // Misalnya, jika ini untuk hero image, Anda bisa melakukan:
            // document.getElementById('session2-main-image-url').value = imageUrl;
            // assignImageUrl('session2-main-image', imageUrl);

        } catch (error) {
            console.error('Kesalahan unggah Cloudinary:', error);
            showErrorMessage('Gagal mengunggah ke Cloudinary: ' + error.message);
        }
    }
}
// --- Akhir perubahan ---

// --- Perubahan di sini: Fungsi untuk menetapkan URL gambar ke elemen dan menyimpannya ---
function assignImageUrl(elementId, url) {
    const inputElement = document.getElementById(`${elementId}-url`);
    const preview = document.getElementById(`preview-${elementId}`);

    if (inputElement) {
        inputElement.value = url; // Pastikan input diperbarui
    }
    if (preview) {
        preview.src = url; // Perbarui pratinjau
    }

    // Simpan URL ke Firebase Firestore
    if (currentUser && firebase.firestore()) {
        firebase.firestore().collection('website').doc('images').set({
            [elementId]: url
        }, { merge: true })
        .then(() => showSuccessMessage(`URL ${elementId} berhasil disimpan!`))
        .catch(error => showErrorMessage(`Gagal menyimpan URL ${elementId}: ${error.message}`));
    } else {
        console.warn("admin-script.js: Tidak menyimpan URL gambar ke Firebase: Pengguna tidak login atau DB tidak diinisialisasi.");
    }
}
// --- Akhir perubahan ---

// Fungsi ini tidak lagi digunakan untuk unggahan, hanya untuk mencatat URL YouTube
function embedYouTubeVideo() {
    const url = document.getElementById('youtube-url').value;
    if (url) {
        showSuccessMessage('URL video YouTube dicatat. Tambahkan ke Sesi 7 (Galeri Video) untuk ditampilkan di situs web.');
    } else {
        showErrorMessage('Harap masukkan URL YouTube.');
    }
}

// Fungsi ini tidak lagi digunakan karena unggahan video ditangani oleh handleCloudinaryUpload
// async function handleVideoUpload(file) { ... }

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

async function saveCustomCode() {
    if (typeof firebase.firestore === 'undefined') {
        showErrorMessage("Firebase Firestore tidak diinisialisasi. Tidak dapat menyimpan kode kustom.");
        return;
    }
    const db = firebase.firestore();
    if (!currentUser || !db) {
        showErrorMessage("Harap login untuk menyimpan kode kustom.");
        return;
    }
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
        
        showSuccessMessage('Kode kustom berhasil disimpan!');
    } catch (error) {
        console.error('Kesalahan saat menyimpan kode kustom:', error);
        showErrorMessage('Gagal menyimpan kode kustom: ' + error.message);
    }
}

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

async function generateCustomPage() {
    if (typeof firebase.firestore === 'undefined') {
        showErrorMessage("Firebase Firestore tidak diinisialisasi. Tidak dapat membuat halaman kustom.");
        return;
    }
    const db = firebase.firestore();
    if (!currentUser || !db) {
        showErrorMessage("Harap login untuk membuat halaman kustom.");
        return;
    }
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
        showSuccessMessage(`Halaman kustom dibuat! URL: ${pageUrl}`);
        
        window.open(pageUrl, '_blank');
    } catch (error) {
        console.error('Kesalahan saat membuat halaman kustom:', error);
        showErrorMessage('Gagal membuat halaman kustom: ' + error.message);
    }
}

function addMenuItem() {
    const name = prompt('Masukkan nama item menu:');
    const url = prompt('Masukkan URL item menu:');
    
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
        showSuccessMessage('Item menu berhasil ditambahkan!');
    }
}

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

function editMenuItem(id) {
    const item = menuItems.find(item => item.id === id);
    if (item) {
        const newName = prompt('Masukkan nama baru:', item.name);
        const newUrl = prompt('Masukkan URL baru:', item.url);
        
        if (newName && newUrl) {
            item.name = newName;
            item.url = newUrl;
            saveMenuItems();
            renderMenuItems();
            showSuccessMessage('Item menu berhasil diperbarui!');
        }
    }
}

function deleteMenuItem(id) {
    const confirmDelete = (callback) => {
        const modal = document.createElement('div');
        modal.className = 'loading-overlay';
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                <p>Apakah Anda yakin ingin menghapus item menu ini?</p>
                <button id="confirmYes" class="btn btn-success" style="margin: 10px;">Ya</button>
                <button id="confirmNo" class="btn btn-danger" style="margin: 10px;">Tidak</button>
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
            showSuccessMessage('Item menu berhasil dihapus!');
        }
    });
}

async function saveMenuItems() {
    if (typeof firebase.firestore === 'undefined') {
        showErrorMessage("Firebase Firestore tidak diinisialisasi. Tidak dapat menyimpan item menu.");
        return;
    }
    const db = firebase.firestore();
    if (!currentUser || !db) {
        showErrorMessage("Harap login untuk menyimpan item menu.");
        return;
    }
    try {
        await db.collection('website').doc('menu').set({
            items: menuItems
        });
    } catch (error) {
        console.error('admin-script.js: Kesalahan saat menyimpan item menu:', error);
    }
}

async function saveContentToFirebase(sessionId, contentData) {
    if (typeof firebase.firestore === 'undefined') {
        showErrorMessage("Firebase Firestore tidak diinisialisasi. Tidak dapat menyimpan konten.");
        return;
    }
    const db = firebase.firestore();
    if (!currentUser || !db) {
        showErrorMessage("Harap login untuk menyimpan konten.");
        return;
    }
    try {
        await db.collection('website').doc('content').set({
            [sessionId]: contentData
        }, { merge: true });
    } catch (error) {
        console.error('admin-script.js: Kesalahan saat menyimpan konten:', error);
        throw error;
    }
}

function saveSettings() {
    if (typeof firebase.firestore === 'undefined') {
        console.warn("Firebase Firestore tidak diinisialisasi. Tidak dapat menyimpan pengaturan.");
        return;
    }
    const db = firebase.firestore();
    if (!currentUser || !db) {
        console.warn("admin-script.js: Tidak menyimpan pengaturan ke Firebase: Pengguna tidak login atau DB tidak diinisialisasi.");
        return;
    }

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
    
    websiteSettings = settings;

    db.collection('website').doc('settings').set(settings).catch(console.error);
}

function autoSave() {
    saveSettings();
    if (tinymce.activeEditor) {
        const activeTabButton = document.querySelector('.content-tabs .tab-btn.active');
        if (activeTabButton) {
            const sessionId = activeTabButton.id.replace('-content', '');
            saveSessionContent(sessionId);
        }
    }
}

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

function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function logout() {
    if (typeof firebase.auth === 'undefined') {
        console.warn("Firebase Auth tidak diinisialisasi. Tidak dapat logout.");
        window.location.href = 'index.html';
        return;
    }
    const auth = firebase.auth();
    if (auth) {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        }).catch(error => {
            console.error('admin-script.js: Kesalahan saat logout:', error);
            showErrorMessage('Gagal logout: ' + error.message);
        });
    } else {
        console.warn("admin-script.js: Firebase Auth tidak tersedia untuk logout.");
        window.location.href = 'index.html';
    }
}
