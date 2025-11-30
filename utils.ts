
import { Currency, Bet } from "./types";

// Función auxiliar para redondeo preciso a 2 decimales (evita errores de coma flotante)
export const roundToTwo = (num: number) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const formatCurrency = (amount: number, currency: Currency) => {
    if (currency === 'COP') {
        return new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: 'COP', 
            minimumFractionDigits: 0,
            maximumFractionDigits: 2 
        }).format(amount);
    }
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD', 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

export const cumulativeDistribution = (mean: number, stdDev: number, value: number) => {
    if (stdDev === 0) return value < mean ? 0 : 1;
    const erf = (x: number) => {
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        const sign = (x < 0) ? -1 : 1;
        x = Math.abs(x);
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return sign * y;
    };
    return 0.5 * (1 + erf((value - mean) / (stdDev * Math.sqrt(2))));
};

export const exportToCSV = (bets: Bet[], username: string) => {
    const headers = ["ID", "Date", "Event", "Pick", "Odds", "ClosingOdds", "Stake", "Status", "Profit", "CLV_Edge%"];
    
    const rows = bets.map(b => {
        const profit = b.status === 'won' ? (b.stake * b.odds) - b.stake : b.status === 'lost' ? -b.stake : 0;
        const clv = b.closingOdds ? (((b.odds / b.closingOdds) - 1) * 100).toFixed(2) : "0";
        
        return [
            b.id,
            b.date,
            `"${b.event}"`, // Escape quotes
            `"${b.pick}"`,
            b.odds,
            b.closingOdds || "",
            b.stake,
            b.status,
            profit.toFixed(2),
            clv
        ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `betsmart_${username}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
