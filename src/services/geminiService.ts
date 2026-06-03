import { GoogleGenAI, Type } from "@google/genai";
import { ItemType } from "../store/useStore";
import { SERMON_SYSTEM_INSTRUCTION } from "../constants/sermonFormat";
import { databaseService } from "./databaseService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
  const model = "gemini-2.0-flash";

  // Verificação de crédito segura via servidor
  const creditRes = await databaseService.deductCredit(`Geração de ${type}: ${topic.substring(0, 30)}...`);
  
  if (!creditRes.success) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  if (type === 'Série') {
    const seriesSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        topic: { type: Type.STRING },
        episodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Deve seguir o formato [Ep. X] - Título" },
              content: { type: Type.STRING, description: "Conteúdo completo do sermão do episódio" }
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
    1. CONEXÃO: A série deve ter um arco narrativo claro (Início, Meio e Fim). O Episódio 1 introduz o tema, os intermediários aprofundam e o último conclui com um apelo forte à mudança.
    2. ESTRUTURA INTERNA: Cada episódio deve ser um sermão completo seguindo a estrutura de: Introdução, Contexto, Desenvolvimento (3-4 pontos com ilustração) e Conclusão.
    3. TÍTULOS: O título de cada episódio DEVE começar com [Ep. X] - Nome do Episódio.
    4. PROFUNDIDADE: Mantenha a profundidade teológica em todos os episódios.

    Gere exatamente ${episodesCount} episódios.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: seriesSchema,
        systemInstruction: SERMON_SYSTEM_INSTRUCTION
      }
    });

    const result = JSON.parse(response.text);
    return { ...result, remainingCredits: creditRes.remaining };

  } else if (type === 'Sermão') {
    const sermonSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        topic: { type: Type.STRING, description: "Reference verse or main topic" },
        content: { type: Type.STRING, description: "The full sermon formatted as requested" }
      },
      required: ["title", "topic", "content"]
    };

    const prompt = `Gere um SERMÃO bíblico completo seguindo a estrutura técnica padrão.
    TEMA/VERSÍCULO BASE: ${topic}
    TOM: ${tone}`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: sermonSchema,
        systemInstruction: SERMON_SYSTEM_INSTRUCTION
      }
    });

    const result = JSON.parse(response.text) as GeneratedContent;
    return { ...result, remainingCredits: creditRes.remaining };
  } else {
    // Illustration
    const illustrationSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        topic: { type: Type.STRING },
        content: { type: Type.STRING, description: "O corpo da história da ilustração e a aplicação moral" }
      },
      required: ["title", "topic", "content"]
    };

    const prompt = `Você é um curador de ilustrações cristãs de elite. Gere uma ILUSTRAÇÃO IMPACTANTE.
    TEMA: ${topic}
    TOM: ${tone}`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: illustrationSchema,
        systemInstruction: "Você é um especialista em retórica e homilética cristã."
      }
    });

    const result = JSON.parse(response.text) as GeneratedContent;
    return { ...result, remainingCredits: creditRes.remaining };
  }
};