// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAXGs4SuX7LtEoDZ5NgUlbukkvY2098WNY",
  authDomain: "arka-auditor.firebaseapp.com",
  projectId: "arka-auditor",
  storageBucket: "arka-auditor.firebasestorage.app",
  messagingSenderId: "929721502087",
  appId: "1:929721502087:web:510c4b342b593f610e2b22"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const provider = new GithubAuthProvider();