
import React from 'react';

const StrategyCard = ({ color, title, subtitle, risk, reward, icon, desc }: any) => {
    const colorClasses: any = {
        blue: { bg: 'bg-blue-900/20', border: 'border-blue-500/50', text: 'text-blue-400', bar: 'bg-blue-500' },
        emerald: { bg: 'bg-emerald-900/20', border: 'border-emerald-500/50', text: 'text-emerald-400', bar: 'bg-emerald-500' },
        purple: { bg: 'bg-purple-900/20', border: 'border-purple-500/50', text: 'text-purple-400', bar: 'bg-purple-500' },
        yellow: { bg: 'bg-yellow-900/20', border: 'border-yellow-500/50', text: 'text-yellow-400', bar: 'bg-yellow-500' },
        red: { bg: 'bg-red-900/20', border: 'border-red-500/50', text: 'text-red-400', bar: 'bg-red-500' },
    };

    const c = colorClasses[color] || colorClasses.blue;

    return (
        <div className={`p-4 rounded-xl border ${c.bg} ${c.border} mb-3`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.bg} border ${c.border}`}>
                        <i className={`fas ${icon} ${c.text}`}></i>
                    </div>
                    <div>
                        <h3 className={`font-black uppercase text-sm ${c.text}`}>{title}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{subtitle}</p>
                    </div>
                </div>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">{desc}</p>
            
            {/* Medidores */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="flex justify-between text-[9px] text-slate-500 uppercase font-bold mb-1">
                        <span>Riesgo</span>
                        <span>{risk}</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div style={{width: risk === 'Bajo' ? '30%' : risk === 'Medio' ? '60%' : '95%'}} className={`h-full ${c.bar}`}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[9px] text-slate-500 uppercase font-bold mb-1">
                        <span>Retorno Potencial</span>
                        <span>{reward}</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div style={{width: reward === 'Bajo' ? '30%' : reward === 'Medio' ? '60%' : '95%'}} className={`h-full ${c.bar}`}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GuidePanel = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/90 z-[60] overflow-y-auto p-4 animate-fade-in backdrop-blur-md flex items-center justify-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors">
                <i className="fas fa-times text-slate-400 hover:text-white"></i>
            </button>
            
            <h2 className="text-2xl font-black text-white mb-1">Diccionario Visual</h2>
            <p className="text-xs text-slate-400 mb-6">Entiende la lógica detrás de cada color.</p>
            
            <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 border-b border-slate-800 pb-1">Estrategias Ganadoras</h3>
                    <StrategyCard 
                        color="blue"
                        icon="fa-shield-alt"
                        title="BANKER (SEGURA)"
                        subtitle="Estrategia de Seguridad"
                        desc="Apuestas con muy alta probabilidad de éxito (Win Rate > 70%). Se usan para construir bankroll poco a poco o como base de combinadas."
                        risk="Bajo"
                        reward="Bajo"
                    />
                    <StrategyCard 
                        color="emerald"
                        icon="fa-balance-scale"
                        title="VALUE (VALOR)"
                        subtitle="Ventaja Matemática"
                        desc="El Santo Grial. Apuestas donde la cuota paga más de lo que debería según la probabilidad real. Son rentables a largo plazo."
                        risk="Medio"
                        reward="Medio"
                    />
                    <StrategyCard 
                        color="purple"
                        icon="fa-rocket"
                        title="HIGH YIELD"
                        subtitle="Alto Rendimiento"
                        desc="Apuestas más arriesgadas (como Parlays o Underdogs) pero que pagan mucho dinero. Se deben jugar con stake muy bajo (0.5u)."
                        risk="Alto"
                        reward="Muy Alto"
                    />
                </div>

                <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 border-b border-slate-800 pb-1">Señales de Alerta</h3>
                    <StrategyCard 
                        color="yellow"
                        icon="fa-exclamation-triangle"
                        title="WARN (ALERTA)"
                        subtitle="Precaución Requerida"
                        desc="El análisis detecta 'Cuotas Trampa' o movimiento de línea sospechoso. Mejor no apostar o reducir el monto drásticamente."
                        risk="Variable"
                        reward="Variable"
                    />
                    <StrategyCard 
                        color="red"
                        icon="fa-ban"
                        title="PASS (DESCARTAR)"
                        subtitle="Valor Negativo (-EV)"
                        desc="Matemáticamente perderás dinero a largo plazo. La casa tiene demasiada ventaja. No tocar."
                        risk="Extremo"
                        reward="Negativo"
                    />
                </div>
            </div>
        </div>
    </div>
);

export default GuidePanel;
