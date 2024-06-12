import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyBcmwPjJO4xP0ivg37T9LpLyUTx8GS-Z3U",
  authDomain: "vibechat-bee21.firebaseapp.com",
  projectId: "vibechat-bee21",
  storageBucket: "vibechat-bee21.appspot.com",
  messagingSenderId: "4418645149",
  appId: "1:4418645149:web:5493454eda17398b337874",
  measurementId: "G-6D2ZQK9WYJ"
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()
