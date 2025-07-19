    // Firebase Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyAnnfK9njvEp2jPFxc-wnPldwxaNqp2GgE",
        authDomain: "homepage-71aa8.firebaseapp.com",
        projectId: "homepage-71aa8",
        storageBucket: "homepage-71aa8.firebasestorage.app",
        messagingSenderId: "238347756112",
        appId: "1:238347756112:web:6b33d6772f3568385f2755"
    };

    // Inisialisasi Firebase App jika belum diinisialisasi
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Variabel global ini digunakan oleh lingkungan Canvas
    const __firebase_config = JSON.stringify(firebaseConfig);
    const __initial_auth_token = null; 
    
