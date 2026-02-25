import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Layers, Zap, Database, ShieldCheck, Code2 } from 'lucide-react';

export default function ArchitectureDoc() {
  return (
    <div className="flex flex-col h-full px-6 pt-4 pb-8 overflow-y-auto no-scrollbar">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold tracking-tight">System Architecture</h2>
        <p className="micro-label text-[10px] mt-1 text-accent">Aura Hi-Res Engine v2.6</p>
      </div>

      <div className="space-y-6">
        {/* Section 0: Elite Features */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-amber-400">
            <Zap size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Elite DSP Suite</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 rounded-2xl bg-amber-400/5 border border-amber-400/10 text-xs text-white/60 leading-relaxed">
              <p className="font-semibold text-amber-400 mb-1">AI Neural Upsampling</p>
              Reconstrução de áudio via <span className="text-white">TensorFlow Lite</span> local. O modelo analisa transientes e harmônicos de alta frequência para restaurar dados perdidos em compressões lossy ou gravações antigas.
            </div>
            <div className="p-4 rounded-2xl bg-emerald-400/5 border border-emerald-400/10 text-xs text-white/60 leading-relaxed">
              <p className="font-semibold text-emerald-400 mb-1">Smart BPM Crossfade</p>
              Algoritmo de detecção de BPM em tempo real. Ajusta a curva de crossfade e o tempo de transição para garantir que o "beat" da próxima faixa se alinhe perfeitamente com a atual.
            </div>
          </div>
        </section>

        {/* Section 1: Audio Engine */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-white/80">
            <Cpu size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Bit-Perfect Engine</h3>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/60 leading-relaxed">
            Implementado via <span className="text-white">AAudio (Android)</span> e <span className="text-white">AudioUnit (iOS)</span> em modo exclusivo. 
            Ignoramos o mixer do sistema operacional para evitar resampling forçado. 
            Suporte nativo para <span className="text-emerald-400">DSD over PCM (DoP)</span> e <span className="text-emerald-400">MQA Unfolding</span>.
          </div>
        </section>

        {/* Section 2: Memory Management */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-white/80">
            <Database size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Zero-Stutter Cache</h3>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/60 leading-relaxed">
            Utilizamos um <span className="text-white">Ring Buffer de 512MB</span> pré-alocado. 
            Arquivos FLAC são decodificados em chunks de 10s para a RAM, garantindo reprodução contínua mesmo em I/O de disco lento.
            IA local prediz a próxima faixa para pré-carregamento (Gapless Playback).
          </div>
        </section>

        {/* Section 3: Library Logic */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-white/80">
            <Layers size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Metadata Indexing</h3>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/60 leading-relaxed">
            Indexador SQL (SQLite) otimizado para <span className="text-white">ID3v2.4</span> e <span className="text-white">Vorbis Comments</span>.
            Suporte híbrido: Navegação por pastas físicas (Filesystem) sincronizada com Biblioteca Virtual (Tags).
          </div>
        </section>

        {/* Section 4: Code Snippet */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-white/80">
            <Code2 size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Audio Processing Loop</h3>
          </div>
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-[10px] text-emerald-400/80 overflow-x-auto">
            <pre>{`// Pseudocode: Bit-Perfect Output
void processAudio(float* buffer, int frames) {
  for (int i = 0; i < frames; i++) {
    // 1. IA Upsampling (if enabled)
    float sample = ai_upsampler.process(buffer[i]);
    
    // 2. 15-Band Parametric EQ
    sample = eq_engine.apply(sample);
    
    // 3. Direct Hardware Write
    hardware_output.write(sample);
  }
}`}</pre>
          </div>
        </section>

        {/* Section 5: Design Tokens */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-white/80">
            <Zap size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Design Tokens</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <p className="micro-label text-[8px]">Primary BG</p>
              <p className="text-xs font-mono">#0A0A0C</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <p className="micro-label text-[8px]">Glass Blur</p>
              <p className="text-xs font-mono">30px / 0.03</p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-white/5 text-center">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">Designed for Audiophiles</p>
      </div>
    </div>
  );
}
