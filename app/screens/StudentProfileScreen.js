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
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionTitle}>Session {index + 1}</Text>
        <Text style={styles.sessionTime}>{formatTime(item.studiedTime)}</Text>
      </View>
      <Text style={styles.sessionAddress}>{coordToAdress(item.location.latitude, item.location.longitude)}</Text>
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
        <View style={styles.totalsTile}>
          <Text style={styles.totalsText}>Total Time Studied:</Text>
        </View>
        <Text style={styles.totalsTextOut}>{formatTime(totalTimeStudied)}</Text>
        <View style={styles.totalsTile}>
          <Text style={styles.totalsText}>Total Study Sessions:</Text>
        </View>
        <Text style={styles.totalsTextOut}>{totalSessions}</Text>
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
    backgroundColor: '#498130', // Changed background color
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
    paddingRight: 30,
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
    marginTop: 40,
    marginBottom: 10,
    alignItems: 'center', // Centered on screen
  },
  totalsText: {
    fontSize: 20, // Big font size
    // fontWeight: 'bold',
    color: '#000', // Black font color
  },
  totalsTextOut: {
    fontSize: 40, // Big font size
    // fontWeight: 'bold',
    color: '#FFF', // Black font color
    marginBottom: 16,
  },
  totalsTile: {
    backgroundColor: '#fff', // White tile
    padding: 8,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 5,
  },
  flatList: {
    marginTop: 16,
  },
  sessionItem: {
    padding: 16,
    marginBottom: 16, // Spaced from one another
    backgroundColor: '#fff', // White tile
    borderRadius: 10, // Rounded corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'column', // Align vertically
    alignItems: 'flex-start',
  },
  sessionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  sessionTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A9A9A9', // Light gray color
  },
  sessionAddress: {
    fontSize: 16,
    marginTop: 4,
    color: '#A9A9A9', // Light gray color
  },
  sessionImage: {
    width: '100%',
    height: 200,
    marginTop: 8,
  },
});

export default StudentProfileScreen;