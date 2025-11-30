
import React, { useMemo } from 'react';
import { Bet, Currency, SportType } from '../types';
import { formatCurrency } from '../utils';

interface DashboardProps {
    user: string;
    initialBankroll: number;
    currentBankroll: number;
    currency: Currency;
    bets: Bet[];
    onNavigate: (mode: any) => void;
    exchangeRate?: number;
}

const PerformanceMatrix = ({ bets, currency, exchangeRate = 1 }: { bets: Bet[], currency: Currency, exchangeRate?: number }) => {
    const statsBySport = useMemo(() => {
        const stats: Record<string, { totalBets: number, won: number, invest: number, return: number }> = {};
        
        bets.forEach(b => {
            if (b.status !== 'won' && b.status !== 'lost') return;
            const sport = b.sport || 'OTHER';
            
            if (!stats[sport]) stats[sport] = { totalBets: 0, won: 0, invest: 0, return: 0 };
            
            const stake = b.stake * exchangeRate;
            stats[sport].totalBets++;
            stats[sport].invest += stake;
            
            if (b.status === 'won') {
                stats[sport].won++;
                stats[sport].return += (stake * b.odds);
            }
        });
        
        return stats;
    }, [bets, exchangeRate]);

    const sports = Object.keys(statsBySport);

    if (sports.length === 0) return null;

    return (
        <div className="mt-4 bg-slate-900 border border-slate-700 rounded-xl p-4">
             <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-3">Rendimiento por Deporte</h4>
             <div className="space-y-2">
                {sports.map(s => {
                    const st = statsBySport[s];
                    const profit = st.return - st.invest;
                    const roi = st.invest > 0 ? (profit / st.invest) * 100 : 0;
                    const winRate = (st.won / st.totalBets) * 100;
                    
                    return (
                        <div key={s} className="bg-slate-950 border border-slate-800 p-2 rounded flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                <span className="text-xs font-bold text-white">{s}</span>
                             </div>
                             <div className="text-right flex gap-3">
                                 <div>
                                     <div className="text-[8px] text-slate-500 uppercase">Win%</div>
                                     <div className="text-[10px] font-mono text-slate-300">{winRate.toFixed(0)}%</div>
                                 </div>
                                 <div>
                                     <div className="text-[8px] text-slate-500 uppercase">ROI</div>
                                     <div className={`text-[10px] font-mono font-bold ${roi > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{roi > 0 ? '+' : ''}{roi.toFixed(1)}%</div>
                                 </div>
                                 <div className="min-w-[50px]">
                                     <div className="text-[8px] text-slate-500 uppercase">Neto</div>
                                     <div className={`text-[10px] font-mono font-bold ${profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(profit, currency)}</div>
                                 </div>
                             </div>
                        </div>
                    )
                })}
             </div>
        </div>
    );
}

const EquityChart = ({ bets, initialBankroll, exchangeRate = 1 }: { bets: Bet[], initialBankroll: number, exchangeRate?: number }) => {
    const dataPoints = useMemo(() => {
        // initialBankroll ya viene convertido en la moneda display
        let current = initialBankroll; 
        const points = [{ x: 0, y: initialBankroll }]; // Start point
        
        // Sort bets by date/id ensures chronological order roughly
        const sorted = [...bets].sort((a, b) => parseInt(a.id) - parseInt(b.id));

        sorted.forEach((b, i) => {
            // Convertimos el stake y profit de cada apuesta (que está en USD) a la moneda actual
            const stake = b.stake * exchangeRate;
            
            if (b.status === 'won') current += (stake * b.odds) - stake;
            else if (b.status === 'lost') current -= stake;
            
            // Only add point if status changed
            if(b.status === 'won' || b.status === 'lost') {
                points.push({ x: i + 1, y: current });
            }
        });
        return points;
    }, [bets, initialBankroll, exchangeRate]);

    if (dataPoints.length < 2) return <div className="h-24 flex items-center justify-center text-xs text-slate-600 border border-slate-800 rounded-xl mt-4 bg-slate-900/50 italic">Registra apuestas resueltas para ver la gráfica.</div>;

    const maxY = Math.max(...dataPoints.map(p => p.y)) * 1.05;
    const minY = Math.min(...dataPoints.map(p => p.y)) * 0.95;
    const rangeY = maxY - minY || 10; // avoid divide by zero
    const maxX = dataPoints.length - 1 || 1;

    const normalizeX = (x: number) => (x / maxX) * 100;
    const normalizeY = (y: number) => 100 - ((y - minY) / rangeY) * 100;

    const pathD = `M ${dataPoints.map(p => `${normalizeX(p.x)} ${normalizeY(p.y)}`).join(' L ')}`;
    const areaD = `${pathD} L 100 100 L 0 100 Z`;

    const isPositive = dataPoints[dataPoints.length - 1].y >= initialBankroll;

    return (
        <div className="mt-4 bg-slate-900 border border-slate-700 rounded-xl p-4 overflow-hidden relative group">
            <div className="flex justify-between items-center mb-2 z-10 relative">
                <h4 className="text-[10px] font-bold uppercase text-slate-400">Curva de Equidad</h4>
                <span className={`text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {initialBankroll > 0 ? ((dataPoints[dataPoints.length - 1].y - initialBankroll) / initialBankroll * 100).toFixed(1) : 0}% Yield
                </span>
            </div>
            <div className="h-24 w-full relative">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={areaD} fill="url(#chartGradient)" />
                    <path d={pathD} fill="none" stroke={isPositive ? "#10b981" : "#ef4444"} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    {/* Start Line */}
                    <line x1="0" y1={normalizeY(initialBankroll)} x2="100" y2={normalizeY(initialBankroll)} stroke="#475569" strokeDasharray="4" strokeWidth="1" vectorEffect="non-scaling-stroke" opacity="0.5" />
                </svg>
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ user, initialBankroll, currentBankroll, currency, bets, onNavigate, exchangeRate = 1 }) => {
    const settled = bets.filter((b: Bet) => b.status === 'won' || b.status === 'lost');
    const won = settled.filter((b: Bet) => b.status === 'won');
    
    // Calcular métricas convirtiendo los valores base USD a la moneda actual
    const invest = settled.reduce((acc: number, b: Bet) => acc + (b.stake * exchangeRate), 0);
    const ret = settled.reduce((acc: number, b: Bet) => b.status === 'won' ? acc + ((b.stake * exchangeRate) * b.odds) : acc, 0);
    const profit = ret - invest;
    const roi = invest > 0 ? (profit / invest) * 100 : 0;

    return (
        <div className="animate-fade-in space-y-4">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h2 className="text-xl font-black text-white italic">HOLA, <span className="text-emerald-400 uppercase">{user}</span></h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Resumen Ejecutivo</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">ROI</div>
                    <div className={`text-xl font-black ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{roi > 0 ? '+' : ''}{roi.toFixed(1)}%</div>
                </div>
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Win Rate</div>
                    <div className="text-xl font-black text-blue-400">{settled.length > 0 ? ((won.length / settled.length) * 100).toFixed(0) : 0}%</div>
                </div>
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Neto</div>
                    <div className={`text-xl font-black ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(profit, currency)}</div>
                </div>
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Pendientes</div>
                    <div className="text-xl font-black text-yellow-400">{bets.filter((b: Bet) => b.status === 'pending').length}</div>
                </div>
            </div>

            <EquityChart bets={bets} initialBankroll={initialBankroll} exchangeRate={exchangeRate} />
            
            {/* NUEVA MATRIZ DE RENDIMIENTO */}
            <PerformanceMatrix bets={bets} currency={currency} exchangeRate={exchangeRate} />

            <button onClick={() => onNavigate('daily')} className="w-full bg-gradient-to-r from-indigo-900 to-blue-900 border border-indigo-500/30 p-4 rounded-xl flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <i className="fas fa-fire"></i>
                </div>
                <div className="text-left flex-1">
                    <div className="text-white font-bold text-sm">Picks del Día</div>
                    <div className="text-indigo-300 text-[10px]">Escáner de oportunidades +EV</div>
                </div>
                <i className="fas fa-chevron-right text-indigo-500/50"></i>
            </button>
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onNavigate('manual')} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col items-center gap-2 hover:border-emerald-500/50">
                    <i className="fas fa-search text-xl text-emerald-500"></i>
                    <span className="text-xs font-bold text-slate-300">Analizar</span>
                </button>
                <button onClick={() => onNavigate('image')} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col items-center gap-2 hover:border-emerald-500/50">
                    <i className="fas fa-camera text-xl text-emerald-500"></i>
                    <span className="text-xs font-bold text-slate-300">Escanear</span>
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
