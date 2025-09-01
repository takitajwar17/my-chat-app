import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(user, {
        displayName: displayName,
      });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: displayName,
        email: email,
        createdAt: serverTimestamp(),
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Registration Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>Sign up to get started</Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.icon }]}
          placeholder="Display Name"
          placeholderTextColor={colors.icon}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />

        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.icon }]}
          placeholder="Email"
          placeholderTextColor={colors.icon}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.icon }]}
          placeholder="Password (min 6 characters)"
          placeholderTextColor={colors.icon}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? 'Creating Account...' : 'Sign Up'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.linkText, { color: colors.tint }]}>
            Already have an account? Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});