import React, { useEffect } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { useStore } from '@/src/store/useStore';
import { databaseService } from '@/src/services/databaseService';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    setAuthState, 
    setAuthLoading, 
    setSubscriptionState, 
    setItems, 
    setNotes, 
    setTags, 
    setPayments,
    setPlans 
  } = useStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleUserAuthenticated(session.user.id, session.user.email || '');
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        handleUserAuthenticated(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          isAuthenticated: false,
          user: null,
        });
        localStorage.removeItem('pregador-360-storage');
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserAuthenticated = async (userId: string, email: string) => {
    const [profileRes, contentsRes, notesRes, tagsRes, paymentsRes, plansRes] = await Promise.all([
      supabase.from('profiles').select('*, plans(*)').eq('id', userId).single(),
      databaseService.fetchContents(userId),
      databaseService.fetchNotes(userId),
      databaseService.fetchTags(userId),
      databaseService.fetchPayments(userId),
      databaseService.fetchPlans()
    ]);

    if (profileRes.data) {
      const data = profileRes.data;
      setAuthState({
        isAuthenticated: true,
        user: {
          id: data.id,
          name: data.full_name || email.split('@')[0] || 'Usuário',
          email: email,
          avatar: data.avatar_url || '',
          isAdmin: data.is_admin || false,
        },
      });
      
      const planInfo = data.plans;
      setSubscriptionState({
        planId: planInfo?.id || null,
        planName: planInfo?.name || 'Gratuito',
        planType: (planInfo?.type || 'free') as 'free' | 'pro',
        status: (data.status || 'inactive') as 'active' | 'inactive' | 'pending',
        credits: data.current_plan_credits ?? 0,
        totalCredits: planInfo?.credits ?? 30,
        nextRenewalDate: data.subscription_expires_at ? new Date(data.subscription_expires_at).toLocaleDateString('pt-BR') : 'N/A'
      });
    }

    if (contentsRes.data) {
      setItems(contentsRes.data.map((c: any) => ({
        id: c.id,
        type: c.type,
        title: c.title,
        topic: c.topic || '',
        tone: c.tone || 'Inspirador',
        content: c.content || '',
        tags: c.content_tags ? c.content_tags.map((ct: any) => ct.tags.name) : [],
        createdAt: c.created_at,
        versions: c.content_versions.map((v: any) => ({
          id: v.id,
          title: v.title,
          content: v.content,
          createdAt: v.created_at,
          label: v.label
        }))
      })));
    }

    if (notesRes.data) {
      setNotes(notesRes.data.map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content || '',
        linked_content_id: n.linked_content_id,
        createdAt: n.created_at,
        tags: n.note_tags ? n.note_tags.map((nt: any) => nt.tags.name) : []
      })));
    }

    if (tagsRes.data) {
      setTags(tagsRes.data);
    }

    if (paymentsRes.data) {
      setPayments(paymentsRes.data);
    }

    if (plansRes.data) {
      setPlans(plansRes.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price?.toString() || '0,00',
        credits: p.credits,
        paymentLink: p.payment_link,
        kiwifyProductId: p.kiwify_product_id,
        features: p.features || [],
        recommended: p.is_recommended,
        type: p.type
      })));
    }

    setAuthLoading(false);
  };

  return <>{children}</>;
};