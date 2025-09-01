# Firebase Setup for Expo Chat App

This app uses Firebase JavaScript SDK which works with Expo Go. Follow these steps to set up Firebase:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name your project (e.g., "my-chat-app")
4. Disable Google Analytics (optional)
5. Click "Create project"

## 2. Add a Web App to Firebase (NOT iOS/Android)

**IMPORTANT: Only add a Web app, NOT iOS or Android apps!**

1. In your Firebase project, click the **web icon (</>)** to add a web app
2. Register your app with a nickname (e.g., "my-chat-app-web")
3. Copy the Firebase configuration object that appears
4. **Do NOT download any native files (GoogleService-Info.plist or google-services.json)**

## 3. Update Firebase Configuration

1. Open `/config/firebase.ts`
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 4. Enable Authentication

1. In Firebase Console, go to Authentication
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Click "Save"

## 5. Set up Firestore Database

1. In Firebase Console, go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select your preferred location (e.g., us-central1)
5. Click "Enable"

## 6. Configure Firestore Security Rules

For development (test mode), your rules allow read/write for 30 days. For production, update them:

1. Go to Firestore Database > Rules
2. Replace with these security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read and write their own user document
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Authenticated users can read and write messages
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click "Publish"

## 7. Run the App

```bash
# Install dependencies if you haven't
npm install

# Start the Expo development server
npm start

# Scan the QR code with Expo Go app on your phone
# Or press 'w' for web, 'i' for iOS simulator, 'a' for Android emulator
```

## Testing the App

1. Open the app in Expo Go or your browser
2. Create a new account using the "Sign Up" link
3. Start chatting!
4. Create another account (use a different device/browser) to test real-time messaging

## Troubleshooting

### "Firebase App not initialized" Error
- Make sure your Firebase config values are correct
- Check that you've enabled Email/Password authentication

### "Permission Denied" Error
- Ensure Firestore is enabled in Firebase Console
- Check that you're authenticated before accessing Firestore
- Verify your security rules allow the operation

### Messages not showing
- Check Firestore Database in Firebase Console to see if messages are being saved
- Ensure your Firestore rules allow read access for authenticated users
- Check browser console for any errors

## Important Notes

- **This app uses Firebase JavaScript SDK, NOT React Native Firebase**
- **You only need to add a Web app in Firebase Console**
- **No native configuration files are needed** (no GoogleService-Info.plist or google-services.json)
- **No iOS/Android apps need to be added in Firebase Console**
- The app works on iOS, Android, and Web through Expo Go
- For production apps, implement proper security rules and authentication flows