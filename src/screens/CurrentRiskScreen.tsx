import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppStackParamList } from '../navigation/RootNavigator';
import { calculateRiskScore, CheckInEntry, SimulatedFactors } from '../lib/riskEngine';
import { getAIInsight, RiskAnalysisResponse } from '../lib/aiRiskAnalysis';
import { getSimulationPreset, SimulationPreset } from '../lib/simulation';
import { getFactors, getLatestCheckIn, getRiskHistory, RiskHistoryEntry, saveFactors, saveRiskHistory } from '../store/riskStore';
import { colors, spacing, typography } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { loadSensoryProfile } from '../services/profileService';

type Props = NativeStackScreenProps<AppStackParamList, 'CurrentRisk'>;
const presets: SimulationPreset[] = ['Calm', 'Mild Stress', 'High Risk', 'Random'];
const levelColor = { Low: '#29825A', Moderate: '#9A6A00', High: '#C25B31', Critical: '#B82E50' };

export default function CurrentRiskScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [factors, setFactors] = useState<SimulatedFactors>();
  const [checkIn, setCheckIn] = useState<CheckInEntry>();
  const [history, setHistory] = useState<RiskHistoryEntry[]>([]);
  const [topTriggers, setTopTriggers] = useState<string[]>([]);
  const [detail, setDetail] = useState(false), [recommendations, setRecommendations] = useState(false), [debug, setDebug] = useState(false);
  const [insight, setInsight] = useState<RiskAnalysisResponse>();
  const [updated, setUpdated] = useState(new Date());
  const result = useMemo(() => factors ? calculateRiskScore(factors, checkIn, { topTriggers }) : undefined, [factors, checkIn, topTriggers]);
  useEffect(() => {
    Promise.all([
      getFactors(),
      getLatestCheckIn(),
      getRiskHistory(),
      session?.user ? loadSensoryProfile(session.user.id).catch(() => null) : Promise.resolve(null),
    ]).then(([f, c, h, sensory]) => {
      setFactors(f);
      setCheckIn(c);
      setHistory(h);
      setTopTriggers(sensory?.top_triggers ?? []);
    });
  }, [session?.user]);
  async function analyze() {
    if (factors && result && !insight) {
      setInsight(await getAIInsight(result.score, factors, result.contributions, checkIn, history, {
        topTriggers,
        primaryTrigger: result.primaryTrigger,
        riskLevel: result.level,
      }));
    }
  }
  async function choose(name: SimulationPreset) {
    const next=getSimulationPreset(name), nextResult=calculateRiskScore(next,checkIn,{ topTriggers }), row={timestamp:new Date().toISOString(),score:nextResult.score,level:nextResult.level};
    await Promise.all([saveFactors(next),saveRiskHistory(row)]);
    setFactors(next);setHistory(v=>[row,...v]);setInsight(undefined);setUpdated(new Date());
  }
  if (!factors || !result) return <SafeAreaView style={styles.safe}><ActivityIndicator style={{marginTop:60}} color={colors.primary}/></SafeAreaView>;
  const trend=history[1] ? result.score>history[1].score+.03?'↑ Rising':result.score<history[1].score-.03?'↓ Falling':'→ Stable':'→ Stable';
  const actionList=[insight?.recommendedAction,'Move to a quieter place','Use noise-cancelling headphones','Take a 5-minute breathing exercise','Contact your caregiver'].filter((v,i,a):v is string=>!!v&&a.indexOf(v)===i);
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.container}>
    <View style={styles.header}><Pressable onPress={()=>navigation.goBack()}><Text style={styles.link}>‹ Back</Text></Pressable><Pressable onPress={()=>setDebug(v=>!v)}><Text style={styles.muted}>Simulation</Text></Pressable></View><Text style={styles.title}>Current Risk</Text>
    {debug&&<Card title="Simulation controls (dev)"><View style={styles.presets}>{presets.map(p=><Pressable key={p} style={styles.preset} onPress={()=>choose(p)}><Text style={styles.link}>{p}</Text></Pressable>)}</View></Card>}
    <View style={styles.scoreCard}><Text style={styles.eyebrow}>CURRENT RISK SCORE</Text><Text style={[styles.score,{color:levelColor[result.level]}]}>{Math.round(result.score*100)}%</Text><Text style={[styles.level,{color:levelColor[result.level]}]}>{result.level}</Text><Text style={styles.muted}>Last updated {updated.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})} · just now</Text><View style={styles.trend}><Text style={styles.bold}>Risk Trend Today</Text><Text style={styles.link}>{trend}</Text></View></View>
    <Card title="Primary Factors">{result.contributions.slice(0,3).map(x=><Row key={x.key} left={x.label} right={`+${x.percentage}%`}/>)}<Toggle text={detail?'Hide Detail':'View Detail'} onPress={()=>{setDetail(v=>!v);analyze();}}/>{detail&&<View style={styles.inner}><Text style={styles.bold}>Contributing Factors</Text>{result.primaryTrigger?<Text>Personalized for your strongest trigger: {result.primaryTrigger}</Text>:null}<Text>Heart Rate ({factors.heartRateBpm} bpm)</Text><Text>Sleep Quality ({factors.sleepQuality.hours}h {factors.sleepQuality.minutes}m)</Text><Text>Crowdedness ({Math.round(factors.crowdedness*100)}%)</Text><Text>Time in Busy Area ({factors.timeInBusyArea.hours}h {factors.timeInBusyArea.minutes}m)</Text><Text style={styles.bold}>AI Insight</Text><Text>{insight?.explanation||'Analyzing current factors…'}</Text></View>}</Card>
    <Card title="Actions"><Toggle text={recommendations?'Hide Recommendation':'View Recommendation'} onPress={()=>{setRecommendations(v=>!v);analyze();}}/>{recommendations&&<View style={styles.inner}><Text style={styles.bold}>AI Recommended Action</Text>{actionList.map((a,i)=><Text key={a} style={i===0?styles.link:undefined}>• {a}</Text>)}</View>}<Toggle text="Start Recovery Session" onPress={()=>navigation.navigate('RecoverySession')}/></Card>
    <Card title="Risk History"><Row left="Today" right={result.level}/><Row left="Yesterday" right={history.find(x=>new Date(x.timestamp).toDateString()===new Date(Date.now()-86400000).toDateString())?.level||'No data'}/><Text style={styles.bold}>Last 7 Days</Text>{history.slice(0,7).map((x,i)=><Row key={x.timestamp+i} left={new Date(x.timestamp).toLocaleDateString()} right={`${Math.round(x.score*100)}% · ${x.level}`}/>)}</Card>
  </ScrollView></SafeAreaView>;
}
function Card({title,children}:{title:string;children:React.ReactNode}){return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{children}</View>}
function Row({left,right}:{left:string;right:string}){return <View style={styles.row}><Text>{left}</Text><Text style={styles.bold}>{right}</Text></View>}
function Toggle({text,onPress}:{text:string;onPress:()=>void}){return <Pressable onPress={onPress} style={{paddingVertical:8}}><Text style={styles.link}>{text} →</Text></Pressable>}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},container:{padding:spacing.lg,paddingBottom:50,gap:spacing.md},header:{flexDirection:'row',justifyContent:'space-between'},title:{...typography.title},scoreCard:{backgroundColor:colors.surface,borderRadius:18,padding:spacing.lg,alignItems:'center'},eyebrow:{fontSize:12,fontWeight:'700',color:colors.textMuted},score:{fontSize:60,fontWeight:'800'},level:{fontSize:20,fontWeight:'700'},muted:{color:colors.textMuted},trend:{alignSelf:'stretch',flexDirection:'row',justifyContent:'space-between',borderTopWidth:1,borderTopColor:colors.border,marginTop:20,paddingTop:15},card:{backgroundColor:colors.surface,borderRadius:18,padding:spacing.lg,gap:12},cardTitle:{...typography.label,fontSize:19},row:{flexDirection:'row',justifyContent:'space-between',gap:12},bold:{fontWeight:'700',color:colors.text},link:{color:colors.primary,fontWeight:'700'},inner:{backgroundColor:colors.background,borderRadius:12,padding:spacing.md,gap:8},presets:{flexDirection:'row',flexWrap:'wrap',gap:8},preset:{backgroundColor:colors.lavender,borderRadius:18,paddingHorizontal:12,paddingVertical:9}});
