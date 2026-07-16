import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { DailySummary, StressLevel } from '../features/dailySummary/types';
import { colors, spacing, typography } from '../theme/colors';

function SummaryCard({ title, icon, children }: { title: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; children: React.ReactNode }) {
  return <View style={styles.card}><View style={styles.heading}><View style={styles.icon}><MaterialCommunityIcons name={icon} size={24} color={colors.primary}/></View><Text style={styles.title}>{title}</Text></View>{children}</View>;
}
function Metric({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return <View style={styles.metric}><Text style={styles.label}>{label}</Text><Text style={[styles.value,valueColor?{color:valueColor}:null]}>{value}</Text></View>;
}
const riskColors={Low:'#277153',Moderate:'#946900',High:'#C25B31',Critical:'#B82E50'} as const;
const stressProgress:Record<StressLevel,number>={'Very Low':.15,Low:.32,Moderate:.52,High:.75,'Very High':1};

export function HealthCard({ health }: { health: DailySummary['health'] }) {
  return <SummaryCard title="Today’s Health" icon="heart-pulse"><Metric label="Current Risk Level" value={health.riskLevel} valueColor={riskColors[health.riskLevel]}/><Metric label="Heart Rate" value={`${health.heartRateBpm} BPM`}/><Metric label="Sleep" value={`${health.sleepHours} hours ${health.sleepMinutes} minutes`}/><Text style={styles.note}>{health.source==='simulated'?'Simulated wearable data':'Connected wearable data'}</Text></SummaryCard>;
}
export function CheckInCard({ checkIn }: { checkIn: DailySummary['checkIn'] }) {
  const level=checkIn.stressLevel;return <SummaryCard title="Today’s Check-in" icon="clipboard-check-outline"><Metric label="Completion Status" value={checkIn.completed?'Completed':'Not Completed'} valueColor={checkIn.completed?'#277153':colors.textMuted}/>{level?<><Metric label="Stress Level" value={level}/><View style={styles.track}><View style={[styles.fill,{width:`${stressProgress[level]*100}%`}]}/></View></>:null}</SummaryCard>;
}
export function ActivityCard({ activities }: { activities: DailySummary['activities'] }) {
  return <SummaryCard title="Today’s Activities" icon="chart-timeline-variant"><Metric label="Recovery Session" value={activities.recoveryCompleted?'Completed':'Not Completed'}/><Metric label="Duration" value={activities.recoveryDurationMinutes?`${activities.recoveryDurationMinutes} minutes`:'No duration recorded'}/><View style={styles.safeZones}><Text style={styles.label}>Safe Zones</Text>{activities.safeZonesVisited.length?<View style={styles.places}>{activities.safeZonesVisited.map(place=><View style={styles.place} key={place}><MaterialCommunityIcons name="map-marker-check-outline" size={18} color="#277153"/><Text style={styles.placeText}>{place}</Text></View>)}</View>:<Text style={styles.empty}>No Safe Zones visited today.</Text>}</View></SummaryCard>;
}
const styles=StyleSheet.create({card:{padding:spacing.lg,borderRadius:22,backgroundColor:colors.surface,borderWidth:1,borderColor:'#E3EAF3',gap:spacing.sm},heading:{flexDirection:'row',alignItems:'center',gap:spacing.md,marginBottom:spacing.sm},icon:{width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:colors.lavender},title:{...typography.label,fontSize:19},metric:{minHeight:42,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:spacing.md},label:{...typography.subtitle,fontSize:14},value:{...typography.label,fontSize:15,textAlign:'right'},note:{...typography.subtitle,fontSize:11,fontStyle:'italic',marginTop:spacing.xs},track:{height:9,borderRadius:5,backgroundColor:'#E1E7EF',overflow:'hidden',marginBottom:spacing.sm},fill:{height:'100%',borderRadius:5,backgroundColor:colors.secondary},safeZones:{borderTopWidth:1,borderTopColor:'#E3EAF3',paddingTop:spacing.md,marginTop:spacing.xs},empty:{...typography.subtitle,fontSize:14,marginTop:spacing.sm},places:{gap:spacing.sm,marginTop:spacing.sm},place:{flexDirection:'row',alignItems:'center',gap:spacing.sm},placeText:{...typography.body}});
