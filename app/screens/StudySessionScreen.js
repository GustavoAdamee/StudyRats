import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

const StudySessionScreen = () => {
  const [location, setLocation] = useState(null);
  const [image, setImage] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});    
      setLocation(location);
    })();
  }, []);

  const handleStartStop = () => {
    if (isRunning) {
      clearInterval(intervalId);
    } else {
      const id = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
      setIntervalId(id);
    }
    setIsRunning(!isRunning);
  };

  const handleStopSession = async () => {
    clearInterval(intervalId);
    setIsRunning(false);
    const user = FIREBASE_AUTH.currentUser;
    try {
      await addDoc(collection(FIREBASE_DB, 'studySessions'), {
        userId: user.uid,
        studiedTime: time,
        location: location?.coords,
        image: image,
      });
      Alert.alert('Success', 'Study session saved');
      navigation.navigate('StudentMain');
    } catch (error) {
      console.error('Error saving study session: ', error);
    }
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchCameraAsync();
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
    } catch (error) {
      console.error('Error logging out: ', error);
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Study Session</Text>
        {/* GAMBIARRA :) */}
        <TouchableOpacity onPress={() => navigation.navigate('StudentProfile')} style={styles.profileButton}>
          {/* <Text style={styles.profileButtonText}>👤</Text> */}
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <TouchableOpacity style={styles.registerButton} onPress={handlePickImage}>
          <Text style={styles.registerButtonText}>📷 Register your session</Text>
        </TouchableOpacity>
        <AnimatedCircularProgress
          size={200}
          width={3}
          fill={100}
          tintColor="green"
          backgroundColor="#3d5875"
          style={styles.cronometer}
        >
          {() => <Text style={styles.timeText}>{new Date(time * 1000).toISOString().substr(11, 8)}</Text>}
        </AnimatedCircularProgress>
        <View style={styles.buttons}>
          <Button title={isRunning ? "Pause" : "Resume"} onPress={handleStartStop} />
          <Button title="Stop" onPress={handleStopSession} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 0.9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileButton: {
    marginRight: 10,
  },
  profileButtonText: {
    fontSize: 18,
  },
  logoutButton: {
    padding: 5,
    backgroundColor: '#f00',
    borderRadius: 5,
  },
  logoutButtonText: {
    fontSize: 12,
    color: '#fff',
  },
  registerButton: {
    marginVertical: 40,
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,

  },
  registerButtonText: {
    fontSize: 18,
  },
  cronometer: {
    marginVertical: 20,
  },
  timeText: {
    fontSize: 30,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    padding: 20,
  },
  
});

export default StudySessionScreen;