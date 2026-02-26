import React from 'react';
import { motion } from 'motion/react';
import { Palette, Trash2, ShieldCheck, ChevronRight, Laptop } from 'lucide-react';
import { clearAllTracks } from '../utils/db';

interface SettingsProps {
    accentColor: string;
    setAccentColor: (color: string) => void;
}

const PRESET_COLORS = [
    { name: 'Gold', value: '#EAB308' },
    { name: 'Purple', value: '#A855F7' },
    { name: 'Rose', value: '#F43F5E' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Emerald', value: '#10B981' },
];

export default function Settings({ accentColor, setAccentColor }: SettingsProps) {
    const handleClearLibrary = async () => {
        if (confirm('Tem certeza que deseja apagar toda a biblioteca permanentemente?')) {
            await clearAllTracks();
            window.location.reload();
        }
    };

    return (
        <div className="flex flex-col h-full px-8 pt-4 pb-12 overflow-y-auto no-scrollbar bg-black/40 backdrop-blur-3xl">
            <div className="mb-10 text-center">
                <h2 className="text-3xl font-display font-bold tracking-tight text-white/90">Aura Settings</h2>
                <p className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold mt-2">Versão 1.0.0 Pro</p>
            </div>

            <div className="space-y-8">
                {/* Appearance Section */}
                <section>
                    <div className="flex items-center space-x-3 mb-4">
                        <Palette size={18} className="text-accent" />
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-display font-bold text-white/40">Customização</h3>
                    </div>
                    <div className="glass-card rounded-[32px] p-6 border-white/5 space-y-6">
                        <div>
                            <p className="text-xs font-bold text-white/80 mb-4">Cor de Destaque (Accent)</p>
                            <div className="flex flex-wrap gap-4">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => setAccentColor(color.value)}
                                        className={`w-10 h-10 rounded-full transition-all border-2 flex items-center justify-center ${accentColor === color.value ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    >
                                        {accentColor === color.value && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Management Section */}
                <section>
                    <div className="flex items-center space-x-3 mb-4">
                        <Laptop size={18} className="text-accent" />
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-display font-bold text-white/40">Gerenciamento de Dados</h3>
                    </div>
                    <div className="glass-card rounded-[32px] p-2 border-white/5 overflow-hidden">
                        <button
                            onClick={handleClearLibrary}
                            className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 transition-all group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
                                    <Trash2 size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-bold text-white/90">Limpar Biblioteca</p>
                                    <p className="text-[9px] text-white/30">Apagar todos os dados do IndexedDB</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-white/10 group-hover:text-red-500" />
                        </button>
                    </div>
                </section>

                {/* Legal / About Section */}
                <section>
                    <div className="flex items-center space-x-3 mb-4">
                        <ShieldCheck size={18} className="text-accent" />
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-display font-bold text-white/40">Sobre</h3>
                    </div>
                    <div className="glass-card rounded-[32px] p-6 border-white/5 text-center">
                        <p className="text-[11px] leading-relaxed text-white/40 italic font-medium">
                            "Dedicated to the pursuit of pure, unadulterated sound. High Fidelity is not a preference, it's a standard."
                        </p>
                        <div className="h-px w-12 bg-accent/20 mx-auto my-6" />
                        <p className="text-[10px] font-bold text-accent tracking-[0.1em]">Ivan Wangler Architecture</p>
                    </div>
                </section>
            </div>

            <div className="mt-12 text-center opacity-20 hover:opacity-100 transition-opacity cursor-default">
                <p className="text-[8px] uppercase tracking-[0.5em] font-bold">Premium High Fidelity Hub</p>
            </div>
        </div>
    );
}
