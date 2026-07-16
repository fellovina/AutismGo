import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileField, ProfileSectionCard } from '../components/ProfileFormControls';
import SelectionChips from '../components/SelectionChips';
import DatePickerModal from '../components/DatePickerModal';
import { useAuth } from '../context/AuthContext';
import { AppStackParamList } from '../navigation/RootNavigator';
import {
  createAvatarUrl,
  loadSensoryProfile,
  PendingAvatar,
  profileToForm,
  ProfileFormData,
  saveProfile,
  validateProfile,
} from '../services/profileService';
import {
  COPING_STRATEGY_OPTIONS,
  Gender,
  PROFILE_TRIGGER_OPTIONS,
} from '../types';
import { colors, spacing, typography } from '../theme/colors';
import { persistCaregiverAvatar, removeCaregiverAvatar } from '../services/caregiverAvatarService';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

const GENDER_OPTIONS: readonly Gender[] = [
  'female',
  'male',
  'non_binary',
  'other',
  'prefer_not_to_say',
];

const RELATIONSHIP_OPTIONS = [
  'Parent',
  'Mother',
  'Father',
  'Caregiver',
  'Guardian',
  'Sibling',
  'Friend',
  'Other',
] as const;

const EMPTY_FORM: ProfileFormData = {
  fullName: '',
  nickname: '',
  dateOfBirth: null,
  email: '',
  phoneNumber: '',
  gender: null,
  emergencyContact: { name: '', phone: '', relationship: '', email: '' },
  triggers: [],
  copingStrategies: [],
};

const formatGender = (gender: Gender) =>
  ({
    female: 'Female',
    male: 'Male',
    non_binary: 'Non-binary',
    other: 'Other',
    prefer_not_to_say: 'Prefer not to say',
  })[gender];

export default function ProfileScreen({ navigation }: Props) {
  const { profile, session, refreshProfile, applyProfileUpdate } = useAuth();
  const { width } = useWindowDimensions();
  const [form, setForm] = useState<ProfileFormData>(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState<ProfileFormData>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<PendingAvatar | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [pendingCaregiverPhoto, setPendingCaregiverPhoto] = useState<{ uri: string; mimeType: string } | null>(null);
  const [removeCaregiverPhoto, setRemoveCaregiverPhoto] = useState(false);

  const contentWidth = Math.min(width - spacing.lg * 2, 920);
  const isWide = contentWidth >= 680;
  const fieldWidth = isWide ? (contentWidth - spacing.lg * 2 - spacing.md) / 2 : contentWidth - spacing.lg * 2;

  const loadProfile = useCallback(async () => {
    if (!profile || !session?.user) return;
    setIsLoading(true);
    setError(null);
    setSaveFailed(false);
    try {
      const [sensory, signedAvatarUrl] = await Promise.all([
        loadSensoryProfile(session.user.id),
        createAvatarUrl(profile.avatar_path, session.user.id),
      ]);
      const nextForm = profileToForm(profile, session.user.email ?? '', sensory, session.user.user_metadata);
      setForm(nextForm);
      setSavedForm(nextForm);
      setAvatarUrl(signedAvatarUrl);
      setPendingAvatar(null);
      setRemoveAvatar(false);
      setPendingCaregiverPhoto(null);
      setRemoveCaregiverPhoto(false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your profile.');
    } finally {
      setIsLoading(false);
    }
  }, [profile, session?.user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const visibleAvatar = useMemo(() => {
    if (removeAvatar) return null;
    return pendingAvatar?.uri ?? avatarUrl;
  }, [avatarUrl, pendingAvatar?.uri, removeAvatar]);

  const updateForm = <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateEmergency = (key: 'name' | 'phone' | 'relationship' | 'email', value: string) => {
    setForm((current) => ({
      ...current,
      emergencyContact: { ...current.emergencyContact, [key]: value },
    }));
  };

  const toggleListValue = (key: 'triggers' | 'copingStrategies', value: string) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  };

  const pickPhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is needed to choose a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      setError('The selected photo could not be prepared for upload.');
      return;
    }
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      setError('Choose a photo smaller than 5 MB.');
      return;
    }
    setPendingAvatar({
      uri: asset.uri,
      base64: asset.base64,
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
    setRemoveAvatar(false);
  };

  const cancelEditing = () => {
    setForm(savedForm);
    setPendingAvatar(null);
    setRemoveAvatar(false);
    setPendingCaregiverPhoto(null);
    setRemoveCaregiverPhoto(false);
    setShowDatePicker(false);
    setError(null);
    setSaveFailed(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!profile || !session?.user) return;
    const validationError = validateProfile(form);
    if (validationError) {
      setError(validationError);
      setSaveFailed(false);
      return;
    }
    setIsSaving(true);
    setError(null);
    setSaveFailed(false);
    try {
      let caregiverAvatarUri = form.emergencyContact.avatar_uri ?? null;
      if (pendingCaregiverPhoto) {
        caregiverAvatarUri = await persistCaregiverAvatar(
          session.user.id,
          `primary-${session.user.id}`,
          pendingCaregiverPhoto.uri,
          pendingCaregiverPhoto.mimeType
        );
      } else if (removeCaregiverPhoto) {
        await removeCaregiverAvatar(caregiverAvatarUri);
        caregiverAvatarUri = null;
      }
      const formToSave: ProfileFormData = {
        ...form,
        emergencyContact: { ...form.emergencyContact, avatar_uri: caregiverAvatarUri },
      };
      const result = await saveProfile({
        userId: session.user.id,
        currentEmail: session.user.email ?? '',
        currentAvatarPath: profile.avatar_path,
        form: formToSave,
        pendingAvatar,
        removeAvatar,
      });
      applyProfileUpdate(result.profile);
      let nextAvatarUrl: string | null = null;
      try {
        nextAvatarUrl = result.avatarUrl ?? await createAvatarUrl(result.avatarPath, session.user.id);
      } catch (avatarError) {
        console.warn('Profile saved, but avatar preview could not be refreshed', avatarError);
      }
      setAvatarUrl(nextAvatarUrl);
      setPendingAvatar(null);
      setRemoveAvatar(false);
      setPendingCaregiverPhoto(null);
      setRemoveCaregiverPhoto(false);
      setForm(formToSave);
      setSavedForm(formToSave);
      setIsEditing(false);
      refreshProfile().catch((refreshError) => {
        console.warn('Profile saved, but background refresh failed', refreshError);
      });
      if (result.emailConfirmationRequired) {
        Alert.alert('Profile updated', 'Your profile was saved. Open the verification link sent to your new email address.');
      } else {
        Alert.alert('Profile updated', 'Your profile has been updated successfully.');
      }
    } catch (saveError) {
      console.warn('Profile save failed', saveError);
      setError("We couldn't save your profile. Please try again.");
      setSaveFailed(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={25} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { width: contentWidth }]}>
          <View style={styles.pageIntro}>
            <View style={styles.pageIntroText}>
              <Text style={styles.pageTitle}>Your profile</Text>
              <Text style={styles.pageSubtitle}>Keep your support preferences and contact details current.</Text>
            </View>
            {!isEditing ? (
              <Pressable style={styles.editButton} onPress={() => setIsEditing(true)}>
                <MaterialCommunityIcons name="pencil-outline" size={19} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </Pressable>
            ) : null}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.error} />
              <View style={styles.errorContent}>
                <Text style={styles.errorText}>{error}</Text>
                {saveFailed ? (
                  <View style={styles.errorActions}>
                    <Pressable style={styles.retryButton} onPress={handleSave} disabled={isSaving}>
                      <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                    <Pressable style={styles.errorCancelButton} onPress={cancelEditing} disabled={isSaving}>
                      <Text style={styles.errorCancelText}>Cancel</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          <ProfileSectionCard title="Personal Information">
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                {visibleAvatar ? (
                  <Image source={{ uri: visibleAvatar }} style={styles.avatarImage} />
                ) : (
                  <MaterialCommunityIcons name="account-outline" size={48} color="#4E659B" />
                )}
              </View>
              <View style={styles.avatarDetails}>
                <Text style={styles.avatarTitle}>Profile photo</Text>
                <Text style={styles.avatarHint}>JPG, PNG or WebP. Maximum 5 MB.</Text>
                {isEditing ? (
                  <View style={styles.avatarActions}>
                    <Pressable style={styles.photoButton} onPress={pickPhoto}>
                      <MaterialCommunityIcons name="image-outline" size={18} color={colors.primary} />
                      <Text style={styles.photoButtonText}>{visibleAvatar ? 'Replace' : 'Upload'}</Text>
                    </Pressable>
                    {visibleAvatar ? (
                      <Pressable
                        style={styles.removePhotoButton}
                        onPress={() => {
                          setPendingAvatar(null);
                          setRemoveAvatar(true);
                        }}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                        <Text style={styles.removePhotoText}>Remove</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>

            <View style={[styles.fields, { gap: spacing.md }]}>
              <ProfileField
                label="Full Name"
                value={form.fullName}
                editable={isEditing}
                width={fieldWidth}
                onChangeText={(value) => updateForm('fullName', value)}
                placeholder="Your full name"
                autoCapitalize="words"
              />
              <ProfileField
                label="Nickname"
                value={form.nickname}
                editable={isEditing}
                width={fieldWidth}
                onChangeText={(value) => updateForm('nickname', value)}
                placeholder="What should we call you?"
                autoCapitalize="words"
              />

              <View style={[styles.dateField, { width: fieldWidth }]}>
                <Text style={styles.fieldLabel}>Date of Birth</Text>
                {isEditing ? (
                  <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                    <Text style={form.dateOfBirth ? styles.dateText : styles.datePlaceholder}>
                      {form.dateOfBirth?.toLocaleDateString() ?? 'Select date'}
                    </Text>
                    <MaterialCommunityIcons name="calendar-outline" size={21} color={colors.primary} />
                  </Pressable>
                ) : (
                  <Text style={form.dateOfBirth ? styles.readOnlyDate : styles.emptyDate}>
                    {form.dateOfBirth?.toLocaleDateString() ?? 'Not provided'}
                  </Text>
                )}
                <DatePickerModal
                  visible={showDatePicker}
                  value={form.dateOfBirth}
                  onCancel={() => setShowDatePicker(false)}
                  onConfirm={(date) => {
                    updateForm('dateOfBirth', date);
                    setShowDatePicker(false);
                  }}
                />
              </View>

              <ProfileField
                label="Email Address"
                value={form.email}
                editable={isEditing}
                width={fieldWidth}
                onChangeText={(value) => updateForm('email', value)}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <ProfileField
                label="Phone Number"
                value={form.phoneNumber}
                editable={isEditing}
                width={fieldWidth}
                onChangeText={(value) => updateForm('phoneNumber', value)}
                placeholder="+1 555 000 0000"
                keyboardType="phone-pad"
              />
            </View>

            <SelectionChips
              label="Gender"
              options={GENDER_OPTIONS}
              selected={form.gender ? [form.gender] : []}
              editable={isEditing}
              singleSelect
              formatLabel={formatGender}
              onToggle={(gender) => updateForm('gender', form.gender === gender ? null : gender)}
            />
          </ProfileSectionCard>

          <ProfileSectionCard title="Caregiver Information" subtitle="Your primary caregiver and trusted emergency contact.">
            <View style={styles.caregiverPhotoRow}>
              <View style={styles.caregiverAvatar}>
                {!removeCaregiverPhoto && (pendingCaregiverPhoto?.uri ?? form.emergencyContact.avatar_uri) ? (
                  <Image source={{ uri: pendingCaregiverPhoto?.uri ?? form.emergencyContact.avatar_uri ?? '' }} style={styles.avatarImage} />
                ) : (
                  <MaterialCommunityIcons name="account-heart-outline" size={37} color={colors.primary} />
                )}
              </View>
              {isEditing ? (
                <View style={styles.avatarActions}>
                  <Pressable style={styles.photoButton} onPress={async () => {
                    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (!permission.granted) {
                      setError('Photo library permission is needed to choose a caregiver picture.');
                      return;
                    }
                    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
                    if (!result.canceled) {
                      setPendingCaregiverPhoto({ uri: result.assets[0].uri, mimeType: result.assets[0].mimeType ?? 'image/jpeg' });
                      setRemoveCaregiverPhoto(false);
                    }
                  }}>
                    <MaterialCommunityIcons name="image-outline" size={18} color={colors.primary} />
                    <Text style={styles.photoButtonText}>Caregiver Photo</Text>
                  </Pressable>
                  {!removeCaregiverPhoto && (pendingCaregiverPhoto?.uri ?? form.emergencyContact.avatar_uri) ? (
                    <Pressable style={styles.removePhotoButton} onPress={() => { setPendingCaregiverPhoto(null); setRemoveCaregiverPhoto(true); }}>
                      <Text style={styles.removePhotoText}>Remove</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
            <View style={[styles.fields, { gap: spacing.md }]}>
              <ProfileField
                label="Contact Name"
                value={form.emergencyContact.name}
                editable={isEditing}
                width={fieldWidth}
                onChangeText={(value) => updateEmergency('name', value)}
                placeholder="Contact name"
                autoCapitalize="words"
              />
              <ProfileField
                label="Phone Number"
                value={form.emergencyContact.phone}
                editable={isEditing}
                width={fieldWidth}
                onChangeText={(value) => updateEmergency('phone', value)}
                placeholder="Contact phone number"
                keyboardType="phone-pad"
              />
              <ProfileField
                label="Email Address"
                value={form.emergencyContact.email ?? ''}
                editable={isEditing}
                width={fieldWidth}
                onChangeText={(value) => updateEmergency('email', value)}
                placeholder="caregiver@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <SelectionChips
              label="Relationship"
              options={RELATIONSHIP_OPTIONS}
              selected={form.emergencyContact.relationship ? [form.emergencyContact.relationship] : []}
              editable={isEditing}
              singleSelect
              onToggle={(relationship) =>
                updateEmergency(
                  'relationship',
                  form.emergencyContact.relationship === relationship ? '' : relationship
                )
              }
            />
          </ProfileSectionCard>

          <ProfileSectionCard
            title="Sensory Profile"
            subtitle="Choose the triggers and coping tools that best support your daily experience."
          >
            <SelectionChips
              label="Common Triggers"
              options={PROFILE_TRIGGER_OPTIONS}
              selected={form.triggers}
              editable={isEditing}
              onToggle={(trigger) => toggleListValue('triggers', trigger)}
            />
            <SelectionChips
              label="Preferred Coping Strategies"
              options={COPING_STRATEGY_OPTIONS}
              selected={form.copingStrategies}
              editable={isEditing}
              onToggle={(strategy) => toggleListValue('copingStrategies', strategy)}
            />
          </ProfileSectionCard>

          {isEditing ? (
            <View style={styles.formActions}>
              <Pressable style={styles.cancelButton} onPress={cancelEditing} disabled={isSaving}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: '#F7FAFC',
  },
  loadingText: { ...typography.subtitle },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E3EAF3',
  },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.label, flex: 1, textAlign: 'center', fontSize: 18 },
  scrollContent: { alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  content: { maxWidth: 920 },
  pageIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  pageIntroText: { flex: 1 },
  pageTitle: { ...typography.title, marginBottom: spacing.xs },
  pageSubtitle: { ...typography.subtitle, lineHeight: 21 },
  editButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  editButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 8,
    backgroundColor: '#FCECEF',
    borderWidth: 1,
    borderColor: '#F1C5CF',
  },
  errorText: { flex: 1, color: colors.error, lineHeight: 20 },
  errorContent: { flex: 1 },
  errorActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  retryButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: 8, backgroundColor: colors.error },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  errorCancelButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: spacing.md },
  errorCancelText: { color: colors.text, fontWeight: '600' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9EDFA',
    borderWidth: 2,
    borderColor: '#D5DFF0',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarDetails: { flex: 1 },
  avatarTitle: { ...typography.label, fontSize: 16 },
  avatarHint: { ...typography.subtitle, fontSize: 12, marginTop: 3 },
  avatarActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  photoButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  photoButtonText: { color: colors.primary, fontWeight: '600' },
  removePhotoButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  removePhotoText: { color: colors.error, fontWeight: '600' },
  caregiverPhotoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  caregiverAvatar: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  fields: { flexDirection: 'row', flexWrap: 'wrap' },
  dateField: { minWidth: 0, marginTop: spacing.md },
  fieldLabel: { ...typography.label, marginBottom: spacing.sm },
  dateButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FBFCFE',
  },
  dateText: { color: colors.text, fontSize: 15 },
  datePlaceholder: { color: colors.textMuted, fontSize: 15 },
  readOnlyDate: { minHeight: 48, paddingVertical: 13, color: colors.text, fontSize: 15 },
  emptyDate: { minHeight: 48, paddingVertical: 13, color: colors.textMuted, fontSize: 15 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.sm },
  cancelButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelButtonText: { color: colors.text, fontWeight: '600' },
  saveButton: {
    minHeight: 48,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  saveButtonText: { color: '#FFFFFF', fontWeight: '600' },
});
