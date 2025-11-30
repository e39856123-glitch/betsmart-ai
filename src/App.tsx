
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Mode, Currency, RiskProfile, Bet, ExtractedData, UserDirectory, SportType } from "./types";
import { formatCurrency, exportToCSV, roundToTwo } from "./utils";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";
import DailyPicks from "./components/DailyPicks";
import { BetSlipCard, VerdictCard } from "./components/AnalysisResults";
import { KellyCalculator, VolatilityCalculator, VigCalculator, ArbCalculator, ParlayCalculator, PoissonCalculator, OddsConverter } from "./components/Calculators";
import GuidePanel from "./components/GuidePanel";
import { analyzeMarket, analyzeTicketImage } from "./services/geminiService";

const App = () => {
    const [user, setUser] = useState<string | null>(null);
    const [mode, setMode] = useState<Mode>('home');
    
    // BANKROLL SIEMPRE SE ALMACENA EN USD INTERNAMENTE
    const [bankrollUSD, setBankrollUSD] = useState(1000); 
    const [currency, setCurrency] = useState<Currency>('USD');
    const [exchangeRate, setExchangeRate] = useState(3734.50); // Ajustado al valor de referencia del usuario
    const [riskProfile, setRiskProfile] = useState<RiskProfile>('balanced');
    const [bets, setBets] = useState<Bet[]>([]);
    
    // Bankroll Editing
    const [isEditingBank, setIsEditingBank] = useState(false);
    const [tempBankInput, setTempBankInput] = useState("");

    // Inputs Analysis
    const [event, setEvent] = useState("");
    const [market, setMarket] = useState("");
    const [odds, setOdds] = useState("");
    const [selectedSport, setSelectedSport] = useState<SportType>('OTHER'); // Selección manual de deporte
    
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [data, setData] = useState<ExtractedData | undefined>(undefined);
    const [showScience, setShowScience] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    
    // Image handling
    const [images, setImages] = useState<string[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    // Sync Data
    useEffect(() => {
        if (user && user !== 'GUEST') {
            const saved = localStorage.getItem(`betsmart_${user}`);
            if (saved) setBets(JSON.parse(saved));
            const dirs = JSON.parse(localStorage.getItem('betsmart_users_directory') || '{}');
            if (dirs[user]) {
                if(dirs[user].startingBankroll) setBankrollUSD(dirs[user].startingBankroll);
            }
        } else if (user === 'GUEST') {
            setBets([]); setBankrollUSD(1000);
        }
    }, [user]);

    useEffect(() => {
        if (user && user !== 'GUEST') localStorage.setItem(`betsmart_${user}`, JSON.stringify(bets));
    }, [bets]);

    // Calculate profit from bets (IN USD)
    const profitUSD = roundToTwo(bets.reduce((acc, b) => {
        if (b.status === 'won') return acc + (b.stake * b.odds) - b.stake;
        if (b.status === 'lost') return acc - b.stake;
        return acc;
    }, 0));

    // Current Bank (USD) - Redondeado para evitar 999.99999999
    const currentBankUSD = roundToTwo(bankrollUSD + profitUSD);

    // Helper: Convert USD to Display Currency
    const getDisplayValue = (usdVal: number) => {
        const val = currency === 'COP' ? usdVal * exchangeRate : usdVal;
        return roundToTwo(val);
    };

    // Helper: Convert Input Display Value back to USD
    const parseInputValueToUSD = (inputVal: number) => {
        const val = currency === 'COP' ? inputVal / exchangeRate : inputVal;
        return roundToTwo(val);
    };

    const handleStartEditing = () => {
        const val = getDisplayValue(currentBankUSD);
        setTempBankInput(val.toString()); // Usar toString simple para no forzar ceros innecesarios al editar
        setIsEditingBank(true);
    };

    const handleUpdateBankroll = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const inputNumber = parseFloat(tempBankInput);
        
        if (!isNaN(inputNumber)) {
            // 1. Convertimos lo que escribió el usuario a USD
            const newCurrentBankUSD = parseInputValueToUSD(inputNumber);
            
            // 2. Recalculamos el Bankroll Inicial (Base)
            // Nuevo Inicial = Nuevo Total Deseado - Ganancias Históricas
            // IMPORTANTE: Usar roundToTwo para evitar sesgo de flotación matemática
            const newInitialUSD = roundToTwo(newCurrentBankUSD - profitUSD);
            
            setBankrollUSD(newInitialUSD);
            
            if (user && user !== 'GUEST') {
                const dirs: UserDirectory = JSON.parse(localStorage.getItem('betsmart_users_directory') || '{}');
                if (dirs[user]) {
                    dirs[user].startingBankroll = newInitialUSD;
                    localStorage.setItem('betsmart_users_directory', JSON.stringify(dirs));
                }
            }
        }
        setIsEditingBank(false);
    };

    const handleAnalyze = async (evt?: string, mkt?: string) => {
        const e = evt || event;
        const m = mkt || market;
        if (!e) return;
        setLoading(true); setAnalysis(null); setData(undefined); setMode('manual');
        if (evt) { setEvent(evt); setMarket(m || ""); }

        try {
            const result = await analyzeMarket(e, m, odds, selectedSport);
            setData(result.data);
            setAnalysis(result.analysis);
        } catch (err: any) {
            console.error(err);
            const isQuota = err.message?.includes('429') || JSON.stringify(err).includes('RESOURCE_EXHAUSTED');
            const msg = isQuota 
                ? "### ⚠️ ERROR 429: CUOTA EXCEDIDA\n\nEl límite de uso de la API de Gemini se ha agotado por el momento. Por favor espera unos minutos antes de volver a intentar."
                : "Error analizando. Intenta de nuevo.";
            setAnalysis(msg);
        }
        setLoading(false);
    };

    const handleImageAnalyze = async () => {
        if (images.length === 0) return;
        setLoading(true); setAnalysis(null); setData(undefined);
        try {
            const imgData = images[0];
            const mimeType = imgData.split(';')[0].split(':')[1];
            const base64Data = imgData.split(',')[1];
            const result = await analyzeTicketImage(base64Data, mimeType);
            setData(result.data);
            setAnalysis(result.analysis);
        } catch (err: any) {
            console.error(err);
            const isQuota = err.message?.includes('429') || JSON.stringify(err).includes('RESOURCE_EXHAUSTED');
            const msg = isQuota
                ? "### ⚠️ ERROR 429: CUOTA EXCEDIDA\n\nEl límite de uso de la API de Gemini se ha agotado. Por favor espera unos minutos."
                : "Error de imagen. Intenta de nuevo.";
            setAnalysis(msg);
        }
        setLoading(false);
    };

    // Shared logic for processing files (from input or paste)
    const processFiles = (files: File[]) => {
        Promise.all(files.map(f => new Promise<string>(r => { 
            const fr = new FileReader(); 
            fr.onload = () => r(fr.result as string); 
            fr.readAsDataURL(f); 
        }))).then(setImages);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        const items = e.clipboardData.items;
        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) files.push(blob);
            }
        }
        if (files.length > 0) {
            processFiles(files);
        }
    };

    const updateClosingOdds = (id: string, val: string) => {
        const num = parseFloat(val);
        setBets(bets.map(b => b.id === id ? { ...b, closingOdds: isNaN(num) ? undefined : num } : b));
    };

    const riskLabels: Record<RiskProfile, string> = {
        conservative: 'BAJO',
        balanced: 'MEDIO',
        aggressive: 'ALTO'
    };
    
    const sportOptions: SportType[] = ['SOCCER', 'NBA', 'TENNIS', 'MLB', 'OTHER'];

    if (!user) return <AuthScreen onLogin={setUser} onGuest={() => setUser('GUEST')} />;

    const displayCurrentBank = getDisplayValue(currentBankUSD);
    const displayInitialBank = getDisplayValue(bankrollUSD);

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-200 p-4 pb-24 font-sans max-w-xl mx-auto">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-xl font-black italic">BETSMART<span className="text-emerald-400">.OS</span></h1>
                    <div className="text-[10px] text-slate-500 font-mono">{new Date().toLocaleDateString()}</div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowGuide(true)} className="w-8 h-8 bg-slate-800 rounded-full text-emerald-400 font-bold border border-slate-700">?</button>
                    <button onClick={() => setUser(null)} className="w-8 h-8 text-slate-500"><i className="fas fa-power-off"></i></button>
                </div>
            </div>

            {/* BANKROLL CARD */}
            <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-2xl mb-6 shadow-lg backdrop-blur relative z-20">
                <div className="flex justify-between items-start mb-2">
                    <div className="w-full">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">
                                Bankroll Disponible ({currency})
                            </p>
                            {!isEditingBank && (
                                <button 
                                    onClick={handleStartEditing}
                                    className="bg-slate-700 hover:bg-emerald-600 text-slate-200 hover:text-white px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 transition-all"
                                >
                                    <i className="fas fa-pencil-alt"></i> Editar
                                </button>
                            )}
                        </div>
                        
                        {isEditingBank ? (
                            <form onSubmit={handleUpdateBankroll} className="flex gap-2 items-center animate-fade-in relative z-30 mt-2 bg-slate-950 p-2 rounded border border-emerald-500/50">
                                <span className="text-emerald-500 font-bold">$</span>
                                <input 
                                    autoFocus
                                    type="number" 
                                    step="any"
                                    value={tempBankInput} 
                                    onChange={e => setTempBankInput(e.target.value)}
                                    className="w-full bg-transparent text-white font-bold text-lg outline-none"
                                    placeholder="0.00"
                                />
                                <button type="submit" className="bg-emerald-600 px-3 py-1 rounded text-white text-xs font-bold uppercase hover:bg-emerald-500">Guardar</button>
                                <button type="button" onClick={() => setIsEditingBank(false)} className="text-slate-500 hover:text-white px-2"><i className="fas fa-times"></i></button>
                            </form>
                        ) : (
                            <div className={`text-4xl font-black tracking-tighter ${currentBankUSD >= bankrollUSD ? 'text-white' : 'text-red-400'} mt-1 mb-2`}>
                                {formatCurrency(displayCurrentBank, currency)}
                            </div>
                        )}
                    </div>
                </div>

                {/* CONTROLES DE MONEDA Y TRM */}
                <div className="flex justify-between items-end border-t border-slate-800 pt-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Moneda</span>
                        <div className="flex bg-slate-950 rounded p-0.5 border border-slate-800">
                            <button onClick={() => setCurrency('USD')} className={`px-3 py-1 rounded text-[10px] font-bold ${currency === 'USD' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>USD</button>
                            <button onClick={() => setCurrency('COP')} className={`px-3 py-1 rounded text-[10px] font-bold ${currency === 'COP' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>COP</button>
                        </div>
                    </div>

                    {currency === 'COP' && (
                        <div className="flex flex-col gap-1 items-end relative">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] text-slate-500 font-bold uppercase">TRM (Tasa de Cambio)</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 bg-slate-950 rounded px-2 py-1 border border-slate-800">
                                    <span className="text-[10px] text-slate-400">1 USD =</span>
                                    <input 
                                        type="number" 
                                        value={exchangeRate}
                                        onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                                        className="w-16 bg-transparent text-right text-[10px] font-mono font-bold text-white outline-none border-b border-slate-700 focus:border-blue-500"
                                    />
                                    <span className="text-[10px] text-blue-400 font-bold">COP</span>
                                </div>
                                <a 
                                    href="https://www.google.com/search?q=1+USD+a+COP+hoy" 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-400 border border-emerald-500/30 px-2 py-1 flex items-center gap-1 rounded transition-colors text-[9px] font-bold uppercase no-underline"
                                >
                                    <i className="fab fa-google"></i> Ver TRM
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/50 flex justify-between items-center">
                     <span className="text-[9px] text-slate-500 font-bold uppercase">Nivel de Riesgo</span>
                     <div className="flex gap-1">
                        {(['conservative', 'balanced', 'aggressive'] as RiskProfile[]).map(r => (
                            <button key={r} onClick={() => setRiskProfile(r)} className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${riskProfile === r ? 'bg-slate-800 text-emerald-400 border-emerald-500/50' : 'border-transparent text-slate-600'}`}>
                                {riskLabels[r]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            {mode === 'home' && <Dashboard user={user} initialBankroll={displayInitialBank} currentBankroll={displayCurrentBank} currency={currency} bets={bets} onNavigate={setMode} exchangeRate={currency === 'COP' ? exchangeRate : 1} />}

            {mode === 'daily' && <DailyPicks onAnalyze={handleAnalyze} />}

            {mode === 'manual' && (
                <div className="animate-fade-in space-y-4">
                    <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl">
                        <h2 className="font-bold text-white mb-4"><i className="fas fa-radar text-emerald-400 mr-2"></i>Auditoría</h2>
                        <div className="space-y-3">
                            <input value={event} onChange={e => setEvent(e.target.value)} placeholder="Evento (ej. Lakers vs Warriors)" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm" />
                            <div className="flex gap-2">
                                <input value={market} onChange={e => setMarket(e.target.value)} placeholder="Mercado (Ganador)" className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm" />
                                <input value={odds} onChange={e => setOdds(e.target.value)} placeholder="1.90" type="number" className="w-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm text-center" />
                            </div>
                            
                            {/* SELECTOR DE DEPORTE (NUEVO) */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {sportOptions.map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => setSelectedSport(s)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold border ${selectedSport === s ? 'bg-emerald-900/50 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            <button onClick={() => handleAnalyze()} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold text-white uppercase text-sm shadow-lg shadow-emerald-900/20">
                                {loading ? 'Procesando...' : 'Analizar Valor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mode === 'image' && (
                <div className="animate-fade-in">
                    <div 
                        onClick={() => fileRef.current?.click()} 
                        onPaste={handlePaste}
                        tabIndex={0}
                        className="border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-all outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                    >
                        <input type="file" hidden ref={fileRef} multiple onChange={(e) => {
                            if (e.target.files) processFiles(Array.from(e.target.files));
                        }} />
                        {images.length > 0 ? (
                            <div className="flex gap-2 flex-wrap justify-center">{images.map((img, i) => <img key={i} src={img} className="h-16 rounded border border-slate-600" />)}</div>
                        ) : (
                            <>
                                <i className="fas fa-camera text-3xl text-slate-500 mb-2"></i>
                                <span className="text-sm font-bold text-slate-400">Subir o Pegar (Ctrl+V) Boleto</span>
                            </>
                        )}
                    </div>
                    {images.length > 0 && <button onClick={handleImageAnalyze} disabled={loading} className="w-full mt-4 bg-emerald-600 py-3 rounded-lg font-bold text-white">Escanear</button>}
                </div>
            )}

            {mode === 'tools' && (
                <div className="animate-fade-in space-y-4">
                    <KellyCalculator bankroll={displayCurrentBank} currency={currency} riskProfile={riskProfile} data={data} />
                    <OddsConverter />
                    <PoissonCalculator />
                    <ParlayCalculator currency={currency} />
                    <VolatilityCalculator data={data} />
                    <VigCalculator />
                    <ArbCalculator />
                </div>
            )}

            {mode === 'portfolio' && (
                <div className="animate-fade-in space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-white">Cartera de Apuestas</h3>
                        {bets.length > 0 && (
                            <button onClick={() => exportToCSV(bets, user)} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded flex items-center gap-2">
                                <i className="fas fa-file-csv"></i> Exportar
                            </button>
                        )}
                    </div>
                    {bets.length === 0 ? <div className="text-center text-slate-500 py-10">Sin datos.</div> :
                        bets.slice().reverse().map(b => (
                            <div key={b.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl relative">
                                <div className="absolute top-3 right-3 text-[9px] font-bold text-slate-600 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                    {b.sport || 'OTHER'}
                                </div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-xs text-slate-500">{b.date}</div>
                                        <div className="font-bold text-sm text-white">{b.event}</div>
                                        <div className="text-xs text-slate-400">{b.pick} @ {b.odds} ({formatCurrency(getDisplayValue(b.stake), currency)})</div>
                                    </div>
                                    {b.status === 'pending' ? (
                                        <div className="flex gap-1">
                                            <button onClick={() => setBets(bets.map(x => x.id === b.id ? { ...x, status: 'won' } : x))} className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-500"><i className="fas fa-check"></i></button>
                                            <button onClick={() => setBets(bets.map(x => x.id === b.id ? { ...x, status: 'lost' } : x))} className="w-8 h-8 rounded bg-red-500/20 text-red-500"><i className="fas fa-times"></i></button>
                                        </div>
                                    ) : (
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${b.status === 'won' ? 'bg-emerald-900 text-emerald-400' : 'bg-red-900 text-red-400'}`}>{b.status.toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[9px] text-slate-500 uppercase font-bold">Línea Cierre (CLV):</label>
                                        <input 
                                            type="number" 
                                            placeholder="Ej. 1.85" 
                                            defaultValue={b.closingOdds || ""}
                                            onBlur={(e) => updateClosingOdds(b.id, e.target.value)}
                                            className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-white"
                                        />
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        {b.closingOdds && (
                                            <div className="text-[9px]">
                                                <span className="text-slate-500 mr-1">Edge:</span>
                                                <span className={`${(b.odds / b.closingOdds - 1) > 0 ? 'text-emerald-400' : 'text-red-400'} font-bold`}>
                                                    {((b.odds / b.closingOdds - 1) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        )}
                                        <button onClick={() => setBets(bets.filter(x => x.id !== b.id))} className="text-slate-600 hover:text-red-500"><i className="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            )}

            {/* RESULTS OVERLAY */}
            {(loading || analysis) && (
                <div className="mt-6 pb-20 animate-fade-in">
                    {loading && (
                        <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 font-mono text-xs text-emerald-500/80 mb-4">
                            <div><span className="mr-2 text-emerald-700">$</span>INIT_NEURAL_ENGINE...</div>
                            <div className="animate-pulse"><span className="mr-2 text-emerald-700">$</span>SCANNING_GLOBAL_ODDS_API...</div>
                        </div>
                    )}

                    {data && (
                        <>
                            <BetSlipCard data={data} />
                            <VerdictCard data={data} />
                        </>
                    )}

                    {analysis && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                            <button onClick={() => setShowScience(!showScience)} className="w-full py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase mb-4 flex items-center justify-center gap-2">
                                <i className="fas fa-flask"></i> {showScience ? 'Ocultar Ciencia' : 'Ver Detalles Científicos'}
                            </button>
                            {showScience && (
                                <div className="markdown-body text-sm text-slate-300">
                                    <ReactMarkdown>{analysis}</ReactMarkdown>
                                    <div className="mt-6 pt-6 border-t border-slate-800">
                                        <h4 className="text-[10px] text-slate-500 font-bold uppercase mb-2">Herramientas Auto-Aplicadas</h4>
                                        <KellyCalculator bankroll={displayCurrentBank} currency={currency} riskProfile={riskProfile} data={data} />
                                        <VolatilityCalculator data={data} />
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => {
                                    setBets([...bets, { 
                                        id: Date.now().toString(), 
                                        date: new Date().toLocaleDateString(), 
                                        event: event || "Evento", 
                                        pick: data?.ticketSelection || market || "Pick", 
                                        stake: 0, 
                                        odds: parseFloat(odds) || data?.userOdds || 0, 
                                        status: 'pending', 
                                        analysisSummary: "Auto", 
                                        closingOdds: undefined,
                                        sport: selectedSport // Guardar deporte seleccionado
                                    }]);
                                    setMode('portfolio'); setAnalysis(null); setData(undefined);
                                }} className="flex-1 bg-emerald-600/20 text-emerald-400 py-3 rounded-xl font-bold text-xs uppercase border border-emerald-500/30">Guardar Pick</button>
                                <button onClick={() => { setAnalysis(null); setData(undefined); }} className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl font-bold text-xs uppercase">Cerrar</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showGuide && <GuidePanel onClose={() => setShowGuide(false)} />}

            {/* NAV BAR */}
            <div className="fixed bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur border border-slate-700 p-2 rounded-2xl flex justify-around shadow-2xl z-50 max-w-xl mx-auto">
                {[
                    { id: 'home', icon: 'fa-home', label: 'Inicio' },
                    { id: 'manual', icon: 'fa-search', label: 'Analizar' },
                    { id: 'image', icon: 'fa-camera', label: 'Escanear' },
                    { id: 'daily', icon: 'fa-fire', label: 'Picks' },
                    { id: 'tools', icon: 'fa-calculator', label: 'Calc' },
                    { id: 'portfolio', icon: 'fa-chart-pie', label: 'Cartera' }
                ].map((item: any) => (
                    <button key={item.id} onClick={() => setMode(item.id)} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${mode === item.id ? 'text-emerald-400 bg-emerald-900/20' : 'text-slate-500'}`}>
                        <i className={`fas ${item.icon} text-lg mb-1`}></i>
                        <span className="text-[9px] font-bold uppercase">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default App;
