import { GoogleGenAI } from "@google/genai";
import { databaseService } from "./databaseService";

export interface BibleAiResult {
  themes: string[];
  verses: string[];
  cleanDisplayContent: string;
  remainingCredits?: number;
}

export async function consultBibleAi(query: string): Promise<BibleAiResult> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  
  const creditRes = await databaseService.deductCredit(`Pesquisa Bíblica: ${query.substring(0, 30)}...`);
  if (!creditRes.success) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  const ai = new GoogleGenAI(apiKey);
  const genModel = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `Você é um assistente bíblico especialista. O usuário busca: "${query}".
  Forneça uma análise teológica profunda em Markdown.
  Ao final, adicione :::SYSTEM_DATA::: e liste temas [T] e versículos [V].`;

  const result = await genModel.generateContent(prompt);
  const content = result.response.text();

  const parsed = parseBibleAiResponse(content);
  return { ...parsed, remainingCredits: creditRes.remaining };
}

function parseBibleAiResponse(content: string): Omit<BibleAiResult, 'remainingCredits'> {
  const parts = content.split(':::SYSTEM_DATA:::');
  const displayContent = parts[0].trim();
  const systemData = parts.length > 1 ? parts[1] : '';

  const themes: string[] = [];
  const verses: string[] = [];
  
  const themeMatches = systemData.match(/\[T\](.*?)\[\/T\]/gi) || [];
  const verseMatches = systemData.match(/\[V\](.*?)\[\/V\]/gi) || [];

  themeMatches.forEach(m => themes.push(m.replace(/\[T\]|\[\/T\]/gi, '').trim()));
  verseMatches.forEach(m => verses.push(m.replace(/\[V\]|\[\/V\]/gi, '').trim()));

  return { themes, verses, cleanDisplayContent: displayContent || content.trim() };
}