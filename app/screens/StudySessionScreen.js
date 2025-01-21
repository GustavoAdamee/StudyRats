import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
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
  const auth = getAuth();
  const db = getFirestore();

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
    console.log('Stopping session');
    console.log('Time:', time);
    console.log('Location:', location?.coords);
    console.log('Image:', image);
    clearInterval(intervalId);
    setIsRunning(false);
    const user = auth.currentUser;
    await addDoc(collection(db, 'studySessions'), {
      userId: user.uid,
      studiedTime: time,
      location: location?.coords,
      image: image,
    });
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchCameraAsync();
    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigation.replace('LoginScreen');
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Student {auth.currentUser.displayName}</Text>
        <Button title="Profile" onPress={() => navigation.navigate('ProfileScreen')} />
        <Button title="Logout" onPress={handleLogout} />
      </View>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 20,
  },
  welcome: {
    fontSize: 20,
  },
  registerButton: {
    marginVertical: 20,
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