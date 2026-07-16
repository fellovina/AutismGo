export type Caregiver = {
  id: string;
  name: string;
  online: boolean;
  relationship: string;
  phone: string;
  email: string;
  avatarUri?: string | null;
  primary: boolean;
};

export type ChatMessage = {
  id: string;
  caregiverId: string;
  sender: 'user' | 'caregiver';
  text: string;
  sentAt: string;
};

export type EmergencyAlertPayload = {
  caregiverId: string;
  latitude: number;
  longitude: number;
  sentAt: string;
};
