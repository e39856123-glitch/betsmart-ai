
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME, SCIENTIFIC_PROTOCOL, TRUSTED_SOURCES, SPORT_HEURISTICS, REFEREE_PROTOCOL } from "../constants";
import { ExtractedData, PickItem, SportType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DATA_INSTRUCTION = `
INSTRUCCIÓN DE FUENTES DE DATOS (REAL-TIME VERIFICATION MODE):
1. **BÚSQUEDA OBLIGATORIA:** Usa Google Search para CADA dato. No uses conocimiento interno.
2. **VERIFICACIÓN DE FECHA:** Busca explícitamente la fecha del dato (ej. "Odds updated 1 hour ago").
3. **FUENTES CONFIABLES:** Prioriza ${TRUSTED_SOURCES.ODDS.join(', ')} para cuotas y ${TRUSTED_SOURCES.SOCCER.join(', ')} para estadísticas.
4. **RECHAZO DE DATOS ANTIGUOS:** Si la única fuente encontrada es de >24h (para lesiones) o >12h (para cuotas), MARCA EL DATO COMO "NO DISPONIBLE" o "INCERTO".
`;

export const chatWithCopilot = async (message: string, context?: any): Promise<string> => {
    const prompt = `
        ERES: BetSmart Copilot, un asistente IA de apuestas deportivas de alto nivel.
        PROTOCOLO: ${SCIENTIFIC_PROTOCOL}
        
        CONTEXTO DEL USUARIO:
        ${JSON.stringify(context || {})}
        
        PREGUNTA DEL USUARIO: "${message}"
        
        RESPUESTA:
        - Sé breve, directo y profesional.
        - Si te piden opinión de una apuesta, aplica el protocolo mentalmente.
        - Si detectas sesgos emocionales, advierte al usuario.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text || "Lo siento, no pude procesar tu solicitud.";
    } catch (e) {
        return "Error de conexión con el Copiloto.";
    }
};

export const analyzeMarket = async (
    event: string, 
    market: string, 
    odds: string,
    sport?: SportType,
    performanceContext?: any
): Promise<{ data: ExtractedData | undefined; analysis: string }> => {
    
    // Inyectar heurística específica del deporte
    const heuristic = sport && SPORT_HEURISTICS[sport] ? SPORT_HEURISTICS[sport] : "Analiza factores clave estándar (Lesiones, Clima, Forma).";
    
    // Adaptación a rendimiento del usuario
    let strategyContext = "";
    if (performanceContext && performanceContext.isLosingStreak) {
        strategyContext = "ALERTA: El usuario está en racha perdedora. Sé EXTREMADAMENTE CONSERVADOR. Solo recomienda 'BUY' si es un Banker absoluto (9/10).";
    }

    const prompt = `
        ROL: Analista Deportivo Cuantitativo & Auditor de Datos (Hedge Fund Level).
        CONTEXTO: ${DATA_INSTRUCTION}
        PROTOCOLO: ${SCIENTIFIC_PROTOCOL}
        HEURÍSTICA DEPORTE (${sport || 'General'}): ${heuristic}
        REFEREE CHECK: ${REFEREE_PROTOCOL}
        ESTRATEGIA ADAPTATIVA: ${strategyContext}
        
        EVENTO A ANALIZAR: ${event}
        MERCADO: ${market}
        CUOTA USUARIO: ${odds || 'N/A (Buscar Mejor Precio de Mercado)'}
        FECHA HOY: ${new Date().toLocaleString()}
        
        ESTRATEGIA DE BÚSQUEDA AVANZADA (MARKET BIAS & SMART MONEY):
        1. **BETTING SPLITS (TICKETS vs MONEY):** Busca "${event} betting splits".
           - **SHARP ACTION:** Si el % de Dinero (Money) es > 15% mayor que el % de Tickets, el dinero inteligente está en ese lado.
           - **PUBLIC FADE:** Si >75% de Tickets están en un lado, es peligroso (Square).
        
        2. **REVERSE LINE MOVEMENT (RLM):**
           - Identifica si la mayoría del público (>60%) está en un lado, PERO la línea se ha movido en contra de ellos (o hacia el otro lado).
           - ESTO ES EL INDICADOR MÁS FUERTE DE DINERO PROFESIONAL.
        
        PASOS DE EJECUCIÓN:
        1. **AUDITORÍA DE PRECIO:** Encuentra la cuota actual en Pinnacle/Exchange.
        2. **ANÁLISIS DE FLUJO DE DINERO:** Llena los campos moneyPercent y ticketPercent con datos reales encontrados.
        3. **REGRESIÓN:** Verifica xG recientes vs Goles reales.
        4. **ABOGADO DEL DIABLO:** Lista 3 razones por las que esto pierde.
        5. **FACTORIZACIÓN DE CONFIANZA:** Califica del 0-100 cada factor (Math, Matchup, Form, Context, Sentiment).
        
        SALIDA: Bloque JSON estricto:
        <JSON_DATA>
        { 
            "verdict": "BUY/PASS/WARN", 
            "evPercentage": 5.5, 
            "fairWinProb": 58, 
            "confidenceScore": 8, 
            "recommendedStakeUnit": 2, 
            "ticketSelection": "Selección óptima + Casa recomendada", 
            "keyStat": "Dato clave verificado (ej. 'Pinnacle bajó a 1.65 hace 1h')", 
            "userOdds": ${odds || 0},
            "pinnacleOdds": 0,
            "optimisticScenario": "Techo del análisis (Mejor caso)",
            "pessimisticScenario": "Suelo del análisis (Riesgos reales identificados)",
            "sources": ["Pinnacle (Hace 30min)", "ActionNetwork (Splits)"],
            "marketSentiment": {
                "publicPercent": 75,
                "ticketPercent": 75,
                "moneyPercent": 30,
                "sharpSide": true,
                "rlmDetected": true,
                "implication": "RLM DETECTADO: El 75% del público está en A, pero la línea se movió hacia B. Dinero inteligente en B."
            },
            "regressionAnalysis": {
                "last5Performance": "Racha insostenible detectada",
                "seasonAverage": "Datos históricos normalizados",
                "verdict": "REGRESSION_RISK"
            },
            "confidenceBreakdown": {
                "math": 85,
                "matchup": 70,
                "form": 90,
                "context": 60,
                "sentiment": 40
            },
            "analysisType": "TEAM"
        }
        </JSON_DATA>
        Seguido de análisis detallado Markdown. 
        IMPORTANTE: Si no encuentras datos de HOY, dilo explícitamente en el análisis.
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { tools: [{ googleSearch: {} }] }
        });
        
        const text = response.text || "";
        
        // Parseo Robusto: Intenta encontrar bloques JSON válidos
        let jsonMatch = text.match(/<JSON_DATA>([\s\S]*?)<\/JSON_DATA>/);
        if (!jsonMatch) jsonMatch = text.match(/```json([\s\S]*?)```/);
        if (!jsonMatch) jsonMatch = text.match(/\{[\s\S]*\}/); // Fallback fuerza bruta

        let data: ExtractedData | undefined;
        
        if (jsonMatch) {
            try {
                const cleanJson = jsonMatch[1] || jsonMatch[0];
                data = JSON.parse(cleanJson);
            } catch (e) {
                console.error("Failed to parse JSON", e);
            }
        }
        
        let analysis = text;
        if (jsonMatch) {
            // Eliminar el bloque JSON del texto visible para que quede limpio
            analysis = text.replace(jsonMatch[0], '').trim();
        }
        
        return { data, analysis };

    } catch (e) {
        console.error("API Error", e);
        throw e;
    }
};

export const analyzeTicketImage = async (base64Data: string, mimeType: string = 'image/png'): Promise<{ data: ExtractedData | undefined; analysis: string }> => {
    try {
        const prompt = `
            ${DATA_INSTRUCTION}
            ${SCIENTIFIC_PROTOCOL}
            ALGORITMOS DEPORTIVOS: ${JSON.stringify(SPORT_HEURISTICS)}
            FECHA HOY: ${new Date().toLocaleString()}
            
            PASO 1: OCR - Transcribe el boleto. Extrae CADA selección individual.
            PASO 2: CLASIFICACIÓN - Detecta el deporte de cada selección.
            PASO 3: AUDITORÍA CIENTÍFICA - Para cada selección:
                - Busca datos en tiempo real.
                - Aplica el algoritmo específico (Elo, xG, etc).
                - Calcula Fair Odds y Edge.
            
            SALIDA: Bloque JSON estricto:
            <JSON_DATA>
            { 
                "verdict": "BUY/PASS/WARN", 
                "evPercentage": 0, 
                "fairWinProb": 0, 
                "confidenceScore": 0, 
                "recommendedStakeUnit": 0, 
                "ticketSelection": "Resumen boleto",
                "extractedSelections": [
                    { 
                        "event": "...", 
                        "market": "...", 
                        "selection": "...", 
                        "odds": 0,
                        "fairOdds": 0,
                        "edge": 0,
                        "stats": { "elo": {"diff": 0}, "xg": {"home": 0, "away": 0} },
                        "algorithmLog": "...",
                        "rationale": "..."
                    }
                ],
                "keyStat": "Dato verificado", 
                "userOdds": 0,
                "marketSentiment": { 
                    "publicPercent": 0, 
                    "ticketPercent": 0,
                    "moneyPercent": 0,
                    "sharpSide": false, 
                    "rlmDetected": false,
                    "implication": "..." 
                }
            }
            </JSON_DATA>
            Seguido de análisis Markdown detallado.
        `;
        
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ 
                role: 'user', 
                parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: prompt }
                ] 
            }],
            config: { tools: [{ googleSearch: {} }] }
        });

        const text = response.text || "";
        
        let jsonMatch = text.match(/<JSON_DATA>([\s\S]*?)<\/JSON_DATA>/);
        if (!jsonMatch) jsonMatch = text.match(/```json([\s\S]*?)```/);
        if (!jsonMatch) jsonMatch = text.match(/\{[\s\S]*\}/);

        let data: ExtractedData | undefined;

        if (jsonMatch) {
            try {
                const cleanJson = jsonMatch[1] || jsonMatch[0];
                data = JSON.parse(cleanJson);
            } catch (e) {
                console.error("Failed to parse JSON", e);
            }
        }

        let analysis = text;
        if (jsonMatch) {
            analysis = text.replace(jsonMatch[0], '').trim();
        }

        return { data, analysis };
    } catch (e) {
        console.error("API Image Error", e);
        throw e;
    }
};

export const getDailyPicks = async (): Promise<PickItem[]> => {
    const prompt = `
        ROL: Analista Deportivo Cuantitativo & Arquitecto de Apuestas (Strict +EV Bot).
        ${DATA_INSTRUCTION}
        ${SCIENTIFIC_PROTOCOL}
        
        ALGORITMOS ESPECÍFICOS POR DEPORTE (OBLIGATORIO APLICAR Y CITAR):
        ${JSON.stringify(SPORT_HEURISTICS)}
        
        FECHA EXACTA HOY (UTC): ${new Date().toISOString()}.
        AÑO ACTUAL: ${new Date().getFullYear()}. ¡NO USES DATOS DE OTROS AÑOS!
        HORIZONTE TEMPORAL: Escanea eventos de las próximas 72 horas (Early Market).
        
        TAREA MAESTRA:
        1. Escanea el mercado global de apuestas (HOY, MAÑANA, PASADO).
        2. Identifica DISCREPANCIAS MATEMÁTICAS (Value Bets).
        3. CLASIFICA EL DEPORTE (sport) para cada pick y EJECUTA su ALGORITMO específico.
        4. **CRÍTICO: HORA DE INICIO:** Debes devolver la hora en formato UTC ISO 8601 TERMINANDO EN 'Z' (Ej: 2024-05-21T19:00:00Z).
        
        CÁLCULO DE PROBABILIDAD (CIENTÍFICO):
        - NO INVENTES PORCENTAJES. Derívalos de modelos:
          * SOCCER: Distribución de Poisson basada en xG reciente.
          * NBA: Expectativa Pitagórica basada en Net Rating.
          * TENNIS: Delta Elo ajustado por superficie.
        - Define "winProb" basado en este cálculo.
        
        ESTRATEGIA DE APUESTA (bettingMethod):
        - Asigna el método óptimo:
          * "FLAT_STAKE": Para apuestas estándar de valor.
          * "KELLY_FRACTIONAL": Para apuestas de alto valor pero alta volatilidad.
          * "LADDER_SYSTEM": Para apuestas escalonadas (Alt/Main line).
          * "INSURANCE": Si requiere Draw No Bet o Hándicap Asiático.

        SALIDA JSON STRICTO:
        <JSON_PICKS>
        [
            {
                "type": "SINGLE" | "PARLAY" | "SYSTEM",
                "strategyName": "Banker / SGP / Value Ladder",
                "sport": "SOCCER" | "NBA" | "TENNIS" | "MLB" | "OTHER",
                "event": "Evento Principal",
                "market": "Mercado",
                "startTime": "YYYY-MM-DDTHH:mm:ssZ", 
                "rationale": "ANÁLISIS: Breve explicación del contexto...",
                "algorithmLog": "CRITERIO ACTIVADO: [Nombre Algoritmo]. Variable X (Valor) vs Variable Y (Valor) -> Señal de Compra.",
                "confidence": 9,
                "category": "BANKER" | "VALUE" | "HIGH_YIELD",
                "winProb": 65,
                "bettingMethod": "Flat Stake (1u) / Fractional Kelly",
                "probabilityRationale": "Probabilidad derivada de Poisson (Local 1.8 goles esp vs Visita 0.6 goles esp)",
                "odds": 1.75,
                "fairOdds": 1.54,
                "edge": 13.5,
                "legs": [],
                "stats": {
                    "elo": { "home": 0, "away": 0, "diff": 0 },
                    "xg": { "home": 0.0, "away": 0.0 },
                    "poisson": { "home": 0.0, "away": 0.0 }
                }
            }
        ]
        </JSON_PICKS>
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { tools: [{ googleSearch: {} }] }
        });

        const text = response.text || "";
        // Parseo robusto
        let match = text.match(/<JSON_PICKS>([\s\S]*?)<\/JSON_PICKS>/);
        if (!match) match = text.match(/```json([\s\S]*?)```/);
        
        if (match) {
            return JSON.parse(match[1] || match[0]);
        }
        const fallbackMatch = text.match(/\[[\s\S]*\]/);
        if (fallbackMatch) return JSON.parse(fallbackMatch[0]);

        return [];
    } catch (e) {
        console.error("Picks Error", e);
        throw e; // Propagar error para manejo en UI
    }
};
