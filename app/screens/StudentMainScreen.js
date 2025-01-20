import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Button } from 'react-native';
import { signOut } from 'firebase/auth';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { collection, query, getDocs, updateDoc, doc, arrayUnion, getDoc } from 'firebase/firestore';

const StudentMainScreen = () => {
  const [studentName, setStudentName] = useState('Student');
  const [groups, setGroups] = useState([]);
  const [userGroup, setUserGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([]);
  const [isInGroup, setIsInGroup] = useState(false);

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
        const groupsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
      return { ...member, userName: userData.name };
    }));
    setGroupName(groupData.name);
    setMembers(membersWithNames);
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
        members: arrayUnion({ userId: uid, timeStudied: 0 })
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

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity style={styles.groupItem} onPress={() => handleJoinGroup(item.id)}>
      <Text>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderMemberItem = ({ item, index }) => (
    <View style={styles.memberItem}>
      <Text>{index + 1}</Text>
      <View style={styles.memberInfo}>
        <Text style={styles.rankingUserName}>{item.userName}</Text>
        <Text>{formatTime(item.timeStudied)}</Text>
      </View>
      {index === 0 && <Text>🏆</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
        <Text style={styles.title}>Student {studentName}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => Alert.alert('Profile Page')} style={styles.profileButton}>
            <Text style={styles.profileButtonText}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>
      {isInGroup ? (
        <View>
          <View style={styles.subtitle}>
            <View style={styles.groupInfo}>
              <Text style={styles.groupTitle}>{groupName}</Text>
              <Text>{members.length} students</Text>
            </View>
            <TouchableOpacity onPress={handleLeaveGroup} style={styles.leaveGroupButton}>
              <Text style={styles.leaveGroupButtonText}>Leave group</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Start study session')} style={styles.startSessionButton}>
            <Text style={styles.startSessionText}>Start study session</Text>
          </TouchableOpacity>
          <FlatList
            style={{ marginTop: 22 }}
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.userId}
          />
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={item => item.id}
        />
      )}
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
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
    flexDirection: 'row',
  },
  groupTitle: {
    fontSize: 22,
    fontStyle: 'bold',
  },
  groupItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  groupInfo: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 16,
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
  startSessionButton: {
    padding: 10,
    backgroundColor: '#498130',
    borderRadius: 5,
  },
  startSessionText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'left',
    paddingLeft: 10,
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
  rankingUserName: {
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default StudentMainScreen;