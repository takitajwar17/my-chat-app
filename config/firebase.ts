import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCZLMi4j6qOzxvMUl9kHfLDEMzoc-tJLi4",
  authDomain: "my-chat-app-a40af.firebaseapp.com",
  projectId: "my-chat-app-a40af",
  storageBucket: "my-chat-app-a40af.firebasestorage.app",
  messagingSenderId: "1060341722891",
  appId: "1:1060341722891:web:67304a20a2bbc1e4a7fc0e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
// Note: AsyncStorage persistence is automatically handled by Firebase SDK in React Native
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;