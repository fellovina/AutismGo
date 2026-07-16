import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/RootNavigator';
import { BREATHING_TECHNIQUE, Emotion } from '../features/recovery/data';
import { CompletionCard, formatDuration, ProgressBar, RecoveryScreen } from '../features/recovery/RecoveryUI';
import { colors, spacing, typography } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'DeepBreathing'>;
type Phase = 'inhale' | 'hold' | 'exhale';
const phases: { key: Phase; label: string; seconds: number }[] = [
  { key: 'inhale', label: 'Breathe In…', seconds: BREATHING_TECHNIQUE.inhaleSeconds },
  { key: 'hold', label: 'Hold…', seconds: BREATHING_TECHNIQUE.holdSeconds },
  { key: 'exhale', label: 'Breathe Out…', seconds: BREATHING_TECHNIQUE.exhaleSeconds },
];

export default function DeepBreathingScreen({ navigation }: Props) {
  const [phaseIndex, setPhaseIndex] = useState(0), [secondsLeft, setSecondsLeft] = useState(phases[0].seconds);
  const [cycle, setCycle] = useState(1), [paused, setPaused] = useState(false), [complete, setComplete] = useState(false);
  const [emotion, setEmotion] = useState<Emotion>(), scale = useRef(new Animated.Value(.62)).current;
  const startedAt = useRef(Date.now()), [duration, setDuration] = useState(0);
  const phase = phases[phaseIndex];

  useEffect(() => {
    if (paused || complete) { scale.stopAnimation(); return; }
    Animated.timing(scale, { toValue: phase.key === 'inhale' || phase.key === 'hold' ? 1 : .62, duration: secondsLeft * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start();
    const timer = setInterval(() => setSecondsLeft(value => {
      if (value > 1) return value - 1;
      if (phaseIndex < phases.length - 1) { const next = phaseIndex + 1; setPhaseIndex(next); return phases[next].seconds; }
      if (cycle < BREATHING_TECHNIQUE.repetitions) { setCycle(cycle + 1); setPhaseIndex(0); return phases[0].seconds; }
      setDuration((Date.now() - startedAt.current) / 1000); setComplete(true); return 0;
    }), 1000);
    return () => clearInterval(timer);
  }, [paused, complete, phaseIndex, cycle, phase.key, scale, secondsLeft]);

  if (complete) return <RecoveryScreen title="Breathing complete" onBack={() => navigation.navigate('RecoverySession')}><CompletionCard message="You completed your breathing exercise." stats={[{ label:'Total duration', value:formatDuration(duration) },{ label:'Breathing cycles', value:String(BREATHING_TECHNIQUE.repetitions) }]} emotion={emotion} onEmotion={setEmotion} onDone={() => navigation.popToTop()}/></RecoveryScreen>;
  const totalPhase = (cycle - 1) * phases.length + phaseIndex;
  return <RecoveryScreen title="Deep Breathing" onBack={() => navigation.goBack()}><ProgressBar progress={(totalPhase + 1 - secondsLeft / phase.seconds) / (BREATHING_TECHNIQUE.repetitions * phases.length)} label={`Cycle ${cycle} / ${BREATHING_TECHNIQUE.repetitions}`}/><View style={styles.exercise}><Text style={styles.title}>{BREATHING_TECHNIQUE.title}</Text><Text style={styles.copy}>Follow the circle. Let your breathing stay gentle and comfortable.</Text><View style={styles.circleSpace}><Animated.View style={[styles.circle,{transform:[{scale}]}]}><Text style={styles.phase}>{phase.label}</Text><Text style={styles.seconds}>{secondsLeft}</Text></Animated.View></View><View style={styles.controls}><Pressable style={styles.control} onPress={() => setPaused(value => !value)}><MaterialCommunityIcons name={paused?'play':'pause'} size={24} color={colors.primary}/><Text style={styles.controlText}>{paused?'Resume':'Pause'}</Text></Pressable><Pressable style={styles.control} onPress={() => navigation.goBack()}><MaterialCommunityIcons name="close" size={24} color={colors.error}/><Text style={[styles.controlText,{color:colors.error}]}>Exit</Text></Pressable></View>{paused?<Text style={styles.paused}>Paused. Continue when you are ready.</Text>:null}</View></RecoveryScreen>;
}
const styles=StyleSheet.create({exercise:{flex:1,alignItems:'center',paddingTop:spacing.xl},title:{...typography.title,textAlign:'center'},copy:{...typography.subtitle,textAlign:'center',lineHeight:23,marginTop:spacing.sm,maxWidth:420},circleSpace:{height:300,alignItems:'center',justifyContent:'center'},circle:{width:210,height:210,borderRadius:105,alignItems:'center',justifyContent:'center',backgroundColor:colors.lavender,borderWidth:8,borderColor:'#CFC5FF'},phase:{...typography.label,fontSize:20,color:colors.primary},seconds:{...typography.title,fontSize:42,color:colors.primary,marginTop:spacing.xs},controls:{flexDirection:'row',gap:spacing.md},control:{minWidth:130,minHeight:52,flexDirection:'row',gap:spacing.sm,alignItems:'center',justifyContent:'center',paddingHorizontal:spacing.md,borderRadius:16,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},controlText:{...typography.label,color:colors.primary},paused:{...typography.subtitle,marginTop:spacing.md}});
