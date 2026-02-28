import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCr7hj5u9JXoI2rLZPtQ1068AUZS8O6jww",
  authDomain: "remnant-new.firebaseapp.com",
  projectId: "remnant-new",
  storageBucket: "remnant-new.appspot.com",
  messagingSenderId: "85063514125",
  appId: "1:85063514125:android:7cd05a438d180901bfbd44"
};

// Next.js에서는 중복 초기화 방지
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
