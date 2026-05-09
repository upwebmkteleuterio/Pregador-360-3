import { GoogleGenAI, Type } from "@google/genai";
import { ItemType } from "../store/useStore";
import { SERMON_SYSTEM_INSTRUCTION } from "../constants/sermonFormat";
import { databaseService } from "./databaseService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GeneratedContent {
  title: string;
  topic: string;
  content: string;
}

export const generateAIContent = async (
  type: ItemType,
  topic: string,
  tone: string,
  userId: string
) => {
  const model = "gemini-3-flash-preview";

  // Verificação de crédito segura via servidor
  const creditRes = await databaseService.deductCredit(`Geração de ${type}: ${topic.substring(0, 30)}...`);
  
  if (!creditRes.success) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  if (type === 'Sermão') {
    const sermonSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        topic: { type: Type.STRING, description: "Reference verse or main topic" },
        content: { type: Type.STRING, description: "The full sermon formatted as requested" }
      },
      required: ["title", "topic", "content"]
    };

    const prompt = `Gere um SERMÃO bíblico completo seguindo a estrutura técnica abaixo.

TEMA/VERSÍCULO BASE: ${topic}
TOM: ${tone}

REGRAS DE OURO (CRÍTICO):
1. GRAMÁTICA E CAPITALIZAÇÃO: Use escrita padrão com gramática rigorosamente correta. Inicie OBRIGATORIAMENTE cada frase com LETRA MAIÚSCULA após pontos finais. Use maiúsculas em nomes próprios e nomes divinos (Deus, Jesus, Espírito Santo). Apenas os rótulos (EXPLICAÇÃO:, etc) devem ser inteiramente em CAIXA ALTA.
2. ESPAÇAMENTO: Você DEVE colocar DUAS quebras de linha (\\n\\n) após cada título (##) e após cada separador (---).
3. SEM REPETIÇÃO: NÃO inclua o título do sermão ou o tópico dentro do campo 'content'. Comece direto no Versículo Base.
4. TEXTO LIMPO: No não use barras invertidas para escapar aspas.

ESTRUTURA OBRIGATÓRIA:

> [Texto Integral do Versículo Base]

---

## INTRODUÇÃO
(Texto rico e envolvente aqui - gramática correta)

---

## CONTEXTO HISTÓRICO E BÍBLICO, USOS E COSTUMES DA ÉPOCA
(Texto detalhado aqui)

---

## ANÁLISE DA PALAVRA ORIGINAL
PALAVRA:
SIGNIFICADO: (Inclua Hebraico/Grego/Latim, dicionário português e dicionário bíblico)
APLICAÇÃO:

---

## CONTEXTO CONTEMPORÂNEO
(Texto ligando o tema aos dias de hoje)

---

## DESENVOLVIMENTO

### 1. (Título do Ponto)
EXPLICAÇÃO: (Texto detalhado)
REFERÊNCIAS: [Versículos integrais]
APLICAÇÃO: (Texto detalhado)
ILUSTRAÇÃO: [História impactante e detalhada]
FRASE: (Frase de pensador cristão)

### 2. (Título do Ponto)
EXPLICAÇÃO: (Texto detalhado)
REFERÊNCIAS: [Versículos integrais]
APLICAÇÃO: (Texto detalhado)
ILUSTRAÇÃO: [História impactante baseada no estilo de Rick Warren ou TD Jakes]
FRASE: (Frase de pensador cristão)

### 3. (Título do Ponto)
EXPLICAÇÃO: (Texto detalhado)
REFERÊNCIAS: [Versículos integrais]
APLICAÇÃO: (Texto detalhado)
ILUSTRAÇÃO: [História impactante e detalhada]
FRASE: (Frase de pensador cristão)

### 4. (Título do Ponto)
EXPLICAÇÃO: (Texto detalhado)
REFERÊNCIAS: [Versículos integrais]
APLICAÇÃO: (Texto detalhado)
ILUSTRAÇÃO: [História impactante e detalhada]
FRASE: (Frase de pensador cristão)

---

## RESUMO IMPACTANTE DOS PONTOS ANTERIORES CITADOS
(Texto recapitulando os 4 pontos)

---

## APLICAÇÃO PRÁTICA
(Texto direto e aplicável)

---

## PERGUNTA RETÓRICA IMPACTANTE
(Pergunta reflexiva e profunda)

---

## CONCLUSÃO
(Fechamento forte)

---

## APELO
(Convite espiritual final)

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

    const prompt = `Você é um curador de ilustrações cristãs de elite. Sua tarefa é gerar uma ILUSTRAÇÃO IMPACTANTE baseada no tema fornecido.

TEMA: ${topic}

DIRETRIZES (RIGOROSO):
1. GRAMÁTICA: Use gramática padrão. Letras maiúsculas após pontos finais e em nomes próprios.
2. ESPAÇAMENTO: Use \\n\\n entre parágrafos.
3. ESTRUTURA:
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