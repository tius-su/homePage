// Firebase Configuration
// Konfigurasi Firebase yang sebenarnya untuk proyek Anda
const firebaseConfig = {
    apiKey: "AIzaSyAnnfK9njvEp2jPFxc-wnPldwxaNqp2GgE",
    authDomain: "homepage-71aa8.firebaseapp.com",
    projectId: "homepage-71aa8",
    storageBucket: "homepage-71aa8.firebasestorage.app",
    messagingSenderId: "238347756112",
    appId: "1:238347756112:web:6b33d6772f3568385f2755"
};

// Inisialisasi Firebase App jika belum diinisialisasi
// Ini akan membuat objek 'firebase' global tersedia
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Variabel global ini digunakan oleh lingkungan Canvas
// Jangan ubah ini kecuali Anda tahu apa yang Anda lakukan
const __firebase_config = JSON.stringify(firebaseConfig);
const __initial_auth_token = null; // Biarkan ini null jika Anda tidak menggunakan token kustom

// Aturan Keamanan Firestore (untuk diatur di Konsol Firebase)
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Izinkan siapa saja (termasuk yang tidak terautentikasi) untuk MEMBACA data
    // dari koleksi 'website' dan 'customPages'.
    // Izinkan HANYA pengguna yang TERAUTENTIKASI untuk MENULIS data.
    match /website/{document=**} {
      allow read: if true; // SIAPA SAJA BOLEH MEMBACA
      allow write: if request.auth != null; // HANYA PENGGUNA TERAUTENTIKASI BOLEH MENULIS
    }

    match /customPages/{document=**} {
      allow read: if true; // SIAPA SAJA BOLEH MEMBACA
      allow write: if request.auth != null; // HANYA PENGGUNA TERAUTENTIKASI BOLEH MENULIS
    }
  }
}
*/

// Aturan Keamanan Storage (untuk diatur di Konsol Firebase)
/*
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true; // SIAPA SAJA BOLEH MEMBACA
      allow write: if request.auth != null; // HANYA PENGGUNA TERAUTENTIKASI BOLEH MENULIS
    }
  }
}
*/
