import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Caregiver } from '../features/caregiver/types';
import { colors, spacing, typography } from '../theme/colors';

type Props = {
  caregiver: Caregiver;
  onChat: () => void;
  onEmergency: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function CaregiverCard({ caregiver, onChat, onEmergency, onEdit, onDelete }: Props) {
  const initials = caregiver.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={styles.card}>
      <View style={styles.profile}>
        {caregiver.avatarUri ? (
          <Image source={{ uri: caregiver.avatarUri }} style={styles.avatarImage} accessibilityLabel={`${caregiver.name} profile picture`} />
        ) : (
          <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
        )}
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{caregiver.name}</Text>
            {caregiver.primary ? <Text style={styles.primaryBadge}>Primary</Text> : null}
          </View>
          <Text style={styles.relationship}>{caregiver.relationship}</Text>
          {caregiver.phone ? <Text style={styles.contact}>{caregiver.phone}</Text> : null}
          {caregiver.email ? <Text style={styles.contact}>{caregiver.email}</Text> : null}
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: caregiver.online ? '#2E8B62' : '#9AA2AF' }]} />
            <Text style={styles.status}>{caregiver.online ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
      </View>
      {onEdit || onDelete ? (
        <View style={styles.manage}>
          {onEdit ? <Pressable onPress={onEdit} style={styles.manageButton}><MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary}/><Text style={styles.manageText}>Edit</Text></Pressable> : null}
          {onDelete ? <Pressable onPress={onDelete} style={styles.manageButton}><MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error}/><Text style={styles.deleteText}>Delete</Text></Pressable> : null}
        </View>
      ) : null}
      <View style={styles.actions}>
        <Pressable onPress={onChat} style={({pressed}) => [styles.chat, pressed && styles.pressed]}><MaterialCommunityIcons name="message-text-outline" size={21} color={colors.primary}/><Text style={styles.chatText}>Chat</Text></Pressable>
        <Pressable onPress={onEmergency} style={({pressed}) => [styles.emergency, pressed && styles.pressed]}><MaterialCommunityIcons name="alert-circle-outline" size={21} color="#FFFFFF"/><Text style={styles.emergencyText}>Emergency Alert</Text></Pressable>
      </View>
    </View>
  );
}

const styles=StyleSheet.create({card:{padding:spacing.lg,borderRadius:22,backgroundColor:colors.surface,borderWidth:1,borderColor:'#E3EAF3'},profile:{flexDirection:'row',alignItems:'flex-start',gap:spacing.md},avatar:{width:62,height:62,borderRadius:31,alignItems:'center',justifyContent:'center',backgroundColor:colors.lavender},avatarImage:{width:62,height:62,borderRadius:31,backgroundColor:colors.lavender},initials:{...typography.label,fontSize:20,color:colors.primary},identity:{flex:1},nameRow:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:spacing.sm},name:{...typography.label,fontSize:19},primaryBadge:{fontSize:11,fontWeight:'700',color:'#277153',backgroundColor:colors.mint,paddingHorizontal:8,paddingVertical:4,borderRadius:10},relationship:{...typography.subtitle,fontSize:13,marginTop:3},contact:{...typography.subtitle,fontSize:12,marginTop:3},statusRow:{flexDirection:'row',alignItems:'center',gap:6,marginTop:7},dot:{width:9,height:9,borderRadius:5},status:{...typography.subtitle,fontSize:13},manage:{flexDirection:'row',gap:spacing.md,marginTop:spacing.sm},manageButton:{minHeight:34,flexDirection:'row',alignItems:'center',gap:5},manageText:{...typography.label,fontSize:13,color:colors.primary},deleteText:{...typography.label,fontSize:13,color:colors.error},actions:{flexDirection:'row',gap:spacing.sm,marginTop:spacing.lg},chat:{flex:1,minHeight:52,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,borderRadius:16,backgroundColor:colors.lavender},chatText:{...typography.label,color:colors.primary},emergency:{flex:1.45,minHeight:52,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,borderRadius:16,backgroundColor:colors.error},emergencyText:{color:'#FFFFFF',fontWeight:'700'},pressed:{opacity:.75,transform:[{scale:.99}]}});
