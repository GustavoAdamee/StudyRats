import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Button, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { collection, query, getDocs, updateDoc, doc, arrayUnion, getDoc, where } from 'firebase/firestore';
import * as Location from 'expo-location';

const StudentProfileScreen = () => {
  const [studentName, setStudentName] = useState('Student');
  const [totalTimeStudied, setTotalTimeStudied] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [sessions, setSessions] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchStudentData = async () => {
      const user = FIREBASE_AUTH.currentUser;
      const uid = user.uid;
      if (user) {
        const userDoc = await getDoc(doc(FIREBASE_DB, 'users', uid));
        const userData = userDoc.data();
        setStudentName(userData.name);
        fetchStudySessions(uid);
      }
    };

    const fetchStudySessions = async (userId) => {
      const q = query(collection(FIREBASE_DB, 'studySessions'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      let totalTime = 0;
      let sessionsList = [];
      querySnapshot.forEach((doc, index) => {
        const data = doc.data();
        totalTime += data.studiedTime;
        sessionsList.push({ id: doc.id, ...data, sessionNumber: index + 1 });
      });
      setTotalTimeStudied(totalTime);
      setTotalSessions(sessionsList.length);
      setSessions(sessionsList);
    };

    fetchStudentData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
    } catch (error) {
      console.error(error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const coordToAdress = (lat, long) => {
    return Location.reverseGeocodeAsync({latitude: lat, longitude: long}).then((res) => {
      // console.log(res);
      return res[0].street + ', ' + res[0].name + ', ' + res[0].subregion + ', ' + res[0].postalCode;
    });
  };

  const renderSessionItem = ({ item, index }) => (
    <View style={styles.sessionItem}>
      <Text style={styles.sessionTitle}>Session {index + 1}</Text>
      <Text 
        style={{fontWeight: 'bold'}}
      >
        Address: <Text style={{fontWeight: '100'}}>{coordToAdress(item.location.latitude,item.location.longitude)}</Text>
      </Text>
      <Text
        style={{fontWeight: 'bold'}}
      >
        Total Time: <Text style={{fontWeight: '100'}}>{formatTime(item.studiedTime)}</Text>
      </Text>
      {item.image && <Image source={{ uri: item.image }} style={styles.sessionImage} />}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Student {studentName}</Text>
        <Text></Text>
      </View>
      <View style={styles.totalsContainer}>
        <Text>Total Time Studied: {formatTime(totalTimeStudied)}</Text>
        <Text>Total Study Sessions: {totalSessions}</Text>
      </View>
      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        style={styles.flatList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
  totalsContainer: {
    marginBottom: 16,
  },
  flatList: {
    marginTop: 16,
  },
  sessionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  sessionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  sessionImage: {
    width: '100%',
    height: 200,
    marginTop: 8,
  },
});

export default StudentProfileScreen;