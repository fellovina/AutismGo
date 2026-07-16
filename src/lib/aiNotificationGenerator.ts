import { AI_NOTIFICATION_API_URL } from '../config/env';
import {
  registerAINotificationGenerator,
  RiskNotificationContent,
  RiskNotificationInput,
} from './notifications';

function isConfigured(url: string) {
  return Boolean(url) && !url.includes('example.com');
}

async function requestAINotification(input: RiskNotificationInput): Promise<RiskNotificationContent> {
  const response = await fetch(AI_NOTIFICATION_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`AI notification request failed: ${response.status}`);
  }

  const payload = await response.json() as Partial<RiskNotificationContent>;
  if (typeof payload.title !== 'string' || typeof payload.body !== 'string') {
    throw new Error('AI notification response is invalid');
  }

  return {
    title: payload.title,
    body: payload.body,
  };
}

export function initializeAINotificationGenerator() {
  if (!isConfigured(AI_NOTIFICATION_API_URL)) return;
  registerAINotificationGenerator(requestAINotification);
}
