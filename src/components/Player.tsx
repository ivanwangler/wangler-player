import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Languages } from 'lucide-react';
import SpectrumAnalyzer from './SpectrumAnalyzer';

interface PlayerProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  accentColor: string;
  audioSource: string | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  trackInfo: { title: string; artist: string };
  onNext: () => void;
  onPrevious: () => void;
  volume: number;
  setVolume: (v: number) => void;
  analyser: AnalyserNode | null;
}

interface LyricLine {
  time: number; // ms
  text: string;
}

const mockLyrics: LyricLine[] = [
  { time: 0, text: "You own the city" },
  { time: 3000, text: "The city owns you" },
  { time: 6000, text: "Midnight city" },
  { time: 9000, text: "Waiting for the sun" },
  { time: 12000, text: "To come and take us home" },
  { time: 15000, text: "Looking at the stars" },
  { time: 18000, text: "Waiting for a sign" },
  { time: 21000, text: "Midnight city" },
  { time: 24000, text: "The neon lights are calling" },
  { time: 27000, text: "In the rhythm of the night" },
  { time: 30000, text: "We are the dreamers" },
  { time: 33000, text: "Hurry up, we're dreaming" },
];

export default function Player({
  isPlaying,
  setIsPlaying,
  accentColor,
  audioSource,
  audioRef,
  trackInfo,
  onNext,
  onPrevious,
  volume,
  setVolume,
  analyser,
}: PlayerProps) {
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const lyricsRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-100, 100], [-10, 10]);
  const opacity = useTransform(x, [-150, -100, 0, 100, 150], [0, 0.5, 1, 0.5, 0]);

  // Subscribe to the persistent audio element's time/duration events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTimeMs(audio.currentTime * 1000);
    const onLoadedMetadata = () => setDurationMs(audio.duration * 1000);
    const onEnded = () => { setIsPlaying(false); setCurrentTimeMs(0); };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioRef, setIsPlaying]);

  // Seek on progress bar click
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !durationMs) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * (durationMs / 1000);
  };

  // Reset time display when source changes
  useEffect(() => {
    setCurrentTimeMs(0);
    setDurationMs(0);
  }, [audioSource]);

  // Lyrics scroll sync
  useEffect(() => {
    if (showLyrics && lyricsRef.current) {
      const idx = mockLyrics.findIndex((l, i) =>
        currentTimeMs >= l.time && (i === mockLyrics.length - 1 || currentTimeMs < mockLyrics[i + 1].time)
      );
      if (idx !== -1) {
        const el = lyricsRef.current.children[idx] as HTMLElement;
        if (el) {
          lyricsRef.current.scrollTo({
            top: el.offsetTop - lyricsRef.current.clientHeight / 2 + el.clientHeight / 2,
            behavior: 'smooth',
          });
        }
      }
    }
  }, [currentTimeMs, showLyrics]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) onPrevious();
    if (info.offset.x < -100) onNext();
  };

  const formatTime = (ms: number) =>
    `${Math.floor(ms / 60000)}:${Math.floor((ms % 60000) / 1000).toString().padStart(2, '0')}`;

  const progressPercent = durationMs > 0 ? (currentTimeMs / durationMs) * 100 : 0;

  return (
    <div className="flex flex-col min-h-full h-auto px-8 pt-4 pb-8 relative overflow-hidden no-scrollbar">

      {/* Album Art + Lyrics */}
      <div className="flex-1 flex flex-col items-center justify-start pt-4 relative">
        <motion.div
          style={{ x, rotate, opacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className="relative w-full aspect-square max-w-[220px] group cursor-grab active:cursor-grabbing"
        >
          <div
            className="absolute inset-0 rounded-[28px] blur-[30px] opacity-30 transition-colors duration-1000"
            style={{ backgroundColor: accentColor }}
          />
          <img
            src={trackInfo.title === 'No Track Selected' ? 'https://i.postimg.cc/W4ND1Ypt/aguia.webp' : 'https://picsum.photos/seed/music/600/600'}
            alt="Album Art"
            className="w-full h-full object-cover rounded-[28px] shadow-[0_15px_40px_rgba(0,0,0,0.5)] relative z-10 border border-white/10"
            referrerPolicy="no-referrer"
          />
          {/* Lyrics toggle - nested to avoid overlap */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowLyrics(!showLyrics); }}
            className={`absolute bottom-4 right-4 p-3 rounded-full transition-all z-30 shadow-lg ${showLyrics ? 'bg-white text-black' : 'bg-black/40 text-white/70 hover:text-white backdrop-blur-md border border-white/10'}`}
          >
            <Languages size={18} />
          </button>
        </motion.div>



        {/* Floating Lyrics */}
        <AnimatePresence>
          {showLyrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-0 z-20 bg-black/50 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col p-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="micro-label text-[10px] text-white/40">Synchronized Lyrics</span>
                <span className="timecode text-[10px] text-emerald-400">±1ms Sync</span>
              </div>
              <div
                ref={lyricsRef}
                className="flex-1 overflow-y-auto no-scrollbar"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
                }}
              >
                <div className="py-[50%] space-y-8">
                  {mockLyrics.map((line, i) => {
                    const isActive = currentTimeMs >= line.time &&
                      (i === mockLyrics.length - 1 || currentTimeMs < mockLyrics[i + 1].time);
                    return (
                      <motion.p
                        key={i}
                        animate={{ opacity: isActive ? 1 : 0.2, scale: isActive ? 1.05 : 1 }}
                        className="text-xl font-medium leading-relaxed"
                        style={{ textShadow: isActive ? `0 0 20px ${accentColor}40` : 'none' }}
                      >
                        {line.text}
                      </motion.p>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Track Info */}
        <div className="mt-4 text-center">
          <motion.h2
            key={trackInfo.title}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-xl font-display font-bold tracking-tight"
          >
            {trackInfo.title}
          </motion.h2>
          <motion.p
            key={trackInfo.artist}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-white/30 text-[9px] mt-0.5 uppercase tracking-[0.3em] font-mono font-medium"
          >
            {trackInfo.artist}
          </motion.p>
        </div>
      </div>

      {/* Spectrum Analyzer */}
      <div className="my-4">
        <SpectrumAnalyzer isPlaying={isPlaying} accentColor={accentColor} analyser={analyser} />
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 px-2">
        <div
          className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden cursor-pointer"
          onClick={handleSeek}
        >
          <motion.div
            className="absolute top-0 left-0 h-full shadow-[0_0_15px_rgba(0,212,255,0.5)] pointer-events-none"
            style={{ width: `${progressPercent}%`, backgroundColor: accentColor }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="timecode text-white/30">{formatTime(currentTimeMs)}</span>
          <div className="flex items-center space-x-3">
            <span className="micro-label px-2 py-0.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-[8px]">HI-RES</span>
            <span className="micro-label px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/30 text-[8px]">24-BIT</span>
          </div>
          <span className="timecode text-white/30">{formatTime(durationMs)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between px-4">
        <button
          onClick={() => setIsShuffle(!isShuffle)}
          className={`transition-colors ${isShuffle ? 'text-accent' : 'text-white/20 hover:text-white'}`}
        >
          <Shuffle size={16} />
        </button>

        <div className="flex items-center space-x-6">
          <button onClick={onPrevious} className="text-white/60 hover:text-white transition-all hover:scale-110 active:scale-95">
            <SkipBack size={24} fill="currentColor" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 btn-neon hover:scale-105 active:scale-90"
          >
            {isPlaying
              ? <Pause size={24} fill="white" className="text-white" />
              : <Play size={24} fill="white" className="text-white ml-1" />
            }
          </button>

          <button onClick={onNext} className="text-white/60 hover:text-white transition-all hover:scale-110 active:scale-95">
            <SkipForward size={24} fill="currentColor" />
          </button>
        </div>

        <button
          onClick={() => setIsRepeat(!isRepeat)}
          className={`transition-colors ${isRepeat ? 'text-accent' : 'text-white/20 hover:text-white'}`}
        >
          <Repeat size={16} />
        </button>
      </div>

      {/* Volume Control */}
      <div className="mt-3 px-4 flex items-center space-x-3">
        <Volume2 size={16} className="text-white/40 shrink-0" />
        <div className="flex-1 h-1 bg-white/5 rounded-full relative overflow-hidden cursor-pointer">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
          />
          <div className="h-full transition-all pointer-events-none" style={{ width: `${volume * 100}%`, backgroundColor: accentColor }} />
        </div>
      </div>

      {/* Up Next */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[8px] font-display font-bold uppercase tracking-[0.2em] text-white/40">Up Next</h3>
          <button className="text-[8px] font-display font-bold uppercase tracking-[0.2em] text-accent">View All</button>
        </div>
        <div className="flex items-center space-x-3 p-2 rounded-2xl glass-card border-white/5">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <img src="https://picsum.photos/seed/next/100/100" alt="Next" className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-display font-bold truncate">Starboy</p>
            <p className="text-[8px] text-white/30 font-medium truncate">The Weeknd • Starboy</p>
          </div>
          <Volume2 size={12} className="text-white/20" />
        </div>
      </div>
    </div>
  );
}
