import { AI_API_URL } from '../config/env';
import { CheckInEntry, FactorContribution, SimulatedFactors, getRiskLevel } from './riskEngine';
import { cacheAI, getCachedAI, RiskHistoryEntry } from '../store/riskStore';
import { sendRiskNotification } from './notifications';
export interface RiskAnalysisResponse { overwhelmLikely:boolean; explanation:string; recommendedAction:string; urgency:'low'|'medium'|'high' }
const actions=['Move to a quieter place','Use noise-cancelling headphones','Take a 5-minute breathing exercise','Contact your caregiver'];
const systemPrompt=`You are a sensory-overload risk assistant for an autism support app.
Given biometric, environmental, and self-reported check-in data, determine:
1. Whether the user is likely heading toward sensory overwhelm or a "crash out" event.
2. A brief (1-2 sentence) plain-language explanation of WHY, referencing the specific contributing factors.
3. The single most relevant recommended action from this list, ranked by urgency:
- Move to a quieter place
- Use noise-cancelling headphones
- Take a 5-minute breathing exercise
- Contact your caregiver
Respond ONLY in JSON: { "overwhelmLikely": boolean, "explanation": string, "recommendedAction": string, "urgency": "low"|"medium"|"high" }`;
const fallback=(parts:FactorContribution[]):RiskAnalysisResponse=>({overwhelmLikely:true,explanation:`Your ${parts[0]?.label.toLowerCase()||'current conditions'} and ${parts[1]?.label.toLowerCase()||'sensory environment'} are increasing your sensory-overload risk.`,recommendedAction:['crowd','duration'].includes(parts[0]?.key)?actions[0]:actions[2],urgency:'medium'});
export async function getAIInsight(
 score:number,
 factors:SimulatedFactors,
 parts:FactorContribution[],
 checkIn?:CheckInEntry,
 history:RiskHistoryEntry[]=[],
 options?:{topTriggers?:string[];primaryTrigger?:string|null;riskLevel?:string}
){
 const key=JSON.stringify({score:score.toFixed(3),factors,checkIn,primaryTrigger:options?.primaryTrigger??options?.topTriggers?.[0]??null}), cached=await getCachedAI<RiskAnalysisResponse>(key); if(cached)return cached;
 if(score<=.5)return {overwhelmLikely:false,explanation:'Your current factors suggest a lower risk of sensory overwhelm.',recommendedAction:actions[2],urgency:'low'} as RiskAnalysisResponse;
 let result=fallback(parts);
 try{if(!AI_API_URL||AI_API_URL.includes('example.com'))throw Error('AI proxy is not configured');const request={riskScore:score,riskLevel:options?.riskLevel??getRiskLevel(score),primaryTrigger:options?.primaryTrigger??options?.topTriggers?.[0]??null,factors:{heartRateBpm:factors.heartRateBpm,sleepHours:factors.sleepQuality.hours+factors.sleepQuality.minutes/60,crowdedness:factors.crowdedness,timeInBusyAreaMinutes:factors.timeInBusyArea.hours*60+factors.timeInBusyArea.minutes},recentCheckIn:checkIn&&{mood:checkIn.moodRating,tiredness:checkIn.tirednessRating,environmentComfort:checkIn.environmentComfort,notes:checkIn.notes},recentHistory:history.slice(0,7).map(x=>({date:x.timestamp,score:x.score}))};const body={request,messages:[{role:'system',content:systemPrompt},{role:'user',content:JSON.stringify(request)}]};const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);const response=await fetch(AI_API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});clearTimeout(timer);if(!response.ok)throw Error(`AI request failed: ${response.status}`);const candidate=await response.json() as RiskAnalysisResponse;if(typeof candidate.explanation!=='string'||!actions.includes(candidate.recommendedAction))throw Error('Invalid AI response');result=candidate;}catch(error){console.warn('Using rule-based risk insight',error)}
 await cacheAI(key,result);if(result.overwhelmLikely)await sendRiskNotification({explanation:result.explanation,recommendedAction:result.recommendedAction,riskPercentage:Math.round(score*100),riskLevel:options?.riskLevel??getRiskLevel(score),primaryTrigger:options?.primaryTrigger??options?.topTriggers?.[0]??null}).catch(()=>false);return result;
}
