import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { ProfileField } from '../components/ProfileFormControls';
import { RecoveryScreen } from '../features/recovery/RecoveryUI';
import { useAuth } from '../context/AuthContext';
import { saveCaregiver, savePrimaryCaregiver } from '../services/caregiverService';
import { persistCaregiverAvatar, removeCaregiverAvatar } from '../services/caregiverAvatarService';
import { colors, spacing, typography } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'CaregiverForm'>;
type PendingPhoto = { uri: string; mimeType: string };

export default function CaregiverFormScreen({ navigation, route }: Props) {
  const { session, profile, applyProfileUpdate } = useAuth();
  const existing = route.params?.caregiver;
  const [name, setName] = useState(existing?.name ?? '');
  const [relationship, setRelationship] = useState(existing?.relationship ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [pendingPhoto, setPendingPhoto] = useState<PendingPhoto>();
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const visiblePhoto = removePhoto ? null : pendingPhoto?.uri ?? existing?.avatarUri;

  const pickPhoto = async () => {
    setError(undefined);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is needed to choose a caregiver photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: .8 });
    if (!result.canceled) {
      setPendingPhoto({ uri: result.assets[0].uri, mimeType: result.assets[0].mimeType ?? 'image/jpeg' });
      setRemovePhoto(false);
    }
  };

  const save = async () => {
    if (!session?.user) return;
    const cleanName = name.trim();
    const cleanRelationship = relationship.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !cleanRelationship || !cleanPhone) {
      setError('Name, relationship, and phone number are required.');
      return;
    }
    if (!/^[+]?[-\d\s().]{7,20}$/.test(cleanPhone)) {
      setError('Enter a valid phone number.');
      return;
    }
    if (cleanEmail && !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      const id = existing?.id ?? `caregiver-${Date.now()}`;
      let avatarUri = removePhoto ? null : existing?.avatarUri;
      if (pendingPhoto) {
        const oldAvatar = existing?.avatarUri;
        avatarUri = await persistCaregiverAvatar(session.user.id, id, pendingPhoto.uri, pendingPhoto.mimeType);
        if (oldAvatar && oldAvatar !== avatarUri) await removeCaregiverAvatar(oldAvatar);
      } else if (removePhoto) {
        await removeCaregiverAvatar(existing?.avatarUri);
      }

      if (existing?.primary) {
        const result = await savePrimaryCaregiver(
          session.user.id,
          { name: cleanName, relationship: cleanRelationship, phone: cleanPhone, email: cleanEmail, avatar_uri: avatarUri },
          profile,
          session.user.user_metadata,
        );
        if (result.profile) applyProfileUpdate(result.profile);
      } else {
        await saveCaregiver(session.user.id, { id, name: cleanName, relationship: cleanRelationship, phone: cleanPhone, email: cleanEmail, avatarUri });
      }

      Alert.alert('Caregiver updated', 'Caregiver information updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (reason) {
      console.warn('Caregiver save failed', reason);
      setError("We couldn't save this caregiver. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return <RecoveryScreen title={existing ? 'Edit Caregiver' : 'Add Caregiver'} onBack={() => navigation.goBack()}><View style={styles.photoSection}><View style={styles.avatar}>{visiblePhoto ? <Image source={{ uri: visiblePhoto }} style={styles.image}/> : <MaterialCommunityIcons name="account-outline" size={49} color={colors.primary}/>}</View><View style={styles.photoActions}><Pressable style={styles.photoButton} onPress={pickPhoto}><MaterialCommunityIcons name="image-outline" size={19} color={colors.primary}/><Text style={styles.photoText}>{visiblePhoto ? 'Replace Photo' : 'Add Photo'}</Text></Pressable>{visiblePhoto ? <Pressable style={styles.removeButton} onPress={() => { setPendingPhoto(undefined); setRemovePhoto(true); }}><Text style={styles.removeText}>Remove</Text></Pressable> : null}</View></View>{error ? <Text style={styles.error}>{error}</Text> : null}<View style={styles.fields}><ProfileField label="Full Name" value={name} onChangeText={setName} editable={!saving} width="100%" placeholder="Caregiver name" autoCapitalize="words"/><ProfileField label="Relationship" value={relationship} onChangeText={setRelationship} editable={!saving} width="100%" placeholder="Parent, sibling, friend…" autoCapitalize="words"/><ProfileField label="Phone Number" value={phone} onChangeText={setPhone} editable={!saving} width="100%" placeholder="+1 555 000 0000" keyboardType="phone-pad"/><ProfileField label="Email Address" value={email} onChangeText={setEmail} editable={!saving} width="100%" placeholder="caregiver@example.com" keyboardType="email-address" autoCapitalize="none"/></View><View style={styles.actions}><Pressable style={styles.cancel} onPress={() => navigation.goBack()} disabled={saving}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable style={[styles.save,saving&&styles.disabled]} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color="#FFFFFF"/> : <><MaterialCommunityIcons name="check" size={20} color="#FFFFFF"/><Text style={styles.saveText}>Save</Text></>}</Pressable></View></RecoveryScreen>;
}

const styles=StyleSheet.create({photoSection:{flexDirection:'row',alignItems:'center',gap:spacing.lg},avatar:{width:92,height:92,borderRadius:46,overflow:'hidden',alignItems:'center',justifyContent:'center',backgroundColor:colors.lavender},image:{width:'100%',height:'100%'},photoActions:{flex:1,alignItems:'flex-start'},photoButton:{minHeight:44,flexDirection:'row',alignItems:'center',gap:spacing.sm,paddingHorizontal:spacing.md,borderRadius:12,borderWidth:1,borderColor:colors.primary},photoText:{...typography.label,color:colors.primary},removeButton:{minHeight:40,justifyContent:'center',paddingHorizontal:spacing.sm},removeText:{...typography.label,color:colors.error},error:{color:colors.error,lineHeight:21,marginTop:spacing.md},fields:{marginTop:spacing.sm},actions:{flexDirection:'row',gap:spacing.md,justifyContent:'flex-end',marginTop:spacing.xl},cancel:{minWidth:110,minHeight:52,alignItems:'center',justifyContent:'center',borderRadius:16,borderWidth:1,borderColor:colors.border},cancelText:{...typography.label},save:{minWidth:140,minHeight:52,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,borderRadius:16,backgroundColor:colors.primary},saveText:{color:'#FFFFFF',fontWeight:'700',fontSize:16},disabled:{opacity:.55}});
