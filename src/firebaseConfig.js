// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA1yaBT3iAQjUxBDazevdvHrm01CKPyhu4",
  authDomain: "cancare-admin-f0646.firebaseapp.com",
  projectId: "cancare-admin-f0646",
  storageBucket: "cancare-admin-f0646.firebasestorage.app",
  messagingSenderId: "718239264276",
  appId: "1:718239264276:web:5992ceec92715d78550101",
  measurementId: "G-MBZNWXTF6F"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
