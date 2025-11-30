
export type Mode = 'home' | 'manual' | 'image' | 'daily' | 'portfolio' | 'tools' | 'guide';
export type Currency = 'USD' | 'COP';
export type RiskProfile = 'conservative' | 'balanced' | 'aggressive';
export type SportType = 'TENNIS' | 'NBA' | 'SOCCER' | 'MLB' | 'OTHER';

export interface Bet {
    id: string;
    date: string;
    event: string;
    pick: string;
    stake: number;
    odds: number;
    closingOdds?: number; // Nuevo: Cuota al cierre del mercado
    sport?: SportType; // Nuevo: Categoría para analítica
    status: 'pending' | 'won' | 'lost' | 'void';
    analysisSummary: string;
}

export interface ExtractedSelection {
    event: string;
    market: string;
    selection: string;
    odds: number;
    fairOdds?: number;
    edge?: number;
    stats?: PickStats;
    algorithmLog?: string;
    rationale?: string;
}

export interface ExtractedData {
    userOdds?: number;
    fairWinProb?: number;
    confidenceIntervalLow?: number;
    confidenceIntervalHigh?: number;
    historicalMean?: number;
    line?: number;
    stdDev?: number;
    pinnacleOdds?: number;
    opposingOdds?: number;
    verdict?: 'BUY' | 'PASS' | 'WARN';
    evPercentage?: number;
    confidenceScore?: number;
    keyStat?: string;
    recommendedStakeUnit?: number;
    ticketSelection?: string;
    ticketPath?: string;
    // Selecciones extraídas del OCR
    extractedSelections?: ExtractedSelection[];
    // Nuevos campos estadísticos
    optimisticScenario?: string;
    pessimisticScenario?: string;
    kellySuggested?: number;
    // Verificación
    sources?: string[];
    // Nuevos Sesgos Detectados
    marketSentiment?: {
        publicPercent: number; // Porcentaje de apuestas (Tickets)
        moneyPercent: number;  // Porcentaje de dinero (Handle) - NUEVO
        ticketPercent: number; // Redundante con publicPercent pero explícito para UI
        sharpSide: boolean; // ¿Está el dinero inteligente aquí?
        rlmDetected: boolean; // Reverse Line Movement detectado - NUEVO
        implication: string; // "Fade the Public" o "Follow the Steam"
    };
    regressionAnalysis?: {
        last5Performance: string; // Ej: "Muy por encima de la media"
        seasonAverage: string;
        verdict: 'SUSTAINABLE' | 'REGRESSION_RISK';
    };
    detectedSport?: SportType; // Para auto-tagging
    confidenceBreakdown?: {
        math: number;
        matchup: number;
        form: number;
        context: number;
        sentiment: number;
    };
    analysisType?: 'TEAM' | 'PLAYER';
}

export interface UserProfile {
    username: string;
    password?: string;
    created: string;
    avatarColor?: string;
    startingBankroll?: number;
}

export interface UserDirectory {
    [username: string]: UserProfile;
}

export interface ParlayLeg {
    event: string;
    market: string;
    selection: string;
    odds: number;
}

export interface PickStats {
    elo?: { home: number; away: number; diff: number };
    xg?: { home: number; away: number };
    poisson?: { home: number; away: number };
}

export interface PickItem {
    type: 'SINGLE' | 'PARLAY' | 'SYSTEM';
    strategyName?: string; // Ej: "Doblete Seguro", "Trixie Value"
    event: string; // Título principal
    market: string;
    startTime: string;
    rationale: string;
    confidence: number;
    category: 'BANKER' | 'VALUE' | 'HIGH_YIELD';
    winProb: number;
    odds: number; // Cuota total
    fairOdds?: number; // Nuevo: Cuota justa calculada (1/winProb)
    edge?: number; // Nuevo: Ventaja porcentual sobre la casa (+EV)
    sport: SportType; // OBLIGATORIO: Deporte detectado
    legs?: ParlayLeg[]; // Para combinadas
    stats?: PickStats; // Nuevas estadísticas avanzadas
    algorithmLog?: string; // LOG DEL ALGORITMO USADO
    bettingMethod?: string; // Nuevo: Estrategia de apuesta (e.g. "Flat Stake", "Kelly")
    probabilityRationale?: string; // Nuevo: Explicación científica de la probabilidad
}
export interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp: number;
}