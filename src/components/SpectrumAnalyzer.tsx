import React, { useRef, useEffect } from 'react';

interface SpectrumAnalyzerProps {
  isPlaying: boolean;
  accentColor: string;
  analyser: AnalyserNode | null;
}

export default function SpectrumAnalyzer({ isPlaying, accentColor, analyser }: SpectrumAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bars = 64;
    const dataArray = new Uint8Array(bars);
    const data = new Array(bars).fill(0);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bars) - 1;
      
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      }

      for (let i = 0; i < bars; i++) {
        // Use real data if available, otherwise decay
        if (analyser && isPlaying) {
          const target = (dataArray[i] / 255) * canvas.height * 0.8;
          data[i] += (target - data[i]) * 0.3; // Smooth transition
        } else {
          data[i] *= 0.85; // Decay
        }

        const x = i * (barWidth + 1);
        const y = canvas.height - data[i];
        
        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, `${accentColor}40`);
        gradient.addColorStop(1, accentColor);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, Math.max(2, data[i]), [2, 2, 0, 0]);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, accentColor, analyser]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={80} 
      className="w-full h-20 opacity-80"
    />
  );
}
