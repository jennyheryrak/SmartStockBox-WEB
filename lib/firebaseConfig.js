import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Ta configuration existante
const firebaseConfig = {
  apiKey: "AIzaSyD_1siugGFDglZu7b-3M9TSX-C1ndIpD5o",
  authDomain: "smartstockbox.firebaseapp.com",
  databaseURL: "https://smartstockbox-default-rtdb.firebaseio.com",
  projectId: "smartstockbox",
  storageBucket: "smartstockbox.firebasestorage.app",
  messagingSenderId: "909859867323",
  appId: "1:909859867323:web:b456eb39007021d431b79e",
  measurementId: "G-XJVQ9G0KCQ"
};

// Initialisation unique
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Export pour Auth et Database
export const auth = getAuth(app);
export const database = getDatabase(app);
