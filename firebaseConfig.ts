import { initializeApp } from 'firebase/app';
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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
