import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Save, Activity } from 'lucide-react';

interface EqualizerProps {
  accentColor: string;
}

export default function Equalizer({ accentColor }: EqualizerProps) {
  const bands = [20, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000, 20000];
  const [values, setValues] = useState(bands.map(() => 0));
  const [qFactor, setQFactor] = useState(1.41);

  const handleSliderChange = (index: number, val: number) => {
    const newValues = [...values];
    newValues[index] = val;
    setValues(newValues);
  };

  return (
    <div className="flex flex-col h-full px-6 pt-4 pb-8 overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">Parametric EQ</h2>
          <p className="micro-label text-[9px] mt-1 text-accent">Elite 15-Band Mastering Grade</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setValues(bands.map(() => 0))}
            className="p-2 rounded-full bg-white/5 text-white/50 hover:text-white transition-colors"
          >
            <RotateCcw size={16} />
          </button>
          <button className="p-2 rounded-full bg-white/5 text-white/50 hover:text-white transition-colors">
            <Save size={16} />
          </button>
        </div>
      </div>

      {/* EQ Visualization */}
      <div className="w-full h-32 glass-card rounded-[32px] border border-white/5 mb-8 relative overflow-hidden">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`M 0 64 ${values.map((v, i) => `L ${(i / (values.length - 1)) * 100}% ${64 - v * 4}`).join(' ')} L 100% 64 L 100% 128 L 0 128 Z`}
            fill="url(#eqGradient)"
            className="transition-all duration-300"
          />
          <path
            d={`M 0 64 ${values.map((v, i) => `L ${(i / (values.length - 1)) * 100}% ${64 - v * 4}`).join(' ')} L 100% 64`}
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            className="transition-all duration-300 shadow-[0_0_10px_rgba(0,212,255,0.5)]"
          />
          {/* Grid lines */}
          {[1, 2, 3].map(i => (
            <line key={i} x1="0" y1={i * 32} x2="100%" y2={i * 32} stroke="white" strokeOpacity="0.05" />
          ))}
        </svg>
      </div>

      {/* EQ Sliders */}
      <div className="flex-1 flex justify-between items-end pb-4 overflow-x-auto no-scrollbar min-h-[250px]">
        {bands.map((freq, i) => (
          <div key={freq} className="flex flex-col items-center space-y-4 px-0.5">
            <span className="micro-label text-[7px] rotate-[-90deg] h-8 flex items-center whitespace-nowrap">
              {freq >= 1000 ? `${freq/1000}k` : freq}Hz
            </span>
            <div className="relative h-40 w-5 flex justify-center">
               <div className="absolute inset-y-0 w-[1px] bg-white/10" />
               <input 
                type="range" 
                min="-12" 
                max="12" 
                step="0.1"
                value={values[i]}
                onChange={(e) => handleSliderChange(i, parseFloat(e.target.value))}
                className="eq-slider appearance-none bg-transparent cursor-pointer z-10"
                style={{ 
                  WebkitAppearance: 'slider-vertical',
                  height: '100%',
                  width: '100%'
                } as any}
              />
              {/* Custom Thumb indicator */}
              <div 
                className="absolute w-2.5 h-1 bg-white rounded-full pointer-events-none transition-all duration-75"
                style={{ 
                  bottom: `${((values[i] + 12) / 24) * 100}%`,
                  boxShadow: `0 0 8px ${accentColor}`
                }}
              />
            </div>
            <span className="timecode text-[7px] w-5 text-center">
              {values[i] > 0 ? '+' : ''}{values[i].toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      {/* Q-Factor Control */}
      <div className="mt-8 p-5 rounded-[32px] glass-card border border-white/5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <span className="micro-label">Q-Factor</span>
            <span className="text-[8px] text-white/20 font-mono">(Resonance)</span>
          </div>
          <span className="timecode text-xs text-accent font-bold">{qFactor.toFixed(2)}</span>
        </div>
        <input 
          type="range" 
          min="0.1" 
          max="10.0" 
          step="0.01"
          value={qFactor}
          onChange={(e) => setQFactor(parseFloat(e.target.value))}
          className="w-full accent-accent"
        />
        <div className="flex justify-between mt-2">
          <span className="text-[8px] text-white/10 uppercase font-bold tracking-widest">Wide</span>
          <span className="text-[8px] text-white/10 uppercase font-bold tracking-widest">Narrow</span>
        </div>
      </div>

      <div className="mt-4 flex items-center space-x-3 text-white/30">
        <Activity size={14} />
        <span className="micro-label text-[8px]">Real-time Phase Correction: Active</span>
      </div>
    </div>
  );
}
