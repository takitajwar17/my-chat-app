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
import { auth } from '@/config/firebase';
import { subscribeToConversations } from '@/utils/conversations';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface Conversation {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  lastMessage: string | null;
  lastMessageTime: any;
  lastMessageSenderId: string;
}

export default function ConversationsScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToConversations(currentUser.uid, (convos) => {
      setConversations(convos);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getOtherUserName = (conversation: Conversation) => {
    if (!currentUser) return 'Unknown';
    const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
    return conversation.participantNames[otherUserId || ''] || 'Unknown User';
  };

  const getOtherUserId = (conversation: Conversation) => {
    if (!currentUser) return '';
    return conversation.participants.find(id => id !== currentUser.uid) || '';
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUserName = getOtherUserName(item);
    const otherUserId = getOtherUserId(item);
    const isLastMessageMine = item.lastMessageSenderId === currentUser?.uid;
    
    return (
      <TouchableOpacity
        style={[styles.conversationItem, { borderBottomColor: colors.icon + '30' }]}
        onPress={() => {
          router.push({
            pathname: '/chat/[id]',
            params: {
              id: item.id,
              userId: otherUserId,
              userName: otherUserName
            }
          });
        }}
      >
        <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
          <Text style={styles.avatarText}>
            {otherUserName[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {otherUserName}
            </Text>
            <Text style={[styles.timestamp, { color: colors.icon }]}>
              {formatTime(item.lastMessageTime)}
            </Text>
          </View>
          <Text style={[styles.lastMessage, { color: colors.icon }]} numberOfLines={1}>
            {item.lastMessage ? (
              isLastMessageMine ? `You: ${item.lastMessage}` : item.lastMessage
            ) : (
              'Start a conversation'
            )}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.icon} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="message.badge.slash" size={60} color={colors.icon} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No conversations yet</Text>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            Go to the Users tab to start a new chat
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});