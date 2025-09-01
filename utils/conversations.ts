import { collection, doc, setDoc, getDoc, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Generate a unique conversation ID between two users
export const getConversationId = (userId1: string, userId2: string) => {
  return [userId1, userId2].sort().join('_');
};

// Create or get existing conversation
export const getOrCreateConversation = async (currentUserId: string, otherUserId: string, otherUserName: string) => {
  const conversationId = getConversationId(currentUserId, otherUserId);
  const conversationRef = doc(db, 'conversations', conversationId);
  
  const conversationDoc = await getDoc(conversationRef);
  
  if (!conversationDoc.exists()) {
    // Create new conversation
    await setDoc(conversationRef, {
      participants: [currentUserId, otherUserId],
      participantNames: {
        [currentUserId]: currentUserId,
        [otherUserId]: otherUserName
      },
      lastMessage: null,
      lastMessageTime: serverTimestamp(),
      createdAt: serverTimestamp()
    });
  }
  
  return conversationId;
};

// Send a message in a conversation
export const sendMessage = async (conversationId: string, senderId: string, senderName: string, text: string) => {
  // Add message to messages subcollection
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  await addDoc(messagesRef, {
    text,
    senderId,
    senderName,
    timestamp: serverTimestamp()
  });
  
  // Update conversation's last message
  const conversationRef = doc(db, 'conversations', conversationId);
  await updateDoc(conversationRef, {
    lastMessage: text,
    lastMessageTime: serverTimestamp(),
    lastMessageSenderId: senderId
  });
};

// Subscribe to messages in a conversation
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: any[]) => void
) => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};

// Subscribe to user's conversations
export const subscribeToConversations = (
  userId: string,
  callback: (conversations: any[]) => void
) => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTime', 'desc')
  );
  
  return onSnapshot(
    q, 
    (snapshot) => {
      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(conversations);
    },
    (error) => {
      console.error('Error fetching conversations:', error);
      // If index is not ready, try without ordering
      if (error.code === 'failed-precondition') {
        const simpleQuery = query(
          conversationsRef,
          where('participants', 'array-contains', userId)
        );
        return onSnapshot(simpleQuery, (snapshot) => {
          const conversations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          // Sort manually if index is not available
          conversations.sort((a, b) => {
            const timeA = a.lastMessageTime?.toMillis?.() || 0;
            const timeB = b.lastMessageTime?.toMillis?.() || 0;
            return timeB - timeA;
          });
          callback(conversations);
        });
      }
    }
  );
};