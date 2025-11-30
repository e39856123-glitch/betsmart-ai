import React, { useState, useEffect } from 'react';
import { UserDirectory, UserProfile } from '../types';

interface AuthScreenProps {
    onLogin: (user: string) => void;
    onGuest: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onGuest }) => {
    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");
    const [bank, setBank] = useState("1000");
    const [view, setView] = useState<'list' | 'login' | 'register'>('list');
    const [directory, setDirectory] = useState<UserDirectory>({});

    useEffect(() => {
        const saved = localStorage.getItem('betsmart_users_directory');
        if (saved) setDirectory(JSON.parse(saved));
    }, []);

    const register = () => {
        if (!user || !pass) return;
        const newDir = {
            ...directory,
            [user]: { username: user, password: pass, created: new Date().toISOString(), startingBankroll: parseFloat(bank) }
        };
        setDirectory(newDir);
        localStorage.setItem('betsmart_users_directory', JSON.stringify(newDir));
        localStorage.setItem(`betsmart_${user}`, JSON.stringify([]));
        onLogin(user);
    };

    const login = () => {
        if (directory[user] && directory[user].password === pass) onLogin(user);
    };

    if (view === 'list') return (
        <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-6">
            <h1 className="text-3xl font-black text-white mb-8">BETSMART <span className="text-emerald-400">OS</span></h1>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-6">
                {Object.values(directory).map((u: UserProfile) => (
                    <button key={u.username} onClick={() => { setUser(u.username); setView('login') }} className="p-4 bg-slate-900 border border-slate-700 rounded-xl hover:border-emerald-500 text-slate-300 font-bold">
                        {u.username}
                    </button>
                ))}
                <button onClick={() => setView('register')} className="p-4 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-white flex flex-col items-center justify-center">
                    <i className="fas fa-plus mb-1"></i> Crear
                </button>
            </div>
            <button onClick={onGuest} className="text-slate-500 text-xs uppercase tracking-widest hover:text-white">Modo Invitado</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">{view === 'login' ? `Hola, ${user}` : 'Nuevo Analista'}</h2>
                <div className="space-y-4">
                    {view === 'register' && (
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Usuario</label>
                            <input 
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none transition-colors" 
                                placeholder="Nombre de Usuario" 
                                value={user} 
                                onChange={e => setUser(e.target.value)} 
                            />
                        </div>
                    )}
                    
                    {view === 'register' && (
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Capital Inicial</label>
                            <div className="relative group">
                                <span className="absolute left-3 top-3 text-emerald-500 font-bold group-focus-within:text-emerald-400">$</span>
                                <input 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-7 text-white appearance-none focus:border-emerald-500 focus:outline-none transition-colors" 
                                    placeholder="1000" 
                                    type="number" 
                                    step="any"
                                    value={bank} 
                                    onChange={e => setBank(e.target.value)} 
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 ml-1 italic">Este será tu bankroll base para gestionar el riesgo.</p>
                        </div>
                    )}
                    
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Contraseña</label>
                        <input 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none transition-colors" 
                            placeholder="••••••" 
                            type="password" 
                            value={pass} 
                            onChange={e => setPass(e.target.value)} 
                        />
                    </div>
                    
                    <div className="pt-2">
                        <button onClick={view === 'login' ? login : register} className="w-full bg-emerald-600 hover:bg-emerald-500 p-3 rounded-lg font-bold text-white uppercase transition-colors shadow-lg shadow-emerald-900/20">
                            {view === 'login' ? 'Entrar al Sistema' : 'Crear Cuenta'}
                        </button>
                        <button onClick={() => setView('list')} className="w-full text-slate-500 text-xs mt-3 hover:text-slate-300 transition-colors">Cancelar y Volver</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;