import { supabase } from '../integrations/supabase/client';
import { ContentItem, Note, Plan } from "../store/useStore";

/**
 * Database Service - Supabase Edition (Secure Refactor)
 */

export const databaseService = {
  // --- PERFIL E CRÉDITOS ---

  deductCredit: async (description: string): Promise<{ success: boolean; remaining: number; error?: string }> => {
    // Pegamos o ID do usuário diretamente da sessão ativa do Supabase para segurança máxima
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, remaining: 0, error: "Usuário não autenticado" };

    const { data, error } = await supabase.rpc('consume_credit', { user_id_input: user.id });

    if (error) {
      console.error("[databaseService] RPC Error:", error);
      return { success: false, remaining: 0, error: error.message };
    }

    if (data && data.success) {
      await supabase.from('credits_log').insert({
        user_id: user.id,
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

  // --- CONTEÚDOS ---

  saveNewContent: async (item: Partial<ContentItem>): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      const { data: content, error: contentError } = await supabase
        .from('contents')
        .insert({
          user_id: user.id,
          type: item.type,
          title: item.title,
          topic: item.topic,
          tone: item.tone,
          content: item.content
        })
        .select()
        .single();

      if (contentError || !content) {
        console.error("[databaseService] Error saving content:", contentError);
        return null;
      }

      await supabase.from('content_versions').insert({
        content_id: content.id,
        title: content.title,
        content: content.content,
        label: 'IA'
      });

      return content.id;
    } catch (err) {
      console.error("[databaseService] Unexpected error in saveNewContent:", err);
      return null;
    }
  },

  updateContent: async (contentId: string, updates: Partial<ContentItem>) => {
    // RLS filtra automaticamente por user_id = auth.uid()
    return await supabase
      .from('contents')
      .update({
        title: updates.title,
        content: updates.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId);
  },

  deleteContent: async (contentId: string) => {
    // RLS filtra automaticamente por user_id = auth.uid()
    return await supabase
      .from('contents')
      .delete()
      .eq('id', contentId);
  },

  saveContentVersion: async (contentId: string, title: string, content: string, label: string = 'Manual') => {
    await databaseService.updateContent(contentId, { title, content });
    return await supabase
      .from('content_versions')
      .insert({ content_id: contentId, title, content, label })
      .select()
      .single();
  },

  fetchContents: async () => {
    // RLS garante que apenas conteúdos do usuário logado sejam retornados
    const { data, error } = await supabase
      .from('contents')
      .select(`
        *,
        content_versions(*),
        content_tags(
          tags(*)
        )
      `)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // --- NOTAS ---

  saveNote: async (note: Partial<Note>): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: note.title,
        content: note.content,
        linked_content_id: note.linkedItemId
      })
      .select()
      .single();

    if (error || !data) return null;
    return data.id;
  },

  updateNote: async (noteId: string, updates: Partial<Note>) => {
    return await supabase
      .from('notes')
      .update({
        title: updates.title,
        content: updates.content,
        linked_content_id: updates.linkedItemId,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId);
  },

  deleteNote: async (noteId: string) => {
    return await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);
  },

  fetchNotes: async () => {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        note_tags(
          tags(*)
        )
      `)
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

  fetchPayments: async () => {
    return await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
  },

  // --- TAGS ---

  fetchTags: async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('*');
    
    return { data, error };
  },

  createTag: async (name: string, color: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Unauthorized" };

    return await supabase
      .from('tags')
      .insert({ user_id: user.id, name, color })
      .select()
      .single();
  },

  updateTag: async (tagId: string, updates: Partial<{ name: string, color: string }>) => {
    return await supabase
      .from('tags')
      .update(updates)
      .eq('id', tagId);
  },

  deleteTag: async (tagId: string) => {
    return await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);
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