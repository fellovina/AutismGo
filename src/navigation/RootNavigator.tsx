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
import HomeDashboardScreen from '../screens/HomeDashboardScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TodaysCheckInScreen from '../screens/TodaysCheckInScreen';
import CurrentRiskScreen from '../screens/CurrentRiskScreen';
import RecoverySessionScreen from '../screens/RecoverySessionScreen';
import DeepBreathingScreen from '../screens/DeepBreathingScreen';
import CalmAudiosEntryScreen from '../screens/CalmAudiosEntryScreen';
import QuietSpaceScreen from '../screens/QuietSpaceScreen';
import GroundingExerciseScreen from '../screens/GroundingExerciseScreen';
import SafeZoneEntryScreen from '../screens/SafeZoneEntryScreen';
import SafeZoneDetailScreen from '../screens/SafeZoneDetailScreen';
import type { SafeZonePlace } from '../features/safeZone/types';
import CaregiverScreen from '../screens/CaregiverScreen';
import CaregiverChatScreen from '../screens/CaregiverChatScreen';
import EmergencyAlertScreen from '../screens/EmergencyAlertScreen';
import DailySummaryScreen from '../screens/DailySummaryScreen';
import CaregiverFormScreen from '../screens/CaregiverFormScreen';
import type { Caregiver } from '../features/caregiver/types';

// Screens reachable before the user has an account / is signed in
export type AuthStackParamList = {
  Onboarding: undefined;
  Welcome: undefined;
  CreateAccount: undefined;
  Login: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Profile: undefined;
  AIAssistant: { recoveryMode?: boolean } | undefined;
  CheckIn: undefined;
  CurrentRisk: undefined;
  RecoverySession: undefined;
  DeepBreathing: undefined;
  CalmAudios: undefined;
  QuietSpace: undefined;
  GroundingExercise: undefined;
  SafeZone: undefined;
  SafeZoneDetail: { place: SafeZonePlace };
  Caregiver: undefined;
  CaregiverChat: { caregiver: Caregiver };
  EmergencyAlert: { caregiver: Caregiver };
  DailySummary: undefined;
  CaregiverForm: { caregiver?: Caregiver } | undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

export default function RootNavigator() {
  const { session, profile, loading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [autisticStep, setAutisticStep] = useState<'permission' | 'profile'>('permission');
  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then((value) => {
      setHasSeenOnboarding(value === 'true');
    });
  }, []);

  // Reset the "which onboarding step am I on" state whenever the signed-in
  // user actually changes (sign out + a different account signing up, etc).
  // Without this, a second account could get dropped onto whatever step the
  // previous account was last on, since this component never unmounts.
  useEffect(() => {
    setAutisticStep('permission');
  }, [session?.user?.id]);

  // Keep the branded splash visible for its minimum duration and until the
  // initial session and onboarding state are both ready.
  if (!splashFinished) {
    return (
      <SplashScreen
        isAppReady={!loading && hasSeenOnboarding !== null}
        onFinish={() => setSplashFinished(true)}
      />
    );
  }

  // ---------- Not signed in yet ----------
  if (!session) {
    return (
      <NavigationContainer>
        <AuthStack.Navigator
          initialRouteName={hasSeenOnboarding ? 'Welcome' : 'Onboarding'}
          screenOptions={{ headerShown: false }}
        >
          <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
          <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
          <AuthStack.Screen name="CreateAccount" component={CreateAccountScreen} />
          <AuthStack.Screen name="Login" component={LoginScreen} />
        </AuthStack.Navigator>
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
  } else if (!profile.onboarding_complete) {
    // ---------- Signed in as a caregiver, but setup is incomplete ----------
    return <CaregiverLinkScreen onComplete={() => {}} />;
  }

  // Both roles share the same authenticated dashboard and feature navigation.
  return (
    <NavigationContainer>
      <AppStack.Navigator screenOptions={{ headerShown: false }}>
        <AppStack.Screen name="Home" component={HomeDashboardScreen} />
        <AppStack.Screen name="CheckIn" component={TodaysCheckInScreen} />
        <AppStack.Screen name="CurrentRisk" component={CurrentRiskScreen} />
        <AppStack.Screen name="RecoverySession" component={RecoverySessionScreen} />
        <AppStack.Screen name="DeepBreathing" component={DeepBreathingScreen} />
        <AppStack.Screen name="CalmAudios" component={CalmAudiosEntryScreen} />
        <AppStack.Screen name="QuietSpace" component={QuietSpaceScreen} />
        <AppStack.Screen name="GroundingExercise" component={GroundingExerciseScreen} />
        <AppStack.Screen name="SafeZone" component={SafeZoneEntryScreen} />
        <AppStack.Screen name="SafeZoneDetail" component={SafeZoneDetailScreen} />
        <AppStack.Screen name="Caregiver" component={CaregiverScreen} />
        <AppStack.Screen name="CaregiverChat" component={CaregiverChatScreen} />
        <AppStack.Screen name="EmergencyAlert" component={EmergencyAlertScreen} />
        <AppStack.Screen name="DailySummary" component={DailySummaryScreen} />
        <AppStack.Screen name="CaregiverForm" component={CaregiverFormScreen} />
        <AppStack.Screen name="Profile" component={ProfileScreen} />
        <AppStack.Screen name="AIAssistant" component={AIAssistantScreen} />
      </AppStack.Navigator>
    </NavigationContainer>
  );
}
