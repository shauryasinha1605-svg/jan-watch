import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import type { AIAnalysis, Category, Severity } from './types';

const categorySchema = z.enum(['roads','sanitation','water','drainage','electricity','pollution','public_infrastructure','other']);
const severitySchema = z.enum(['low','medium','high','critical']);
const outputSchema = z.object({
  title: z.string().min(3).max(120), summary: z.string().min(5).max(500), category: categorySchema,
  issue_type: z.string().min(2).max(80), severity: severitySchema,
  recommended_action: z.string().min(5).max(500), confidence: z.number().min(0).max(1),
  needs_human_review: z.boolean(), uncertainty_reason: z.string().max(300).default('')
});

function classifyRules(description: string): Omit<AIAnalysis, 'source'> {
  const text = description.toLowerCase();
  const rules: Array<[Category, string[], string]> = [
    ['roads',['pothole','road','asphalt','bridge','crater'],'road damage'],
    ['sanitation',['garbage','waste','rubbish','bin','trash','dump'],'garbage accumulation'],
    ['water',['water leak','pipeline','pipe leak','water wastage','leaking pipe'],'water leakage'],
    ['drainage',['drain','sewer','flood','waterlogging','blocked drain'],'blocked drainage'],
    ['electricity',['streetlight','street light','electric','wire','lamp','power cable'],'electrical infrastructure issue'],
    ['pollution',['smoke','pollution','burning','noise','emission'],'pollution concern'],
    ['public_infrastructure',['park','bench','public building','footpath','playground'],'public infrastructure damage']
  ];
  let category: Category = 'other', issueType = 'unclassified civic issue';
  for (const [cat, keywords, type] of rules) if (keywords.some(k => text.includes(k))) { category = cat; issueType = type; break; }
  let severity: Severity = 'medium';
  if (/exposed wire|sparking|collapse|deep pothole|flood|overflow|open manhole|accident|injur|danger|school zone/.test(text)) severity = 'high';
  if (/electric shock|live wire|major flooding|bridge collapse|immediate danger/.test(text)) severity = 'critical';
  if (/minor|small|slight|cosmetic/.test(text)) severity = 'low';
  return { title: issueType.replace(/\b\w/g, m => m.toUpperCase()), summary: description.slice(0, 220), category, issue_type: issueType, severity,
    recommended_action: 'Arrange a field inspection and determine the appropriate corrective action.', confidence: 0.58,
    needs_human_review: true, uncertainty_reason: 'Rule-based fallback; an authorized officer must confirm the classification.' };
}

export async function analyzeComplaint(description: string, image?: { data: Buffer; mimeType: string }): Promise<AIAnalysis> {
  if (process.env.GEMINI_API_KEY) {
    try {
      const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Analyze this citizen-submitted civic infrastructure complaint. Use only the supplied description and image. Do not infer location or claim independent verification. Return JSON with: title, summary, category (roads|sanitation|water|drainage|electricity|pollution|public_infrastructure|other), issue_type, severity (low|medium|high|critical), recommended_action, confidence (0 to 1 uncalibrated estimate), needs_human_review, uncertainty_reason. Treat severity as an urgency recommendation only. Any potential immediate safety risk must be marked critical and needs_human_review=true. Description: ${description}`;
      const parts: any[] = [{ text: prompt }];
      if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data.toString('base64') } });
      const result = await client.models.generateContent({ model: process.env.GEMINI_MODEL || 'gemini-3.8-flash', contents: [{ role: 'user', parts }], config: { responseMimeType: 'application/json' } });
      const parsed = outputSchema.parse(JSON.parse(result.text || '{}'));
      return { ...parsed, source: 'gemini', needs_human_review: parsed.needs_human_review || parsed.severity === 'critical' };
    } catch (error) {
      console.error('Gemini analysis failed; using rule-based fallback:', error instanceof Error ? error.message : error);
    }
  }
  return { ...classifyRules(description), source: 'rule_based' };
}
