"use client";

import React, { useState, useEffect } from 'react';
import { useStore } from '@/src/store/useStore';
import { integrityService, IntegrityReport } from '../services/integrityService';
import { X, Copy, Terminal, AlertTriangle, Bug, RotateCw, User, Database, Layout, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function IntegrityMonitor() {
  const { auth, items, plans } = useStore();
  const [reports, setReports] = useState<IntegrityReport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  const runDiagnostic = async () => {
    if (!auth.user?.id) return;
    setIsScanning(true);
    try {
      const contentReports = await integrityService.runDeepScan('contents');
      const planReports = await integrityService.runDeepScan('plans');
      
      const allReports = [...contentReports, ...planReports];
      setReports(allReports);
      
      const dbPlanCount = planReports.find(r => r.strategy.includes('plans'))?.count || 0;
      setMismatch(dbPlanCount > 0 && plans.length === 0);
    } catch (err) {
      console.error("[IntegrityMonitor] Diagnostic failed", err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id && isOpen) {
      runDiagnostic();
    }
  }, [isOpen]);

  const hasCriticalError = reports.some(r => r.status === 'error') || mismatch;

  const copyToClipboard = () => {
    const logData = {
      user: auth.user,
      ui: { contents: items.length, plans: plans.length },
      db_reports: reports,
      timestamp: new Date().toISOString()
    };
    navigator.clipboard.writeText(JSON.stringify(logData, null, 2));
    alert('Logs de diagnóstico copiados!');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${
          hasCriticalError 
            ? "bg-red-500/10 border-red-500 text-red-500 animate-pulse" 
            : "bg-green-500/10 border-green-500/20 text-green-500"
        }`}
      >
        <Bug size={18} />
        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">
          {hasCriticalError ? "Erro" : "Monitor"}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden flex flex-col h-[80vh] relative z-10 shadow-2xl"
            >
              <div className="p-6 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-3 text-yellow-500 font-bold uppercase tracking-[0.2em]">
                  <Terminal size={20} />
                  Integridade de Dados
                </div>
                <div className="flex gap-2">
                  <button onClick={copyToClipboard} className="p-3 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
                    <Copy size={20} />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-3 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {mismatch && (
                <div className="bg-red-600 text-white p-4 flex items-center gap-4">
                  <ShieldAlert size={24} className="animate-bounce" />
                  <div>
                    h4 className="font-bold text-xs uppercase">Sincronização Interrompida</h4>
                    <p className="text-[10px] opacity-90">Dados no banco diferem do estado da aplicação.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800 border-b border-zinc-800">
                <MetricBox icon={<User size={14}/>} label="User" value={auth.isAuthenticated ? "OK" : "ERR"} status={auth.isAuthenticated ? "ok" : "err"} />
                <MetricBox icon={<Database size={14}/>} label="DB Plans" value={reports.find(r => r.strategy.includes('plans'))?.count.toString() || '0'} status="neutral" />
                <MetricBox icon={<Layout size={14}/>} label="UI Plans" value={plans.length.toString()} status={plans.length > 0 ? "ok" : "neutral"} />
                <MetricBox icon={<ShieldAlert size={14}/>} label="Admin" value={auth.user?.isAdmin ? "SIM" : "NÃO"} status={auth.user?.isAdmin ? "ok" : "err"} />
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {reports.map((report, idx) => (
                  <div key={idx} className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${report.status === 'success' ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{report.strategy}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">{report.latency.toFixed(1)}ms</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-zinc-800/50">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Count</span>
                      <span className="text-lg font-bold text-white">{report.count}</span>
                    </div>

                    {report.error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <div className="flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase mb-2">
                           <AlertTriangle size={14} /> {report.details}
                        </div>
                        <pre className="text-[9px] text-red-300 overflow-x-auto whitespace-pre-wrap font-mono">
                          {JSON.stringify(report.error, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-6 bg-zinc-900 border-t border-zinc-800">
                <button 
                  onClick={runDiagnostic} 
                  disabled={isScanning}
                  className="w-full py-5 bg-yellow-500 text-zinc-950 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isScanning ? <RotateCw className="animate-spin" size={20} /> : <RotateCw size={20}/>}
                  {isScanning ? "Escaneando..." : "Atualizar Diagnóstico"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function MetricBox({ icon, label, value, status }: { icon: any, label: string, value: string, status: 'ok' | 'err' | 'neutral' }) {
  return (
    <div className="bg-zinc-900 p-4 flex flex-col items-center justify-center gap-1">
      <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
        {icon} {label}
      </div>
      <div className={`text-xs font-bold ${status === 'ok' ? "text-green-500" : status === 'err' ? "text-red-500" : "text-zinc-300"}`}>
        {value}
      </div>
    </div>
  );
}