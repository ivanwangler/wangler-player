import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Sparkles, Timer, Activity, BrainCircuit, Waves } from 'lucide-react';

interface DSPSettingsProps {
  accentColor: string;
}

export default function DSPSettings({ accentColor }: DSPSettingsProps) {
  const [aiUpsampling, setAiUpsampling] = useState(true);
  const [upsamplingLevel, setUpsamplingLevel] = useState(2); // 2x, 4x, 8x
  const [smartCrossfade, setSmartCrossfade] = useState(true);
  const [crossfadeDuration, setCrossfadeDuration] = useState(3.5);
  const [phaseCorrection, setPhaseCorrection] = useState(true);

  return (
    <div className="flex flex-col h-full px-6 pt-4 pb-8 overflow-y-auto no-scrollbar">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold tracking-tight">Elite DSP Engine</h2>
        <p className="micro-label text-[9px] mt-1 text-accent">Neural Audio Processing Active</p>
      </div>

      <div className="space-y-6">
        {/* AI Upsampling Section */}
        <section className="p-6 rounded-[32px] glass-card border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-2xl ${aiUpsampling ? 'bg-accent/20 text-accent shadow-[0_0_15px_rgba(0,212,255,0.3)]' : 'bg-white/5 text-white/20'}`}>
                <BrainCircuit size={20} />
              </div>
              <div>
                <h3 className="text-sm font-display font-bold tracking-tight">AI Neural Upsampling</h3>
                <p className="text-[10px] text-white/30 font-medium">Neural reconstruction of lost harmonics</p>
              </div>
            </div>
            <button 
              onClick={() => setAiUpsampling(!aiUpsampling)}
              className={`w-12 h-6 rounded-full relative transition-colors ${aiUpsampling ? 'bg-accent' : 'bg-white/10'}`}
            >
              <motion.div 
                animate={{ x: aiUpsampling ? 26 : 2 }}
                className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>

          {aiUpsampling && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-2"
            >
              <div className="flex justify-between items-center">
                <span className="micro-label">Reconstruction Level</span>
                <span className="timecode text-accent font-bold">{upsamplingLevel}x HD</span>
              </div>
              <div className="flex space-x-2">
                {[2, 4, 8].map(level => (
                  <button 
                    key={level}
                    onClick={() => setUpsamplingLevel(level)}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-mono font-bold transition-all ${upsamplingLevel === level ? 'bg-white/10 text-white border border-white/20 shadow-lg' : 'bg-white/5 text-white/20 border border-transparent'}`}
                  >
                    {level}X
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2 text-[9px] text-accent/60 bg-accent/5 p-2.5 rounded-xl">
                <Sparkles size={12} />
                <span>AI model optimized for local NPU execution</span>
              </div>
            </motion.div>
          )}
        </section>

        {/* Smart Crossfade Section */}
        <section className="p-6 rounded-[32px] glass-card border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-2xl ${smartCrossfade ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 text-white/20'}`}>
                <Waves size={20} />
              </div>
              <div>
                <h3 className="text-sm font-display font-bold tracking-tight">BPM-Sync Crossfade</h3>
                <p className="text-[10px] text-white/30 font-medium">Intelligent transition based on tempo</p>
              </div>
            </div>
            <button 
              onClick={() => setSmartCrossfade(!smartCrossfade)}
              className={`w-12 h-6 rounded-full relative transition-colors ${smartCrossfade ? 'bg-blue-500' : 'bg-white/10'}`}
            >
              <motion.div 
                animate={{ x: smartCrossfade ? 26 : 2 }}
                className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>

          {smartCrossfade && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-2"
            >
              <div className="flex justify-between items-center">
                <span className="micro-label">Transition Window</span>
                <span className="timecode text-blue-400 font-bold">{crossfadeDuration}s</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="10.0" 
                step="0.1"
                value={crossfadeDuration}
                onChange={(e) => setCrossfadeDuration(parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex items-center space-x-2 text-[9px] text-blue-400/60 bg-blue-400/5 p-2.5 rounded-xl">
                <Timer size={12} />
                <span>Analyzing BPM of next track: 124 BPM</span>
              </div>
            </motion.div>
          )}
        </section>

        {/* Phase Correction Section */}
        <section className="p-6 rounded-[32px] glass-card border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-2xl ${phaseCorrection ? 'bg-accent/20 text-accent shadow-[0_0_15px_rgba(0,212,255,0.3)]' : 'bg-white/5 text-white/20'}`}>
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-sm font-display font-bold tracking-tight">Phase Correction</h3>
                <p className="text-[10px] text-white/30 font-medium">Linear phase alignment for Hi-Res</p>
              </div>
            </div>
            <button 
              onClick={() => setPhaseCorrection(!phaseCorrection)}
              className={`w-12 h-6 rounded-full relative transition-colors ${phaseCorrection ? 'bg-accent' : 'bg-white/10'}`}
            >
              <motion.div 
                animate={{ x: phaseCorrection ? 26 : 2 }}
                className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>
        </section>

        {/* Real-time Stats */}
        <div className="mt-4 p-5 rounded-[32px] glass-card border border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity size={16} className="text-accent" />
            <div>
              <p className="micro-label text-[8px] opacity-40">DSP Load</p>
              <p className="timecode text-[10px] font-bold">12.4% @ 384kHz</p>
            </div>
          </div>
          <div className="text-right">
            <p className="micro-label text-[8px] opacity-40">Latency</p>
            <p className="timecode text-[10px] text-accent font-bold">0.8ms</p>
          </div>
        </div>
      </div>
    </div>
  );
}
