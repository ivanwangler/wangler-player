import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, ListMusic, Info, Zap } from 'lucide-react';
import Player from './components/Player';
import Equalizer from './components/Equalizer';
import Library from './components/Library';
import DSPSettings from './components/DSPSettings';
import ArchitectureDoc from './components/ArchitectureDoc';


export default function App() {
  const [activeTab, setActiveTab] = useState<'player' | 'eq' | 'library' | 'arch' | 'dsp'>('player');
  const [isPlaying, setIsPlaying] = useState(false);
  const [accentColor, setAccentColor] = useState('#EAB308');
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const [trackInfo, setTrackInfo] = useState({
    title: 'No Track Selected',
    artist: 'Upload from Library',
    coverUrl: ''
  });
  const [volume, setVolume] = useState(0.8);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Refs — all persistent, never recreated on tab switch
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Queue
  const [queue, setQueue] = useState([
    { id: 1, title: "Midnight City", artist: "M83", format: "FLAC 24/192", duration: "4:03" },
    { id: 2, title: "Starboy", artist: "The Weeknd", format: "DSD 128", duration: "3:50" },
    { id: 3, title: "Instant Crush", artist: "Daft Punk", format: "WAV 32/384", duration: "5:37" },
  ]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);

  // ─── Initialize AudioContext once (called on first real user gesture) ───────
  const initAudioContext = () => {
    if (audioCtxRef.current || !audioRef.current) return;
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx();
    const analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 256;
    try {
      const src = ctx.createMediaElementSource(audioRef.current);
      src.connect(analyserNode);
      analyserNode.connect(ctx.destination);
      audioCtxRef.current = ctx;
      setAnalyser(analyserNode);
    } catch (err) {
      console.warn('AudioContext init error:', err);
    }
  };

  // ─── Playback: react to audioSource change ────────────────────────────────
  useEffect(() => {
    if (!audioRef.current) return;
    if (audioSource) {
      // audioSource change already updates <audio src> via React render.
      // We need to call load() so the browser picks up the new src,
      // then play().
      audioRef.current.load();
      initAudioContext();
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSource]);

  // ─── Playback: react to isPlaying toggle ──────────────────────────────────
  useEffect(() => {
    if (!audioRef.current || !audioSource) return;
    if (isPlaying) {
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // ─── Volume ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // ─── Cleanup blob URL on change ───────────────────────────────────────────
  useEffect(() => {
    return () => { if (audioSource) URL.revokeObjectURL(audioSource); };
  }, [audioSource]);

  // ─── Track selection ─────────────────────────────────────────────────────
  const handleAddToQueue = (file: File | any) => {
    const newTrack = file instanceof File
      ? { id: Date.now(), title: file.name.replace(/\.[^/.]+$/, ''), artist: 'Local File', isFile: true, file }
      : { ...file, id: Date.now() };
    setQueue([...queue, newTrack]);
  };

  const handlePlayNext = (file: File | any) => {
    const newTrack = file instanceof File
      ? { id: Date.now(), title: file.name.replace(/\.[^/.]+$/, ''), artist: 'Local File', isFile: true, file }
      : { ...file, id: Date.now() };

    const newQueue = [...queue];
    const insertIndex = currentQueueIndex + 1;
    newQueue.splice(insertIndex, 0, newTrack);
    setQueue(newQueue);
  };

  const handleSelectTrack = (file: File | any) => {
    if (audioSource) URL.revokeObjectURL(audioSource);
    if (trackInfo.coverUrl && trackInfo.coverUrl.startsWith('blob:')) {
      URL.revokeObjectURL(trackInfo.coverUrl);
    }

    const processFile = (fileToProcess: File, trackTitle: string, trackArtist: string) => {
      const url = URL.createObjectURL(fileToProcess);
      setAudioSource(url);
      const jsmediatags = (window as any).jsmediatags;
      if (jsmediatags) {
        jsmediatags.read(fileToProcess, {
          onSuccess: (tag: any) => {
            const { title, artist, picture } = tag.tags;
            let coverUrl = '';
            if (picture) {
              const { data, format } = picture;
              const uint8Array = new Uint8Array(data);
              const blob = new Blob([uint8Array], { type: format });
              coverUrl = URL.createObjectURL(blob);
            }
            setTrackInfo({
              title: title || trackTitle,
              artist: artist || trackArtist,
              coverUrl: coverUrl
            });
          },
          onError: (error: any) => {
            console.warn('Error reading tags:', error);
            setTrackInfo({ title: trackTitle, artist: trackArtist, coverUrl: '' });
          }
        });
      } else {
        setTrackInfo({ title: trackTitle, artist: trackArtist, coverUrl: '' });
      }
    };

    if (file instanceof File) {
      processFile(file, file.name.replace(/\.[^/.]+$/, ''), 'Local File');
      setCurrentQueueIndex(-1);
    } else if (file.isFile && file.file) {
      processFile(file.file, file.title, file.artist);
      setCurrentQueueIndex(queue.findIndex(t => t.id === file.id));
    } else {
      setAudioSource(null);
      setTrackInfo({ title: file.title, artist: file.artist, coverUrl: '' });
      setCurrentQueueIndex(queue.findIndex(t => t.id === file.id));
    }
    setActiveTab('player');
    setIsPlaying(true);
  };

  const handleNextTrack = () => {
    if (currentQueueIndex < queue.length - 1) {
      const next = queue[currentQueueIndex + 1];
      if (next.isFile && (next as any).file) {
        handleSelectTrack(next);
      } else {
        setTrackInfo({ title: next.title, artist: next.artist, coverUrl: '' });
        setCurrentQueueIndex(currentQueueIndex + 1);
      }
    }
  };

  const handlePreviousTrack = () => {
    if (currentQueueIndex > 0) {
      const prev = queue[currentQueueIndex - 1];
      if (prev.isFile && (prev as any).file) {
        handleSelectTrack(prev);
      } else {
        setTrackInfo({ title: prev.title, artist: prev.artist, coverUrl: '' });
        setCurrentQueueIndex(currentQueueIndex - 1);
      }
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 relative bg-midnight"
      style={{ '--accent-color': accentColor } as React.CSSProperties}
    >
      {/* Persistent hidden audio element — NEVER conditionally rendered */}
      <audio
        ref={audioRef}
        src={audioSource || undefined}
        onTimeUpdate={() => {/* handled in Player via ref */ }}
        onEnded={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />

      {/* Dynamic Atmospheric Background */}
      <div
        className="atmosphere"
        style={{
          background: `
            radial-gradient(circle at 50% -10%, ${accentColor}25 0%, transparent 60%),
            radial-gradient(circle at 0% 100%, ${accentColor}15 0%, transparent 50%),
            radial-gradient(circle at 100% 100%, ${accentColor}10 0%, transparent 40%)
          `
        }}
      />

      {/* Main App Container */}
      <div className="w-full sm:max-w-md h-[100dvh] sm:h-[850px] sm:max-h-[90vh] sm:rounded-[48px] player-chrome flex flex-col overflow-hidden relative z-10">

        {/* Header */}
        <header className="px-8 pt-6 pb-2 flex items-center justify-between">
          <div>
            <p className="micro-label text-accent opacity-80">
              {(() => {
                const hour = new Date().getHours();
                if (hour >= 5 && hour < 12) return 'Bom dia';
                if (hour >= 12 && hour < 18) return 'Boa tarde';
                return 'Boa noite';
              })()}
            </p>
            <h1 className="text-lg font-display font-bold tracking-tight">Usuário</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab(activeTab === 'arch' ? 'player' : 'arch')}
              className={`p-2 rounded-xl glass-card transition-all ${activeTab === 'arch' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
            >
              <Info size={16} />
            </button>
            <button className="p-2 rounded-xl glass-card text-white/60 hover:text-white transition-all">
              <Settings2 size={16} />
            </button>
          </div>
        </header>

        {/* Top Navigation */}
        <nav className="flex items-center justify-between px-8 py-4">
          <button
            onClick={() => setActiveTab('library')}
            className={`p-2.5 rounded-xl transition-all duration-300 ${activeTab === 'library' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white'}`}
          >
            <ListMusic size={18} />
          </button>

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('player')}
              className={`px-5 py-1.5 rounded-lg text-[9px] font-display font-bold tracking-[0.15em] uppercase transition-all duration-300 ${activeTab === 'player' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'}`}
            >
              Player
            </button>
            <button
              onClick={() => setActiveTab('dsp')}
              className={`px-5 py-1.5 rounded-lg text-[9px] font-display font-bold tracking-[0.15em] uppercase transition-all duration-300 ${activeTab === 'dsp' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'}`}
            >
              DSP
            </button>
          </div>

          <button
            onClick={() => setActiveTab('eq')}
            className={`p-2.5 rounded-xl transition-all duration-300 ${activeTab === 'eq' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white'}`}
          >
            <Zap size={18} />
          </button>
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative no-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'player' && (
              <motion.div
                key="player"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 h-full"
              >
                <Player
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  accentColor={accentColor}
                  audioSource={audioSource}
                  audioRef={audioRef}
                  trackInfo={trackInfo}
                  onNext={handleNextTrack}
                  onPrevious={handlePreviousTrack}
                  volume={volume}
                  setVolume={setVolume}
                  analyser={analyser}
                />
              </motion.div>
            )}
            {activeTab === 'eq' && (
              <motion.div
                key="eq"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 h-full"
              >
                <Equalizer accentColor={accentColor} />
              </motion.div>
            )}
            {activeTab === 'library' && (
              <motion.div
                key="library"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 h-full"
              >
                <Library
                  accentColor={accentColor}
                  onSelectTrack={handleSelectTrack}
                  onPlayNext={handlePlayNext}
                  onAddToQueue={handleAddToQueue}
                  tracks={queue}
                  currentTrackId={queue[currentQueueIndex]?.id}
                />
              </motion.div>
            )}
            {activeTab === 'dsp' && (
              <motion.div
                key="dsp"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 h-full"
              >
                <DSPSettings accentColor={accentColor} />
              </motion.div>
            )}
            {activeTab === 'arch' && (
              <motion.div
                key="arch"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 h-full"
              >
                <ArchitectureDoc />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 flex justify-center border-t border-white/5">
          <p className="micro-label text-[8px] text-white/20 tracking-[0.3em]">
            Criado por <span className="text-accent/40 font-bold">Ivan Wangler</span>
          </p>
        </div>
      </div>
    </div>
  );
}
