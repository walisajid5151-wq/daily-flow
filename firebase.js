import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCgFDo_QayYlg_BDgz87kXU2ruMT6tNePI",
  authDomain: "planit-7d547.firebaseapp.com",
  projectId: "planit-7d547",
  storageBucket: "planit-7d547.appspot.com",
  messagingSenderId: "303143714610",
  appId: "1:303143714610:web:bacf18a1e646ab1676e12b",
  measurementId: "G-C221WEKVF8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);      // For login/signup
export const db = getFirestore(app);   // For tasks, streaks, routines
export const analytics = getAnalytics(app);
