'use client';

import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Wallet, Settings, Play, RefreshCcw, 
  Info, CheckCircle, PieChart, BarChart3, Printer, 
  X, Briefcase, AlertTriangle, ArrowRight, Lightbulb
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// === UTILS ===
function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// === TYPES ===
interface HistoryPoint { date: string; price: number; }
interface StockResult {
  id: string; name: string; price: number;
  c1_per: number; c2_pbv: number; c3_roe: number; c4_rsi: number; c5_volume: number;
  analysis: string; topsis_score: number;
  alloc_money: number; alloc_lots: number; is_recommended: boolean;
  history: HistoryPoint[];
}

export default function UltimateDashboard() {
  // === STATE ===
  const [capital, setCapital] = useState(10000000);
  const [weights, setWeights] = useState({ per: 30, pbv: 10, roe: 20, rsi: 20, volume: 20 });
  const [results, setResults] = useState<StockResult[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // State UI
  const [selectedStock, setSelectedStock] = useState<StockResult | null>(null);
  const [viewMode, setViewMode] = useState<'portfolio' | 'market'>('portfolio');

  // === HANDLER: FORMAT RUPIAH INPUT ===
  const handleCapitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Ambil value mentah, buang semua karakter selain angka
    const rawValue = e.target.value.replace(/\D/g, '');
    
    // 2. Simpan sebagai number di state (untuk dikirim ke backend)
    // Jika kosong, set 0
    setCapital(rawValue ? parseInt(rawValue) : 0);
  };

  // === HELPER: CAPITAL ADVICE (PENJELASAN MODAL) ===
  const getCapitalAdvice = (amount: number) => {
    if (amount < 1000000) {
      return {
        title: "Modal Pembelajaran",
        desc: "Fokus pada saham 'Second Liner' atau Fractional untuk belajar volatilitas pasar tanpa risiko besar.",
        color: "text-slate-400",
        bg: "bg-slate-800"
      };
    } else if (amount < 10000000) {
      return {
        title: "Portfolio Pemula",
        desc: "Cukup untuk diversifikasi ke 2-3 sektor berbeda. Prioritaskan saham LQ45 harga < 5.000/lembar.",
        color: "text-blue-400",
        bg: "bg-blue-900/20"
      };
    } else if (amount < 50000000) {
      return {
        title: "Portfolio Pertumbuhan",
        desc: "Ideal untuk membangun pondasi kuat. Anda bisa mulai mengakumulasi saham 'Big Banks' (BBCA/BBRI).",
        color: "text-emerald-400",
        bg: "bg-emerald-900/20"
      };
    } else {
      return {
        title: "Portfolio High-End",
        desc: "Fokus pada Manajemen Risiko & Dividen. Alokasi modal Anda sangat kuat untuk strategi jangka panjang.",
        color: "text-purple-400",
        bg: "bg-purple-900/20"
      };
    }
  };

  const advice = getCapitalAdvice(capital);

  // === ACTIONS ===
  const runAnalysis = async () => {
    setLoading(true);
    try {
      const payload = {
        capital, 
        w_per: weights.per, w_pbv: weights.pbv, w_roe: weights.roe, 
        w_rsi: weights.rsi, w_volume: weights.volume
      };
      const res = await axios.post('https://zmzari-topsis-stock-system.hf.space/analyze-custom', payload);
      setResults(res.data.data);
      setMeta(res.data);
      setViewMode('portfolio');
    } catch (err) {
      console.error(err);
      alert("Gagal koneksi. Pastikan Backend Python (main.py) sudah jalan!");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // === FORMATTERS ===
  const fmtIDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
  const fmtNum = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(n);

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 font-sans selection:bg-blue-500/30 print:bg-white print:text-black">
      
      {/* === NAVBAR === */}
      <nav className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Quantum<span className="text-blue-500">Edge</span></h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Ultimate SPK System</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-400">
             <span className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-full border border-white/5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> System Live
             </span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
        
        {/* === LEFT PANEL: CONTROL === */}
        <aside className="lg:col-span-4 space-y-6 print:hidden">
          
          {/* 1. INPUT MODAL (UPDATED FITUR BARU) */}
          <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all hover:border-blue-500/30">
            <h2 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
              <Wallet size={14}/> 1. Modal Investasi
            </h2>
            
            {/* Input dengan Auto-Format */}
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
              <input 
                type="text" 
                value={capital.toLocaleString('id-ID')} // Tampilkan dengan format 1.000.000
                onChange={handleCapitalChange}
                className="w-full bg-[#09090b] border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white font-mono text-xl font-bold outline-none focus:border-blue-500 transition-colors shadow-inner"
                placeholder="0"
              />
            </div>

            {/* AI Insight / Penjelasan Modal */}
            <motion.div 
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               key={advice.title} 
               className={cn("p-4 rounded-xl border border-white/5 flex gap-3", advice.bg)}
            >
               <div className="mt-1">
                 <Lightbulb size={18} className={advice.color} />
               </div>
               <div>
                  <h4 className={cn("text-xs font-bold uppercase mb-1", advice.color)}>
                     {advice.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                     {advice.desc}
                  </p>
               </div>
            </motion.div>
          </div>

          {/* 2. SLIDER STRATEGI */}
          <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2"><Settings size={14}/> 2. Strategi TOPSIS</h2>
               <button onClick={() => setWeights({ per: 30, pbv: 10, roe: 20, rsi: 20, volume: 20 })} className="text-[10px] text-blue-400 underline">Reset</button>
            </div>
            
            <div className="space-y-5">
              {[
                { id: 'per', label: 'Valuasi Murah (PER)', color: 'accent-blue-500', desc: 'Fundamental' },
                { id: 'pbv', label: 'Aset Murah (PBV)', color: 'accent-cyan-500', desc: 'Fundamental' },
                { id: 'roe', label: 'Profit Tinggi (ROE)', color: 'accent-emerald-500', desc: 'Bisnis' },
                { id: 'rsi', label: 'Tren Naik (RSI)', color: 'accent-purple-500', desc: 'Teknikal' },
                { id: 'volume', label: 'Pasar Ramai (Vol)', color: 'accent-orange-500', desc: 'Teknikal' },
              ].map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between text-xs mb-1 text-slate-300">
                    <span className="flex flex-col">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-[8px] text-slate-500 uppercase">{item.desc}</span>
                    </span>
                    <span className="font-bold bg-slate-800 px-2 py-0.5 rounded h-fit">{weights[item.id as keyof typeof weights]}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" step="5"
                    value={weights[item.id as keyof typeof weights]}
                    onChange={(e) => setWeights(prev => ({...prev, [item.id]: parseInt(e.target.value)}))}
                    className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${item.color}`}
                  />
                </div>
              ))}
            </div>
            
            <button 
              onClick={runAnalysis} disabled={loading}
              className="mt-8 w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <RefreshCcw className="animate-spin"/> : <Play fill="currentColor"/>}
              {loading ? 'Menganalisis...' : 'Generate Portofolio'}
            </button>
          </div>
        </aside>

        {/* === RIGHT PANEL: RESULTS === */}
        <section className="lg:col-span-8 space-y-6 print:w-full">
          
          {/* HEADER LAPORAN */}
          {(results.length > 0) && (
            <div className="flex flex-col md:flex-row justify-between items-center bg-[#18181b] p-4 rounded-xl border border-white/5 print:bg-white print:border-black print:mb-4">
              <div>
                <h2 className="text-xl font-bold text-white print:text-black">Laporan Rekomendasi Investasi</h2>
                <p className="text-xs text-slate-400 print:text-gray-600">Generated by QuantumEdge SPK • {meta?.timestamp}</p>
              </div>
              
              <div className="flex gap-2 mt-4 md:mt-0 print:hidden">
                 <div className="bg-black/30 p-1 rounded-lg border border-white/5 flex">
                    <button 
                      onClick={() => setViewMode('portfolio')}
                      className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", viewMode === 'portfolio' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}
                    >
                      Portofolio
                    </button>
                    <button 
                      onClick={() => setViewMode('market')}
                      className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", viewMode === 'market' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}
                    >
                      Data Lengkap
                    </button>
                 </div>
                 <button onClick={handlePrint} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border border-white/5">
                    <Printer size={16}/> Cetak PDF
                 </button>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {results.length === 0 && !loading && (
            <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-600 bg-[#09090b]/50">
              <BarChart3 size={48} className="mb-4 opacity-30"/>
              <p className="font-bold">Sistem Siap Digunakan</p>
              <p className="text-xs text-slate-500 mt-2">Atur modal & strategi di panel kiri, lalu klik Generate.</p>
            </div>
          )}

          {/* LOADING STATE */}
          {loading && (
            <div className="h-[400px] flex items-center justify-center rounded-3xl bg-[#18181b]/50 backdrop-blur">
               <div className="flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4 shadow-[0_0_30px_rgba(59,130,246,0.2)]"/>
                  <span className="text-white font-bold animate-pulse">Mengambil Data Historis IDX...</span>
                  <span className="text-xs text-slate-500 mt-1">Menghitung Alokasi & Skor TOPSIS</span>
               </div>
            </div>
          )}

          {/* MODE PORTOFOLIO (KARTU) */}
          {results.length > 0 && !loading && viewMode === 'portfolio' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3 print:border-gray-300 print:bg-gray-50">
                 <AlertTriangle size={18} className="text-yellow-500 shrink-0 print:text-black"/>
                 <p className="text-xs text-yellow-200/80 leading-relaxed print:text-black">
                    Sistem ini merekomendasikan pembelian berdasarkan skor tertinggi. Klik pada kartu saham untuk melihat <strong>Grafik Harga & Analisis Detail</strong>.
                 </p>
              </div>

              {results.filter(r => r.is_recommended).map((stock, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                  key={stock.id}
                  onClick={() => setSelectedStock(stock)}
                  className="bg-[#09090b] border border-slate-800 hover:border-blue-500/50 p-5 rounded-xl cursor-pointer group transition-all relative overflow-hidden print:border-gray-300 print:bg-white print:text-black print:break-inside-avoid"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>

                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="w-12 h-12 bg-blue-900/20 text-blue-400 rounded-full flex items-center justify-center font-bold text-lg border border-blue-500/20 print:bg-gray-200 print:text-black print:border-gray-400">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors print:text-black">{stock.id}</h3>
                           <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 print:hidden">{stock.name}</span>
                        </div>
                        <p className="text-xs text-blue-300/80 mt-1 flex items-center gap-1 print:text-gray-600">
                           <Info size={12}/> {stock.analysis.split('|')[0]}
                        </p>
                      </div>
                    </div>

                    <div className="print:hidden bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700">
                       <span className="text-[10px] text-slate-400 uppercase font-bold block text-center">TOPSIS Score</span>
                       <span className="text-sm font-mono font-bold text-blue-400">{stock.topsis_score.toFixed(4)}</span>
                    </div>

                    <div className="flex items-center gap-4 text-right bg-[#18181b] p-2 rounded-lg border border-white/5 print:bg-gray-100 print:border-gray-300">
                       <div className="px-2">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Target Lot</span>
                          <span className="text-xl font-black text-white print:text-black">{stock.alloc_lots}</span>
                       </div>
                       <div className="border-l border-slate-700 pl-4 px-2 print:border-gray-300">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Investasi</span>
                          <span className="text-sm font-mono font-bold text-blue-400 print:text-black">{fmtIDR(stock.alloc_money)}</span>
                       </div>
                       <div className="pr-2 print:hidden">
                          <ArrowRight size={16} className="text-slate-600 group-hover:text-white transition-colors"/>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* MODE MARKET (TABEL) */}
          {results.length > 0 && !loading && viewMode === 'market' && (
             <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden shadow-xl animate-in fade-in">
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                      <thead>
                         <tr className="bg-[#09090b] text-slate-500 text-xs uppercase border-b border-slate-800">
                            <th className="p-4 font-bold">Rank</th>
                            <th className="p-4 font-bold">Emiten</th>
                            <th className="p-4 font-bold text-right text-blue-500">Skor</th>
                            <th className="p-4 font-bold text-right">Harga</th>
                            <th className="p-4 font-bold text-right">PER</th>
                            <th className="p-4 font-bold text-right">ROE</th>
                            <th className="p-4 font-bold text-right">RSI</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                         {results.map((stock, idx) => (
                            <tr key={stock.id} onClick={() => setSelectedStock(stock)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                               <td className="p-4 text-center font-mono text-slate-500">#{idx + 1}</td>
                               <td className="p-4 font-bold text-white group-hover:text-blue-400 transition-colors">{stock.id}</td>
                               <td className="p-4 text-right font-mono font-bold text-blue-400">{stock.topsis_score.toFixed(4)}</td>
                               <td className="p-4 text-right font-mono text-slate-300">{fmtIDR(stock.price)}</td>
                               <td className={cn("p-4 text-right font-mono", stock.c1_per < 15 ? "text-emerald-400 font-bold" : "text-slate-400")}>{fmtNum(stock.c1_per)}</td>
                               <td className={cn("p-4 text-right font-mono", stock.c3_roe > 15 ? "text-emerald-400 font-bold" : "text-slate-400")}>{fmtNum(stock.c3_roe)}</td>
                               <td className={cn("p-4 text-right font-mono", stock.c4_rsi < 30 ? "text-emerald-400" : stock.c4_rsi > 70 ? "text-rose-400" : "text-slate-400")}>{fmtNum(stock.c4_rsi)}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {/* TABEL PRINT ONLY */}
          <div className="hidden print:block mt-8 pt-8 border-t border-gray-300">
             <h3 className="font-bold text-black mb-2 text-sm uppercase">Lampiran Data Analisis</h3>
             <table className="w-full text-xs text-left border-collapse border border-gray-300">
                <thead>
                   <tr className="bg-gray-100">
                      <th className="p-1 border text-center">No</th>
                      <th className="p-1 border">Saham</th>
                      <th className="p-1 border text-right">Harga</th>
                      <th className="p-1 border text-right">Skor</th>
                      <th className="p-1 border text-right">PER</th>
                      <th className="p-1 border text-right">ROE</th>
                      <th className="p-1 border text-right">RSI</th>
                      <th className="p-1 border text-right">Rek. Lot</th>
                   </tr>
                </thead>
                <tbody>
                   {results.map((r, i) => (
                      <tr key={r.id}>
                         <td className="p-1 border text-center">{i + 1}</td>
                         <td className="p-1 border font-bold">{r.id}</td>
                         <td className="p-1 border text-right">{fmtIDR(r.price)}</td>
                         <td className="p-1 border text-right">{r.topsis_score.toFixed(3)}</td>
                         <td className="p-1 border text-right">{fmtNum(r.c1_per)}</td>
                         <td className="p-1 border text-right">{fmtNum(r.c3_roe)}</td>
                         <td className="p-1 border text-right">{fmtNum(r.c4_rsi)}</td>
                         <td className="p-1 border text-right">{r.alloc_lots}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>

        </section>
      </main>

      {/* === MODAL POPUP GRAFIK === */}
      <AnimatePresence>
        {selectedStock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden" onClick={() => setSelectedStock(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#18181b] border border-slate-700 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-[#09090b]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                     {selectedStock.id.substring(0,1)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      {selectedStock.id} <CheckCircle size={18} className="text-blue-500 fill-blue-500/20"/>
                    </h2>
                    <p className="text-sm text-slate-400">{selectedStock.name}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStock(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                  <X size={24} className="text-slate-400"/>
                </button>
              </div>
              
              <div className="p-6">
                 <div className="h-[250px] w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={selectedStock.history}>
                          <defs>
                             <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false}/>
                          <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false}/>
                          <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{fontSize: 10}} tickFormatter={(val)=>`${(val/1000).toFixed(0)}k`} tickLine={false} axisLine={false}/>
                          <Tooltip 
                            contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff'}}
                            itemStyle={{color: '#60a5fa'}}
                            formatter={(val: any) => [fmtIDR(Number(val)), 'Harga']}
                          />
                          <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                       <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><Briefcase size={12}/> Analisis Fundamental</h4>
                       <ul className="text-sm text-slate-300 space-y-1">
                          <li className="flex justify-between"><span>PER:</span> <span className={selectedStock.c1_per < 15 ? "text-emerald-400 font-bold" : "text-slate-400"}>{fmtNum(selectedStock.c1_per)}x</span></li>
                          <li className="flex justify-between"><span>PBV:</span> <span className="text-slate-400">{fmtNum(selectedStock.c2_pbv)}x</span></li>
                          <li className="flex justify-between"><span>ROE:</span> <span className={selectedStock.c3_roe > 15 ? "text-emerald-400 font-bold" : "text-slate-400"}>{fmtNum(selectedStock.c3_roe)}%</span></li>
                       </ul>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                       <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><TrendingUp size={12}/> Analisis Teknikal</h4>
                       <ul className="text-sm text-slate-300 space-y-1">
                          <li className="flex justify-between"><span>RSI (14):</span> <span className={selectedStock.c4_rsi < 30 ? "text-emerald-400" : selectedStock.c4_rsi > 70 ? "text-rose-400" : "text-slate-400"}>{fmtNum(selectedStock.c4_rsi)}</span></li>
                          <li className="flex justify-between"><span>Volume:</span> <span className="text-slate-400">{(selectedStock.c5_volume / 1000000).toFixed(1)} Juta</span></li>
                          <li className="flex justify-between border-t border-slate-700 pt-1 mt-1"><span>Skor TOPSIS:</span> <span className="text-blue-400 font-bold">{selectedStock.topsis_score.toFixed(4)}</span></li>
                       </ul>
                    </div>
                 </div>
                 
                 <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg text-center">
                    <p className="text-sm text-blue-200">
                       Disarankan membeli <strong>{selectedStock.alloc_lots} Lot</strong> senilai <strong>{fmtIDR(selectedStock.alloc_money)}</strong>
                    </p>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}