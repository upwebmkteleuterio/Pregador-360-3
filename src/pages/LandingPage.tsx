"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cross, 
  Library, 
  Zap, 
  Instagram, 
  Youtube, 
  Mail,
  FileText,
  MonitorPlay,
  PencilRuler,
  CheckCircle2,
  BookOpenCheck,
  Sparkles,
  Search,
  BookOpen,
  Languages,
  Landmark,
  Scroll,
  Clock,
  Lightbulb
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '@/src/store/useStore';
import logoImg from '@/src/assets/logo.png';
import mockupImg from '@/src/assets/mockup.png';

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useStore();

  useEffect(() => {
    if (theme === 'dark') {
      toggleTheme();
    }
  }, []);

  const handleCTA = () => {
    navigate('/login?mode=signup');
  };

  const revealVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="bg-[#ffffff] text-[#09090b] font-sans selection:bg-yellow-500/30 overflow-x-hidden min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center bg-[#ffffff]/90 backdrop-blur-md border border-[#e4e4e7] px-6 py-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Pregador 360"
              className="h-8 w-auto"
            />
          </div>
          
          <div className="flex items-center gap-4 md:gap-8 text-sm font-medium">
            <button
              onClick={() => navigate('/login')}
              className="text-[#09090b] font-bold text-xs uppercase tracking-widest hover:text-yellow-600 transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={handleCTA}
              className="bg-yellow-500 text-[#09090b] px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-yellow-500/20"
            >
              Começar
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero-section" className="relative pt-32 pb-20 px-6 overflow-hidden min-h-screen flex items-center bg-white">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden" whileInView="visible" variants={revealVariants}
            className="block text-[#52525b] text-[10px] font-bold uppercase tracking-widest mb-6"
          >
            Crie sermões com profundidade, clareza e propósito em minutos
          </motion.div>
          
          <motion.h1
            initial="hidden" whileInView="visible" variants={revealVariants}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight text-[#09090b]"
          >
            Potencialize seu Ministério com <span className="text-yellow-500">auxílio da tecnologia.</span>
          </motion.h1>
          
          <motion.p
            initial="hidden" whileInView="visible" variants={revealVariants}
            className="text-[#52525b] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Organize seus pensamentos, estruture seus sermões e alcance mais corações através de recursos digitais criados para apoiar a propagação da fé.
          </motion.p>
          
          <motion.div
            initial="hidden" whileInView="visible" variants={revealVariants}
            className="flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={handleCTA}
              className="bg-yellow-500 text-[#09090b] px-10 py-5 rounded-2xl text-sm font-bold uppercase tracking-widest w-full md:w-auto hover:scale-105 active:scale-95 transition-all shadow-xl shadow-yellow-500/20"
            >
              Comece Grátis Agora →
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-10 py-5 rounded-2xl text-sm font-bold text-[#09090b] border border-[#e4e4e7] hover:bg-[#f4f4f5] transition-all w-full md:w-auto"
            >
              Ver demonstração
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="mt-20 relative max-w-4xl mx-auto animate-bounce-slow"
          >
            <img 
              src={mockupImg} 
              alt="App Preview" 
              className="w-full h-auto rounded-[32px]"
            />
          </motion.div>
        </div>
      </section>

      {/* Sermon Anatomy Section */}
      <section className="py-32 px-6 border-y border-[#e4e4e7]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" variants={revealVariants} className="space-y-8">
              <h2 className="text-4xl font-bold text-[#09090b] leading-tight">
                Um Resultado <span className="text-yellow-500">Teológico</span> Completo
              </h2>
              <p className="text-[#52525b] leading-relaxed">
                Ao contrário de geradores genéricos, o Pregador 360 entrega uma estrutura homilética profissional pronta para o estudo ou pregação imediata.
              </p>
              
              <div className="space-y-4">
                <SermonDetail 
                  icon={<Languages className="text-yellow-500" size={20} />}
                  title="Análise Lexical e Exegese"
                  desc="Identificação de palavras-chave no Grego ou Hebraico com significados e aplicações originais."
                />
                <SermonDetail 
                  icon={<Landmark className="text-yellow-500" size={20} />}
                  title="Estrutura de 4 Pontos"
                  desc="Cada ponto inclui explicação profunda, referências cruzadas, aplicação prática e ilustrações."
                />
                <SermonDetail 
                  icon={<Scroll className="text-yellow-500" size={20} />}
                  title="Contexto Histórico"
                  desc="Explicação detalhada sobre usos, costumes e o cenário bíblico da época do texto base."
                />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-[#f4f4f5] p-8 rounded-[2.5rem] border border-[#e4e4e7] shadow-inner"
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e4e4e7] space-y-4">
                <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Exemplo de Estrutura</div>
                <div className="h-4 w-3/4 bg-[#f4f4f5] rounded"></div>
                <div className="h-px w-full bg-[#e4e4e7]"></div>
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-[#09090b]">1. TÍTULO DO PONTO</div>
                  <div className="h-2 w-full bg-[#f4f4f5] rounded"></div>
                  <div className="h-2 w-5/6 bg-[#f4f4f5] rounded"></div>
                </div>
                <div className="p-3 bg-yellow-500/5 border-l-4 border-yellow-500 rounded-r-lg space-y-2">
                  <div className="text-[10px] font-bold text-yellow-600">ILUSTRAÇÃO</div>
                  <div className="h-2 w-full bg-yellow-500/10 rounded"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" variants={revealVariants} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#09090b]">Ferramentas de Púlpito</h2>
            <p className="text-[#52525b] mt-4">Tudo o que você precisa para preparar e ministrar a mensagem.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <ToolCard 
              icon={<PencilRuler className="text-yellow-600" />}
              title="Editor Profissional"
              desc="Interface de texto rica que permite formatar, adicionar seus próprios insights e ajustar cada detalhe do esboço gerado."
            />
            <ToolCard 
              icon={<FileText className="text-yellow-600" />}
              title="Exportação em PDF"
              desc="Gere documentos formatados e limpos em PDF para imprimir ou salvar, mantendo a organização da sua biblioteca."
            />
            <ToolCard 
              icon={<MonitorPlay className="text-yellow-600" />}
              title="Modo Ministração"
              desc="Transforme seu tablet em um teleprompter inteligente com auto-scroll e ajuste de fonte para leitura fluida no púlpito."
            />
          </div>
        </div>
      </section>

      {/* Bible Search Section */}
      <section className="py-32 px-6 bg-[#f4f4f5] border-y border-[#e4e4e7]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
             <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="bg-white p-8 rounded-[2.5rem] border border-[#e4e4e7] shadow-2xl space-y-6">
                <div className="flex items-center gap-4 p-4 bg-[#f4f4f5] rounded-2xl border border-[#e4e4e7]">
                  <Search size={20} className="text-yellow-500" />
                  <div className="h-4 w-48 bg-[#e4e4e7] rounded"></div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Sparkles size={16} className="text-yellow-500" />
                    <div className="h-3 w-32 bg-yellow-500/10 rounded"></div>
                  </div>
                  <div className="h-2 w-full bg-[#f4f4f5] rounded-full"></div>
                  <div className="h-2 w-5/6 bg-[#f4f4f5] rounded-full"></div>
                  <div className="h-2 w-4/6 bg-[#f4f4f5] rounded-full"></div>
                </div>
                <div className="pt-4 border-t border-[#e4e4e7] flex gap-2">
                  <div className="h-8 w-24 bg-yellow-500 rounded-lg"></div>
                  <div className="h-8 w-24 bg-[#f4f4f5] rounded-lg border border-[#e4e4e7]"></div>
                </div>
              </div>
              {/* Floating element */}
              <div className="absolute -bottom-6 -right-6 p-6 bg-yellow-500 text-white rounded-3xl shadow-xl hidden md:block">
                <BookOpen size={32} />
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" variants={revealVariants} className="space-y-8">
              <h2 className="text-4xl font-bold text-[#09090b] leading-tight">
                Pesquisa Bíblica com <span className="text-yellow-500">Inteligência</span>
              </h2>
              <p className="text-[#52525b] leading-relaxed">
                Nossa ferramenta de consulta bíblica vai além da simples busca por palavras. Ela oferece uma camada teológica profunda para auxiliar seus estudos.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                    <Sparkles className="text-yellow-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#09090b]">Consulta Teológica Profunda</h4>
                    <p className="text-[#71717a] text-sm mt-1">Obtenha exegese, contexto histórico e aplicações espirituais de qualquer passagem ou tema bíblico instantaneamente.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1 w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                    <Library className="text-yellow-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#09090b]">Extração de Temas e Versículos</h4>
                    <p className="text-[#71717a] text-sm mt-1">A IA identifica automaticamente temas secundários e referências cruzadas relevantes para expandir sua visão sobre o assunto.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1 w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                    <FileText className="text-yellow-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#09090b]">Integração Direta</h4>
                    <p className="text-[#71717a] text-sm mt-1">Transforme o resultado de uma pesquisa em uma nova nota de estudo ou utilize o tema identificado para gerar um sermão completo.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" variants={revealVariants}
            className="text-center mb-20"
          >
            <h2 className="text-4xl font-bold mb-4 text-[#09090b]">Por que o Pregador 360?</h2>
            <p className="text-[#71717a] max-w-xl mx-auto">Equilíbrio perfeito entre suporte técnico e profundidade espiritual.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Clock className="text-yellow-600" size={28} />}
              title="Ganhe Tempo para a Oração"
              desc="Deixe que nossa tecnologia auxilie na estrutura técnica do seu esboço, para que você dedique mais tempo ao que realmente importa."
            />
            <FeatureCard
              icon={<Library className="text-yellow-600" size={28} />}
              title="Organização Impecável"
              desc="Tenha toda a sua biblioteca de pregações e ilustrações na palma da mão, acessível em qualquer lugar."
              delay={0.2}
            />
            <FeatureCard
              icon={<Lightbulb className="text-yellow-600" size={28} />}
              title="Clareza na Mensagem"
              desc="Ferramentas que ajudam a conectar passagens bíblicas e temas contemporâneos, garantindo clareza e impacto."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Functionalities */}
      <section className="py-32 px-6 bg-[#f4f4f5]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <motion.div
              initial="hidden" whileInView="visible" variants={revealVariants}
              className="max-w-xl"
            >
              <h2 className="text-4xl font-bold mb-4 text-[#09090b]">Recursos Digitais Pensados para Você</h2>
              <p className="text-[#52525b]">A tecnologia não substitui o chamado, ela o potencializa.</p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <GridFeature number="1" title="Assistente de Estruturação" desc="Transforme um tema ou versículo em um esboço completo em segundos, mantendo a profundidade teológica." />
            <GridFeature number="2" title="Biblioteca de Ilustrações" desc="Um acervo inteligente para encontrar a história certa que ilustra o amor de Deus de forma inesquecível." delay={0.1} />
            <GridFeature number="3" title="Modo Ministração" desc="Uma interface limpa e focada para você pregar usando seu tablet ou celular, sem distrações." delay={0.2} />
            <GridFeature number="4" title="Leitura Devocional por Áudio" desc="Transforme seus sermões em áudio para revisar sua mensagem enquanto se prepara para o culto." delay={0.3} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#e4e4e7] bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Cross className="text-yellow-600" size={18} />
            </div>
            <span className="font-bold text-lg text-[#09090b]">Pregador 360</span>
          </div>
          
          <p className="text-[#71717a] text-sm">© 2024 Pregador 360. Todos os direitos reservados.</p>
          
          <div className="flex gap-6">
            <a href="#" className="text-[#71717a] hover:text-yellow-500 transition-colors"><Instagram size={20} /></a>
            <a href="#" className="text-[#71717a] hover:text-yellow-500 transition-colors"><Youtube size={20} /></a>
            <a href="#" className="text-[#71717a] hover:text-yellow-500 transition-colors"><Mail size={20} /></a>
          </div>
        </div>
      </footer>

      <style>{`
        .animate-bounce-slow {
          animation: floating 3s ease-in-out infinite;
        }
        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}

function SermonDetail({ icon, title, desc }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1">{icon}</div>
      <div>
        <h4 className="font-bold text-[#09090b] text-sm">{title}</h4>
        <p className="text-[#71717a] text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ToolCard({ icon, title, desc }: any) {
  return (
    <div className="p-8 bg-white border border-[#e4e4e7] rounded-[2.5rem] space-y-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
        {React.cloneElement(icon as React.ReactElement, { size: 24 })}
      </div>
      <h3 className="text-xl font-bold text-[#09090b]">{title}</h3>
      <p className="text-[#71717a] text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      viewport={{ once: true }}
      className="bg-white border border-[#e4e4e7] p-10 rounded-[32px] hover:-translate-y-2 hover:border-yellow-500/40 transition-all duration-300 shadow-xl"
    >
      <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 text-[#09090b]">{title}</h3>
      <p className="text-[#71717a] leading-relaxed text-sm">{desc}</p>
    </motion.div>
  );
}

function GridFeature({ number, title, desc, delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      className="flex items-start gap-6 p-8 bg-white border border-[#e4e4e7] rounded-[32px]"
    >
      <div className="flex-shrink-0 w-12 h-12 bg-yellow-500 text-[#09090b] rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-yellow-500/20">
        {number}
      </div>
      <div>
        <h4 className="text-xl font-bold mb-2 text-[#09090b]">{title}</h4>
        <p className="text-[#71717a] text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}