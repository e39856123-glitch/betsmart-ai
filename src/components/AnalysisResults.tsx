
import React, { useState } from 'react';
import { ExtractedData } from '../types';
import { TRUSTED_SOURCES } from '../constants';

export const BetSlipCard = ({ data }: { data: ExtractedData }) => {
    const [copied, setCopied] = useState(false);
    
    // Si tenemos selecciones detalladas (ej. del OCR), las mostramos de forma desglosada
    const hasDetailedSelections = data.extractedSelections && data.extractedSelections.length > 0;

    if (data.verdict === 'PASS' || (!data.ticketSelection && !hasDetailedSelections)) return null;

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 animate-slide-up">
            <div className="bg-emerald-600 p-2 flex justify-between items-center text-white px-4">
                <span className="font-bold text-xs uppercase tracking-wider">
                    {hasDetailedSelections ? 'Boleto Escaneado' : 'Boleto Óptimo'}
                </span>
                <i className="fas fa-ticket-alt"></i>
            </div>
            <div className="p-4">
                {hasDetailedSelections ? (
                    <div className="space-y-2 mb-4">
                        {data.extractedSelections!.map((sel, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-2 flex justify-between items-center">
                                <div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase">{sel.event}</div>
                                    <div className="text-sm font-bold text-slate-800">{sel.selection} <span className="text-[10px] text-slate-400 font-normal">({sel.market})</span></div>
                                </div>
                                <div className="font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded">@{sel.odds}</div>
                            </div>
                        ))}
                         <div className="mt-2 text-[10px] text-slate-500 italic text-right">
                            Total Odds: <strong className="text-slate-700">@{data.userOdds}</strong>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => { navigator.clipboard.writeText(data.ticketSelection || ""); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-all group"
                    >
                        <span className="font-black text-slate-800 text-lg">{data.ticketSelection}</span>
                        <i className={`fas ${copied ? 'fa-check text-emerald-500' : 'fa-copy text-slate-400'} group-hover:scale-110 transition-transform`}></i>
                    </div>
                )}
                
                {data.ticketPath && <div className="mt-2 text-[10px] text-slate-500 font-mono bg-slate-50 p-1 rounded px-2">{data.ticketPath}</div>}
                <div className="flex gap-4 mt-3 pt-3 border-t border-slate-200">
                    <div className="flex-1"><p className="text-[10px] uppercase text-slate-500 font-bold">Cuota Total</p><p className="text-xl font-black text-slate-800">@{data.userOdds}</p></div>
                    <div className="flex-1"><p className="text-[10px] uppercase text-slate-500 font-bold">Confianza</p><p className="text-xl font-black text-slate-800">{data.confidenceScore}<span className="text-xs text-slate-400">/10</span></p></div>
                </div>
            </div>
        </div>
    );
};

export const VerdictCard = ({ data }: { data: ExtractedData }) => {
    if (!data.verdict) return null;
    const isBuy = data.verdict === 'BUY';
    const isPass = data.verdict === 'PASS';
    const bgClass = isBuy ? 'bg-emerald-900/30 border-emerald-500/50' : isPass ? 'bg-red-900/30 border-red-500/50' : 'bg-yellow-900/30 border-yellow-500/50';
    const textClass = isBuy ? 'text-emerald-400' : isPass ? 'text-red-400' : 'text-yellow-400';

    const isTrustedSource = (sourceStr: string) => {
        const allTrusted = Object.values(TRUSTED_SOURCES).flat();
        return allTrusted.some(trusted => sourceStr.toLowerCase().includes(trusted.split('.')[0])); 
    };

    return (
        <div className={`rounded-xl border p-4 mb-6 backdrop-blur-sm ${bgClass} animate-slide-up`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <i className={`fas ${isBuy ? 'fa-check-circle' : isPass ? 'fa-ban' : 'fa-exclamation-triangle'} text-3xl ${textClass}`}></i>
                    <div>
                        <h2 className={`text-xl font-black uppercase ${textClass}`}>{data.verdict === 'BUY' ? 'APROBADO (BUY)' : data.verdict === 'PASS' ? 'DESCARTAR' : 'PRECAUCIÓN'}</h2>
                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Análisis Cuantitativo</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-white">{data.evPercentage ? (data.evPercentage > 0 ? `+${data.evPercentage}%` : `${data.evPercentage}%`) : '--'}</div>
                    <p className="text-[9px] text-slate-400 uppercase">EV (Valor)</p>
                </div>
            </div>
            
            {/* NUEVO: SENTIMIENTO DE MERCADO MEJORADO (RLM + MONEY vs TICKETS) */}
            {data.marketSentiment && (
                <div className="mb-4 bg-slate-950/50 p-3 rounded border border-slate-700 shadow-inner">
                    <div className="flex justify-between items-center mb-2">
                         <div className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                            <i className="fas fa-users"></i> Market Bias
                         </div>
                         {data.marketSentiment.rlmDetected && (
                             <span className="text-[9px] font-bold bg-yellow-600 text-white px-2 py-0.5 rounded animate-pulse">
                                 ⚠️ REVERSE LINE MOVEMENT
                             </span>
                         )}
                    </div>
                    
                    {/* Visualización de Money vs Tickets */}
                    <div className="space-y-2 mb-3">
                        {/* Tickets Bar */}
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-bold text-slate-400 w-10">TICKETS</span>
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    style={{width: `${data.marketSentiment.ticketPercent || data.marketSentiment.publicPercent}%`}} 
                                    className="h-full bg-blue-500 rounded-full"
                                ></div>
                            </div>
                            <span className="text-[9px] text-blue-400 font-mono w-8 text-right">{data.marketSentiment.ticketPercent || data.marketSentiment.publicPercent}%</span>
                        </div>
                        
                        {/* Money Bar */}
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-bold text-slate-400 w-10">DINERO</span>
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    style={{width: `${data.marketSentiment.moneyPercent || 0}%`}} 
                                    className="h-full bg-emerald-500 rounded-full"
                                ></div>
                            </div>
                            <span className="text-[9px] text-emerald-400 font-mono w-8 text-right">{data.marketSentiment.moneyPercent || 0}%</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-start text-[10px]">
                         <span className={`${data.marketSentiment.sharpSide ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                            {data.marketSentiment.sharpSide ? '✅ SIGUIENDO AL DINERO' : 'Neutral'}
                        </span>
                        <span className={`${(data.marketSentiment.ticketPercent || data.marketSentiment.publicPercent) > 70 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                            {(data.marketSentiment.ticketPercent || data.marketSentiment.publicPercent) > 70 ? '⚠️ FADE THE PUBLIC' : ''}
                        </span>
                    </div>
                    
                    <div className={`mt-2 text-[10px] p-2 rounded border ${data.marketSentiment.sharpSide ? 'bg-emerald-900/20 border-emerald-500/20 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400 italic'}`}>
                        <i className="fas fa-info-circle mr-1"></i> {data.marketSentiment.implication}
                    </div>
                </div>
            )}

            {/* NUEVO: ALERTA DE REGRESIÓN */}
            {data.regressionAnalysis && data.regressionAnalysis.verdict === 'REGRESSION_RISK' && (
                <div className="mb-4 bg-yellow-900/20 border border-yellow-500/30 p-2 rounded flex items-start gap-2">
                    <i className="fas fa-chart-line text-yellow-400 mt-0.5"></i>
                    <div>
                        <div className="text-[10px] font-bold text-yellow-400 uppercase">Riesgo de Regresión a la Media</div>
                        <div className="text-[10px] text-slate-300">
                            Rendimiento reciente ({data.regressionAnalysis.last5Performance}) es insostenible vs Promedio ({data.regressionAnalysis.seasonAverage}).
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-3 gap-2 bg-black/20 p-2 rounded-lg text-center mb-3">
                <div className="border-r border-white/10">
                    <div className="text-[9px] text-slate-400 uppercase">Prob. Real</div>
                    <div className="text-lg font-bold text-white">{data.fairWinProb}%</div>
                </div>
                <div className="border-r border-white/10">
                    <div className="text-[9px] text-slate-400 uppercase">Stake Sugerido</div>
                    <div className="text-lg font-bold text-white">{data.recommendedStakeUnit}u</div>
                </div>
                <div>
                    <div className="text-[9px] text-slate-400 uppercase">Riesgo</div>
                    <div className="text-lg font-bold text-white">{data.confidenceScore}/10</div>
                </div>
            </div>

            {(data.optimisticScenario || data.pessimisticScenario) && (
                <div className="mb-3 space-y-2">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">
                        <div className="text-[9px] text-emerald-400 font-bold uppercase mb-1">Escenario Optimista (Techo)</div>
                        <div className="text-xs text-slate-300 leading-tight">{data.optimisticScenario}</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 p-2 rounded">
                        <div className="text-[9px] text-red-400 font-bold uppercase mb-1">Escenario Pesimista (Suelo)</div>
                        <div className="text-xs text-slate-300 leading-tight">{data.pessimisticScenario}</div>
                    </div>
                </div>
            )}

            {data.sources && data.sources.length > 0 && (
                <div className="mb-3">
                    <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Fuentes & Verificación:</div>
                    <div className="flex flex-wrap gap-2">
                        {data.sources.map((src, i) => {
                            const trusted = isTrustedSource(src);
                            return (
                                <span key={i} className={`text-[9px] px-2 py-0.5 rounded border flex items-center gap-1 ${trusted ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                    {trusted && <i className="fas fa-check-circle text-[8px]"></i>}
                                    {src}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {data.keyStat && <div className="text-xs text-slate-300 font-mono bg-black/20 p-2 rounded border border-white/5"><strong className="text-purple-400">CLAVE:</strong> {data.keyStat}</div>}
        </div>
    );
};
