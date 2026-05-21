import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgWbT7YyrSFflL9thn1px2cuUwPpynZOO",
  authDomain: "safety-videos-2026.firebaseapp.com",
  projectId: "safety-videos-2026",
  storageBucket: "safety-videos-2026.firebasestorage.app",
  messagingSenderId: "252891422855",
  appId: "1:252891422855:web:b2961c8a13f85c9db71822",
  measurementId: "G-TVC4H66NDD",
};

// تشغيل Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // ده أهم سطر عشان قاعدة البيانات تشتغل

// تصدير الأوامر للملفات التانية
window.db = db;
window.collection = collection;
window.addDoc = addDoc;
window.getDocs = getDocs;
window.deleteDoc = deleteDoc;
window.doc = doc;

console.log("Firebase Database Connected! ✅");
