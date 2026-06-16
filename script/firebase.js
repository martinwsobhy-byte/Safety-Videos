import { initializeApp }                from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import { getFirestore, collection,
         getDocs, addDoc, updateDoc,
         deleteDoc, doc, query,
         where, getDoc, onSnapshot }   from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey:            'AIzaSyAgWbT7YyrSFflL9thn1px2cuUwPpynZ00',
    authDomain:        'safety-videos-2026.firebaseapp.com',
    projectId:         'safety-videos-2026',
    storageBucket:     'safety-videos-2026.firebasestorage.app',
    messagingSenderId: '252891422855',
    appId:             '1:252891422855:web:581cedd1265f88cfb71822',
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

export { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc, onSnapshot };
