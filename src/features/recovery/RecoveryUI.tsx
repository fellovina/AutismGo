import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme/colors';
import { Emotion } from './data';

export function RecoveryScreen({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return <SafeAreaView style={styles.safe}><View style={styles.header}><Pressable style={styles.iconButton} onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back"><MaterialCommunityIcons name="arrow-left" size={25} color={colors.text}/></Pressable><Text style={styles.headerTitle}>{title}</Text><View style={styles.headerSpace}/></View><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>{children}</ScrollView></SafeAreaView>;
}

export function ProgressBar({ progress, label }: { progress: number; label?: string }) {
  return <View style={styles.progressGroup}>{label ? <Text style={styles.progressLabel}>{label}</Text> : null}<View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}><View style={[styles.fill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]}/></View></View>;
}

const EMOTIONS: { label: Emotion; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { label: 'Better', icon: 'emoticon-happy-outline' }, { label: 'Calm', icon: 'weather-sunset' },
  { label: 'Still stressed', icon: 'emoticon-sad-outline' }, { label: 'Neutral', icon: 'emoticon-neutral-outline' },
];

export function EmotionCheckIn({ value, onChange }: { value?: Emotion; onChange: (emotion: Emotion) => void }) {
  return <View style={styles.checkIn}><Text style={styles.question}>How do you feel now?</Text><View style={styles.emotions}>{EMOTIONS.map(item => { const selected = item.label === value; return <Pressable key={item.label} onPress={() => onChange(item.label)} style={[styles.emotion, selected && styles.emotionSelected]} accessibilityRole="button" accessibilityState={{ selected }}><MaterialCommunityIcons name={item.icon} size={25} color={selected ? '#FFFFFF' : colors.primary}/><Text style={[styles.emotionText, selected && styles.emotionTextSelected]}>{item.label}</Text></Pressable>; })}</View></View>;
}

export function PrimaryButton({ label, onPress, icon, disabled = false }: { label: string; onPress: () => void; icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name']; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primary, disabled && styles.disabled, pressed && !disabled && styles.pressed]} accessibilityRole="button"><Text style={styles.primaryText}>{label}</Text>{icon ? <MaterialCommunityIcons name={icon} size={21} color="#FFFFFF"/> : null}</Pressable>;
}

export function CompletionCard({ message, stats, emotion, onEmotion, onDone }: { message: string; stats: { label: string; value: string }[]; emotion?: Emotion; onEmotion: (value: Emotion) => void; onDone: () => void }) {
  return <View style={styles.completion}><View style={styles.successIcon}><MaterialCommunityIcons name="check" size={38} color="#FFFFFF"/></View><Text style={styles.completeTitle}>Great job!</Text><Text style={styles.completeMessage}>{message}</Text><View style={styles.stats}>{stats.map(stat => <View style={styles.stat} key={stat.label}><Text style={styles.statValue}>{stat.value}</Text><Text style={styles.statLabel}>{stat.label}</Text></View>)}</View><EmotionCheckIn value={emotion} onChange={onEmotion}/><PrimaryButton label="Done" onPress={onDone} icon="arrow-right"/></View>;
}

export function formatDuration(seconds: number) { const rounded = Math.max(0, Math.round(seconds)); const minutes = Math.floor(rounded / 60); const rest = rounded % 60; return `${minutes}:${rest.toString().padStart(2, '0')}`; }

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F7FAFC'},header:{minHeight:64,flexDirection:'row',alignItems:'center',paddingHorizontal:spacing.md,borderBottomWidth:1,borderBottomColor:'#E3EAF3',backgroundColor:colors.surface},iconButton:{width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:22},headerTitle:{...typography.label,flex:1,textAlign:'center',fontSize:17},headerSpace:{width:44},content:{flexGrow:1,width:'100%',maxWidth:680,alignSelf:'center',padding:spacing.lg,paddingBottom:48},progressGroup:{gap:spacing.sm},progressLabel:{...typography.label,color:colors.textMuted},track:{height:10,borderRadius:5,backgroundColor:'#DDE5EF',overflow:'hidden'},fill:{height:'100%',borderRadius:5,backgroundColor:colors.secondary},checkIn:{gap:spacing.md,marginTop:spacing.xl},question:{...typography.label,fontSize:18,textAlign:'center'},emotions:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},emotion:{width:'48%',minHeight:70,flexGrow:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,padding:spacing.sm,borderRadius:16,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface},emotionSelected:{backgroundColor:colors.primary,borderColor:colors.primary},emotionText:{...typography.label,color:colors.primary},emotionTextSelected:{color:'#FFFFFF'},primary:{minHeight:54,marginTop:spacing.lg,borderRadius:16,backgroundColor:colors.primary,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,paddingHorizontal:spacing.lg},primaryText:{color:'#FFFFFF',fontSize:17,fontWeight:'700'},disabled:{opacity:.45},pressed:{opacity:.8,transform:[{scale:.99}]},completion:{flex:1,justifyContent:'center'},successIcon:{width:76,height:76,borderRadius:38,alignSelf:'center',alignItems:'center',justifyContent:'center',backgroundColor:colors.secondary,marginBottom:spacing.lg},completeTitle:{...typography.title,textAlign:'center'},completeMessage:{...typography.subtitle,textAlign:'center',fontSize:17,lineHeight:25,marginTop:spacing.sm},stats:{flexDirection:'row',justifyContent:'center',marginTop:spacing.xl,gap:spacing.md},stat:{minWidth:130,flex:1,alignItems:'center',padding:spacing.md,borderRadius:16,backgroundColor:colors.sky},statValue:{...typography.title,fontSize:22,color:colors.primary},statLabel:{...typography.subtitle,fontSize:13,textAlign:'center',marginTop:spacing.xs},
});
