import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ItemType } from "../store/useStore";
import { SERMON_SYSTEM_INSTRUCTION } from "../constants/sermonFormat";
import { databaseService } from "./databaseService";

export interface GeneratedContent {
  title: string;
  topic: string;
  content: string;
  episodes?: { title: string; content: string }[];
}

// Configurações de segurança para evitar bloqueio de temas teológicos sensíveis
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

export const generateAIContent = async (
  type: ItemType,
  topic: string,
  tone: string,
  episodesCount: number = 4
): Promise<GeneratedContent & { remainingCredits?: number }> => {
  const modelName = "gemini-2.0-flash";
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("A chave de API do Gemini não foi encontrada. Verifique as configurações de ambiente.");
  }

  // Verificação de crédito via banco de dados
  const creditRes = await databaseService.deductCredit(`Geração de ${type}: ${topic.substring(0, 30)}...`);
  
  if (!creditRes.success) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  try {
    const ai = new GoogleGenAI(apiKey);
    
    // Simplificamos a instrução do sistema para string direta para máxima compatibilidade
    const genModel = ai.getGenerativeModel({ 
      model: modelName,
      systemInstruction: type === 'Sermão' || type === 'Série' 
        ? SERMON_SYSTEM_INSTRUCTION 
        : "Você é um especialista em retórica, homilética e aconselhamento cristão."
    });

    // Prompt específico baseado no tipo
    const prompt = type === 'Série'
      ? `Crie uma SÉRIE DE SERMÕES estruturada com ${episodesCount} episódios sobre "${topic}". Use o tom ${tone}.`
      : `Gere um(a) ${type} completo(a) sobre "${topic}" com tom ${tone}.`;

    // Definição do esquema de resposta para JSON estruturado
    const responseSchema = type === 'Série' 
      ? {
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
        }
      : {
          type: "object",
          properties: {
            title: { type: "string" },
            topic: { type: "string" },
            content: { type: "string" }
          },
          required: ["title", "topic", "content"]
        };

    const result = await genModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      safetySettings,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });

    const responseText = result.response.text();
    const data = JSON.parse(responseText);
    
    return { ...data, remainingCredits: creditRes.remaining };

  } catch (err: any) {
    console.error("[GeminiService] Falha na geração:", err);
    // Relança o erro para que a UI possa lidar com ele (ex: mostrar mensagem de crédito insuficiente)
    throw err;
  }
};