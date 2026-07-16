import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, typography } from '../theme/colors';

const MINIMUM_DISPLAY_TIME_MS = 4000;
const FADE_DURATION_MS = 400;

interface SplashScreenProps {
  isAppReady: boolean;
  onFinish: () => void;
}

export default function SplashScreen({ isAppReady, onFinish }: SplashScreenProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);
  const hasStartedFade = useRef(false);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const timer = setTimeout(() => setMinimumTimeElapsed(true), MINIMUM_DISPLAY_TIME_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isAppReady || !minimumTimeElapsed || hasStartedFade.current) return;

    hasStartedFade.current = true;
    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_DURATION_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onFinishRef.current();
    });
  }, [isAppReady, minimumTimeElapsed, opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <StatusBar style="dark" backgroundColor={colors.surface} />
      <View style={styles.content}>
        <Image
          source={require('../../assets/android-icon-foreground.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="AutismGo logo"
        />
        <Text style={styles.appName}>AutismGo</Text>
        <ActivityIndicator
          size="small"
          color={colors.primaryDark}
          style={styles.loadingIndicator}
          accessibilityLabel="Loading AutismGo"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
  appName: {
    ...typography.title,
    marginTop: spacing.lg,
    color: colors.primaryDark,
    fontSize: 30,
    fontWeight: '700',
  },
  loadingIndicator: {
    marginTop: spacing.lg,
  },
});
