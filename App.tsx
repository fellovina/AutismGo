import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { initializeAINotificationGenerator } from './src/lib/aiNotificationGenerator';

export default function App() {
  useEffect(() => {
    initializeAINotificationGenerator();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
