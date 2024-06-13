// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider, signInWithPopup } from "firebase/auth";
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

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const provider = new GithubAuthProvider();
export const signInWithGitHub = () => signInWithPopup(auth, provider);
