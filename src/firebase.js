import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCMhShqK32bQ-YVsUCfgWpoVAGh9bFFj_8",
  authDomain: "chatapp-8302d.firebaseapp.com",
  projectId: "chatapp-8302d",
  storageBucket: "chatapp-8302d.firebasestorage.app",
  messagingSenderId: "484227729320",
  appId: "1:484227729320:web:cea33c02abf3fd353eff9d",
  measurementId: "G-SP1L8644GV"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);