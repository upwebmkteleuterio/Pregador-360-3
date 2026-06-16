import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.29.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Lida com requisições OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Autenticação segura do usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error("[gemini-proxy] Header de autorização ausente.");
      return new Response(JSON.stringify({ error: 'Não autorizado: Header de autorização ausente.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      console.error("[gemini-proxy] Token de autorização inválido:", authError);
      return new Response(JSON.stringify({ error: 'Não autorizado: Token inválido.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Busca da chave do Gemini de forma segura nas variáveis de ambiente do Supabase
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      console.error("[gemini-proxy] Chave GEMINI_API_KEY não configurada nas variáveis de ambiente do Supabase.");
      return new Response(JSON.stringify({ error: 'Configuração da API Gemini não encontrada no servidor.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Processamento das ações
    const { action, payload } = await req.json()
    const ai = new GoogleGenAI({ apiKey })

    if (action === 'generate_content') {
      const { model, contents, config } = payload
      console.log(`[gemini-proxy] Processando geração de conteúdo para o modelo: ${model}`);
      
      const response = await ai.models.generateContent({
        model,
        contents,
        config
      })

      return new Response(JSON.stringify({ 
        text: response.text, 
        candidates: response.candidates,
        usageMetadata: response.usageMetadata
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    } else if (action === 'generate_speech') {
      const { text, voiceName } = payload
      console.log(`[gemini-proxy] Processando TTS para a voz: ${voiceName}`);

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text }] }],
        config: {
          responseModalities: ["audio"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      })

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
      return new Response(JSON.stringify({ base64Audio }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    } else {
      return new Response(JSON.stringify({ error: 'Ação não suportada.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error: any) {
    console.error("[gemini-proxy] Erro geral na execução:", error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno no proxy.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
