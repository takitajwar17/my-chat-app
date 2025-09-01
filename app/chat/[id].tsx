import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { auth } from '@/config/firebase';
import { subscribeToMessages, sendMessage } from '@/utils/conversations';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
}

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const conversationId = params.id as string;
  const otherUserName = params.userName as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      // Auto-scroll to bottom when new messages arrive
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [conversationId, currentUser]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentUser || !conversationId) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      await sendMessage(
        conversationId,
        currentUser.uid,
        currentUser.displayName || 'Anonymous',
        messageText
      );
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setInputText(messageText);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === currentUser?.uid;
    const showTimestamp = index === 0 || 
      (messages[index - 1] && messages[index - 1].senderId !== item.senderId);
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {showTimestamp && !isOwnMessage && (
          <Text style={[styles.senderName, { color: colors.tint }]}>
            {item.senderName}
          </Text>
        )}
        <View style={[
          styles.messageBubble,
          isOwnMessage 
            ? [styles.ownMessageBubble, { 
                backgroundColor: colorScheme === 'dark' ? '#0A84FF' : '#007AFF' 
              }]
            : [styles.otherMessageBubble, { 
                backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#E9E9EB' 
              }]
        ]}>
          <Text style={[
            styles.messageText,
            { color: isOwnMessage ? 'white' : colors.text }
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime,
            { color: isOwnMessage ? 'rgba(255,255,255,0.8)' : (colorScheme === 'dark' ? '#8E8E93' : '#6C6C70') }
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  }, [currentUser, colors, messages]);

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: otherUserName || 'Chat',
          headerBackTitle: 'Chats'
        }} 
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
        
        <View style={[styles.inputContainer, { 
          borderTopColor: colorScheme === 'dark' ? '#3A3A3C' : '#E5E5EA',
          backgroundColor: colors.background 
        }]}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F2F2F7',
              color: colors.text 
            }]}
            placeholder={`Message ${otherUserName}...`}
            placeholderTextColor={colorScheme === 'dark' ? '#8E8E93' : '#8E8E93'}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, { 
              backgroundColor: inputText.trim() 
                ? (colorScheme === 'dark' ? '#0A84FF' : '#007AFF')
                : (colorScheme === 'dark' ? '#2C2C2E' : '#E5E5EA')
            }]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <IconSymbol 
              name="paperplane.fill" 
              size={24} 
              color={inputText.trim() ? 'white' : (colorScheme === 'dark' ? '#8E8E93' : '#8E8E93')} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 5,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: 10,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});