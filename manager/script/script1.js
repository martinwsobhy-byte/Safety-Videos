// 1. استدعاء مكتبة قاعدة البيانات (Firestore)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. بيانات مشروعك
const firebaseConfig = {
  apiKey: "AIzaSyAgWbT7YyrSFflL9thn1px2cuUwPpynZOO",
  authDomain: "safety-videos-2026.firebaseapp.com",
  projectId: "safety-videos-2026",
  storageBucket: "safety-videos-2026.firebasestorage.app",
  messagingSenderId: "252891422855",
  appId: "1:252891422855:web:b2961c8a13f85c9db71822",
  measurementId: "G-TVC4H66NDD",
};

// 3. تشغيل الـ App والـ Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. جعل الـ db متاح لباقي الكود
window.db = db;
window.collection = collection;
window.addDoc = addDoc;
window.getDocs = getDocs;

console.log("Firebase is ready! 🚀");
