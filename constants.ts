
export const MODEL_NAME = "gemini-3-pro-preview";

export const TRUSTED_SOURCES = {
    SOCCER: ["understat.com", "fbref.com", "whoscored.com", "sofascore.com", "transfermarkt.com"],
    BASKETBALL: ["nba.com/stats", "basketball-reference.com", "cleaningtheglass.com"],
    TENNIS: ["atptour.com", "tennisabstract.com", "flashscore.com"],
    ODDS: ["pinnacle.com", "oddsportal.com", "flashscore.com", "vegasinsider.com", "bet365.com", "draftkings.com"],
    WEATHER: ["accuweather.com", "wunderground.com"],
    NEWS: ["twitter.com", "x.com", "rotoworld.com", "espn.com"]
};

export const SPORT_HEURISTICS = {
    TENNIS: "ALGORITMO SURFACE_ELO: Calcula ELO específico en esta superficie (Arcilla/Hierba/Dura). Si Delta ELO > 100 y Rival jugó > 150min ayer (Fatiga) => Alta Probabilidad. Requiere H2H reciente.",
    NBA: "ALGORITMO REST_DIFF: Calcula 'Rest Advantage' (Días descanso). Si Local tiene +1 día descanso y Visita viene de B2B (Back-to-back) con viaje > 800km => Fade Visita. Revisa Net Rating L10.",
    SOCCER: "ALGORITMO xG_DELTA: Compara (xG Favor - xG Contra) últimos 5 partidos. Si Equipo A tiene Delta > +0.6 y Equipo B < -0.2 => Value Pick. Usa Poisson para marcador exacto.",
    MLB: "ALGORITMO PITCHER_SIERA: Usa SIERA/xFIP del abridor en lugar de ERA. Si Abridor A (SIERA < 3.50) vs Abridor B (SIERA > 4.50) y Viento Outfield => Over/Runline."
};

export const REFEREE_PROTOCOL = "REFEREE CHECK: Verifica estadísticas del árbitro asignado (Faltas por juego, Bias Local/Visita). Si es extremo, ajusta predicción.";

export const SCIENTIFIC_PROTOCOL = `METODOLOGÍA (PROTOCOLO BAYESIANO UNIFICADO v8.0 - REAL-TIME DATA AUDIT): 

1. **AUDITORÍA DE TIMESTAMP (CRÍTICO):**
   - **CUOTAS:** Deben ser de HOY (Hace < 6 horas). Si la fuente es antigua, DESCARTA.
   - **NOTICIAS:** Las bajas/lesiones deben verificarse con noticias de las últimas 24h.
   - **BÚSQUEDA:** Usa términos como "odds today", "lineups confirmed [Today's Date]".

2. **COMPORTAMIENTO DE AGREGADOR (MARKET MAKER):**
   - Tu prioridad es encontrar el "Precio de Mercado Justo" (Fair Price).
   - Usa Google Search para escanear Pinnacle, Bet365 y Betfair Exchange.

3. **FILTRO ANTI-SESGO DE CONFIRMACIÓN:**
   - **ABOGADO DEL DIABLO:** Antes de dar un veredicto 'BUY', debes listar 3 razones por las que la apuesta FALLARÁ.
   - **TRAP ODDS:** Si la cuota del usuario es >10% mayor que la de Pinnacle, ALERTA DE TRAMPA (WARN).

4. **DETECCIÓN DE SESGO DE RECENCIA:**
   - Compara SIEMPRE el rendimiento "Last 5 Games" vs "Season Average".
   - Detecta si un equipo está "Overperforming" su xG (Suerte insostenible).

5. **ANÁLISIS CONTRARIAN (FADE THE PUBLIC):**
   - Busca "betting public percentages". Si >75% del público está en un lado, busca valor en el opuesto.

6. **MATEMÁTICAS DEFENSIVAS:**
   - Define el "Suelo" (Worst Case Scenario) claramente.
   - Verifica las fuentes: Si no proviene de un dominio en la WHITE_LIST, márcalo como "No Verificado".`;