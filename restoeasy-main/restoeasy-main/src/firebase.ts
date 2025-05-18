import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmO4uHOMQyVzmg7Xzb3NYVZ7QY8GMgYPM",
  authDomain: "restoeasy-n3y17.firebaseapp.com",
  projectId: "restoeasy-n3y17",
  storageBucket: "restoeasy-n3y17.firebasestorage.app",
  messagingSenderId: "709741771801",
  appId: "1:709741771801:web:4fcb2d527a2d0c080b3e88"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };