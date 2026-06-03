import { GoogleGenAI, Type } from "@google/genai";
import { ItemType } from "../store/useStore";
import { SERMON_SYSTEM_INSTRUCTION } from "../constants/sermonFormat";
import { databaseService } from "./databaseService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GeneratedEpisode {
  title: string;
  content: string;
}

export interface GeneratedContent {
  title: string;
  topic: string;
  content: string;
  episodes?: GeneratedEpisode[]; // Opcional para séries
}

export const generateAIContent = async (
  type: ItemType,
  topic: string,
  tone: string,
  episodesCount: number = 4
) => {
  const model = "gemini-2.0-flash";

  const creditRes = await databaseService.deductCredit(`Geração de ${type}: ${topic.substring(0, 30)}...`);
  
  if (!creditRes.success) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  if (type === 'Série') {
    const seriesSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Título criativo para a série de mensagens" },
        topic: { type: Type.STRING, description: "O tema central da série" },
        content: { type: Type.STRING, description: "Uma breve introdução ou visão geral da série" },
        episodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Título do episódio (ex: Ep. 1 - O Início)" },
              content: { type: Type.STRING, description: "O sermão completo deste episódio seguindo a estrutura técnica" }
            },
            required: ["title", "content"]
          }
        }
      },
      required: ["title", "topic", "content", "episodes"]
    };

    const prompt = `Você é um mentor de homilética. Crie uma SÉRIE DE MENSAGENS bíblicas com EXATAMENTE ${episodesCount} episódios.
    TEMA CENTRAL: ${topic}
    TOM: ${tone}

    Cada episódio deve ser um SERMÃO COMPLETO e PROFUNDO, mantendo a conexão temática entre eles para formar uma jornada espiritual.
    Use a estrutura técnica padrão para o conteúdo de cada episódio (Introdução, Contexto, 4 Pontos com Ilustração e Aplicação, Conclusão).
    
    Importante: Mantenha a gramática perfeita e inicie frases com letra maiúscula.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: seriesSchema,
        systemInstruction: SERMON_SYSTEM_INSTRUCTION
      }
    });

    const result = JSON.parse(response.text) as GeneratedContent;
    return { ...result, remainingCredits: creditRes.remaining };

  } else if (type === 'Sermão') {
    const sermonSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        topic: { type: Type.STRING },
        content: { type: Type.STRING }
      },
      required: ["title", "topic", "content"]
    };

    const prompt = `Gere um SERMÃO bíblico completo. TEMA: ${topic}. TOM: ${tone}.`;

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
    // Ilustração
    const illustrationSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        topic: { type: Type.STRING },
        content: { type: Type.STRING }
      },
      required: ["title", "topic", "content"]
    };

    const prompt = `Gere uma ILUSTRAÇÃO IMPACTANTE. TEMA: ${topic}.`;

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