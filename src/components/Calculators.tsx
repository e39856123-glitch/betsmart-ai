
import React, { useState, useEffect } from 'react';
import { Currency, ExtractedData, RiskProfile } from '../types';
import { formatCurrency, cumulativeDistribution } from '../utils';

// --- ODDS CONVERTER ---
export const OddsConverter = () => {
    const [decimal, setDecimal] = useState<string>("2.00");
    const [american, setAmerican] = useState<string>("+100");
    const [prob, setProb] = useState<string>("50.0");

    const handleDecimal = (val: string) => {
        setDecimal(val);
        const d = parseFloat(val);
        if (!isNaN(d) && d > 1) {
            // Dec to Prob
            setProb(((1 / d) * 100).toFixed(1));
            // Dec to American
            if (d >= 2) setAmerican("+" + Math.round((d - 1) * 100).toString());
            else setAmerican(Math.round(-100 / (d - 1)).toString());
        } else {
            setAmerican(""); setProb("");
        }
    };

    const handleAmerican = (val: string) => {
        setAmerican(val);
        const a = parseFloat(val);
        if (!isNaN(a)) {
            let d = 0;
            if (a > 0) d = (a / 100) + 1;
            else d = (100 / Math.abs(a)) + 1;
            
            if (d > 1) {
                setDecimal(d.toFixed(2));
                setProb(((1 / d) * 100).toFixed(1));
            }
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mt-4">
            <h4 className="font-bold text-white text-sm mb-3"><i className="fas fa-exchange-alt text-indigo-400 mr-2"></i>Conversor de Cuotas</h4>
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Decimal</label>
                    <input type="number" value={decimal} onChange={e => handleDecimal(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs font-mono text-center" />
                </div>
                <div>
                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Americano</label>
                    <input type="text" value={american} onChange={e => handleAmerican(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs font-mono text-center" />
                </div>
                <div>
                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Prob. Implícita</label>
                    <div className="w-full bg-slate-950/50 border border-slate-800 rounded p-2 text-slate-300 text-xs font-mono text-center">{prob}%</div>
                </div>
            </div>
        </div>
    );
};

// --- NUEVA CALCULADORA POISSON ---
export const PoissonCalculator = () => {
    const [homeGoalAvg, setHomeGoalAvg] = useState("");
    const [awayGoalAvg, setAwayGoalAvg] = useState("");
    
    // Función de masa de probabilidad de Poisson: P(k) = (lambda^k * e^-lambda) / k!
    const poisson = (k: number, lambda: number) => {
        return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
    };
    
    const factorial = (n: number): number => {
        if (n === 0 || n === 1) return 1;
        let res = 1;
        for (let i = 2; i <= n; i++) res *= i;
        return res;
    };

    const hLambda = parseFloat(homeGoalAvg) || 0;
    const aLambda = parseFloat(awayGoalAvg) || 0;

    let probHomeWin = 0;
    let probDraw = 0;
    let probAwayWin = 0;
    let probOver25 = 0;

    if (hLambda > 0 && aLambda > 0) {
        for (let h = 0; h < 10; h++) {
            for (let a = 0; a < 10; a++) {
                const p = poisson(h, hLambda) * poisson(a, aLambda);
                if (h > a) probHomeWin += p;
                else if (h === a) probDraw += p;
                else probAwayWin += p;
                
                if (h + a > 2.5) probOver25 += p;
            }
        }
    }

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mt-4">
            <h4 className="font-bold text-white text-sm mb-2"><i className="fas fa-atom text-blue-400 mr-2"></i>Distribución de Poisson (Goles)</h4>
            <div className="text-[10px] text-slate-400 mb-2">Ingresa media de goles esperados para cada equipo.</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <input type="number" value={homeGoalAvg} onChange={e => setHomeGoalAvg(e.target.value)} placeholder="Media Local (Ej. 1.8)" className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs" />
                <input type="number" value={awayGoalAvg} onChange={e => setAwayGoalAvg(e.target.value)} placeholder="Media Visita (Ej. 1.2)" className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs" />
            </div>
            {(hLambda > 0 && aLambda > 0) && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                     <div className="bg-slate-950 p-2 rounded border border-slate-800">
                        <div className="text-slate-500">Local Gana</div>
                        <div className="font-bold text-emerald-400">{(probHomeWin * 100).toFixed(1)}%</div>
                     </div>
                     <div className="bg-slate-950 p-2 rounded border border-slate-800">
                        <div className="text-slate-500">Over 2.5 Goles</div>
                        <div className="font-bold text-yellow-400">{(probOver25 * 100).toFixed(1)}%</div>
                     </div>
                     <div className="bg-slate-950 p-2 rounded border border-slate-800">
                        <div className="text-slate-500">Empate</div>
                        <div className="font-bold text-slate-300">{(probDraw * 100).toFixed(1)}%</div>
                     </div>
                     <div className="bg-slate-950 p-2 rounded border border-slate-800">
                        <div className="text-slate-500">Visita Gana</div>
                        <div className="font-bold text-red-400">{(probAwayWin * 100).toFixed(1)}%</div>
                     </div>
                </div>
            )}
        </div>
    );
};

export const KellyCalculator = ({ bankroll, currency, riskProfile, data }: { bankroll: number, currency: Currency, riskProfile: RiskProfile, data?: ExtractedData }) => {
    const [odds, setOdds] = useState("");
    const [winProb, setWinProb] = useState("");
    const [useSafetyMargin, setUseSafetyMargin] = useState(true); // Nuevo: Margen de seguridad por defecto
    
    const fraction = riskProfile === 'conservative' ? 0.25 : riskProfile === 'balanced' ? 0.5 : 1.0;
    const profileLabel = riskProfile === 'conservative' ? 'BAJO' : riskProfile === 'balanced' ? 'MEDIO' : 'ALTO';

    useEffect(() => {
        if (data) {
            if (data.userOdds) setOdds(data.userOdds.toString());
            if (data.fairWinProb) setWinProb(data.fairWinProb.toString());
        }
    }, [data]);

    const calculateKelly = () => {
        const b = parseFloat(odds) - 1;
        // CORRECCIÓN DE SESGO DE SOBRECONFIANZA:
        // Si activamos el margen de seguridad, reducimos la probabilidad estimada un 5% absoluto o relativo.
        // Aquí aplicamos un factor de 0.95 a la probabilidad para ser conservadores.
        let rawP = parseFloat(winProb) / 100;
        const p = useSafetyMargin ? rawP * 0.95 : rawP; 
        
        const q = 1 - p;
        if (!b || !p || b <= 0) return 0;
        const f = (b * p - q) / b;
        const adjustedF = f * fraction;
        return adjustedF <= 0 ? 0 : adjustedF * bankroll;
    };
    
    const stake = calculateKelly();
    const percent = stake > 0 ? (stake / bankroll) * 100 : 0;

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mt-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-white text-sm"><i className="fas fa-calculator text-emerald-400 mr-2"></i>Kelly ({profileLabel})</h4>
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="safety" 
                        checked={useSafetyMargin} 
                        onChange={e => setUseSafetyMargin(e.target.checked)} 
                        className="accent-emerald-500 h-3 w-3"
                    />
                    <label htmlFor="safety" className="text-[10px] text-slate-400 cursor-pointer select-none">Margen Seguridad</label>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
                <input type="number" value={odds} onChange={e => setOdds(e.target.value)} placeholder="Cuota (2.0)" className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs font-mono" />
                <input type="number" value={winProb} onChange={e => setWinProb(e.target.value)} placeholder="Prob % (55)" className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs font-mono" />
            </div>
            <div className="bg-emerald-900/20 border border-emerald-500/20 p-2 rounded flex justify-between items-center">
                <span className="text-xs text-slate-400">Apostar:</span>
                <div className="text-right">
                    <div className="font-bold text-emerald-400 text-lg">{formatCurrency(stake, currency)}</div>
                    <div className="text-[10px] text-emerald-600">{percent.toFixed(2)}% del Bank</div>
                </div>
            </div>
            {percent > 5 && (
                <div className="mt-2 text-[10px] text-yellow-400 bg-yellow-900/20 p-1 rounded text-center border border-yellow-700/30">
                    <i className="fas fa-exclamation-triangle mr-1"></i> Alto riesgo (&gt;5%). Considera reducir stake.
                </div>
            )}
        </div>
    );
};

export const VolatilityCalculator = ({ data }: { data?: ExtractedData }) => {
    const [mean, setMean] = useState("");
    const [line, setLine] = useState("");
    const [stdDev, setStdDev] = useState("");

    useEffect(() => {
        if (data) {
            if (data.historicalMean) setMean(data.historicalMean.toString());
            if (data.line) setLine(data.line.toString());
            if (data.stdDev) setStdDev(data.stdDev.toString());
        }
    }, [data]);

    const m = parseFloat(mean), l = parseFloat(line), s = parseFloat(stdDev);
    let zScore = 0, probUnder = 0;
    if (!isNaN(m) && !isNaN(l) && !isNaN(s) && s > 0) {
        zScore = (l - m) / s;
        probUnder = cumulativeDistribution(m, s, l) * 100;
    }

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mt-4">
            <h4 className="font-bold text-white text-sm mb-2"><i className="fas fa-wave-square text-cyan-400 mr-2"></i>Z-Score (Volatilidad)</h4>
            <div className="grid grid-cols-3 gap-2 mb-2">
                <input type="number" value={mean} onChange={e => setMean(e.target.value)} placeholder="Media" className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs" />
                <input type="number" value={line} onChange={e => setLine(e.target.value)} placeholder="Línea" className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs" />
                <input type="number" value={stdDev} onChange={e => setStdDev(e.target.value)} placeholder="Desv" className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs" />
            </div>
            {!isNaN(probUnder) && probUnder > 0 && (
                <div className="text-xs text-slate-300 bg-slate-950 p-2 rounded">
                    Z: <span className="font-mono font-bold text-white">{zScore.toFixed(2)}</span> | Under: <span className="font-mono text-cyan-400">{probUnder.toFixed(1)}%</span> | Over: <span className="font-mono text-pink-400">{(100 - probUnder).toFixed(1)}%</span>
                </div>
            )}
        </div>
    );
};

export const VigCalculator = () => {
    const [o1, setO1] = useState("");
    const [o2, setO2] = useState("");
    const p1 = o1 ? 1 / parseFloat(o1) : 0;
    const p2 = o2 ? 1 / parseFloat(o2) : 0;
    const vig = ((p1 + p2) - 1) * 100;

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mt-4">
            <h4 className="font-bold text-white text-sm mb-2"><i className="fas fa-percentage text-pink-400 mr-2"></i>Calculadora de Vig</h4>
            <div className="grid grid-cols-2 gap-2 mb-2">
                <input type="number" value={o1} onChange={e => setO1(e.target.value)} placeholder="Cuota A" className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs" />
                <input type="number" value={o2} onChange={e => setO2(e.target.value)} placeholder="Cuota B" className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs" />
            </div>
            {vig > 0 && <div className="text-xs text-slate-300">Vig de la casa: <span className="text-red-400 font-bold">{vig.toFixed(2)}%</span></div>}
        </div>
    );
};

export const ArbCalculator = () => {
    const [o1, setO1] = useState("");
    const [o2, setO2] = useState("");
    const p = (o1 && o2) ? (1 / parseFloat(o1) + 1 / parseFloat(o2)) : 1;
    const isArb = p < 1;
    const roi = isArb ? ((1 / p) - 1) * 100 : 0;

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mt-4">
            <h4 className="font-bold text-white text-sm mb-2"><i className="fas fa-balance-scale text-yellow-400 mr-2"></i>Arbitraje</h4>
            <div className="grid grid-cols-2 gap-2 mb-2">
                <input type="number" value={o1} onChange={e => setO1(e.target.value)} placeholder="Casa A" className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs" />
                <input type="number" value={o2} onChange={e => setO2(e.target.value)} placeholder="Casa B" className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs" />
            </div>
            {isArb ?
                <div className="bg-emerald-900/30 text-emerald-400 p-2 rounded text-xs font-bold border border-emerald-500/30">¡OPORTUNIDAD! ROI: {roi.toFixed(2)}%</div>
                : <div className="text-xs text-slate-500">Sin arbitraje (Suma: {(p * 100).toFixed(2)}%)</div>
            }
        </div>
    );
};

export const ParlayCalculator = ({ currency }: { currency: Currency }) => {
    const [items, setItems] = useState(['']);
    const [wager, setWager] = useState('10');

    const odds = items.reduce((acc, val) => {
        const o = parseFloat(val);
        return !isNaN(o) && o > 0 ? acc * o : acc;
    }, 1);

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mt-4">
            <h4 className="font-bold text-white text-sm mb-2"><i className="fas fa-layer-group text-purple-400 mr-2"></i>Parlay</h4>
            <div className="space-y-2 mb-2">
                {items.map((it, i) => (
                    <div key={i} className="flex gap-1">
                        <input type="number" value={it} onChange={e => { const n = [...items]; n[i] = e.target.value; setItems(n) }} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs" placeholder={`Selección ${i + 1}`} />
                        {items.length > 1 && <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-500 px-2"><i className="fas fa-times"></i></button>}
                    </div>
                ))}
                <button onClick={() => setItems([...items, ''])} className="text-purple-400 text-xs font-bold">+ Añadir</button>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                <input type="number" value={wager} onChange={e => setWager(e.target.value)} className="w-20 bg-slate-950 border border-slate-700 rounded p-1 text-right text-white text-xs" />
                <div className="text-right">
                    <div className="text-xs text-slate-400">Cuota: {odds > 1 ? odds.toFixed(2) : '-'}</div>
                    <div className="text-sm font-bold text-purple-400">{formatCurrency(parseFloat(wager) * odds, currency)}</div>
                </div>
            </div>
        </div>
    );
};
