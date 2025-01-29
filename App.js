import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB } from './FirebaseConfig';

import AdminLogin from './app/screens/AdminLogin';
import StudentLogin from './app/screens/StudentLogin';
import AdminMainScreen from './app/screens/AdminMainScreen';
import StudentMainScreen from './app/screens/StudentMainScreen';
import StudySessionScreen from './app/screens/StudySessionScreen';
import StudentProfileScreen from './app/screens/StudentProfileScreen';

const Stack = createNativeStackNavigator();

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Study Rats</Text>
      <Text style={styles.emoji}>🎓</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Login as Administrator"
          onPress={() => navigation.navigate('AdminLogin')}
          color="#498130"
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Login as Student"
          onPress={() => navigation.navigate('StudentLogin')}
          color="#498130"
        />
      </View>
    </View>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (authUser) => {
      try {
        if (authUser) {
          const uid = authUser.uid;
          const userDoc = await getDoc(doc(FIREBASE_DB, 'users', uid));
          const userData = userDoc.data();
          setUser({ ...authUser, role: userData.role });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName='Home'>
          {user ? (
            user.role === 'admin' ? (
              <Stack.Screen name="AdminMain" component={AdminMainScreen} options={{ headerShown: false }}/>
            ) : (
              <>
                <Stack.Screen name="StudentMain" component={StudentMainScreen} options={{ headerShown: false }}/>
                <Stack.Screen name="StudySession" component={StudySessionScreen} options={{ headerShown: false }}/>
                <Stack.Screen name="StudentProfile" component={StudentProfileScreen} options={{ headerShown: false }}/>
              </>
            )
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }}/>
              <Stack.Screen name="AdminLogin" component={AdminLogin} options={{ headerShown: false }}/>
              <Stack.Screen name="StudentLogin" component={StudentLogin} options={{ headerShown: false }}/>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    marginTop: 20, // Adjust the value as needed
  },
  title: {
    fontSize: 32,
    marginBottom: 16,
    textAlign: 'center',
  },
  emoji: {
    fontSize: 100,
    textAlign: 'center',
    marginBottom: 72,
  },
  buttonContainer: {
    marginVertical: 20,
    width: '80%', // Adjust the width as needed
    alignSelf: 'center', // Center the buttons
    borderRadius: 8, // Make the buttons rounded
    overflow: 'hidden', // Ensure the button content stays within the rounded corners
  },
});
