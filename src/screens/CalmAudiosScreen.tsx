import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/RootNavigator';
import { CALM_SOUNDS, Emotion } from '../features/recovery/data';
import { CompletionCard, formatDuration, ProgressBar, RecoveryScreen } from '../features/recovery/RecoveryUI';
import { colors, spacing, typography } from '../theme/colors';
type Props=NativeStackScreenProps<AppStackParamList,'CalmAudios'>;
type Sound=typeof CALM_SOUNDS[number];

export default function CalmAudiosScreen({navigation}:Props){
  const [selected,setSelected]=useState<Sound>(),[complete,setComplete]=useState(false),[emotion,setEmotion]=useState<Emotion>();
  const [playing,setPlaying]=useState(false),[currentTime,setCurrentTime]=useState(0);
  const listening=useRef(0),shouldPlayWhenLoaded=useRef(false);
  const simulatedDuration=180;
  useEffect(()=>{if(playing)listening.current=Math.max(listening.current,currentTime)},[playing,currentTime]);
  useEffect(()=>{
    if(!playing||!selected)return;
    const timer=setInterval(()=>setCurrentTime(value=>{
      const next=value+1;
      if(next>=simulatedDuration){
        listening.current=simulatedDuration;
        setPlaying(false);
        setComplete(true);
        return simulatedDuration;
      }
      return next;
    }),1000);
    return()=>clearInterval(timer);
  },[playing,selected]);
  useEffect(()=>{if(shouldPlayWhenLoaded.current&&selected){shouldPlayWhenLoaded.current=false;setPlaying(true)}},[selected]);
  const play=(sound:Sound)=>{if(selected?.id!==sound.id){shouldPlayWhenLoaded.current=true;listening.current=0;setCurrentTime(0);setSelected(sound);setComplete(false)}else setPlaying(true)};
  const stop=()=>{listening.current=Math.max(listening.current,currentTime);setPlaying(false);setCurrentTime(0);setComplete(true)};
  const leave=()=>{setPlaying(false);navigation.goBack()};
  if(complete)return <RecoveryScreen title="Listening complete" onBack={()=>{setComplete(false);setSelected(undefined);setCurrentTime(0);}}><CompletionCard message="Hope you’re feeling a little more relaxed." stats={[{label:'Listening duration',value:formatDuration(listening.current)},{label:'Sound',value:selected?.title??'Calm audio'}]} emotion={emotion} onEmotion={setEmotion} onDone={()=>{setPlaying(false);navigation.popToTop()}}/></RecoveryScreen>;
  return <RecoveryScreen title="Calm Audios" onBack={leave}><Text style={styles.title}>Choose a calming sound</Text><Text style={styles.copy}>Set the volume to a level that feels comfortable.</Text><View style={styles.list}>{CALM_SOUNDS.map(sound=><Pressable key={sound.id} onPress={()=>play(sound)} style={[styles.card,selected?.id===sound.id&&styles.cardSelected]}><View style={[styles.icon,{backgroundColor:sound.color}]}><MaterialCommunityIcons name={sound.icon} size={32} color={colors.primary}/></View><View style={styles.cardText}><Text style={styles.cardTitle}>{sound.title}</Text><Text style={styles.description}>{sound.description}</Text></View><View style={styles.play}><MaterialCommunityIcons name={selected?.id===sound.id&&playing?'volume-high':'play'} size={25} color="#FFFFFF"/></View></Pressable>)}</View>{selected?<View style={styles.player}><Text style={styles.now}>Now playing</Text><Text style={styles.audioTitle}>{selected.title}</Text><ProgressBar progress={currentTime/simulatedDuration}/><View style={styles.times}><Text style={styles.time}>{formatDuration(currentTime)}</Text><Text style={styles.time}>-{formatDuration(Math.max(0,simulatedDuration-currentTime))}</Text></View><View style={styles.controls}><Pressable style={styles.control} onPress={()=>setPlaying(value=>!value)}><MaterialCommunityIcons name={playing?'pause':'play'} size={27} color={colors.primary}/><Text style={styles.controlText}>{playing?'Pause':currentTime>0?'Resume':'Play'}</Text></Pressable><Pressable style={styles.stop} onPress={stop}><MaterialCommunityIcons name="stop" size={25} color={colors.error}/><Text style={styles.stopText}>Stop</Text></Pressable></View><Text style={styles.loading}>Prototype mode: the playback timer is simulated in this build.</Text></View>:null}</RecoveryScreen>
}
const styles=StyleSheet.create({title:{...typography.title,marginTop:spacing.sm},copy:{...typography.subtitle,fontSize:16,marginTop:spacing.sm},list:{gap:spacing.md,marginTop:spacing.xl},card:{minHeight:88,flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.md,borderRadius:20,backgroundColor:colors.surface,borderWidth:1,borderColor:'#E3EAF3'},cardSelected:{borderWidth:2,borderColor:colors.primary},icon:{width:58,height:58,borderRadius:18,alignItems:'center',justifyContent:'center'},cardText:{flex:1},cardTitle:{...typography.label,fontSize:17},description:{...typography.subtitle,fontSize:14,marginTop:4},play:{width:46,height:46,borderRadius:23,alignItems:'center',justifyContent:'center',backgroundColor:colors.primary},player:{marginTop:spacing.xl,padding:spacing.lg,borderRadius:22,backgroundColor:'#EEF4FA'},now:{...typography.subtitle,fontSize:13,textTransform:'uppercase',letterSpacing:1,textAlign:'center'},audioTitle:{...typography.title,fontSize:23,textAlign:'center',marginTop:spacing.xs,marginBottom:spacing.lg},times:{flexDirection:'row',justifyContent:'space-between',marginTop:spacing.xs},time:{...typography.subtitle,fontSize:13},controls:{flexDirection:'row',gap:spacing.md,marginTop:spacing.md},control:{flex:1,minHeight:52,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,borderRadius:16,backgroundColor:colors.surface},controlText:{...typography.label,color:colors.primary},stop:{minWidth:110,minHeight:52,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.xs,borderRadius:16,backgroundColor:colors.surface},stopText:{...typography.label,color:colors.error},loading:{...typography.subtitle,textAlign:'center',fontSize:13,marginTop:spacing.sm}});
