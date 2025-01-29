import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;

  const signIn = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const userDoc = await getDoc(doc(FIREBASE_DB, 'users', uid));
      const user = userDoc.data();
      if (user.role !== 'student') {
        Alert.alert('Invalid user role');
        return;
      }
      console.log('Student logged in');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      await setDoc(doc(FIREBASE_DB, 'users', uid), { 
        email,
        name,
        role: 'student', 
      });
      console.log('Student account created');
      alert('Student account created');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Study Rats</Text>
      <View style={styles.titleContainer}>
        <Text style={styles.emoji}>🎓</Text>
        <Text style={styles.title}>Student Login</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Name (fill just to create account)"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={signIn}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonMargin]} onPress={signUp}>
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#498130',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    position: 'absolute',
    top: 50,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 24,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  input: {
    width: '100%',
    padding: 15,
    borderRadius: 25,
    backgroundColor: '#fff',
    marginBottom: 20,
    fontSize: 18,
  },
  button: {
    marginTop: 20,
    // width: '100%',
    padding: 15,
    borderRadius: 12,
    // backgroundColor: 'rgba(73, 129, 48, 0.17)',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: 'rgba(73, 129, 48, 0.8)',
    fontWeight: 'bold',
  },
  buttonMargin: {
    marginTop: 10,
  },
});

export default StudentLogin;