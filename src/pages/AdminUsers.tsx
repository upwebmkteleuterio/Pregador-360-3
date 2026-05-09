"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Mail, Shield, Search, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/integrations/supabase/client';

interface UserData {
  id: string;
  displayName: string;
  email: string;
  planName: string;
  createdAt: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          updated_at,
          plans ( name )
        `);

      if (error) {
        console.error("Erro de permissão ou rede:", error.message);
        setUsers([]);
      } else if (data) {
        const formattedUsers: UserData[] = data.map((u: any) => ({
          id: u.id,
          displayName: u.full_name || 'Usuário Sem Nome',
          email: u.email || 'N/A',
          planName: u.plans?.name || 'Gratuito',
          createdAt: u.updated_at ? new Date(u.updated_at).toLocaleDateString('pt-BR') : 'N/A',
        }));
        setUsers(formattedUsers);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl text-yellow-500 font-bold">Gerenciar Usuários</h1>
          <p className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-tighter">Acesso Restrito ao Administrador</p>
        </div>
      </div>

      <div className="relative group">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar usuários por nome ou email..."
          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-6 py-4 pl-12 focus:outline-none focus:border-yellow-500/50 transition-all"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={20} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
            {loading ? 'Carregando...' : `${filteredUsers.length} Usuários Encontrados`}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-yellow-500" size={32} />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <div 
                key={user.id}
                className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] hover:border-yellow-500/30 transition-all group"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex-shrink-0 flex items-center justify-center text-yellow-500">
                      <User size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[var(--text-primary)] group-hover:text-yellow-500 transition-colors truncate">
                        {user.displayName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] break-all sm:truncate">
                        <Mail size={12} className="flex-shrink-0" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--border-color)] border-dashed">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                      user.planName === 'Gratuito' 
                        ? "bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                        : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                    )}>
                      <Shield size={10} />
                      {user.planName}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                      <Calendar size={12} className="text-yellow-500/50" />
                      <span className="opacity-60">Cadastrado em:</span>
                      <span className="text-[var(--text-primary)]">{user.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
