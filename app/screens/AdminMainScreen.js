import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet, TextInput, Alert, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import Modal from 'react-native-modal';

const AdminMainScreen = ({ navigation }) => {
  const [adminName, setAdminName] = useState('Admin');
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editedGroupName, setEditedGroupName] = useState('');

  useEffect(() => {
    const fetchAdminName = async () => {
      const user = FIREBASE_AUTH.currentUser;
      const uid = user.uid;
      if (user) {
        const userDoc = await getDoc(doc(FIREBASE_DB, 'users', uid));
        const user = userDoc.data();
        setAdminName(user.name);
      }
    };

    fetchAdminName();
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const q = query(collection(FIREBASE_DB, 'groups'), where('CreatedBy', '==', FIREBASE_AUTH.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const groupsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(groupsList);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateGroup = async () => {
    if (newGroupName.trim() === '') {
      Alert.alert('Error', 'Group name cannot be empty');
      return;
    }
    try {
      await addDoc(collection(FIREBASE_DB, 'groups'), {
        CreatedBy: FIREBASE_AUTH.currentUser.uid,
        name: newGroupName,
        members: []
      });
      setNewGroupName('');
      fetchGroups();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await deleteDoc(doc(FIREBASE_DB, 'groups', groupId));
      fetchGroups();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditGroup = async () => {
    if (selectedGroup && editedGroupName.trim() !== '') {
      try {
        await updateDoc(doc(FIREBASE_DB, 'groups', selectedGroup.id), { name: editedGroupName });
        setModalVisible(false);
        fetchGroups();
      } catch (error) {
        console.error(error);
      }
    } else {
      Alert.alert('Error', 'Group name cannot be empty');
    }
  };

  const openEditModal = (group) => {
    setSelectedGroup(group);
    setEditedGroupName(group.name);
    setModalVisible(true);
  };

  const renderGroupItem = ({ item }) => (
    <View style={styles.groupItem}>
      <Text style={styles.groupItemText}>{item.name}</Text>
      <View style={styles.groupActionsButtons}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={{ marginRight: 20 }}>
          <Text style={styles.groupItemButton}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteGroup(item.id)}>
          <Text style={styles.groupItemButton}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📚</Text>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Administrator {adminName}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.profileButton}>
          </TouchableOpacity>
        </View>
      </View>
      <TextInput
        style={styles.input}
        placeholder="New Group Name"
        value={newGroupName}
        onChangeText={setNewGroupName}
      />
      <TouchableOpacity style={styles.createGroupButton} onPress={handleCreateGroup}>
        <Text style={styles.createGroupButtonText}>+ Group</Text>
      </TouchableOpacity>
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={item => item.id}
      />
      <Modal isVisible={isModalVisible}>
        <View style={styles.modalContent}>
          <Text>Edit Group Name</Text>
          <TextInput
            style={styles.input}
            value={editedGroupName}
            onChangeText={setEditedGroupName}
          />
          <Button title="Done" onPress={handleEditGroup} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  emoji: {
    fontSize: 50,
    textAlign: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: '#f44336',
    borderRadius: 5,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  profileButton: {
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  profileButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 16,
  },
  createGroupButton: {
    backgroundColor: 'rgba(73, 129, 48, 0.17)',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 60,
  },
  createGroupButtonText: {
    color: '#498130',
    fontSize: 18,
    fontWeight: 'bold',
  },
  groupActionsButtons: {
    flexDirection: 'row'
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#498130',
    borderRadius: 5,
    marginBottom: 8,
  },
  groupItemText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  groupItemButton: {
    fontSize: 22,
    color: 'white',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default AdminMainScreen;