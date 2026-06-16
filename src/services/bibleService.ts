import { databaseService } from "./databaseService";
import { supabase } from '../integrations/supabase/client';
import { calculateTokenCost } from "../constants/tokenRates";

export interface BibleAiResult {
  themes: string[];
  verses: string[];
  cleanDisplayContent: string;
  remainingCredits?: number;
}

export async function consultBibleAi(query: string): Promise<BibleAiResult> {
  // Verificação de crédito agora é feita internamente pelo banco usando a sessão do usuário
  const creditRes = await databaseService.deductCredit(`Pesquisa Bíblica: ${query.substring(0, 30)}...`);
  
  if (!creditRes.success) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  const prompt = `Você é um assistente bíblico especialista. 
  O usuário está buscando informações sobre: "${query}". 
  Forneça uma análise teológica profunda, exegese e contexto. 
  
  REGRAS DE FORMATAÇÃO:
  1. Use Markdown para o texto principal (negrito, listas, citações).
  2. Ao final da sua resposta, adicione OBRIGATORIAMENTE o marcador :::SYSTEM_DATA:::
  3. Abaixo desse marcador, liste de forma técnica (apenas para o sistema ler) os temas e versículos identificados usando as tags [T] e [V].
  
  EXEMPLO DE RESPOSTA MODELO:
  (Texto rico sobre o tema aqui...)
  :::SYSTEM_DATA:::
  [V]João 3:16 - Porque Deus amou o mundo...[/V]
  [T]O Amor de Deus[/T]
  
  Importante: Nada após o marcador :::SYSTEM_DATA::: será visto pelo usuário, então não escreva textos explicativos lá, apenas as tags.`;

  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: {
      action: 'generate_content',
      payload: {
        model: "gemini-3-flash-preview",
        contents: prompt
      }
    }
  });

  if (error || !data) {
    throw new Error(error?.message || "Falha ao consultar a inteligência bíblica.");
  }

  // Se houver logId e metadados de uso da API, calcula e salva o custo real de tokens
  if (creditRes.logId && data.usageMetadata) {
    const promptTokens = data.usageMetadata.promptTokenCount || 0;
    const candidatesTokens = data.usageMetadata.candidatesTokenCount || 0;
    const cost = calculateTokenCost(promptTokens, candidatesTokens);
    
    await databaseService.updateCreditLog(creditRes.logId, promptTokens, candidatesTokens, cost).catch(err => {
      console.error("[bibleService] Erro ao atualizar log de tokens no banco:", err);
    });
  }

  const content = data.text;
  if (!content) throw new Error("A IA não retornou conteúdo.");

  const parsed = parseBibleAiResponse(content);
  return { ...parsed, remainingCredits: creditRes.remaining };
}

function parseBibleAiResponse(content: string): Omit<BibleAiResult, 'remainingCredits'> {
  const parts = content.split(':::SYSTEM_DATA:::');
  const displayContent = parts[0].trim();
  const systemData = parts.length > 1 ? parts[1] : '';

  const themeRegex = /\[T\](.*?)\[\/T\]/gi;
  const verseRegex = /\[V\](.*?)\[\/V\]/gi;
  
  const themes: string[] = [];
  const verses: string[] = [];
  
  let match;
  while ((match = themeRegex.exec(systemData)) !== null) {
    themes.push(match[1].trim());
  }
  while ((match = verseRegex.exec(systemData)) !== null) {
    verses.push(match[1].trim());
  }

  if (themes.length === 0 && verses.length === 0) {
    while ((match = themeRegex.exec(displayContent)) !== null) {
      themes.push(match[1].trim());
    }
    while ((match = verseRegex.exec(displayContent)) !== null) {
      verses.push(match[1].trim());
    }
  }

  const cleanDisplayContent = displayContent
    .replace(/\[T\].*?\[\/T\]/gi, '')
    .replace(/\[V\].*?\[\/V\]/gi, '')
    .trim();

  return { 
    themes, 
    verses, 
    cleanDisplayContent: cleanDisplayContent || content.trim() 
  };
}
