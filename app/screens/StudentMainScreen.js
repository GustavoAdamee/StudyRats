import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { collection, query, getDocs, updateDoc, doc, arrayUnion, getDoc, where } from 'firebase/firestore';

const StudentMainScreen = () => {
  const [studentName, setStudentName] = useState('Student');
  const [groups, setGroups] = useState([]);
  const [userGroup, setUserGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([]);
  const [isInGroup, setIsInGroup] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchStudentName = async () => {
      const user = FIREBASE_AUTH.currentUser;
      const uid = user.uid;
      if (user) {
        const userDoc = await getDoc(doc(FIREBASE_DB, 'users', uid));
        const userData = userDoc.data();
        setStudentName(userData.name);
        setUserGroup(userData.groupId || null);
        if (userData.groupId) {
          fetchGroupDetails(userData.groupId);
          setIsInGroup(true);
        }
      }
    };

    const fetchGroups = async () => {
      try {
        const q = query(collection(FIREBASE_DB, 'groups'));
        const querySnapshot = await getDocs(q);
        const groupsList = querySnapshot.docs.map(doc => ({ id: doc.id, membersCount: doc.data().members.length, ...doc.data() }));
        setGroups(groupsList);
      } catch (error) {
        console.error(error);
      }
    };

    fetchStudentName();
    fetchGroups();
  }, []);

  const fetchGroupDetails = async (groupId) => {
    const groupDoc = await getDoc(doc(FIREBASE_DB, 'groups', groupId));
    const groupData = groupDoc.data();
    const membersWithNames = await Promise.all(groupData.members.map(async (member) => {
      const userDoc = await getDoc(doc(FIREBASE_DB, 'users', member.userId));
      const userData = userDoc.data();
      const totalTimeStudied = await calculateTotalTimeStudied(member.userId);
      return { ...member, userName: userData.name, totalTimeStudied };
    }));
    membersWithNames.sort((a, b) => b.totalTimeStudied - a.totalTimeStudied);
    setGroupName(groupData.name);
    setMembers(membersWithNames);
  };

  const calculateTotalTimeStudied = async (userId) => {
    const q = query(collection(FIREBASE_DB, 'studySessions'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    let totalTime = 0;
    querySnapshot.forEach(doc => {
      totalTime += doc.data().studiedTime;
    });
    return totalTime;
  };

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
    } catch (error) {
      console.error(error);
    }
  };

  const handleJoinGroup = async (groupId) => {
    const user = FIREBASE_AUTH.currentUser;
    const uid = user.uid;
    try {
      await updateDoc(doc(FIREBASE_DB, 'users', uid), { groupId });
      await updateDoc(doc(FIREBASE_DB, 'groups', groupId), {
        members: arrayUnion({ userId: uid})
      });
      setUserGroup(groupId);
      fetchGroupDetails(groupId);
      setIsInGroup(true);
      Alert.alert('Success', 'You have joined the group');
    } catch (error) {
      console.error(error);
    }
  };

  const handleLeaveGroup = async () => {
    const user = FIREBASE_AUTH.currentUser;
    const uid = user.uid;
    try {
      await updateDoc(doc(FIREBASE_DB, 'users', uid), { groupId: null });
      await updateDoc(doc(FIREBASE_DB, 'groups', userGroup), {
        members: members.filter(member => member.userId !== uid)
      });
      setUserGroup(null);
      setGroupName('');
      setMembers([]);
      setIsInGroup(false);
      Alert.alert('Success', 'You have left the group');
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartSession = () => {
    navigation.navigate('StudySession');
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity style={styles.groupTile} onPress={() => handleJoinGroup(item.id)}>
      <Text style={styles.groupTileText}>{item.name}</Text>
      <Text style={styles.groupTileMembers}>{item.membersCount} members</Text>
    </TouchableOpacity>
  );

  const renderMemberItem = ({ item, index }) => (
    <View style={styles.memberTile}>
      <View style={styles.rankCircle}>
        <Text style={styles.rankText}>{index + 1}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.rankingUserName}>{item.userName}</Text>
        <Text style={styles.totalTimeText}>{formatTime(item.totalTimeStudied)}</Text>
      </View>
      {index === 0 && <Text style={styles.trophyEmoji}>🏆</Text>}
    </View>
  );

  return (
    <View style={[styles.container, isInGroup && styles.groupContainer]}>
      <Text style={styles.logo}>📚</Text>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isInGroup && styles.titleWhite]}>Student {studentName}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => navigation.navigate("StudentProfile")} style={styles.profileButton}>
            <Text style={styles.profileButtonText}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>
      {isInGroup ? (
        <View>
          <View style={styles.subtitle}>
            <View style={styles.groupInfo}>
              <Text style={styles.groupTitle}>{groupName}</Text>
              <Text style={styles.groupStudents}>{members.length} students</Text>
            </View>
            <TouchableOpacity onPress={handleLeaveGroup} style={styles.leaveGroupButton}>
              <Text style={styles.leaveGroupButtonText}>Leave group</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleStartSession} style={styles.startSessionButton}>
            <Text style={styles.startSessionText}>Start study session</Text>
            <Text style={styles.bookEmoji}>📚</Text>
          </TouchableOpacity>
          <FlatList
            style={{ marginTop: 22 }}
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.userId}
          />
        </View>
      ) : (
        <>
          <View style={styles.noGroupBox}>
            <Text style={styles.noGroupMessage}>Enter your first study group :)</Text>
          </View>
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={item => item.id}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  groupContainer: {
    backgroundColor: '#498130',
  },
  logo: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 16,
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
  titleWhite: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
    flexDirection: 'row',
  },
  groupTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  groupStudents: {
    color: '#fff',
  },
  groupItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  groupInfo: {
    flex: 1,
  },
  memberTile: {
    backgroundColor: '#fff',
    padding: 6,
    marginVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#d3d3d3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 16,
  },
  rankingUserName: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  totalTimeText: {
    fontSize: 18,
  },
  trophyEmoji: {
    fontSize: 24,
  },
  profileButton: {
    marginRight: 10,
  },
  profileButtonText: {
    fontSize: 24,
    color: 'black',
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
  startSessionButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%',
    alignSelf: 'center',
  },
  startSessionText: {
    fontSize: 18,
    color: '#498130',
  },
  bookEmoji: {
    fontSize: 18,
    color: '#498130',
  },
  leaveGroupButton: {
    marginTop: 10,
    marginBottom: 10,
    padding: 5,
    backgroundColor: '#f00',
    borderRadius: 5,
  },
  leaveGroupButtonText: {
    fontSize: 12,
    color: '#fff',
  },
  noGroupBox: {
    alignItems: 'center',
    flex: 0.5,
    justifyContent: 'center',
    textAlign: 'center',
    marginTop: 16,
  },
  noGroupMessage: {
    fontSize: 28,
    textAlign: 'center',
  },
  groupTile: {
    backgroundColor: '#498130',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupTileText: {
    color: '#fff',
    fontSize: 26,
  },
  groupTileMembers: {
    color: '#fff',
    fontSize: 12,
  },
});

export default StudentMainScreen;