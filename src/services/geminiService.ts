import { GoogleGenAI, Type } from "@google/genai";
import { ItemType } from "../store/useStore";
import { SERMON_SYSTEM_INSTRUCTION } from "../constants/sermonFormat";
import { SERMON_STRUCTURE_TEMPLATE } from "../constants/sermonTemplate";
import { databaseService } from "./databaseService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GeneratedContent {
  title: string;
  topic: string;
  content: string;
  episodes?: { title: string; content: string }[]; // Para séries
  remainingCredits?: number;
}

export const generateAIContent = async (
  type: ItemType,
  topic: string,
  tone: string,
  episodesCount: number = 4
) => {
  const model = "gemini-3-flash-preview";

  // Verificação de crédito segura via servidor
  const creditRes = await databaseService.deductCredit(`Geração de ${type}: ${topic.substring(0, 30)}...`);
  
  if (!creditRes.success) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  if (type === 'Série') {
    const seriesSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "O título geral da série" },
        topic: { type: Type.STRING },
        episodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Título do episódio incluindo [Ep. X]" },
              content: { type: Type.STRING, description: "Sermão completo e detalhado do episódio" }
            },
            required: ["title", "content"]
          }
        }
      },
      required: ["title", "topic", "episodes"]
    };

    const prompt = `Gere uma SÉRIE DE SERMÕES bíblicos completa com exatamente ${episodesCount} episódios.

TEMA CENTRAL: ${topic}
TOM DA SÉRIE: ${tone}

REGRAS PARA A SÉRIE:
1. UNIDADE: Todos os episódios devem estar conectados ao tema central, mas abordando ângulos diferentes e progressivos.
2. ESTRUTURA DOS EPISÓDIOS: Cada sermão dentro do campo 'content' de cada episódio deve seguir OBRIGATORIAMENTE o modelo abaixo:

${SERMON_STRUCTURE_TEMPLATE}

3. TÍTULOS: O título de cada episódio deve obrigatoriamente começar com "[Ep. X] - ", onde X é o número do episódio.
4. PROFUNDIDADE: Não economize palavras. Cada sermão deve ser rico, detalhado e profissional, preenchendo todas as seções do modelo.
5. FORMATAÇÃO CRÍTICA: Os rótulos das seções (EXPLICAÇÃO, APLICAÇÃO, etc) devem estar em CAIXA ALTA e seguidos de dois pontos (:). NUNCA use bolinhas ou hifens no início dessas linhas.

Idioma: Português (Brasil).`;

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
    return { ...result, remainingCredits: creditRes.remaining } as GeneratedContent;

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

    const prompt = `Gere um SERMÃO bíblico completo seguindo a estrutura técnica rigorosa do modelo fornecido abaixo.

TEMA/VERSÍCULO BASE: ${topic}
TOM: ${tone}

REGRAS DE OURO (CRÍTICO):
1. MODELO OBRIGATÓRIO: Você deve preencher cada seção deste modelo com profundidade teológica:
${SERMON_STRUCTURE_TEMPLATE}

2. GRAMÁTICA E CAPITALIZAÇÃO: Use escrita padrão com gramática rigorosamente correta. Inicie OBRIGATORIAMENTE cada frase com LETRA MAIÚSCULA após pontos finais.
3. ESPAÇAMENTO: Você DEVE colocar DUAS quebras de linha (\\n\\n) após cada título (##) e após cada separador (---).
4. FORMATAÇÃO DOS RÓTULOS: Os rótulos (Ex: EXPLICAÇÃO:, APLICAÇÃO:, ILUSTRAÇÃO:) devem estar sempre em CAIXA ALTA. NUNCA coloque bolinhas (•) ou qualquer outro símbolo antes do rótulo.
5. SEM REPETIÇÃO: NÃO inclua o título do sermão ou o tópico dentro do campo 'content'. Comece direto no Versículo Base.

Idioma: Português (Brasil).`;

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
        content: { type: Type.STRING, description: "O corpo da história da ilustração e a aplicação moral" }
      },
      required: ["title", "topic", "content"]
    };

    const prompt = `Você é um curador de ilustrações cristãs de elite. Sua tarefa é gerar uma ILUSTRAÇÃO IMPACTANTE baseada no tema fornecido.

TEMA: ${topic}

ESTRUTURA:
(Narração da história baseada em fatos reais ou ciência - 3 a 4 parágrafos)

## APLICAÇÃO ESPIRITUAL
(2 a 3 parágrafos de aplicação poderosa)

Idioma: Português (Brasil).`;

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