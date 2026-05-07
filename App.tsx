import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { onAuthChange, registerSession } from './src/lib/firebase';
import { useArmStore } from './src/state/useArmStore';
import LoginScreen from './src/screens/LoginScreen';
import MainLayout from './src/screens/MainLayout';
import React from 'react';

const Stack = createNativeStackNavigator();

export default function App() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Main'>('Login');
  const { setUser, subscribeAll, addLog, startUptime } = useArmStore();

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (user) {
        await registerSession(user.uid);
        setUser(user);
        subscribeAll(user.uid);
        startUptime();
        addLog(`Sesión restaurada: ${user.email}`, 'ok');
        setInitialRoute('Main');
      }
      setReady(true);
    });
    return unsub;
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050d14', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#00b4ff" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainLayout} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
