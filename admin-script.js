// Admin Panel JavaScript
let currentUser = null;
let websiteData = {}; // Menyimpan data konten
let websiteSettings = {}; // Menyimpan pengaturan desain dan visibilitas
let menuItems = [];

let auth, db, storage; // Deklarasikan variabel Firebase untuk cakupan skrip ini

document.addEventListener('DOMContentLoaded', function() {
    // Tampilkan overlay loading segera
    showLoadingOverlay();
    // Inisialisasi TinyMCE lebih awal, konten akan diatur setelah data dimuat
    initializeTinyMCE(); 
    setupAdminEventListeners();
    checkAuthentication(); // Ini akan menyembunyikan overlay setelah auth selesai
});

// Periksa apakah pengguna diautentikasi
function checkAuthentication() {
    // Tetapkan objek Firebase global ke variabel lokal
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();

    // Pastikan objek auth Firebase tersedia
    if (!auth) {
        console.error("Objek Firebase Auth tidak diinisialisasi. Tidak dapat memeriksa autentikasi.");
        hideLoadingOverlay();
        window.location.href = 'index.html'; // Alihkan jika Firebase Auth tidak siap
        return;
    }

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            console.log('Admin logged in:', user.email);
            await loadAdminData(); // Muat data hanya setelah pengguna dikonfirmasi
            hideLoadingOverlay();
            // Pastikan bagian dashboard ditampilkan secara default setelah login
            showSection('dashboard');
            setActiveNavLink(document.querySelector('.nav-link[data-section="dashboard"]'));
        } else {
            console.log('Admin not logged in. Redirecting to index.html.');
            hideLoadingOverlay();
            // Hanya alihkan jika halaman saat ini adalah admin.html
            if (window.location.pathname.includes('admin.html')) {
                window.location.href = 'index.html';
            }
        }
    });
}

// Tampilkan overlay loading
function showLoadingOverlay() {
    const overlay = document.getElementById('admin-loading-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

// Sembunyikan overlay loading
function hideLoadingOverlay() {
    const overlay = document.getElementById('admin-loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Setup event listeners
function setupAdminEventListeners() {
    // Navigasi sidebar
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

    // Fungsionalitas auto-save untuk input formulir
    document.addEventListener('input', debounce(autoSave, 1000));
    document.addEventListener('change', debounce(autoSave, 1000)); // Penting untuk kotak centang dan pilihan
}

// Tampilkan bagian admin tertentu
function showSection(sectionName) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Atur tautan navigasi aktif
function setActiveNavLink(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Inisialisasi editor TinyMCE
function initializeTinyMCE() {
    // Hancurkan instance yang ada untuk mencegah masalah inisialisasi ulang
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
        setup: function(editor) {
            editor.on('change', function() {
                autoSave(); // Auto-save saat konten editor berubah
            });
            editor.on('init', function() {
                // Saat editor diinisialisasi, coba muat kontennya dari websiteData
                const editorId = editor.id;
                const contentKey = editorId.replace('edit-', ''); // contoh: session2-col1-content
                
                // Tentukan sesi dan kolom dari ID
                const parts = contentKey.split('-');
                if (parts.length >= 3) {
                    const sessionId = parts[0]; // contoh: session2
                    const colKey = parts.slice(1).join('-'); // contoh: col1-content

                    if (websiteData[sessionId] && websiteData[sessionId][colKey]) {
                        editor.setContent(websiteData[sessionId][colKey]);
                    }
                }
            });
        }
    });
}

// Muat semua data admin (pengaturan, konten, gambar, menu) dari Firebase
async function loadAdminData() {
    if (!db) {
        console.error("Objek Firestore DB tidak diinisialisasi. Tidak dapat memuat data admin.");
        return;
    }

    try {
        // Muat pengaturan
        const settingsDoc = await db.collection('website').doc('settings').get();
        if (settingsDoc.exists) {
            websiteSettings = settingsDoc.data();
            applySettingsToAdminPanel(websiteSettings);
        } else {
            websiteSettings = {}; // Inisialisasi kosong jika tidak ada pengaturan
        }

        // Muat konten
        const contentDoc = await db.collection('website').doc('content').get();
        if (contentDoc.exists) {
            websiteData = contentDoc.data();
            // Inisialisasi ulang TinyMCE untuk memastikan konten dimuat ke editor
            // Ini penting agar TinyMCE mengambil konten setelah websiteData diisi
            initializeTinyMCE(); 
            // Muat konten untuk tab yang saat ini aktif setelah TinyMCE siap
            loadContentForTab(document.querySelector('.content-tabs .tab-btn.active')?.id || 'session1-content');
        } else {
            websiteData = {}; // Inisialisasi kosong jika tidak ada konten
        }

        // Muat penugasan gambar
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

        // Muat item menu
        const menuDoc = await db.collection('website').doc('menu').get();
        if (menuDoc.exists) {
            menuItems = menuDoc.data().items || [];
            renderMenuItems();
        }

        showSuccessMessage('Data admin berhasil dimuat!');
    } catch (error) {
        console.error('Kesalahan saat memuat data admin:', error);
        showErrorMessage('Gagal memuat data admin: ' + error.message);
    }
}

// Terapkan pengaturan yang dimuat ke UI panel admin
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

// Perbarui warna header
function updateHeaderColor(color) {
    document.documentElement.style.setProperty('--header-bg-color', color);
    saveSettings();
}

// Perbarui warna footer
function updateFooterColor(color) {
    document.documentElement.style.setProperty('--footer-bg-color', color);
    saveSettings();
}

// Perbarui warna sesi
function updateSessionColor(sessionId, color) {
    document.documentElement.style.setProperty(`--${sessionId}-bg-color`, color);
    saveSettings();
}

// Perbarui ukuran font
function updateFontSize(elementId, size) {
    document.documentElement.style.setProperty(`--${elementId}-font-size`, size);
    saveSettings();
}

// Perbarui ukuran judul bagian
function updateSectionHeadingSize(size) {
    document.documentElement.style.setProperty('--section-heading-size', size);
    saveSettings();
}

// Perbarui font body
function updateBodyFont(font) {
    document.documentElement.style.setProperty('--body-font', font);
    saveSettings();
}

// Perbarui animasi hero
function updateHeroAnimation(animation) {
    saveSettings();
}

// Perbarui efek hover kartu
function updateCardHover(effect) {
    saveSettings();
}

// Perbarui tata letak grid untuk Sesi 5
function updateGridLayout(columns) {
    saveSettings();
}

// Alihkan visibilitas media sosial
function toggleSocialMedia(show) {
    saveSettings();
}

// Alihkan visibilitas bagian (untuk sesi 6 dan 7)
function toggleSection(sectionId, show) {
    saveSettings();
}

// Alihkan visibilitas kolom individual
function toggleColumnVisibility(columnId, show) {
    saveSettings(); // Simpan status kotak centang
}

// Tampilkan tab konten dan muat datanya
async function showContentTab(tabId) {
    document.querySelectorAll('.content-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.content-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    
    // Pastikan editor TinyMCE siap dan kemudian muat konten
    initializeTinyMCE(); // Inisialisasi ulang untuk memastikan semua editor aktif
    await loadContentForTab(tabId);
}

// Muat konten untuk tab tertentu ke TinyMCE dan input lainnya
async function loadContentForTab(tabId) {
    const sessionId = tabId.replace('-content', '');
    const sessionContent = websiteData[sessionId] || {};

    // Isi bidang formulir berdasarkan data yang dimuat
    // Untuk TinyMCE, gunakan tinymce.get(id)?.setContent()
    // Untuk input/textarea, gunakan .value
    // Untuk kotak centang, gunakan .checked

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

// Simpan konten sesi ke objek websiteData dan kemudian ke Firebase
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
        case 'session6': // Galeri Foto
            contentData.heading = document.getElementById('edit-session6-heading').value;
            contentData.items = websiteData.session6?.items || []; // Gunakan item yang ada di websiteData
            break;
        case 'session7': // Galeri Video
            contentData.heading = document.getElementById('edit-session7-heading').value;
            contentData.items = websiteData.session7?.items || []; // Gunakan item yang ada di websiteData
            break;
    }
    
    // Perbarui objek websiteData lokal
    websiteData[sessionId] = contentData;

    // Simpan ke Firebase
    if (currentUser && db) {
        await db.collection('website').doc('content').set({
            [sessionId]: contentData
        }, { merge: true });
    } else {
        console.warn("Tidak menyimpan konten ke Firebase: Pengguna tidak login atau DB tidak diinisialisasi.");
    }
    
    showSuccessMessage('Konten berhasil disimpan!');
}

// Tambahkan item galeri (URL gambar atau video)
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
            websiteData[sessionId] = { items: [] }; // Inisialisasi jika tidak ada
        }
        websiteData[sessionId].items.push({ url: url, type: type });
        renderGalleryItems(sessionId, websiteData[sessionId].items);
        document.getElementById(urlInputId).value = ''; // Bersihkan input
        saveSessionContent(sessionId); // Simpan galeri yang diperbarui ke Firebase
        showSuccessMessage('Item galeri ditambahkan!');
    } else {
        showErrorMessage('Harap masukkan URL yang valid.');
    }
}

// Render item galeri di panel admin
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

// Hapus item galeri
function removeGalleryItem(sessionId, index) {
    const confirmRemove = (callback) => {
        const modal = document.createElement('div');
        modal.className = 'loading-overlay'; // Gunakan kembali gaya loading-overlay untuk modal
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
                saveSessionContent(sessionId); // Simpan perubahan ke Firebase
                showSuccessMessage('Item galeri berhasil dihapus!');
            }
        }
    });
}

// Tampilkan tab media
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

// Tangani unggahan gambar
async function handleImageUpload(files) {
    if (!storage) {
        showErrorMessage("Firebase Storage tidak diinisialisasi. Tidak dapat mengunggah gambar.");
        return;
    }
    for (let file of files) {
        try {
            const storageRef = storage.ref(`images/${Date.now()}_${file.name}`);
            const snapshot = await storageRef.put(file);
            const url = await snapshot.ref.getDownloadURL();
            console.log('Gambar diunggah:', url);
            showSuccessMessage('Gambar berhasil diunggah! URL: ' + url);
            // Secara opsional, tampilkan URL di suatu tempat atau tetapkan secara otomatis
        } catch (error) {
            console.error('Kesalahan unggah:', error);
            showErrorMessage('Gagal mengunggah gambar: ' + error.message);
        }
    }
}

// Tetapkan gambar ke elemen
async function assignImage(input, elementId) {
    if (!storage) {
        showErrorMessage("Firebase Storage tidak diinisialisasi. Tidak dapat menetapkan gambar.");
        return;
    }
    const file = input.files[0];
    if (file) {
        try {
            const storageRef = storage.ref(`images/${Date.now()}_${file.name}`);
            const snapshot = await storageRef.put(file);
            const url = await snapshot.ref.getDownloadURL();
            
            // Perbarui pratinjau di panel admin
            const preview = document.getElementById(`preview-${elementId}`);
            if (preview) {
                preview.src = url;
            }
            
            // Simpan ke Firebase
            if (currentUser && db) {
                await db.collection('website').doc('images').set({
                    [elementId]: url
                }, { merge: true });
            } else {
                console.warn("Tidak menyimpan penugasan gambar ke Firebase: Pengguna tidak login atau DB tidak diinisialisasi.");
            }
            
            showSuccessMessage('Gambar berhasil ditetapkan!');
        } catch (error) {
            console.error('Kesalahan saat menetapkan gambar:', error);
            showErrorMessage('Gagal menetapkan gambar: ' + error.message);
        }
    }
}

// Sematkan video YouTube (Fungsi ini terutama memperbarui UI admin, penyematan aktual ditangani oleh script.js melalui data Firebase)
function embedYouTubeVideo() {
    const url = document.getElementById('youtube-url').value;
    if (url) {
        showSuccessMessage('URL video YouTube dicatat. Tambahkan ke Sesi 7 (Galeri Video) untuk ditampilkan di situs web.');
    } else {
        showErrorMessage('Harap masukkan URL YouTube.');
    }
}

// Tangani unggahan video
async function handleVideoUpload(file) {
    if (!storage) {
        showErrorMessage("Firebase Storage tidak diinisialisasi. Tidak dapat mengunggah video.");
        return;
    }
    try {
        const storageRef = storage.ref(`videos/${Date.now()}_${file.name}`);
        const snapshot = await storageRef.put(file);
        const url = await snapshot.ref.getDownloadURL();
        console.log('Video diunggah:', url);
        showSuccessMessage('Video berhasil diunggah! URL: ' + url);
        // Secara opsional, tampilkan URL di suatu tempat atau tetapkan secara otomatis
    } catch (error) {
        console.error('Kesalahan unggah video:', error);
        showErrorMessage('Gagal mengunggah video: ' + error.message);
    }
}

// Tampilkan tab kode
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

// Simpan kode kustom
async function saveCustomCode() {
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
            updatedAt: firebase.firestore.FieldValue.serverTimestamp() // Membutuhkan firebase.firestore agar tersedia
        });
        
        showSuccessMessage('Kode kustom berhasil disimpan!');
    } catch (error) {
        console.error('Kesalahan saat menyimpan kode kustom:', error);
        showErrorMessage('Gagal menyimpan kode kustom: ' + error.message);
    }
}

// Pratinjau kode kustom
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

// Buat halaman kustom
async function generateCustomPage() {
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
        
        // Buka halaman yang dibuat
        window.open(pageUrl, '_blank');
    } catch (error) {
        console.error('Kesalahan saat membuat halaman kustom:', error);
        showErrorMessage('Gagal membuat halaman kustom: ' + error.message);
    }
}

// Tambahkan item menu
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

// Render item menu
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

// Edit item menu
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

// Hapus item menu
function deleteMenuItem(id) {
    const confirmDelete = (callback) => {
        const modal = document.createElement('div');
        modal.className = 'loading-overlay'; // Gunakan kembali gaya loading-overlay untuk modal
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

// Simpan item menu ke Firebase
async function saveMenuItems() {
    if (!currentUser || !db) {
        showErrorMessage("Harap login untuk menyimpan item menu.");
        return;
    }
    try {
        await db.collection('website').doc('menu').set({
            items: menuItems
        });
    } catch (error) {
        console.error('Kesalahan saat menyimpan item menu:', error);
    }
}

// Simpan konten ke Firebase
async function saveContentToFirebase(sessionId, contentData) {
    if (!currentUser || !db) {
        showErrorMessage("Harap login untuk menyimpan konten.");
        return;
    }
    try {
        await db.collection('website').doc('content').set({
            [sessionId]: contentData
        }, { merge: true });
    } catch (error) {
        console.error('Kesalahan saat menyimpan konten ke Firebase:', error);
        throw error;
    }
}

// Simpan semua pengaturan dari panel admin ke Firebase
function saveSettings() {
    if (!currentUser || !db) {
        // Jangan tampilkan pesan kesalahan untuk auto-save jika tidak login, cukup log
        console.warn("Tidak menyimpan pengaturan ke Firebase: Pengguna tidak login atau DB tidak diinisialisasi.");
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
        // Pengaturan visibilitas kolom
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
    
    // Perbarui objek websiteSettings lokal
    websiteSettings = settings;

    // Simpan ke Firebase
    db.collection('website').doc('settings').set(settings).catch(console.error);
}

// Fungsionalitas auto-save
function autoSave() {
    saveSettings();
    // Juga simpan konten jika ada editor TinyMCE yang aktif
    if (tinymce.activeEditor) {
        const activeTabButton = document.querySelector('.content-tabs .tab-btn.active');
        if (activeTabButton) {
            const sessionId = activeTabButton.id.replace('-content', '');
            saveSessionContent(sessionId);
        }
    }
}

// Fungsi debounce
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

// Tampilkan pesan sukses
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Tampilkan pesan kesalahan
function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Fungsi logout
function logout() {
    if (auth) {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        }).catch(error => {
            console.error('Kesalahan saat logout:', error);
            showErrorMessage('Gagal logout: ' + error.message);
        });
    } else {
        console.warn("Firebase Auth tidak tersedia untuk logout.");
        window.location.href = 'index.html';
    }
}
