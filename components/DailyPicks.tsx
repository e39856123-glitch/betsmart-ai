
import React, { useState } from 'react';
import { PickItem, SportType } from '../types';
import { getDailyPicks } from '../services/geminiService';

interface DailyPicksProps {
    onAnalyze: (e: string, m: string) => void;
}

const PickStatsDisplay = ({ stats }: { stats: NonNullable<PickItem['stats']> }) => (
    <div className="grid grid-cols-3 gap-px bg-slate-700/50 rounded-lg overflow-hidden border border-slate-700 mb-3">
        <div className="bg-slate-900/80 p-2 text-center flex flex-col justify-center">
             <div className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-1">Elo Rating</div>
             {stats.elo && (
                <>
                    <div className="flex justify-between text-[8px] text-slate-600 px-2">
                        <span>{stats.elo.home}</span><span>{stats.elo.away}</span>
                    </div>
                    <div className={`text-xs font-mono font-bold ${stats.elo.diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stats.elo.diff > 0 ? '+' : ''}{stats.elo.diff}
                    </div>
                </>
             )}
        </div>
        <div className="bg-slate-900/80 p-2 text-center flex flex-col justify-center">
             <div className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-1">xG (5 Games)</div>
             {stats.xg && (
                 <div className="text-xs font-mono font-bold text-white tracking-wide">
                    {stats.xg.home} <span className="text-slate-600">vs</span> {stats.xg.away}
                 </div>
             )}
        </div>
        <div className="bg-slate-900/80 p-2 text-center flex flex-col justify-center">
             <div className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-1">Poisson Proj.</div>
             {stats.poisson && (
                 <div className="text-xs font-mono font-bold text-blue-400 tracking-wide">
                    {stats.poisson.home} - {stats.poisson.away}
                 </div>
             )}
        </div>
    </div>
);

const RiskMeter = ({ category }: { category: string }) => {
    let level = 1;
    let color = 'bg-blue-500';
    let text = 'RIESGO BAJO';

    if (category === 'VALUE') { level = 2; color = 'bg-emerald-500'; text = 'RIESGO MEDIO'; }
    if (category === 'HIGH_YIELD') { level = 3; color = 'bg-purple-500'; text = 'RIESGO ALTO'; }

    return (
        <div className="flex flex-col gap-1 mb-2">
            <div className="flex justify-between items-center">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Perfil de Riesgo</span>
                <span className={`text-[8px] font-bold ${category === 'HIGH_YIELD' ? 'text-purple-400' : category === 'VALUE' ? 'text-emerald-400' : 'text-blue-400'}`}>{text}</span>
            </div>
            <div className="flex gap-1 h-1.5">
                <div className={`flex-1 rounded-l-full ${level >= 1 ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
                <div className={`flex-1 ${level >= 2 ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
                <div className={`flex-1 rounded-r-full ${level >= 3 ? 'bg-purple-500' : 'bg-slate-800'}`}></div>
            </div>
        </div>
    );
};

const WinProbGauge = ({ prob }: { prob: number }) => {
    const color = prob >= 70 ? 'text-emerald-400' : prob >= 55 ? 'text-blue-400' : 'text-yellow-400';
    const borderColor = prob >= 70 ? 'border-emerald-500' : prob >= 55 ? 'border-blue-500' : 'border-yellow-500';
    
    return (
        <div className={`flex flex-col items-center justify-center border-2 ${borderColor} rounded-full w-14 h-14 bg-slate-900/50 shadow-lg`}>
            <span className={`text-sm font-black ${color}`}>{prob}%</span>
            <span className="text-[6px] text-slate-400 uppercase font-bold">Win Prob</span>
        </div>
    );
};

const DailyPicks: React.FC<DailyPicksProps> = ({ onAnalyze }) => {
    const [picks, setPicks] = useState<PickItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [visibleCount, setVisibleCount] = useState(5);
    const [error, setError] = useState<string | null>(null);

    // FUNCIÓN DE PARSEO DE FECHA ROBUSTA
    // Asegura que si la fecha ISO no tiene zona horaria, se trate como UTC ('Z')
    // para evitar que el navegador la interprete como local y desfase el horario.
    const parseDateSafe = (dateStr: string) => {
        if (!dateStr) return new Date();
        let safeStr = dateStr.trim();
        // Si parece ISO (tiene T) pero no tiene Z ni offset, añadir Z
        if (safeStr.includes('T') && !safeStr.endsWith('Z') && !safeStr.includes('+') && !safeStr.split('T')[1].includes('-')) {
            safeStr += 'Z';
        }
        return new Date(safeStr);
    };

    const fetchPicks = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getDailyPicks();
            
            const now = Date.now();
            const durationBuffer = 3 * 60 * 60 * 1000; // 3 horas

            const sortedData = [...data].sort((a, b) => {
                const timeA = parseDateSafe(a.startTime).getTime();
                const timeB = parseDateSafe(b.startTime).getTime();
                
                if (isNaN(timeA)) return 1;
                if (isNaN(timeB)) return -1;

                const isFinishedA = timeA < (now - durationBuffer);
                const isFinishedB = timeB < (now - durationBuffer);

                if (isFinishedA && !isFinishedB) return 1;
                if (!isFinishedA && isFinishedB) return -1;

                return timeA - timeB;
            });

            setPicks(sortedData);
            setVisibleCount(5);
        } catch (e: any) {
            console.error("Daily Picks Error", e);
            if (e.message?.includes('429') || JSON.stringify(e).includes('RESOURCE_EXHAUSTED')) {
                setError("⚠️ Límite de Cuota de API Excedido. El sistema está en pausa. Intenta más tarde.");
            } else {
                setError("Error de conexión con el sistema de análisis.");
            }
        } finally {
            setLoading(false);
        }
    };

    const formatMatchTime = (isoString: string) => {
        try {
            const date = parseDateSafe(isoString);
            return date.toLocaleString('es-ES', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short',
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return isoString;
        }
    };

    const getMatchStatus = (isoString: string): 'FUTURE' | 'LIVE' | 'FINISHED' => {
        try {
            const start = parseDateSafe(isoString).getTime();
            const now = Date.now();
            const durationBuffer = 4 * 60 * 60 * 1000; // 4h

            if (now < start) return 'FUTURE';
            if (now >= start && now < (start + durationBuffer)) return 'LIVE';
            return 'FINISHED';
        } catch {
            return 'FUTURE';
        }
    };

    const getSportIcon = (sport: SportType) => {
        switch(sport) {
            case 'SOCCER': return 'fa-futbol';
            case 'NBA': return 'fa-basketball-ball';
            case 'TENNIS': return 'fa-table-tennis';
            case 'MLB': return 'fa-baseball-ball';
            default: return 'fa-medal';
        }
    };

    const visiblePicks = picks.slice(0, visibleCount);

    return (
        <div className="space-y-4 animate-fade-in pb-20">
            <div className="bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-2xl relative overflow-hidden">
                <i className="fas fa-network-wired absolute right-[-10px] bottom-[-10px] text-8xl text-indigo-500/10"></i>
                <h2 className="text-xl font-bold text-white relative z-10">Generador de Sistemas</h2>
                <p className="text-xs text-indigo-300 mb-4 relative z-10">Algoritmos de Parlays Correlacionados y Value Bets.</p>
                <button onClick={fetchPicks} disabled={loading} className="relative z-10 bg-white hover:bg-indigo-50 text-indigo-900 px-4 py-3 rounded-lg font-bold text-sm shadow-lg w-full transition-colors flex justify-center items-center gap-2">
                    {loading ? <><i className="fas fa-spin fa-circle-notch"></i> Analizando Estrategias...</> : <><i className="fas fa-magic"></i> Generar Picks Maestros</>}
                </button>
                {error && (
                    <div className="relative z-10 mt-3 bg-red-900/80 border border-red-500/50 p-2 rounded text-xs text-red-200 font-bold text-center animate-fade-in">
                        {error}
                    </div>
                )}
            </div>
            
            {visiblePicks.map((p, i) => {
                const status = getMatchStatus(p.startTime);
                const edge = p.edge || (p.fairOdds ? ((p.odds - p.fairOdds)/p.fairOdds)*100 : 0);
                const sport = p.sport || 'OTHER';
                
                const categoryColor = p.category === 'BANKER' ? 'blue' : p.category === 'HIGH_YIELD' ? 'purple' : 'emerald';
                const borderColor = `border-${categoryColor}-500/30`;
                const shadowColor = `shadow-${categoryColor}-900/10`;
                const bgColor = status === 'FINISHED' ? 'bg-slate-800' : `bg-${categoryColor}-900/20`;

                let strategySubtitle = "Oportunidad Estándar";
                if(p.category === 'BANKER') strategySubtitle = "Alta Seguridad / Constructor de Bankroll";
                if(p.category === 'VALUE') strategySubtitle = "Ventaja Matemática (+EV)";
                if(p.category === 'HIGH_YIELD') strategySubtitle = "Alta Volatilidad / Lotería";

                return (
                    <div key={i} className={`bg-slate-900 border p-0 rounded-xl relative overflow-hidden ${borderColor} ${shadowColor} shadow-lg transition-transform hover:scale-[1.01]`}>
                        
                        <div className={`px-4 py-3 flex justify-between items-center ${status === 'LIVE' ? 'bg-orange-900/50 animate-pulse' : bgColor}`}>
                            <div className="flex flex-col">
                                <span className={`text-[12px] font-black uppercase tracking-widest text-${categoryColor}-400`}>
                                    {p.category === 'BANKER' ? '🛡️ BANKER (SEGURA)' : p.category === 'VALUE' ? '⚖️ VALUE (+EV)' : '🚀 HIGH YIELD'}
                                </span>
                                <span className="text-[9px] text-slate-300 font-medium opacity-80">{strategySubtitle}</span>
                                
                                {status === 'LIVE' ? (
                                    <span className="text-[9px] font-bold text-orange-400 mt-1 animate-pulse">🔴 EN JUEGO</span>
                                ) : status === 'FINISHED' ? (
                                    <span className="text-[9px] font-bold text-slate-500 mt-1">🏁 FINALIZADO • {formatMatchTime(p.startTime)}</span>
                                ) : (
                                    <span className="text-[9px] font-bold text-white mt-1 flex items-center gap-1">
                                        <i className="far fa-clock text-slate-400"></i> {formatMatchTime(p.startTime)} <span className="text-slate-500 text-[8px]">(Tu Hora)</span>
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                 <div className="flex items-center gap-2">
                                     <span className="text-[9px] font-bold bg-slate-950/40 text-slate-300 px-1.5 py-0.5 rounded border border-white/5 flex items-center gap-1">
                                        <i className={`fas ${getSportIcon(sport)} text-[8px]`}></i> {sport}
                                     </span>
                                 </div>
                                 <span className="text-sm font-black text-white bg-slate-950/50 px-2 py-0.5 rounded border border-white/10 shadow-lg">
                                    @{p.odds.toFixed(2)}
                                 </span>
                            </div>
                        </div>

                        <div className="p-4">
                            
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 pr-2">
                                    <RiskMeter category={p.category} />
                                    <div className="mt-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase">Estrategia:</span>
                                            <span className="text-[9px] font-bold bg-slate-800 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
                                                {p.bettingMethod || "Standard Unit"}
                                            </span>
                                        </div>
                                        {p.probabilityRationale && (
                                            <div className="text-[8px] text-slate-400 italic leading-tight">
                                                {p.probabilityRationale}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <WinProbGauge prob={p.winProb} />
                            </div>

                            {edge > 0 && (
                                <div className="mb-3 flex items-center gap-2 bg-slate-950/30 p-1.5 rounded border border-emerald-500/20">
                                    <i className="fas fa-chart-line text-emerald-500 text-xs ml-1"></i>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Ventaja (Edge):</div>
                                    <div className="text-xs font-black text-emerald-400">+{edge.toFixed(1)}%</div>
                                </div>
                            )}

                            {p.type === 'PARLAY' && p.legs ? (
                                <div className="space-y-2 mb-3">
                                    <div className="text-[9px] font-bold text-purple-400 uppercase tracking-wider mb-1">Estructura Combinada:</div>
                                    {p.legs.map((leg, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-800">
                                            <div>
                                                <div className="text-xs font-bold text-slate-200">{leg.event}</div>
                                                <div className="text-[10px] text-slate-400">{leg.selection}</div>
                                            </div>
                                            <div className="text-xs font-mono text-slate-500">@{leg.odds}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mb-3">
                                    <h3 className="font-bold text-white text-sm">{p.event}</h3>
                                    <p className="text-xs text-emerald-400 font-bold mb-1">{p.market}</p>
                                </div>
                            )}

                            {p.stats && <PickStatsDisplay stats={p.stats} />}

                            {p.algorithmLog && (
                                <div className="mb-3 bg-indigo-900/20 border border-indigo-500/20 p-2 rounded text-[10px] text-indigo-300 font-mono">
                                    <div className="text-[8px] font-bold text-indigo-500 uppercase mb-1">⚡ Lógica Algorítmica:</div>
                                    {p.algorithmLog}
                                </div>
                            )}

                            <div className="bg-slate-800/50 p-2 rounded text-[10px] text-slate-300 italic mb-3 border-l-2 border-slate-600">
                                "{p.rationale}"
                            </div>

                            <button onClick={() => onAnalyze(p.event, p.market)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 flex justify-center items-center gap-2 transition-colors">
                                <i className="fas fa-microscope"></i> Analizar a Fondo
                            </button>
                        </div>
                    </div>
                );
            })}

            {picks.length > visibleCount && (
                <button 
                    onClick={() => setVisibleCount(prev => prev + 5)}
                    className="w-full bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 text-slate-400 hover:text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg flex flex-col items-center gap-1 transition-all"
                >
                    <span>Cargar más estrategias</span>
                    <i className="fas fa-chevron-down"></i>
                </button>
            )}
        </div>
    );
};

export default DailyPicks;
