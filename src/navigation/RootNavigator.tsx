import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import CreateAccountScreen from '../screens/CreateAccountScreen';
import LoginScreen from '../screens/LoginScreen';
import RoleSelectScreen from '../screens/RoleSelectScreen';
import PermissionSetupScreen from '../screens/PermissionSetupScreen';
import PersonalProfileScreen from '../screens/PersonalProfileScreen';
import CaregiverLinkScreen from '../screens/CaregiverLinkScreen';
import AutisticDashboardScreen from '../screens/AutisticDashboardScreen';
import CaregiverDashboardScreen from '../screens/CaregiverDashboardScreen';

// Screens reachable before the user has an account / is signed in
export type AuthStackParamList = {
  Onboarding: undefined;
  Welcome: undefined;
  CreateAccount: undefined;
  Login: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function RootNavigator() {
  const { session, profile, loading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [autisticStep, setAutisticStep] = useState<'permission' | 'profile'>('permission');

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then((value) => {
      setHasSeenOnboarding(value === 'true');
    });
  }, []);

  // Still figuring out session state or the onboarding flag — show splash
  if (loading || hasSeenOnboarding === null) {
    return <SplashScreen />;
  }

  // ---------- Not signed in yet ----------
  if (!session) {
    return (
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={hasSeenOnboarding ? 'Welcome' : 'Onboarding'}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // ---------- Signed in, but no role chosen yet ----------
  if (!profile?.role) {
    return <RoleSelectScreen />;
  }

  // ---------- Signed in as an autistic user ----------
  if (profile.role === 'autistic_user') {
    if (!profile.onboarding_complete) {
      return autisticStep === 'permission' ? (
        <PermissionSetupScreen onContinue={() => setAutisticStep('profile')} />
      ) : (
        <PersonalProfileScreen onComplete={() => {}} />
      );
    }
    return <AutisticDashboardScreen />;
  }

  // ---------- Signed in as a caregiver ----------
  if (!profile.onboarding_complete) {
    return <CaregiverLinkScreen onComplete={() => {}} />;
  }
  return <CaregiverDashboardScreen />;
}
