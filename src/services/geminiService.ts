import { Type } from "@google/genai";
import { ItemType } from "../store/useStore";
import { SERMON_SYSTEM_INSTRUCTION } from "../constants/sermonFormat";
import { SERMON_STRUCTURE_TEMPLATE } from "../constants/sermonTemplate";
import { databaseService } from "./databaseService";
import { supabase } from '../integrations/supabase/client';
import { calculateTokenCost } from "../constants/tokenRates";

export interface GeneratedContent {
  title: string;
  topic: string;
  content: string;
  episodes?: { title: string; content: string }[]; // Para séries
  remainingCredits?: number;
}

import { ESTUDO_PROMPT_TEMPLATE } from "../constants/recursos360/estudoPrompt";
import { ESCRITOR_PROMPT_TEMPLATE } from "../constants/recursos360/escritorPrompt";
import { LIDERANCA_PROMPT_TEMPLATE } from "../constants/recursos360/liderancaPrompt";

async function callGeminiProxy(model: string, contents: any, config: any, logId?: string) {
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: {
      action: 'generate_content',
      payload: { model, contents, config }
    }
  });

  if (error || !data) {
    throw new Error(error?.message || "Falha ao gerar conteúdo do servidor de IA.");
  }

  // Se houver logId e metadados de uso da API, calcula e salva o custo real de tokens
  if (logId && data.usageMetadata) {
    const promptTokens = data.usageMetadata.promptTokenCount || 0;
    const candidatesTokens = data.usageMetadata.candidatesTokenCount || 0;
    const cost = calculateTokenCost(promptTokens, candidatesTokens);
    
    await databaseService.updateCreditLog(logId, promptTokens, candidatesTokens, cost).catch(err => {
      console.error("[geminiService] Erro ao atualizar log de tokens no banco:", err);
    });
  }

  return data; // { text, candidates, usageMetadata }
}

export const generateAIContent = async (
  type: ItemType,
  topic: string,
  tone: string,
  episodesCount: number = 4,
  extraParams?: any
) => {
  const model = "gemini-3-flash-preview";

  // Verificação de crédito segura via servidor
  const creditRes = await databaseService.deductCredit(`Geração de ${type}: ${topic.substring(0, 30)}...`);
  
  if (!creditRes.success) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  if (type === 'Estudo') {
    const studySchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        topic: { type: Type.STRING },
        content: { type: Type.STRING, description: "O estudo de grupo pequeno completo formatado em Markdown" }
      },
      required: ["title", "topic", "content"]
    };

    const level = extraParams?.level || 'Geral';
    const language = extraParams?.language || 'Português (Brasil)';

    const prompt = ESTUDO_PROMPT_TEMPLATE
      .replace('{{TOPIC}}', topic)
      .replace(/{{LANGUAGE}}/g, language)
      .replace(/{{LEVEL}}/g, level);

    const response = await callGeminiProxy(model, prompt, {
      responseMimeType: "application/json",
      responseSchema: studySchema,
      systemInstruction: "Você é um teólogo cristão, especialista em ensino bíblico, discipulado e liderança de pequenos grupos."
    }, creditRes.logId);

    const result = JSON.parse(response.text) as GeneratedContent;
    return { ...result, remainingCredits: creditRes.remaining };

  } else if (type === 'Escritor') {
    const writerSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        topic: { type: Type.STRING },
        content: { type: Type.STRING, description: "O esboço literário completo do livro formatado em Markdown" }
      },
      required: ["title", "topic", "content"]
    };

    const chapters = extraParams?.chapters || 12;
    const language = extraParams?.language || 'Português (Brasil)';

    const prompt = ESCRITOR_PROMPT_TEMPLATE
      .replace('{{TOPIC}}', topic)
      .replace(/{{LANGUAGE}}/g, language)
      .replace(/{{CHAPTERS}}/g, chapters.toString());

    const response = await callGeminiProxy(model, prompt, {
      responseMimeType: "application/json",
      responseSchema: writerSchema,
      systemInstruction: "Você é um escritor cristão, teólogo e especialista em produção literária cristã."
    }, creditRes.logId);

    const result = JSON.parse(response.text) as GeneratedContent;
    return { ...result, remainingCredits: creditRes.remaining };

  } else if (type === 'Liderança') {
    const leadershipSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        topic: { type: Type.STRING },
        content: { type: Type.STRING, description: "O material completo de capacitação de liderança em Markdown" }
      },
      required: ["title", "topic", "content"]
    };

    const focus = extraParams?.focus || 'Geral';
    const language = extraParams?.language || 'Português (Brasil)';

    const prompt = LIDERANCA_PROMPT_TEMPLATE
      .replace('{{TOPIC}}', topic)
      .replace(/{{LANGUAGE}}/g, language)
      .replace(/{{FOCUS}}/g, focus);

    const response = await callGeminiProxy(model, prompt, {
      responseMimeType: "application/json",
      responseSchema: leadershipSchema,
      systemInstruction: "Você é um especialista em liderança cristã, teologia pastoral e desenvolvimento ministerial."
    }, creditRes.logId);

    const result = JSON.parse(response.text) as GeneratedContent;
    return { ...result, remainingCredits: creditRes.remaining };

  } else if (type === 'Série') {
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

    const response = await callGeminiProxy(model, prompt, {
      responseMimeType: "application/json",
      responseSchema: seriesSchema,
      systemInstruction: SERMON_SYSTEM_INSTRUCTION
    }, creditRes.logId);

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

    const response = await callGeminiProxy(model, prompt, {
      responseMimeType: "application/json",
      responseSchema: sermonSchema,
      systemInstruction: SERMON_SYSTEM_INSTRUCTION
    }, creditRes.logId);

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

    const response = await callGeminiProxy(model, prompt, {
      responseMimeType: "application/json",
      responseSchema: illustrationSchema,
      systemInstruction: "Você é um especialista em retórica e homilética cristã."
    }, creditRes.logId);

    const result = JSON.parse(response.text) as GeneratedContent;
    return { ...result, remainingCredits: creditRes.remaining };
  }
};
