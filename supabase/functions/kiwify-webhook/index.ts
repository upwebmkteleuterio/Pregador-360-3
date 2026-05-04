import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    console.log("[kiwify-webhook] Payload completo:", JSON.stringify(body, null, 2))

    // Tenta obter o ID do produto de múltiplos caminhos comuns na Kiwify
    const kiwifyProductId = body.product_id || body.Product?.product_id
    const email = body.customer?.email || body.email || body.Customer?.email
    const event = body.order_status || body.event || body.webhook_event_type
    
    console.log("[kiwify-webhook] Extraído:", { kiwifyProductId, email, event })

    if (!email) {
      console.error("[kiwify-webhook] Email não encontrado no payload")
      return new Response(JSON.stringify({ error: "Email não encontrado" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Busca o perfil do usuário
    const { data: profile, error: profileError } = await supabase.from('profiles').select('id').eq('email', email).single()
    if (profileError || !profile) {
      console.error("[kiwify-webhook] Usuário não cadastrado:", email)
      return new Response(JSON.stringify({ error: "Usuário não cadastrado" }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- LÓGICA DE APROVAÇÃO / RENOVAÇÃO ---
    const isApproval = ['paid', 'approved', 'compra_aprovada', 'subscription_renewed'].includes(event)
    
    if (isApproval) {
      console.log("[kiwify-webhook] Processando Aprovação/Renovação...")
      
      if (!kiwifyProductId) {
        console.error("[kiwify-webhook] Product ID não encontrado no payload")
        return new Response(JSON.stringify({ error: "Product ID não encontrado" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Busca o plano dinamicamente
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('id, credits')
        .eq('kiwify_product_id', kiwifyProductId)
        .single()

      if (planError || !plan) {
        console.error("[kiwify-webhook] Plano não encontrado para o ID:", kiwifyProductId)
        return new Response(JSON.stringify({ error: "Plano não mapeado" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      console.log("[kiwify-webhook] Plano encontrado:", plan)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          plan_id: plan.id,
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          current_plan_credits: plan.credits,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (updateError) throw updateError
      console.log(`[kiwify-webhook] Ativação concluída para ${email}`)
    }

    // --- LÓGICA DE CANCELAMENTO / REEMBOLSO ---
    const isCancellation = ['refunded', 'compra_reembolsada', 'subscription_canceled'].includes(event)

    if (isCancellation) {
      console.log("[kiwify-webhook] Processando Cancelamento/Reembolso...")
      
      const { data: freePlan } = await supabase.from('plans').select('id, credits').eq('type', 'free').single()

      if (freePlan) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            status: 'inactive',
            plan_id: freePlan.id,
            current_plan_credits: freePlan.credits,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id)
        
        if (updateError) throw updateError
        console.log(`[kiwify-webhook] Reversão concluída para ${email}`)
      }
    }

    return new Response(JSON.stringify({ message: "OK" }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error("[kiwify-webhook] Erro Crítico:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
