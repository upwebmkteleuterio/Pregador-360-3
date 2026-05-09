import { supabase } from '../integrations/supabase/client';
import { ItemType, MessageTone, ContentItem, Note, ContentVersion, Plan } from "../store/useStore";

/**
 * Database Service - Supabase Edition
 */

export const databaseService = {
  // --- PERFIL E CRÉDITOS ---

  deductCredit: async (userId: string, description: string): Promise<{ success: boolean; remaining: number; error?: string }> => {
    // Usamos a função RPC do Supabase que verifica e consome o crédito de forma atômica
    const { data, error } = await supabase.rpc('consume_credit', { user_id_input: userId });

    if (error) {
      console.error("[databaseService] RPC Error:", error);
      return { success: false, remaining: 0, error: error.message };
    }

    if (data && data.success) {
      // Registra o log apenas se o consumo foi bem sucedido
      await supabase.from('credits_log').insert({
        user_id: userId,
        description,
        amount_changed: -1
      });
    }

    return { 
      success: data?.success || false, 
      remaining: data?.remaining ?? 0, 
      error: data?.error 
    };
  },

  // FUNÇÃO DE TESTE (DEBUG)
  debugSetUserPlan: async (userId: string, planId: string) => {
    const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
    if (!plan) return { error: 'Plano não encontrado' };

    return await supabase
      .from('profiles')
      .update({
        plan_id: planId,
        status: 'active',
        current_plan_credits: plan.credits,
        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', userId);
  },

  // --- CONTEÚDOS ---

  saveNewContent: async (userId: string, item: Partial<ContentItem>): Promise<string | null> => {
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: userId,
        type: item.type,
        title: item.title,
        topic: item.topic,
        tone: item.tone,
        content: item.content
      })
      .select()
      .single();

    if (contentError || !content) return null;

    await supabase.from('content_versions').insert({
      content_id: content.id,
      title: content.title,
      content: content.content,
      label: 'IA'
    });

    return content.id;
  },

  updateContent: async (userId: string, contentId: string, updates: Partial<ContentItem>) => {
    return await supabase
      .from('contents')
      .update({
        title: updates.title,
        content: updates.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId)
      .eq('user_id', userId);
  },

  deleteContent: async (userId: string, contentId: string) => {
    return await supabase
      .from('contents')
      .delete()
      .eq('id', contentId)
      .eq('user_id', userId);
  },

  saveContentVersion: async (userId: string, contentId: string, title: string, content: string, label: string = 'Manual') => {
    await databaseService.updateContent(userId, contentId, { title, content });
    return await supabase
      .from('content_versions')
      .insert({ content_id: contentId, title, content, label })
      .select()
      .single();
  },

  fetchContents: async (userId: string) => {
    const { data, error } = await supabase
      .from('contents')
      .select(`
        *,
        content_versions(*),
        content_tags(
          tags(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // --- NOTAS ---

  saveNote: async (userId: string, note: Partial<Note>): Promise<string | null> => {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title: note.title,
        content: note.content,
        linked_content_id: note.linkedItemId
      })
      .select()
      .single();

    if (error || !data) return null;
    return data.id;
  },

  updateNote: async (userId: string, noteId: string, updates: Partial<Note>) => {
    return await supabase
      .from('notes')
      .update({
        title: updates.title,
        content: updates.content,
        linked_content_id: updates.linkedItemId,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .eq('user_id', userId);
  },

  deleteNote: async (userId: string, noteId: string) => {
    return await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId);
  },

  fetchNotes: async (userId: string) => {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        note_tags(
          tags(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // --- PLANOS (ADMIN) ---

  fetchPlans: async () => {
    return await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });
  },

  savePlan: async (plan: Partial<Plan>) => {
    // Sanitização rigorosa do preço para o banco
    const rawPrice = plan.price?.toString() || '0';
    const cleanPrice = rawPrice.includes(',') 
      ? rawPrice.replace(/\./g, '').replace(',', '.') 
      : rawPrice;

    const payload = {
      name: plan.name,
      description: plan.description,
      price: parseFloat(cleanPrice) || 0,
      credits: plan.credits,
      payment_link: plan.paymentLink,
      features: plan.features,
      is_recommended: plan.recommended,
      type: plan.type,
      kiwify_product_id: plan.kiwifyProductId
    };

    if (plan.id) {
      return await supabase
        .from('plans')
        .update(payload)
        .eq('id', plan.id);
    } else {
      return await supabase
        .from('plans')
        .insert(payload)
        .select()
        .single();
    }
  },

  deletePlan: async (planId: string) => {
    return await supabase
      .from('plans')
      .delete()
      .eq('id', planId);
  },

  // --- PAGAMENTOS ---

  fetchPayments: async (userId: string) => {
    return await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },

  // --- TAGS ---

  fetchTags: async (userId: string) => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId);
    
    return { data, error };
  },

  createTag: async (userId: string, name: string, color: string) => {
    return await supabase
      .from('tags')
      .insert({ user_id: userId, name, color })
      .select()
      .single();
  },

  updateTag: async (userId: string, tagId: string, updates: Partial<{ name: string, color: string }>) => {
    return await supabase
      .from('tags')
      .update(updates)
      .eq('id', tagId)
      .eq('user_id', userId);
  },

  deleteTag: async (userId: string, tagId: string) => {
    return await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)
      .eq('user_id', userId);
  },

  // --- RELACIONAMENTOS ---

  linkTagToContent: async (contentId: string, tagId: string) => {
    return await supabase
      .from('content_tags')
      .insert({ content_id: contentId, tag_id: tagId });
  },

  unlinkTagFromContent: async (contentId: string, tagId: string) => {
    return await supabase
      .from('content_tags')
      .delete()
      .eq('content_id', contentId)
      .eq('tag_id', tagId);
  },

  linkTagToNote: async (noteId: string, tagId: string) => {
    return await supabase
      .from('note_tags')
      .insert({ note_id: noteId, tag_id: tagId });
  },

  unlinkTagFromNote: async (noteId: string, tagId: string) => {
    return await supabase
      .from('note_tags')
      .delete()
      .eq('note_id', noteId)
      .eq('tag_id', tagId);
  }
};