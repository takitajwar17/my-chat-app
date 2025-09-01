# Firebase Setup for Expo Chat App (Messenger-Style)

This app uses Firebase JavaScript SDK with Expo Go for a one-to-one messaging app similar to Messenger.

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

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable **"Email/Password"** authentication
5. Click "Save"

## 5. Set up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose **"Start in test mode"** for development
4. Select your preferred location (e.g., us-central1)
5. Click "Enable"

## 6. Create Required Firestore Index

**IMPORTANT: This index is required for the app to work!**

### Option 1: Auto-create (Easiest)
1. Run the app and try to view the Chats tab
2. Check the console for an error with a link like: `https://console.firebase.google.com/v1/r/project/...`
3. Click that link - it will automatically create the required index

### Option 2: Manual Creation
1. Go to Firebase Console > Firestore Database > **Indexes** tab
2. Click **"Create Index"**
3. Configure as follows:
   - **Collection ID**: `conversations`
   - **Fields to index**:
     - Field path: `participants` | Order: `Arrays`
     - Field path: `lastMessageTime` | Order: `Descending`
   - **Query scope**: Collection
4. Click "Create"
5. Wait 1-5 minutes for the index to build

## 7. Configure Firestore Security Rules

For production, update your security rules:

1. Go to Firestore Database > **Rules** tab
2. Replace with these security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Conversations collection
    match /conversations/{conversationId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      allow create: if request.auth != null && 
        request.auth.uid in request.resource.data.participants;
      allow update: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        allow create: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants &&
          request.auth.uid == request.resource.data.senderId;
      }
    }
  }
}
```

3. Click "Publish"

## 8. Run the App

```bash
# Install dependencies
npm install

# Start the Expo development server
npm start

# Scan the QR code with Expo Go app on your phone
# Or press 'w' for web, 'i' for iOS simulator, 'a' for Android emulator
```

## App Features

### One-to-One Messaging (Like Messenger)
- **Chats Tab**: Shows all your conversations with last message preview
- **New Chat Tab**: Browse all users and start new conversations
- **Individual Chat**: Private messaging with message history
- **Real-time Updates**: Messages appear instantly for both users
- **Persistent Auth**: Stay logged in between sessions

### Database Structure
```
Firestore:
├── users/
│   └── {userId}/
│       ├── displayName
│       ├── email
│       └── createdAt
│
└── conversations/
    └── {conversationId}/
        ├── participants: [userId1, userId2]
        ├── participantNames: {userId1: name1, userId2: name2}
        ├── lastMessage: "message text"
        ├── lastMessageTime: timestamp
        ├── lastMessageSenderId: userId
        └── messages/
            └── {messageId}/
                ├── text
                ├── senderId
                ├── senderName
                └── timestamp
```

## Testing the App

1. **Create Account #1**: Sign up with first email
2. **Create Account #2**: Use different device/browser, sign up with second email
3. **Start Chatting**: 
   - Go to "New Chat" tab
   - Tap on the other user
   - Send messages back and forth
4. **View Conversations**: Return to "Chats" tab to see your conversation with preview

## Troubleshooting

### "The query requires an index" Error
- You need to create the Firestore index (see Step 6)
- Click the link in the error message for automatic creation

### Messages not appearing
- Check if both users are properly authenticated
- Verify Firestore rules are published
- Check browser console for errors
- Ensure the index has finished building (takes 1-5 minutes)

### "Permission Denied" Error
- Make sure you're logged in
- Check that Firestore rules are correctly configured
- Verify you're only accessing conversations you're a participant in

## Important Notes

- **Uses Firebase JavaScript SDK** (works with Expo Go)
- **Web app configuration only** (no native iOS/Android setup needed)
- **No native files required** (no GoogleService-Info.plist or google-services.json)
- **Works on all platforms** through Expo Go
- **AsyncStorage included** for auth persistence
- **Firestore index required** for conversations query to work