import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { PrimaryButton, RecoveryScreen } from '../features/recovery/RecoveryUI';
import { colors, spacing, typography } from '../theme/colors';
type Props=NativeStackScreenProps<AppStackParamList,'SafeZone'>;
export default function SafeZoneEntryScreen({ navigation }:Props){return <RecoveryScreen title="Safe Zone" onBack={()=>navigation.goBack()}><View style={styles.body}><View style={styles.icon}><MaterialCommunityIcons name="map-marker-star-outline" size={52} color={colors.primary}/></View><Text style={styles.title}>Safe Zone page</Text><Text style={styles.copy}>This page is empty for now. You can add your Safe Zone content here later.</Text></View><PrimaryButton label="Back to Recovery" onPress={()=>navigation.goBack()}/></RecoveryScreen>}
const styles=StyleSheet.create({body:{flex:1,alignItems:'center',justifyContent:'center'},icon:{width:104,height:104,borderRadius:52,alignItems:'center',justifyContent:'center',backgroundColor:colors.mint,marginBottom:spacing.lg},title:{...typography.title,fontSize:24,textAlign:'center'},copy:{...typography.subtitle,maxWidth:420,marginTop:spacing.md,fontSize:17,lineHeight:25,textAlign:'center'}});
