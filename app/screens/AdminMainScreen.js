import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../FirebaseConfig';

const AdminMainScreen = ({ navigation }) => {
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
        <Button title="Logout" onPress={handleLogout} />
      </View>
      <Text>Admin Main Screen</Text>
      <Button
        title="Go to Admin Profile"
        onPress={() => navigation.navigate('AdminProfile')}
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
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
});

export default AdminMainScreen;