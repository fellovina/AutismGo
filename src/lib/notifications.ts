import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

const RISK_CHANNEL_ID = 'risk-alerts';

export interface RiskNotificationInput {
  explanation: string;
  recommendedAction: string;
  riskPercentage: number;
  riskLevel: string;
  primaryTrigger?: string | null;
}

export interface RiskNotificationContent {
  title: string;
  body: string;
}

type NotificationGenerator = (input: RiskNotificationInput) => Promise<RiskNotificationContent> | RiskNotificationContent;

let aiNotificationGenerator: NotificationGenerator | null = null;

export function registerAINotificationGenerator(generator: NotificationGenerator) {
  aiNotificationGenerator = generator;
}

async function ensureNotificationChannelAsync() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(RISK_CHANNEL_ID, {
    name: 'Risk alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#D86C45',
  });
}

function buildFallbackContent(input: RiskNotificationInput): RiskNotificationContent {
  const triggerContext = input.primaryTrigger ? ` Your main trigger is ${input.primaryTrigger.toLowerCase()}, so this alert is weighted around that.` : '';
  return {
    title: `${input.riskPercentage}% risk: ${input.riskLevel}`,
    body: `${input.explanation}${triggerContext} Try: ${input.recommendedAction}`,
  };
}

export async function sendRiskNotification(input: RiskNotificationInput) {
  await ensureNotificationChannelAsync();
  const current = await Notifications.getPermissionsAsync();
  const status = current.status === 'granted' ? current.status : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return false;

  let content = buildFallbackContent(input);
  if (aiNotificationGenerator) {
    try {
      content = await aiNotificationGenerator(input);
    } catch (error) {
      console.warn('Falling back to local risk notification copy', error);
    }
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: {
        riskPercentage: input.riskPercentage,
        riskLevel: input.riskLevel,
        primaryTrigger: input.primaryTrigger ?? null,
      },
    },
    trigger: null,
  });
  return true;
}
