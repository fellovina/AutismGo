import { supabase } from '../lib/supabase';
import { SUPABASE_URL, SUPABASE_ANON_KEY, AI_API_URL } from '../config/env';

// New implementation: separate save + processing steps.
type Form = {
  mood: string;
  moodRating?: number;
  tiredness: number; // 1-5
  environmentComfort: number; // 1-5
  notes?: string;
  user_id?: string | null;
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

async function fetchLatestFromTable(table: string) {
  // Try ordering by common timestamp columns; if they don't exist, fall back to ordering by id.
  const orders = ['created_at', 'created', 'inserted_at', 'id'];
  for (const col of orders) {
    try {
      const { data, error } = await supabase.from(table).select('*').order(col, { ascending: false }).limit(1);
      if (error) {
        // If error is about missing column, try next
        const msg = (error as any)?.message || '';
        if (msg.toLowerCase().includes('column') || msg.toLowerCase().includes('does not exist')) {
          continue;
        }
        console.warn(`Failed to fetch from ${table} ordering by ${col}`, error);
        return null;
      }
      if (data && data.length > 0) return data[0];
    } catch (e) {
      // continue to next ordering strategy
      continue;
    }
  }
  return null;
}

export async function saveCheckIn(form: Form) {
  // Prefer the feature-contract table and preserve legacy fallbacks.
  try {
    const { data, error } = await supabase.from('check_ins').insert([{
      user_id: form.user_id,
      timestamp: new Date().toISOString(),
      mood_rating: form.moodRating ?? (Number(form.mood) || 3),
      tiredness_rating: form.tiredness,
      environment_comfort: form.environmentComfort,
      notes: form.notes || null,
    }]).select().single();
    if (error) throw error;
    return data;
  } catch {
  try {
    const { data, error } = await supabase.from('mood_logs').insert([
      {
        user_id: form.user_id,
        mood: form.mood,
        tiredness: form.tiredness,
        environment_comfort: form.environmentComfort,
        notes: form.notes || null,
      },
    ]);

    if (error) throw error;
    return data?.[0];
  } catch (err) {
    // If mood_logs insert fails, try creating the legacy `checkins` row as a fallback.
    const { data, error } = await supabase.from('checkins').insert([
      {
        user_id: form.user_id,
        mood: form.mood,
        tiredness: form.tiredness,
        environment_comfort: form.environmentComfort,
        notes: form.notes || null,
        processed: false,
      },
    ]);
    if (error) throw err;
    return data?.[0];
  }
  }
}

async function callOpenAIForAssessment(payload: any) {
  const OPENAI_API_KEY = (global as any).OPENAI_API_KEY || undefined;
  // Prefer using a server-side key. If none present, read from env file fallback.
  // In this repo we expose OPENAI_API_KEY in src/config/env.ts for dev; keep keys out of public repos.
  try {
    const { OPENAI_API_KEY: keyFromEnv } = await import('../config/env');
    const key = keyFromEnv || OPENAI_API_KEY;
    if (!key) throw new Error('OpenAI API key not configured');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an assistant that evaluates risk of overwhelm for an autistic user.' },
          { role: 'user', content: `Analyze the following payload and respond with JSON: ${JSON.stringify(payload)}` },
        ],
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`OpenAI responded with ${res.status}: ${t}`);
    }

    const json = await res.json();
    // Try to parse assistant content as JSON if possible
    const assistantText = json?.choices?.[0]?.message?.content || '';
    try {
      return JSON.parse(assistantText);
    } catch {
      return { alert: true, message: assistantText };
    }
  } catch (err) {
    console.warn('OpenAI call failed', err);
    return { alert: false, message: 'OpenAI request failed' };
  }
}

export async function processNextUnprocessedCheckin() {
  // 1) find a mood_logs row that doesn't yet have a risk entry in `risk_scores` (your DB uses `mood_logs` and `risk_scores`).
  // Fetch a small set of recent mood_logs. Order by id if created_at isn't present.
  let latestMoodRows: any[] | null = null;
  try {
    const { data, error } = await supabase.from('mood_logs').select('*').order('created_at', { ascending: false }).limit(5);
    if (error) {
      // fallback to id ordering
      const { data: d2 } = await supabase.from('mood_logs').select('*').order('id', { ascending: false }).limit(5);
      latestMoodRows = d2 as any[];
    } else {
      latestMoodRows = data as any[];
    }
  } catch (e) {
    const { data: d2 } = await supabase.from('mood_logs').select('*').order('id', { ascending: false }).limit(5);
    latestMoodRows = d2 as any[];
  }
  if (!latestMoodRows || latestMoodRows.length === 0) return null;

  // pick the most recent mood_log that has no corresponding risk_scores entry
  let checkin: any = null;
  for (const row of latestMoodRows) {
    const id = row.id;
    // check risk_scores by common column names
    const { data: existingRS } = await supabase.from('risk_scores').select('*').or(`mood_log_id.eq.${id},checkin_id.eq.${id}`).limit(1);
    if (!existingRS || existingRS.length === 0) {
      checkin = row;
      break;
    }
  }
  if (!checkin) return null;

  // 2) fetch supporting data: try health_records for heart rate/sleep and the mall/mrt crowd data tables
  const hr = await fetchLatestFromTable('health_records');
  const sleep = await fetchLatestFromTable('health_records');
  const mall = await fetchLatestFromTable('mall_crowd_data');
  const mrt = await fetchLatestFromTable('mrt_crowd_data');

  const simulatedHeartRate = hr?.bpm ?? hr?.value ?? 60 + Math.floor(Math.random() * 60);
  const simulatedSleepQuality = sleep?.quality ?? sleep?.value ?? Math.random();

  const mallLevel = (mall?.level ?? mall?.crowd_level ?? mall?.value ?? 0) as number;
  const mrtLevel = (mrt?.level ?? mrt?.crowd_level ?? mrt?.value ?? 0) as number;
  // combine crowdness by taking the highest level and summing durations (approx)
  const crowdLevel = Math.max(mallLevel, mrtLevel);
  const durationMinutes = (mall?.duration_minutes || mall?.duration || 0) + (mrt?.duration_minutes || mrt?.duration || 0);

  // normalize
  const hrNorm = clamp01((simulatedHeartRate - 60) / 60);
  const poorSleep = clamp01(1 - simulatedSleepQuality);
  const crowdNorm = clamp01(crowdLevel / 100);
  const durationNorm = clamp01(durationMinutes / 120);
  const tirednessNorm = clamp01((checkin.tiredness ?? checkin.tiredness_level ?? 3 - 1) / 4);
  const envComfortInverse = clamp01(1 - ((checkin.environment_comfort ?? checkin.env_comfort ?? 3) - 1) / 4);

  const riskScore = clamp01(
    hrNorm * 0.25 + poorSleep * 0.2 + crowdNorm * 0.25 + durationNorm * 0.15 + tirednessNorm * 0.1 + envComfortInverse * 0.05
  );

  const payload = {
    checkin,
    sensors: { heartRate: simulatedHeartRate, sleepQuality: simulatedSleepQuality },
    crowd: { mall: mall ?? null, mrt: mrt ?? null, combined_level: crowdLevel, combined_duration_minutes: durationMinutes },
    riskScore,
  };

  // 3) If riskScore >= 0.5, ask OpenAI for advice
  let aiResult = { alert: false, message: 'No action recommended' };
  if (riskScore >= 0.5) {
    aiResult = await callOpenAIForAssessment(payload);
  }
  // 4) Persist assessment result into `risk_scores` (existing) or fallback to `risk_assessments`.
  try {
    const { error: insertErr } = await supabase.from('risk_scores').insert([
      {
        mood_log_id: checkin.id,
        checkin_id: checkin.id,
        user_id: checkin.user_id,
        score: riskScore,
        ai_alert: aiResult.alert || false,
        ai_message: (aiResult.message || '') as string,
        payload: payload,
      },
    ]);
    if (insertErr) throw insertErr;
  } catch (err) {
    const { error: insertErr2 } = await supabase.from('risk_assessments').insert([
      {
        checkin_id: checkin.id,
        user_id: checkin.user_id,
        risk_score: riskScore,
        ai_alert: aiResult.alert || false,
        ai_message: (aiResult.message || '') as string,
        assessment_payload: payload,
      },
    ]);
    if (insertErr2) console.warn('Failed to insert into risk tables', insertErr2);
  }

  return { checkin, riskScore, aiResult };
}

