import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { getOrCreateConversation } from '@/utils/conversations';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface User {
  uid: string;
  displayName: string;
  email: string;
  createdAt: any;
}

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const currentUser = auth.currentUser;

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(q);
      
      const usersList = usersSnapshot.docs
        .map(doc => ({
          uid: doc.id,
          ...doc.data(),
        } as User))
        .filter(user => user.uid !== currentUser?.uid);
      
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const startChat = async (user: User) => {
    if (!currentUser) return;
    
    setStartingChat(user.uid);
    try {
      const conversationId = await getOrCreateConversation(
        currentUser.uid,
        user.uid,
        user.displayName || 'Unknown'
      );
      
      // Update the current user's name in the conversation
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`participantNames.${currentUser.uid}`]: currentUser.displayName || 'Anonymous'
      });
      
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: conversationId,
          userId: user.uid,
          userName: user.displayName || 'Unknown'
        }
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat');
    } finally {
      setStartingChat(null);
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userContainer, { backgroundColor: colors.background, borderBottomColor: colors.icon + '30' }]}
      onPress={() => startChat(item)}
      disabled={startingChat === item.uid}
    >
      <View style={[styles.avatarContainer, { backgroundColor: colors.tint }]}>
        <Text style={styles.avatarText}>
          {item.displayName ? item.displayName[0].toUpperCase() : '?'}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>{item.displayName || 'Anonymous'}</Text>
        <Text style={[styles.userEmail, { color: colors.icon }]}>{item.email}</Text>
      </View>
      {startingChat === item.uid ? (
        <Text style={[styles.loadingText, { color: colors.icon }]}>...</Text>
      ) : (
        <View style={[styles.startChatButton, { backgroundColor: colors.tint }]}>
          <IconSymbol name="message.fill" size={18} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.icon + '30' }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Start New Chat</Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
          {users.length} {users.length === 1 ? 'user' : 'users'} available
        </Text>
      </View>
      
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="person.2.slash" size={60} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.icon }]}>No other users yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  listContent: {
    flexGrow: 1,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
  },
  startChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
  },
});