// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Importamos la base de datos

const firebaseConfig = {
  apiKey: "AIzaSyBlk3SAsHFkyMst9bUa1_pCn0QuoWw-0eA",
  authDomain: "lol-impostor-deyvi.firebaseapp.com",
  projectId: "lol-impostor-deyvi",
  storageBucket: "lol-impostor-deyvi.firebasestorage.app",
  messagingSenderId: "813812839987",
  appId: "1:813812839987:web:1389da938056c6ebc11546"
};

// 1. Iniciamos la app
const app = initializeApp(firebaseConfig);

// 2. Iniciamos la base de datos y la EXPORTAMOS para usarla en el juego
export const db = getFirestore(app);