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

// Inisialisasi Firebase dengan penanganan kesalahan
// Variabel ini akan tersedia secara global setelah SDK dimuat
let auth, db, storage;

// Inisialisasi Firebase App
// Penting: Inisialisasi ini harus terjadi hanya sekali
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Tetapkan layanan Firebase ke variabel global
auth = firebase.auth();
db = firebase.firestore();
storage = firebase.storage();

// Variabel global ini digunakan oleh lingkungan Canvas
// Jangan ubah ini kecuali Anda tahu apa yang Anda lakukan
const __firebase_config = JSON.stringify(firebaseConfig);
const __initial_auth_token = null; // Biarkan ini null jika Anda tidak menggunakan token kustom

// Aturan Keamanan Firestore (untuk diatur di Konsol Firebase)
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Izinkan siapa saja untuk membaca data
    // Izinkan hanya pengguna terautentikasi untuk menulis data
    match /website/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /customPages/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
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
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
*/
