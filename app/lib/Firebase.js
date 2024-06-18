import { initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: "vibechat-bee21.firebaseapp.com",
  projectId: "vibechat-bee21",
  storageBucket: "vibechat-bee21.appspot.com",
  messagingSenderId: "4418645149",
  appId: "1:4418645149:web:5493454eda17398b337874",
  measurementId: "G-6D2ZQK9WYJ"
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize providers
export const githubProvider = new GithubAuthProvider();
export const googleProvider = new GoogleAuthProvider();


export const signInWithGitHub = () => signInWithPopup(auth, githubProvider);
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
