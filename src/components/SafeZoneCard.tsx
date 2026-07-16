import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SafeZonePlace } from '../features/safeZone/types';
import { colors, spacing, typography } from '../theme/colors';

export function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} meters` : `${(meters / 1000).toFixed(1)} km`;
}

export default function SafeZoneCard({ place, onPress }: { place: SafeZonePlace; onPress: () => void }) {
  const icon =
    place.category === 'Library'
      ? 'bookshelf'
      : place.category === 'Garden'
        ? 'flower-outline'
        : place.category === 'MRT Station'
          ? 'train'
          : place.category === 'Mall'
            ? 'shopping'
            : 'tree-outline';
  const statusColor = place.openingStatus === 'Open' ? '#277153' : place.openingStatus === 'Closed' ? colors.error : colors.textMuted;
  return <Pressable onPress={onPress} style={({pressed})=>[styles.card,pressed&&styles.pressed]} accessibilityRole="button" accessibilityLabel={`${place.name}, ${formatDistance(place.distanceMeters)}`}><View style={styles.top}><View style={styles.icon}><MaterialCommunityIcons name={icon} size={28} color={colors.primary}/></View><View style={styles.heading}><Text style={styles.name}>{place.name}</Text><Text style={styles.category}>{place.category} · {formatDistance(place.distanceMeters)}</Text></View><MaterialCommunityIcons name="chevron-right" size={25} color={colors.textMuted}/></View><View style={styles.tags}><View style={styles.tag}><MaterialCommunityIcons name="volume-low" size={17} color="#277153"/><Text style={styles.tagText}>{place.quietness}</Text></View><View style={styles.tag}><View style={[styles.dot,{backgroundColor:statusColor}]}/><Text style={styles.tagText}>{place.openingStatus === 'Unknown' ? 'Hours unknown' : `${place.openingStatus} now`}</Text></View>{place.crowdLevel!=='Unknown'?<View style={styles.tag}><MaterialCommunityIcons name="account-group-outline" size={16} color={colors.primary}/><Text style={styles.tagText}>{place.crowdLevel} crowd</Text></View>:null}</View></Pressable>;
}
const styles=StyleSheet.create({card:{padding:spacing.md,borderRadius:20,backgroundColor:colors.surface,borderWidth:1,borderColor:'#E3EAF3'},pressed:{opacity:.72,transform:[{scale:.99}]},top:{flexDirection:'row',alignItems:'center',gap:spacing.md},icon:{width:52,height:52,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.mint},heading:{flex:1},name:{...typography.label,fontSize:17},category:{...typography.subtitle,fontSize:14,marginTop:4},tags:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm,marginTop:spacing.md},tag:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:10,paddingVertical:7,borderRadius:14,backgroundColor:'#F0F5FA'},tagText:{...typography.label,fontSize:12,color:colors.textMuted},dot:{width:8,height:8,borderRadius:4}});
