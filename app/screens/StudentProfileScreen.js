import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { collection, query, getDocs, updateDoc, doc, arrayUnion, getDoc, where } from 'firebase/firestore';

const StudentProfileScreen = () => {
  const [studentName, setStudentName] = useState('Student');
//   const [groups, setGroups] = useState([]);
//   const [userGroup, setUserGroup] = useState(null);
//   const [groupName, setGroupName] = useState('');
//   const [members, setMembers] = useState([]);
//   const [isInGroup, setIsInGroup] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchStudentName = async () => {
      const user = FIREBASE_AUTH.currentUser;
      const uid = user.uid;
      if (user) {
        const userDoc = await getDoc(doc(FIREBASE_DB, 'users', uid));
        const userData = userDoc.data();
        setStudentName(userData.name);
      }
    };

    fetchStudentName();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
                <Text style={styles.title}>Student {studentName}</Text>
                <View style={styles.headerButtons}>
                {/* GAMBIARRA */}
                <TouchableOpacity onPress={() => navigation.navigate("StudentProfile")} style={styles.profileButton}>
                    {/* <Text style={styles.profileButtonText}>👤</Text> */}
                </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
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
  }
});

export default StudentProfileScreen;