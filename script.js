// Main Website JavaScript
let websiteData = {};
let websiteSettings = {};
// Variabel auth, db, storage akan diakses langsung dari objek global 'firebase'

document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi Firebase dan setup listener
    initializeFirebaseAndLoadData();
    setupEventListeners();
});

// Inisialisasi Firebase dan setup listener Firestore
function initializeFirebaseAndLoadData() {
    // Firebase config tersedia secara global dari firebase-config.js
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    // Pastikan objek 'firebase' global tersedia
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error("script.js: Objek Firebase global tidak ditemukan atau tidak diinisialisasi. Pastikan firebase-config.js dimuat dengan benar.");
        // Fallback untuk lingkungan di mana Firebase mungkin di-mock
        if (window.auth && window.db && window.storage) {
            console.warn("script.js: Menggunakan layanan mock Firebase.");
            setupFirestoreListeners(); // Tetap coba memuat data dengan layanan mock
        } else {
            console.error("script.js: Layanan Firebase (mock atau asli) tidak tersedia. Tidak dapat melanjutkan.");
        }
        return;
    }

    // Sign in secara anonim atau dengan token kustom
    // Menggunakan try...catch di sini untuk menangkap kesalahan signInAnonymously
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            try {
                if (initialAuthToken) {
                    await firebase.auth().signInWithCustomToken(initialAuthToken);
                    console.log("script.js: Signed in with custom token.");
                } else {
                    // Coba sign in anonim
                    await firebase.auth().signInAnonymously();
                    console.log("script.js: Signed in anonymously.");
                }
            } catch (error) {
                console.error("script.js: Kesalahan saat sign-in anonim:", error.code, error.message);
                // Menampilkan pesan kesalahan yang lebih spesifik kepada pengguna jika diperlukan
                if (error.code === 'auth/operation-not-allowed') {
                    console.error("script.js: Autentikasi anonim tidak diaktifkan di konsol Firebase Anda.");
                } else if (error.code === 'auth/network-request-failed') {
                    console.error("script.js: Kesalahan jaringan saat mencoba autentikasi.");
                }
                // Jika sign-in anonim gagal, mungkin tidak ada akses ke Firestore
                console.warn("script.js: Gagal melakukan sign-in anonim. Akses ke Firestore mungkin dibatasi.");
            }
        }
        // Setelah status auth dikonfirmasi (atau gagal), setup listener Firestore
        console.log("script.js: Status Auth Firebase dikonfirmasi. Menyiapkan listener Firestore.");
        setupFirestoreListeners();
    });
}

// Setup Firestore real-time listeners
function setupFirestoreListeners() {
    console.log("script.js: setupFirestoreListeners dipanggil.");
    if (typeof firebase.firestore === 'undefined') {
        console.error("script.js: Objek Firebase Firestore tidak diinisialisasi. Tidak dapat menyiapkan listener.");
        return;
    }

    const db = firebase.firestore(); // Dapatkan instance Firestore

    // Dengarkan perubahan pengaturan situs web
    db.collection('website').doc('settings').onSnapshot(doc => {
        if (doc.exists) {
            websiteSettings = doc.data();
            console.log("script.js: Firestore: Pengaturan diperbarui.", websiteSettings);
            applyWebsiteSettings(websiteSettings);
        } else {
            console.log("script.js: Firestore: Tidak ada pengaturan situs web ditemukan. Menerapkan pengaturan default.");
            applyWebsiteSettings({}); 
        }
    }, error => {
        console.error("script.js: Kesalahan saat mendengarkan pengaturan:", error);
    });

    // Dengarkan perubahan konten situs web
    db.collection('website').doc('content').onSnapshot(doc => {
        if (doc.exists) {
            websiteData = doc.data();
            console.log("script.js: Firestore: Konten diperbarui.", websiteData);
            applyWebsiteContent(websiteData);
        } else {
            console.log("script.js: Firestore: Tidak ada konten situs web ditemukan. Menerapkan konten default.");
            applyWebsiteContent({});
        }
    }, error => {
        console.error("script.js: Kesalahan saat mendengarkan konten:", error);
    });

    // Dengarkan penugasan gambar
    db.collection('website').doc('images').onSnapshot(doc => {
        if (doc.exists) {
            const images = doc.data();
            console.log("script.js: Firestore: Penugasan gambar diperbarui.", images);
            applyImageAssignments(images);
        } else {
            console.log("script.js: Firestore: Tidak ada penugasan gambar ditemukan. Menerapkan gambar default.");
            applyImageAssignments({});
        }
    }, error => {
        console.error("script.js: Kesalahan saat mendengarkan gambar:", error);
    });

    // Dengarkan perubahan item menu
    db.collection('website').doc('menu').onSnapshot(doc => {
        if (doc.exists) {
            const menuItems = doc.data().items || [];
            console.log("script.js: Firestore: Item menu diperbarui.", menuItems);
            updateMenu(menuItems);
        } else {
            console.log("script.js: Firestore: Tidak ada item menu ditemukan. Menerapkan menu default.");
            updateMenu([]);
        }
    }, error => {
        console.error("script.js: Kesalahan saat mendengarkan menu:", error);
    });
}

// Setup event listeners untuk interaksi UI (misalnya, menu mobile)
function setupEventListeners() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
        });
    }
}

// Terapkan konten situs web ke DOM
function applyWebsiteContent(data) {
    // Sesi 1
    document.getElementById('session1-title1').textContent = data.session1?.title1 || 'Welcome to Our Professional Website';
    document.getElementById('session1-title2').textContent = data.session1?.title2 || 'Your Success is Our Priority';

    // Sesi 2
    document.getElementById('session2-heading').textContent = data.session2?.heading || 'Our Services';
    document.getElementById('session2-col1-heading').textContent = data.session2?.col1Heading || 'Web Development';
    document.getElementById('session2-col1-content').innerHTML = data.session2?.col1Content || 'Professional web development services with modern technologies and responsive design.';
    document.getElementById('session2-col2-heading').textContent = data.session2?.col2Heading || 'Digital Marketing';
    document.getElementById('session2-col2-content').innerHTML = data.session2?.col2Content || 'Comprehensive digital marketing strategies to grow your business online.';
    document.getElementById('session2-col3-heading').textContent = data.session2?.col3Heading || 'Consulting';
    document.getElementById('session2-col3-content').innerHTML = data.session2?.col3Content || 'Expert business consulting to help you make informed decisions.';

    // Sesi 3
    document.getElementById('session3-col1-heading').textContent = data.session3?.col1Heading || 'About Our Company';
    document.getElementById('session3-col1-content').innerHTML = data.session3?.col1Content || 'We are a leading company in providing innovative solutions for businesses worldwide. Our team of experts is dedicated to delivering exceptional results.';
    document.getElementById('session3-col2-part1-heading').textContent = data.session3?.col2Part1Heading || 'Our Mission';
    document.getElementById('session3-col2-part1-content').innerHTML = data.session3?.col2Part1Content || 'To empower businesses with cutting-edge technology and strategic insights.';
    document.getElementById('session3-col2-part2-heading').textContent = data.session3?.col2Part2Heading || 'Our Vision';
    document.getElementById('session3-col2-part2-content').innerHTML = data.session3?.col2Part2Content || 'To be the global leader in digital transformation and business innovation.';
    document.getElementById('session3-col3-heading').textContent = data.session3?.col3Heading || 'Our Values'; // Kolom baru
    document.getElementById('session3-col3-content').innerHTML = data.session3?.col3Content || 'Integrity, innovation, and customer satisfaction are at the core of everything we do. We believe in building lasting relationships with our clients.'; // Kolom baru
    applyReadMore('session3-col3-content', data.session3?.col3Readmore); // Terapkan readmore untuk kolom baru

    // Sesi 4
    document.getElementById('session4-col1-heading').textContent = data.session4?.col1Heading || 'Our Expertise';
    document.getElementById('session4-col1-content').innerHTML = data.session4?.col1Content || 'With years of experience in the industry, we have developed expertise in various domains including technology, marketing, and business strategy.';
    document.getElementById('session4-col2-heading').textContent = data.session4?.col2Heading || 'Why Choose Us';
    document.getElementById('session4-col2-content').innerHTML = data.session4?.col2Content || 'We offer personalized solutions, 24/7 support, and proven results. Our client-centric approach ensures your success is our top priority.';
    document.getElementById('session4-col3-heading').textContent = data.session4?.col3Heading || 'Our Process'; // Kolom baru
    document.getElementById('session4-col3-content').innerHTML = data.session4?.col3Content || 'Our streamlined process ensures efficient project delivery from conception to completion, keeping you informed every step of the way.'; // Kolom baru
    applyReadMore('session4-col3-content', data.session4?.col3Readmore); // Terapkan readmore untuk kolom baru

    // Sesi 5
    document.getElementById('session5-heading').textContent = data.session5?.heading || 'Our Portfolio';
    document.getElementById('session5-col1-heading').textContent = data.session5?.col1Heading || 'Project Alpha';
    document.getElementById('session5-col1-content').innerHTML = data.session5?.col1Content || 'Innovative web application development.';
    document.getElementById('session5-col2-heading').textContent = data.session5?.col2Heading || 'Project Beta';
    document.getElementById('session5-col2-content').innerHTML = data.session5?.col2Content || 'Mobile app development and deployment.';
    document.getElementById('session5-col3-heading').textContent = data.session5?.col3Heading || 'Project Gamma';
    document.getElementById('session5-col3-content').innerHTML = data.session5?.col3Content || 'E-commerce platform optimization.';
    document.getElementById('session5-col4-heading').textContent = data.session5?.col4Heading || 'Project Delta';
    document.getElementById('session5-col4-content').innerHTML = data.session5?.col4Content || 'Digital marketing campaign success.';

    // Sesi 6 (Galeri Foto)
    document.getElementById('session6-heading').textContent = data.session6?.heading || 'Photo Gallery';
    renderGallery('photo-gallery-grid', data.session6?.items || [], 'image');

    // Sesi 7 (Galeri Video)
    document.getElementById('session7-heading').textContent = data.session7?.heading || 'Video Gallery';
    renderGallery('video-gallery-grid', data.session7?.items || [], 'video');
}

// Terapkan pengaturan situs web (warna, font, visibilitas, dll.)
function applyWebsiteSettings(settings) {
    // Terapkan warna
    document.documentElement.style.setProperty('--header-bg-color', settings['header-bg-color'] || '#2c3e50');
    document.documentElement.style.setProperty('--footer-bg-color', settings['footer-bg-color'] || '#2c3e50');
    document.documentElement.style.setProperty('--session1-bg-color', settings['session1-bg-color'] || '#667eea');
    document.documentElement.style.setProperty('--session2-bg-color', settings['session2-bg-color'] || '#f8f9fa');
    document.documentElement.style.setProperty('--session3-bg-color', settings['session3-bg-color'] || '#ffffff');
    document.documentElement.style.setProperty('--session4-bg-color', settings['session4-bg-color'] || '#f8f9fa');
    document.documentElement.style.setProperty('--session5-bg-color', settings['session5-bg-color'] || '#ffffff');
    document.documentElement.style.setProperty('--session6-bg-color', settings['session6-bg-color'] || '#f8f9fa');
    document.documentElement.style.setProperty('--session7-bg-color', settings['session7-bg-color'] || '#ffffff');

    // Terapkan ukuran font
    document.documentElement.style.setProperty('--main-title-size', settings['main-title-size'] || '3rem');
    document.documentElement.style.setProperty('--section-heading-size', settings['section-heading-size'] || '2.5rem');
    document.documentElement.style.setProperty('--body-font', settings['body-font'] || "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif");

    // Terapkan animasi dan efek hover
    const heroImage = document.querySelector('.hero-image');
    if (heroImage) {
        heroImage.style.animation = settings['hero-animation'] && settings['hero-animation'] !== 'none' ? `${settings['hero-animation']} 1s ease-out` : 'none';
    }
    document.querySelectorAll('.card').forEach(card => {
        // Hanya terapkan transformasi jika efek tertentu dipilih, jika tidak, reset
        if (settings['card-hover'] && settings['card-hover'] !== 'none') {
            card.style.transform = settings['card-hover'];
        } else {
            card.style.transform = 'none'; // Reset ke default
        }
    });

    // Terapkan tata letak grid untuk Sesi 5
    updateSession5GridLayout(settings['session5-layout']);

    // Alihkan visibilitas media sosial
    toggleElementVisibility('#social-icons', settings['show-social']);

    // Alihkan visibilitas sesi 6 dan 7
    console.log(`script.js: Menerapkan visibilitas untuk Sesi 6: ${settings['show-session6']}`);
    toggleElementVisibility('#session6', settings['show-session6']);
    console.log(`script.js: Menerapkan visibilitas untuk Sesi 7: ${settings['show-session7']}`);
    toggleElementVisibility('#session7', settings['show-session7']);

    // Terapkan visibilitas kolom untuk Sesi 2-7
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

// Terapkan penugasan gambar
function applyImageAssignments(images) {
    Object.keys(images).forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.src = images[elementId];
        }
    });
}

// Perbarui item menu
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

// Fungsi generik untuk mengalihkan visibilitas elemen
function toggleElementVisibility(selector, show) {
    const element = document.querySelector(selector);
    if (element) {
        console.log(`script.js: Mengalihkan visibilitas untuk ${selector}. Tampilan saat ini: ${element.style.display}. Tampilan yang diinginkan: ${show}`);
        element.style.display = show ? '' : 'none'; // Gunakan string kosong untuk kembali ke tampilan default
        console.log(`script.js: Tampilan aktual setelah pengaturan: ${element.style.display}`);
    } else {
        console.warn(`script.js: Elemen dengan selektor ${selector} tidak ditemukan.`);
    }
}

// Perbarui tata letak grid Sesi 5
function updateSession5GridLayout(columns) {
    const session5Grid = document.getElementById('session5-grid');
    if (session5Grid) {
        // Hapus kelas kolom yang ada
        session5Grid.classList.remove('grid-2-cols', 'grid-3-cols', 'grid-4-cols');
        // Tambahkan kelas kolom baru
        if (columns === '2') {
            session5Grid.classList.add('grid-2-cols');
        } else if (columns === '3') {
            session5Grid.classList.add('grid-3-cols');
        } else if (columns === '4') {
            session5Grid.classList.add('grid-4-cols');
        }
    }
}

// Terapkan fungsionalitas "Read More"
function applyReadMore(contentId, enableReadMore) {
    const contentDiv = document.getElementById(contentId);
    if (!contentDiv) return;

    let readMoreBtn = contentDiv.nextElementSibling;
    // Buat tombol read more jika belum ada atau bukan tombol yang benar
    if (!readMoreBtn || !readMoreBtn.classList.contains('read-more-btn')) {
        readMoreBtn = document.createElement('button');
        readMoreBtn.className = 'read-more-btn';
        readMoreBtn.textContent = 'Read More';
        contentDiv.parentNode.insertBefore(readMoreBtn, contentDiv.nextElementSibling);
    }

    // Dapatkan konten asli dari websiteData, tangani jalur bersarang
    let fullContent = '';
    const parts = contentId.split('-'); // contoh: ['session3', 'col3', 'content']
    if (parts.length >= 3) {
        const sessionId = parts[0];
        const contentKey = parts.slice(1).join('-'); // contoh: 'col3-content'
        fullContent = websiteData[sessionId]?.[contentKey] || '';
    } else {
        fullContent = contentDiv.innerHTML; // Fallback jika format ID tidak terduga
    }

    if (enableReadMore && fullContent.length > 200) { // Hanya terapkan jika konten panjang dan readmore diaktifkan
        contentDiv.innerHTML = fullContent.substring(0, 200) + '...'; // Atur konten awal yang diciutkan
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
        contentDiv.innerHTML = fullContent; // Tampilkan konten penuh
        contentDiv.classList.remove('collapsed');
        readMoreBtn.style.display = 'none'; // Sembunyikan tombol
    }
}


// Render item galeri di situs web utama
function renderGallery(containerId, items, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ''; // Hapus item yang ada

    items.forEach(item => {
        const galleryItemDiv = document.createElement('div');
        galleryItemDiv.className = 'gallery-item';

        if (type === 'image') {
            const img = document.createElement('img');
            img.src = item.url;
            img.alt = 'Gallery Image';
            galleryItemDiv.appendChild(img);
        } else if (type === 'video') {
            // Ekstrak ID video untuk sematan YouTube/Vimeo
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
            iframe.setAttribute('loading', 'lazy'); // Optimalkan pemuatan
            galleryItemDiv.appendChild(iframe);
        }
        container.appendChild(galleryItemDiv);
    });
}

// Fungsi untuk membuka halaman detail (fungsionalitas yang sudah ada)
function openDetail(id) {
    window.location.href = `detail.html?id=${id}`;
}
