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
    throw new Error("A chave GEMINI_API_KEY não foi configurada no ambiente.");
  }

  // Verificação de crédito segura via servidor
  const creditRes = await databaseService.deductCredit(`Geração de ${type}: ${topic.substring(0, 30)}...`);
  
  if (!creditRes.success) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  // Instancia o SDK e o modelo apenas quando necessário
  const ai = new GoogleGenAI(apiKey);
  const genModel = ai.getGenerativeModel({ 
    model: modelName,
    systemInstruction: type === 'Sermão' || type === 'Série' ? SERMON_SYSTEM_INSTRUCTION : "Você é um especialista em retórica e homilética cristã."
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
              title: { type: "string", description: "Deve seguir o formato [Ep. X] - Título" },
              content: { type: "string", description: "Conteúdo completo do sermão do episódio" }
            },
            required: ["title", "content"]
          }
        }
      },
      required: ["title", "topic", "episodes"]
    };

    const prompt = `Você é um teólogo sênior criando uma SÉRIE DE SERMÕES com ${episodesCount} episódios.
    TEMA CENTRAL: ${topic}
    TOM: ${tone}

    REGRAS DA SÉRIE:
    1. CONEXÃO: A série deve ter um arco narrativo claro (Início, Meio e Fim).
    2. ESTRUTURA INTERNA: Cada episódio deve ser um sermão completo.
    3. TÍTULOS: O título de cada episódio DEVE começar com [Ep. X] - Nome do Episódio.
    Gere exatamente ${episodesCount} episódios.`;

    const result = await genModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: seriesSchema,
      }
    });

    const data = JSON.parse(result.response.text());
    return { ...data, remainingCredits: creditRes.remaining };

  } else if (type === 'Sermão') {
    const sermonSchema = {
      type: "object",
      properties: {
        title: { type: "string" },
        topic: { type: "string" },
        content: { type: "string" }
      },
      required: ["title", "topic", "content"]
    };

    const prompt = `Gere um SERMÃO bíblico completo seguindo a estrutura técnica padrão.
    TEMA/VERSÍCULO BASE: ${topic}
    TOM: ${tone}`;

    const result = await genModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: sermonSchema,
      }
    });

    const data = JSON.parse(result.response.text());
    return { ...data, remainingCredits: creditRes.remaining };
  } else {
    // Illustration
    const illustrationSchema = {
      type: "object",
      properties: {
        title: { type: "string" },
        topic: { type: "string" },
        content: { type: "string" }
      },
      required: ["title", "topic", "content"]
    };

    const prompt = `Gere uma ILUSTRAÇÃO IMPACTANTE. TEMA: ${topic}. TOM: ${tone}`;

    const result = await genModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: illustrationSchema,
      }
    });

    const data = JSON.parse(result.response.text());
    return { ...data, remainingCredits: creditRes.remaining };
  }
};