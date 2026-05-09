import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type MessageTone = 'Inspirador' | 'Exortativo' | 'Teológico' | 'Acolhedor' | 'Confrontador' | 'Evangelístico' | 'Profético' | 'Didático' | 'Pastoral';
export type ItemType = 'Sermão' | 'Ilustração';

export interface ContentVersion {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  label: string;
}

export interface ContentItem {
  id: string;
  type: ItemType;
  title: string;
  topic: string;
  tone: MessageTone;
  content: string;
  tags: string[];
  createdAt: string;
  versions: ContentVersion[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  linkedItemId?: string;
  createdAt: string;
  tags: string[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  credits: number;
  paymentLink: string;
  features: string[];
  recommended: boolean;
  type: 'free' | 'pro';
  buttonText?: string;
  kiwifyProductId?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  paid_at: string;
  payment_method: string;
}

interface AppState {
  authLoading: boolean;
  items: ContentItem[];
  plans: Plan[];
  payments: PaymentRecord[];
  generatorForm: { type: ItemType; topic: string; tone: MessageTone; };
  modals: {
    exportOpen: boolean;
    historyOpen: boolean;
    moreMenuOpen: boolean;
    tagModalOpen: boolean;
    deleteConfirmOpen: boolean;
    deleteTagConfirmOpen: boolean;
    createEditTagModalOpen: boolean;
    aiCreditsOpen: boolean;
    audioPlayerOpen: boolean;
    currentItemId: string | null;
    currentTagId: string | null;
    restoredContent: { title: string; content: string } | null;
  };
  library: { searchQuery: string; filter: 'Todos' | ItemType; };
  tags: Tag[];
  notes: Note[];
  notesLibrary: { searchQuery: string; };
  preachingMode: { fontSize: number; scrollSpeed: number; };
  auth: {
    isAuthenticated: boolean;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string;
      isAdmin?: boolean; 
    } | null;
  };
  subscription: {
    planId: string | null;
    planName: string;
    planType: 'free' | 'pro';
    status: 'active' | 'inactive' | 'pending';
    nextRenewalDate: string;
    credits: number;
    totalCredits: number;
  };
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setItems: (items: ContentItem[]) => void;
  setNotes: (notes: Note[]) => void;
  setTags: (tags: Tag[]) => void;
  setPayments: (payments: PaymentRecord[]) => void;
  setPlans: (plans: Plan[]) => void;
  addItem: (item: ContentItem) => void;
  updateItem: (id: string, updates: Partial<ContentItem>) => void;
  deleteItem: (id: string) => void;
  setGeneratorForm: (form: Partial<AppState['generatorForm']>) => void;
  setModalState: (modal: keyof AppState['modals'], open: boolean, id?: string | null) => void;
  setLibraryState: (state: Partial<AppState['library']>) => void;
  duplicateItem: (id: string) => void;
  toggleTag: (itemId: string, tagId: string) => Promise<void>;
  addTag: (tag: Tag) => void;
  updateTag: (id: string, updates: Partial<{ name: string; color: string }>) => void;
  deleteTag: (id: string) => Promise<void>;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setNotesLibraryState: (state: Partial<AppState['notesLibrary']>) => void;
  setPreachingModeState: (state: Partial<AppState['preachingMode']>) => void;
  setAuthState: (state: Partial<AppState['auth']>) => void;
  setSubscriptionState: (state: Partial<AppState['subscription']>) => void;
  setAuthLoading: (loading: boolean) => void;
  addVersion: (itemId: string, data: Partial<ContentItem>, label: string) => void;
  restoreVersion: (itemId: string, versionId: string) => void;
  updatePlan: (id: string, updates: Partial<Plan>) => void;
  addPlan: (plan: Plan) => void;
  deletePlan: (id: string) => void;
}

const storage = createJSONStorage(() => localStorage);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      authLoading: true,
      items: [],
      plans: [],
      payments: [],
      generatorForm: { type: 'Sermão', topic: '', tone: 'Inspirador' },
      modals: {
        exportOpen: false, historyOpen: false, moreMenuOpen: false, tagModalOpen: false,
        deleteConfirmOpen: false, deleteTagConfirmOpen: false, createEditTagModalOpen: false, aiCreditsOpen: false,
        audioPlayerOpen: false, currentItemId: null, currentTagId: null, restoredContent: null,
      },
      library: { searchQuery: '', filter: 'Todos' },
      tags: [],
      notes: [],
      notesLibrary: { searchQuery: '' },
      preachingMode: { fontSize: 32, scrollSpeed: 1 },
      auth: { isAuthenticated: false, user: null },
      subscription: { planId: null, planName: 'Carregando...', planType: 'free', status: 'inactive', nextRenewalDate: 'N/A', credits: 0, totalCredits: 30 },
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setItems: (items) => set({ items }),
      setNotes: (notes) => set({ notes }),
      setTags: (tags) => set({ tags }),
      setPayments: (payments) => set({ payments }),
      setPlans: (plans) => set({ plans }),
      addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
      updateItem: (id, updates) => set((state) => ({ items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)) })),
      deleteItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setGeneratorForm: (form) => set((state) => ({ generatorForm: { ...state.generatorForm, ...form } })),
      setModalState: (modal, open, id) => set((state) => {
        const updates: any = { [modal]: open };
        if (id !== undefined) {
           if (modal === 'createEditTagModalOpen' || modal === 'deleteTagConfirmOpen') {
             updates.currentTagId = id;
           } else {
             updates.currentItemId = id;
           }
        }
        return { modals: { ...state.modals, ...updates } };
      }),
      setLibraryState: (libState) => set((state) => ({ library: { ...state.library, ...libState } })),
      duplicateItem: (id) => set((state) => {
        const item = state.items.find(i => i.id === id);
        if (!item) return state;
        return { items: [{ ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString(), versions: [] }, ...state.items] };
      }),
      toggleTag: async (itemId, tagId) => {
        const state = get();
        const tag = state.tags.find(t => t.id === tagId);
        if (!tag) return;

        const isContent = state.items.some(i => i.id === itemId);
        const isNote = state.notes.some(n => n.id === itemId);
        const currentItem = isContent ? state.items.find(i => i.id === itemId) : state.notes.find(n => n.id === itemId);
        
        if (!currentItem) return;

        const isTagLinked = currentItem.tags.includes(tag.name);
        const { databaseService } = await import('../services/databaseService');

        try {
          if (isTagLinked) {
            if (isContent) await databaseService.unlinkTagFromContent(itemId, tagId);
            else await databaseService.unlinkTagFromNote(itemId, tagId);
            
            set((s) => ({
              items: s.items.map(i => i.id === itemId ? { ...i, tags: i.tags.filter(t => t !== tag.name) } : i),
              notes: s.notes.map(n => n.id === itemId ? { ...n, tags: n.tags.filter(t => t !== tag.name) } : n)
            }));
          } else {
            if (isContent) await databaseService.linkTagToContent(itemId, tagId);
            else await databaseService.linkTagToNote(itemId, tagId);

            set((s) => ({
              items: s.items.map(i => i.id === itemId ? { ...i, tags: [...i.tags, tag.name] } : i),
              notes: s.notes.map(n => n.id === itemId ? { ...n, tags: [...n.tags, tag.name] } : n)
            }));
          }
        } catch (error) {
          console.error("Erro ao alternar tag:", error);
        }
      },
      addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),
      updateTag: (id, updates) => set((state) => ({ tags: state.tags.map(t => t.id === id ? { ...t, ...updates } : t) })),
      deleteTag: async (id) => {
        const state = get();
        const tagToDelete = state.tags.find(t => t.id === id);
        if (!tagToDelete || !state.auth.user?.id) return;

        const { databaseService } = await import('../services/databaseService');
        const { error } = await databaseService.deleteTag(state.auth.user.id, id);

        if (error) return;

        set((s) => ({
          tags: s.tags.filter(t => t.id !== id),
          items: s.items.map(i => ({ ...i, tags: i.tags.filter(t => t !== tagToDelete.name) })),
          notes: s.notes.map(n => ({ ...n, tags: n.tags.filter(t => t !== tagToDelete.name) }))
        }));
      },
      addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
      updateNote: (id, updates) => set((state) => ({ notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n) })),
      deleteNote: (id) => set((state) => ({ notes: state.notes.filter(n => n.id !== id) })),
      setNotesLibraryState: (libState) => set((state) => ({ notesLibrary: { ...state.notesLibrary, ...libState } })),
      setPreachingModeState: (pmState) => set((state) => ({ preachingMode: { ...state.preachingMode, ...pmState } })),
      setAuthState: (authState) => set((state) => ({ auth: { ...state.auth, ...authState } })),
      setSubscriptionState: (subState) => set((state) => ({ subscription: { ...state.subscription, ...subState } })),
      setAuthLoading: (loading) => set({ authLoading: loading }),
      addVersion: (itemId, data, label) => set((state) => ({
        items: state.items.map((i) => i.id === itemId ? { ...i, versions: [{ id: crypto.randomUUID(), title: data.title || i.title, content: data.content || i.content, createdAt: new Date().toISOString(), label }, ...i.versions].slice(0, 10) } : i)
      })),
      restoreVersion: (itemId, versionId) => set((state) => ({
        items: state.items.map((i) => i.id === itemId ? { ...i, content: i.versions.find(v => v.id === versionId)?.content || i.content } : i)
      })),
      updatePlan: (id, updates) => set((state) => ({ plans: state.plans.map(p => p.id === id ? { ...p, ...updates } : p) })),
      addPlan: (plan) => set((state) => ({ plans: [...state.plans, plan] })),
      deletePlan: (id) => set((state) => ({ plans: state.plans.filter(p => p.id !== id) })),
    }),
    { name: 'pregador-360-storage', storage }
  )
);