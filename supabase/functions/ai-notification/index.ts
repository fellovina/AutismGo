// @ts-nocheck
import { corsHeaders } from '../_shared/cors.ts';

type RiskNotificationInput = {
  explanation: string;
  recommendedAction: string;
  riskPercentage: number;
  riskLevel: string;
  primaryTrigger?: string | null;
};

type OpenAIResponsePayload = {
  output_text?: string;
};

const openAiUrl = 'https://api.openai.com/v1/responses';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function validateInput(body: Partial<RiskNotificationInput>): body is RiskNotificationInput {
  return (
    typeof body.explanation === 'string' &&
    typeof body.recommendedAction === 'string' &&
    typeof body.riskPercentage === 'number' &&
    typeof body.riskLevel === 'string'
  );
}

function fallbackNotification(input: RiskNotificationInput) {
  const triggerText = input.primaryTrigger
    ? ` Your strongest trigger is ${input.primaryTrigger.toLowerCase()}, so this suggestion is tailored around that.`
    : '';

  return {
    title: `${input.riskPercentage}% risk: ${input.riskLevel}`,
    body: `${input.explanation}${triggerText} Try: ${input.recommendedAction}`,
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return json({ error: 'OPENAI_API_KEY is not configured' }, 500);
  }

  let body: Partial<RiskNotificationInput>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!validateInput(body)) {
    return json({ error: 'Missing required notification fields' }, 400);
  }

  try {
    const response = await fetch(openAiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.6',
        input: [
          {
            role: 'developer',
            content: [
              {
                type: 'input_text',
                text:
                  'Write a gentle, clear push notification for an autism support app. Keep the title under 10 words. Keep the body under 160 characters. Be calm, specific, and actionable. Return JSON only.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify({
                  riskPercentage: body.riskPercentage,
                  riskLevel: body.riskLevel,
                  primaryTrigger: body.primaryTrigger ?? null,
                  explanation: body.explanation,
                  recommendedAction: body.recommendedAction,
                }),
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'risk_notification',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                body: { type: 'string' },
              },
              required: ['title', 'body'],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI notification request failed', errorText);
      return json(fallbackNotification(body));
    }

    const payload = await response.json() as OpenAIResponsePayload;
    const text = payload.output_text;
    if (!text) {
      return json(fallbackNotification(body));
    }

    const parsed = JSON.parse(text) as { title?: unknown; body?: unknown };
    if (typeof parsed.title !== 'string' || typeof parsed.body !== 'string') {
      return json(fallbackNotification(body));
    }

    return json({ title: parsed.title, body: parsed.body });
  } catch (error) {
    console.error('AI notification function failed', error);
    return json(fallbackNotification(body));
  }
});
