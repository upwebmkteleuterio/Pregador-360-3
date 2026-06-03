import { GoogleGenAI } from "@google/genai";
import { ItemType } from "../store/useStore";
import { SERMON_SYSTEM_INSTRUCTION } from "../constants/sermonFormat";
import { databaseService } from "./databaseService";

export interface GeneratedContent {
  title: string;
  topic: string;
  content: string;
  episodes?: { title: string; content: string }[];
}

export const generateAIContent = async (
  type: ItemType,
  topic: string,
  tone: string,
  episodesCount: number = 4
): Promise<GeneratedContent & { remainingCredits?: number }> => {
  const modelName = "gemini-2.0-flash";
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("A chave GEMINI_API_KEY não foi configurada. Por favor, adicione-a ao arquivo .env.local");
  }

  // Verificação de crédito segura via servidor
  const creditRes = await databaseService.deductCredit(`Geração de ${type}: ${topic.substring(0, 30)}...`);
  
  if (!creditRes.success) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  try {
    const ai = new GoogleGenAI(apiKey);
    const genModel = ai.getGenerativeModel({ 
      model: modelName,
      systemInstruction: {
        role: "system",
        parts: [{ text: type === 'Sermão' || type === 'Série' ? SERMON_SYSTEM_INSTRUCTION : "Você é um especialista em retórica e homilética cristã." }]
      }
    });

    if (type === 'Série') {
      const seriesSchema = {
        type: "object",
        properties: {
          title: { type: "string" },
          topic: { type: "string" },
          episodes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" }
              },
              required: ["title", "content"]
            }
          }
        },
        required: ["title", "topic", "episodes"]
      };

      const prompt = `Crie uma SÉRIE DE SERMÕES com ${episodesCount} episódios sobre "${topic}" com tom ${tone}.`;

      const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: seriesSchema,
        }
      });

      const data = JSON.parse(result.response.text());
      return { ...data, remainingCredits: creditRes.remaining };

    } else {
      const standardSchema = {
        type: "object",
        properties: {
          title: { type: "string" },
          topic: { type: "string" },
          content: { type: "string" }
        },
        required: ["title", "topic", "content"]
      };

      const prompt = `Gere um(a) ${type} sobre "${topic}" com tom ${tone}.`;

      const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: standardSchema,
        }
      });

      const data = JSON.parse(result.response.text());
      return { ...data, remainingCredits: creditRes.remaining };
    }
  } catch (err: any) {
    console.error("[GeminiService] Error detail:", err);
    throw err;
  }
};