## AI Notification Setup

This app now supports OpenAI-written risk notifications through:

- App bootstrap: `App.tsx`
- Client registration: `src/lib/aiNotificationGenerator.ts`
- Notification scheduler: `src/lib/notifications.ts`
- Backend function: `supabase/functions/ai-notification/index.ts`

### 1. Deploy the Supabase function

```bash
supabase functions deploy ai-notification
```

### 2. Set the OpenAI key for the function

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

### 3. Point the app at the function URL

Update `src/config/env.ts`:

```ts
export const AI_NOTIFICATION_API_URL =
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai-notification';
```

### 4. Result

When the app detects elevated risk, it will:

1. Generate the risk score locally.
2. Ask your backend for AI-written notification copy.
3. Fall back to local copy if the AI endpoint is unavailable.
4. Schedule the notification on-device with Expo Notifications.
