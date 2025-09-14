// public/firebase-config.js

// INI YANG BENAR UNTUK PROJECT KITA
// Kita import langsung dari URL Firebase (bukan "firebase/app")
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Your web app's Firebase configuration
// Kunci-kunci ini udah bener, gw copy dari punya lu
const firebaseConfig = {
  apiKey: "AIzaSyDZnXCAO6b7mu5E3lC1xGEO_YUByphQB2k",
  authDomain: "web-gw-f63be.firebaseapp.com",
  projectId: "web-gw-f63be",
  storageBucket: "web-gw-f63be.appspot.com", // <-- Gw benerin dikit, harusnya .appspot.com
  messagingSenderId: "839331123143",
  appId: "1:839331123143:web:defa080f403bf1ebd953e2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Kita cuma butuh Auth dan Firestore, jadi analytics kita hapus aja biar bersih
export const auth = getAuth(app);
export const db = getFirestore(app);