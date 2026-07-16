import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/RootNavigator';
import { PrimaryButton, RecoveryScreen } from '../features/recovery/RecoveryUI';
import { colors, spacing, typography } from '../theme/colors';
type Props=NativeStackScreenProps<AppStackParamList,'QuietSpace'>;
export default function QuietSpaceScreen({navigation}:Props){return <RecoveryScreen title="Find a Quiet Space" onBack={()=>navigation.goBack()}><View style={styles.body}><View style={styles.illustration}><View style={styles.house}><MaterialCommunityIcons name="home-heart" size={78} color={colors.primary}/></View><View style={styles.leaf}><MaterialCommunityIcons name="leaf" size={28} color="#3A815F"/></View></View><Text style={styles.title}>Find a quiet and comfortable place.</Text><Text style={styles.copy}>Take your time.{`\n\n`}When you’re ready, press Continue.</Text></View><PrimaryButton label="Continue" icon="arrow-right" onPress={()=>navigation.replace('GroundingExercise')}/><Text onPress={()=>navigation.goBack()} accessibilityRole="button" style={styles.skip}>Skip</Text></RecoveryScreen>}
const styles=StyleSheet.create({body:{flex:1,justifyContent:'center',alignItems:'center'},illustration:{width:210,height:180,alignItems:'center',justifyContent:'center',borderRadius:40,backgroundColor:colors.mint,marginBottom:spacing.xl},house:{width:130,height:130,borderRadius:65,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},leaf:{position:'absolute',right:25,bottom:25},title:{...typography.title,textAlign:'center',fontSize:25,maxWidth:440},copy:{...typography.subtitle,textAlign:'center',fontSize:18,lineHeight:27,marginTop:spacing.md},skip:{...typography.label,color:colors.primary,textAlign:'center',padding:spacing.md,marginTop:spacing.sm}});
