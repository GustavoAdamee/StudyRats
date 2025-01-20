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
      <Text>{item.name}</Text>
      <Button title="Edit" onPress={() => openEditModal(item)} />
      <Button title="Delete" onPress={() => handleDeleteGroup(item.id)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button title="Logout" onPress={handleLogout} />
      </View>
      <Text style={styles.title}>Administrator {adminName}</Text>
      <TextInput
        style={styles.input}
        placeholder="New Group Name"
        value={newGroupName}
        onChangeText={setNewGroupName}
      />
      <Button title="+ Group" onPress={handleCreateGroup} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 16,
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default AdminMainScreen;