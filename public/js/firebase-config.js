// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCqZuvTQ-7QLq6G6pffpll6fHNhDBvkxnY",
  authDomain: "myshop-b6757.firebaseapp.com",
  projectId: "myshop-b6757",
  storageBucket: "myshop-b6757.firebasestorage.app",
  messagingSenderId: "608318671797",
  appId: "1:608318671797:web:720ee5fd33d4f2c94467fc",
  measurementId: "G-T0YV3NYGT3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);