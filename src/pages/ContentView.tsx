import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/src/store/useStore';
import { cn } from '@/src/lib/utils';
import { 
  ChevronLeft, 
  Pencil, 
  Volume2, 
  History, 
} from 'lucide-react';

export default function ContentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, setModalState } = useStore();
  const item = items.find(i => i.id === id);

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[var(--text-secondary)]">
        <h2 className="text-xl font-bold mb-4">Conteúdo não encontrado</h2>
        <button onClick={() => navigate('/library')} className="px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-yellow-500 font-bold active:scale-95 transition-transform">
          Voltar para Biblioteca
        </button>
      </div>
    );
  }

  const formatContent = (content: string) => {
    const cleanContent = content
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
    
    return cleanContent.split('\n').map((line, idx) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) return <div key={idx} className="h-4" />;

      if (trimmedLine === '---' || trimmedLine.startsWith('---')) {
        return <div key={idx} className="h-[2px] w-full bg-[var(--border-color)]/30 my-8 rounded-full" />;
      }

      if (trimmedLine.startsWith('# ')) {
         const title = trimmedLine.replace('# ', '').replace(/^\[|\]$/g, '');
         return <h2 key={idx} className="text-2xl text-yellow-500 font-bold uppercase tracking-tight py-4 mb-2">{title}</h2>;
      }

      if (trimmedLine.startsWith('## ')) {
        const title = trimmedLine.replace('## ', '');
        return (
          <div key={idx} className="mt-12 mb-6 group">
            <h3 className="text-xs font-bold text-yellow-500/40 uppercase tracking-[0.2em] mb-2 px-1">
              {title}
            </h3>
            <div className="h-[1px] w-full bg-gradient-to-r from-yellow-500/30 to-transparent mb-4" />
            <div className="bg-yellow-500/5 border-l-4 border-yellow-500/50 p-4 rounded-r-xl transition-all group-hover:bg-yellow-500/10">
               <span className="text-lg text-yellow-500 font-bold block">
                 {title}
               </span>
            </div>
          </div>
        );
      }

      if (trimmedLine.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-md font-sans text-[var(--text-primary)] font-bold mt-8 mb-4 flex items-center gap-3 border-b border-[var(--border-color)]/30 pb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-yellow-500/20 text-yellow-500 text-[10px]">
              {trimmedLine.match(/\d+/) ? trimmedLine.match(/\d+/)![0] : '•'}
            </span>
            {trimmedLine.replace(/###\s+(\d+\.\s+)?/, '')}
          </h4>
        );
      }

      if (trimmedLine.startsWith('•')) {
        return (
          <div key={idx} className="flex gap-2 py-1 pl-2">
            <span className="text-yellow-500/50 text-sm">•</span>
            <p className="text-[var(--text-primary)] font-medium opacity-90 text-sm">
              {trimmedLine.substring(1).trim()}
            </p>
          </div>
        );
      }

      if (trimmedLine.includes(':')) {
         const parts = trimmedLine.split(':');
         const firstPart = parts[0].trim();
         if (firstPart.length > 2 && firstPart === firstPart.toUpperCase()) {
            return (
              <div key={idx} className="py-2 text-sm">
                <span className="text-yellow-500/70 font-bold uppercase tracking-widest mr-2">{firstPart}:</span>
                <span className="text-[var(--text-primary)] opacity-80 leading-relaxed">{parts.slice(1).join(':').trim()}</span>
              </div>
            );
         }
      }

      return <p key={idx} className="text-[var(--text-secondary)] leading-relaxed text-sm py-1 min-h-[1.5rem]">{line}</p>;
    });
  };

  const handleExport = async (type: 'pdf' | 'docx' | 'print') => {
    if (type === 'pdf' || type === 'print') {
      try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(180, 140, 20);
        
        const titleLines = doc.splitTextToSize(item.title.toUpperCase(), contentWidth);
        doc.text(titleLines, margin, 30);
        
        let headerOffset = 30 + (titleLines.length * 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        const topicLines = doc.splitTextToSize(item.topic, contentWidth);
        doc.text(topicLines, margin, headerOffset);
        
        headerOffset += (topicLines.length * 6) + 2;

        doc.setDrawColor(234, 179, 8);
        doc.setLineWidth(0.5);
        doc.line(margin, headerOffset, pageWidth - margin, headerOffset);

        let cursorY = headerOffset + 15;
        const standardLineHeight = 7;
        
        const rawLines = item.content.split('\n');
        
        rawLines.forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed) {
            cursorY += standardLineHeight / 2;
            return;
          }

          if (trimmed.startsWith('## ')) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(180, 140, 20);
            const cleanText = trimmed.replace('## ', '').toUpperCase();
            const wrapped = doc.splitTextToSize(cleanText, contentWidth);
            wrapped.forEach((l: string) => {
              if (cursorY > 275) { doc.addPage(); cursorY = 20; }
              doc.text(l, margin, cursorY);
              cursorY += standardLineHeight + 2;
            });
            cursorY += 2;
          } else if (trimmed.startsWith('### ')) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(40, 40, 40);
            const cleanText = trimmed.replace('### ', '');
            const wrapped = doc.splitTextToSize(cleanText, contentWidth);
            wrapped.forEach((l: string) => {
              if (cursorY > 275) { doc.addPage(); cursorY = 20; }
              doc.text(l, margin, cursorY);
              cursorY += standardLineHeight + 1;
            });
          } else if (trimmed === '---' || trimmed.startsWith('---')) {
            cursorY += 2;
            doc.setDrawColor(230, 230, 230);
            doc.line(margin, cursorY, pageWidth - margin, cursorY);
            cursorY += standardLineHeight;
          } else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(60, 60, 60);
            const wrapped = doc.splitTextToSize(line, contentWidth);
            wrapped.forEach((l: string) => {
              if (cursorY > 275) { doc.addPage(); cursorY = 20; }
              doc.text(l, margin, cursorY);
              cursorY += standardLineHeight;
            });
          }
        });

        const finalPage = doc.internal.pages.length - 1;
        doc.setPage(finalPage);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Gerado por Pregador 360', margin, 285);

        if (type === 'pdf') {
          doc.save(`${item.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
        } else {
          const blobUrl = doc.output('bloburl');
          const printWindow = window.open(blobUrl, '_blank');
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.focus();
              printWindow.print();
            };
          }
        }
      } catch (error) {
        console.error('Erro na exportação:', error);
        alert('Erro ao gerar documento.');
      }
      return;
    }

    if (type === 'docx') {
      const htmlHeader = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${item.title}</title>
          <style>
            body { font-family: 'Calibri', 'Arial', sans-serif; line-height: 1.5; color: #333; }
            h1 { font-size: 24pt; color: #B48C14; text-transform: uppercase; margin-bottom: 5pt; border-bottom: 2pt solid #B48C14; }
            h2 { font-size: 18pt; color: #B48C14; margin-top: 20pt; margin-bottom: 10pt; font-weight: bold; }
            h3 { font-size: 14pt; color: #333; margin-top: 15pt; margin-bottom: 5pt; font-weight: bold; border-bottom: 1pt solid #eee; }
            p { font-size: 11pt; margin-bottom: 10pt; }
            .topic { color: #666; font-style: italic; font-size: 12pt; margin-bottom: 20pt; }
            .divider { border-top: 1pt solid #ddd; margin: 20pt 0; }
            .bullet { margin-left: 20pt; }
            .label { font-weight: bold; color: #B48C14; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <h1>${item.title}</h1>
          <p class="topic">${item.topic}</p>
      `;

      let htmlBody = '';
      const lines = item.content.split('\n');

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) {
          htmlBody += '<br/>';
          return;
        }

        if (trimmed.startsWith('# ')) {
          htmlBody += `<h2>${trimmed.replace('# ', '')}</h2>`;
        } else if (trimmed.startsWith('## ')) {
          htmlBody += `<h2>${trimmed.replace('## ', '')}</h2>`;
        } else if (trimmed.startsWith('### ')) {
          htmlBody += `<h3>${trimmed.replace('### ', '')}</h3>`;
        } else if (trimmed === '---' || trimmed.startsWith('---')) {
          htmlBody += '<div class="divider"></div>';
        } else if (trimmed.startsWith('•')) {
          htmlBody += `<p class="bullet">• ${trimmed.substring(1).trim()}</p>`;
        } else if (trimmed.includes(':') && trimmed.split(':')[0].trim() === trimmed.split(':')[0].trim().toUpperCase()) {
          const parts = trimmed.split(':');
          htmlBody += `<p><span class="label">${parts[0]}:</span> ${parts.slice(1).join(':')}</p>`;
        } else {
          htmlBody += `<p>${trimmed}</p>`;
        }
      });

      const htmlFooter = '</body></html>';
      const fullHtml = htmlHeader + htmlBody + htmlFooter;
      
      const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${item.title.toLowerCase().replace(/\s+/g, '-')}.doc`;
      link.click();
    }
  };

  React.useEffect(() => {
    const handleExportEvent = (e: any) => {
      if (e.detail?.type) {
        handleExport(e.detail.type);
      }
    };
    window.addEventListener('app-export', handleExportEvent);
    return () => window.removeEventListener('app-export', handleExportEvent);
  }, [item]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <button 
          onClick={() => navigate('/library')}
          className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-yellow-500 transition-colors rounded-xl"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={() => setModalState('historyOpen', true, item.id)}
          className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-yellow-500 transition-colors rounded-xl"
        >
          <History size={20} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto md:mx-0">
        <button 
          onClick={() => navigate(`/editor/${item.id}`)}
          className={cn(
            "flex flex-col items-center justify-center gap-3 aspect-square sm:aspect-auto sm:h-32 rounded-[1.5rem] border transition-all active:scale-[0.95]",
            "bg-[var(--bg-card)]/50 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-yellow-500 hover:text-yellow-500"
          )}
        >
          <Pencil size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">Editar</span>
        </button>

        <button 
          onClick={() => item.type !== 'Ilustração' && navigate(`/preach/${item.id}`)}
          disabled={item.type === 'Ilustração'}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-3 aspect-square sm:aspect-auto sm:h-32 rounded-[1.5rem] border transition-all active:scale-[0.95]",
            item.type === 'Ilustração' 
              ? "bg-[var(--bg-card)]/50 border-[var(--border-color)] text-[var(--text-secondary)] opacity-40 grayscale cursor-not-allowed"
              : "bg-yellow-500 border-yellow-400/50 text-zinc-950 shadow-lg shadow-yellow-500/20"
          )}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 11h16L18 8H6L4 11z" />
            <path d="M9 11v9" />
            <path d="M15 11v9" />
            <path d="M12 11v9" />
            <path d="M10 20h4" />
            <path d="M14 8l-2-4-2 4" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">Pregar</span>
        </button>

        <button 
          onClick={() => setModalState('audioPlayerOpen', true, item.id)}
          className={cn(
            "flex flex-col items-center justify-center gap-3 aspect-square sm:aspect-auto sm:h-32 rounded-[1.5rem] border transition-all active:scale-[0.95]",
            "bg-[var(--bg-card)]/50 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-yellow-500 hover:text-yellow-500"
          )}
        >
          <Volume2 size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">Ouvir</span>
        </button>

        <button 
          onClick={() => setModalState('exportOpen', true, item.id)}
          className={cn(
            "flex flex-col items-center justify-center gap-3 aspect-square sm:aspect-auto sm:h-32 rounded-[1.5rem] border transition-all active:scale-[0.95]",
            "bg-[var(--bg-card)]/50 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-yellow-500 hover:text-yellow-500"
          )}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">Exportar</span>
        </button>
      </div>

      <div>
        <div className="flex gap-2 mb-3">
          {item.tags?.map(tag => (
            <span key={tag} className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase border border-[var(--border-color)] px-2 py-1 rounded">
              {tag}
            </span>
          ))}
          <span className="text-[10px] font-bold tracking-widest text-yellow-500/70 border border-yellow-500/20 px-2 py-1 rounded bg-yellow-500/5 uppercase">
            {item.type}
          </span>
        </div>
        <h1 className="text-3xl font-bold leading-tight text-yellow-500">{item.title}</h1>
        <p className="mt-2 text-[var(--text-secondary)] text-sm">{item.topic}</p>
      </div>

      <div className="relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-yellow-500/10 rounded-full" />
        <div className="space-y-1 pl-2">
          {formatContent(item.content)}
        </div>
      </div>

      <div className="py-12 flex items-center justify-center gap-4 text-[var(--text-secondary)] opacity-30">
        <div className="h-[1px] flex-1 bg-[var(--border-color)]" />
        <span className="text-[10px] uppercase tracking-widest font-bold">Fim da {item.type}</span>
        <div className="h-[1px] flex-1 bg-[var(--border-color)]" />
      </div>
    </div>
  );
}