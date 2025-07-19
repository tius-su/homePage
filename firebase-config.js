// Firebase Configuration
// StackBlitz WebCode Firebase Configuration
// Disabled Firebase for StackBlitz demo - using localStorage fallback
const firebaseConfig = null;

// Initialize Firebase with error handling
let auth, db, storage;

// Using localStorage fallback for StackBlitz demo
console.log('Using localStorage fallback for StackBlitz demo');

// Mock Firebase services for development
auth = {
    onAuthStateChanged: (callback) => {
        // Check for existing user in localStorage
        const mockUser = localStorage.getItem('mockUser');
        setTimeout(() => callback(mockUser ? JSON.parse(mockUser) : null), 100);
        return () => {};
    },
    signInWithEmailAndPassword: (email, password) => {
        return new Promise((resolve, reject) => {
            if (email === 'admin@example.com' && password === 'admin123') {
                const mockUser = { email: email, uid: 'mock-user-id' };
                localStorage.setItem('mockUser', JSON.stringify(mockUser));
                resolve({ user: mockUser });
            } else {
                reject(new Error('Invalid credentials'));
            }
        });
    },
    signOut: () => {
        localStorage.removeItem('mockUser');
        return Promise.resolve();
    }
};

db = {
    collection: (collectionName) => ({
        doc: (docId) => ({
            get: () => {
                const data = localStorage.getItem(`${collectionName}_${docId}`);
                return Promise.resolve({
                    exists: !!data,
                    data: () => data ? JSON.parse(data) : null
                });
            },
            set: (data, options = {}) => {
                const existingData = localStorage.getItem(`${collectionName}_${docId}`);
                const finalData = options.merge && existingData ? 
                    { ...JSON.parse(existingData), ...data } : data;
                localStorage.setItem(`${collectionName}_${docId}`, JSON.stringify(finalData));
                return Promise.resolve();
            }
        }),
        add: (data) => {
            const id = Date.now().toString();
            localStorage.setItem(`${collectionName}_${id}`, JSON.stringify(data));
            return Promise.resolve({ id });
        },
        where: () => ({
            orderBy: () => ({
                get: () => Promise.resolve({ empty: true, forEach: () => {} })
            })
        })
    })
};

storage = {
    ref: () => ({
        child: (path) => ({
            put: (file) => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const dataUrl = e.target.result;
                        localStorage.setItem(`storage_${path}`, dataUrl);
                        resolve({
                            ref: {
                                getDownloadURL: () => Promise.resolve(dataUrl)
                            }
                        });
                    };
                    reader.readAsDataURL(file);
                });
            }
        })
    })
};


// Firestore Security Rules (to be set in Firebase Console)
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all users
    match /{document=**} {
      allow read: if true;
    }
    
    // Allow write access only to authenticated users
    match /{document=**} {
      allow write: if request.auth != null;
    }
  }
}
*/

// Storage Security Rules (to be set in Firebase Console)
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