import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, ListMusic, Info, Zap } from 'lucide-react';
import Player from './components/Player';
import Equalizer from './components/Equalizer';
import Library from './components/Library';
import DSPSettings from './components/DSPSettings';
import Settings from './components/Settings';
import ArchitectureDoc from './components/ArchitectureDoc';
import { getAllTracks, saveTrack, deleteTrack } from './utils/db';

const extractDominantColor = (imageUrl: string, fallback: string = '#EAB308'): Promise<string> => {
  return new Promise((resolve) => {
    if (!imageUrl || imageUrl === 'https://i.postimg.cc/W4ND1Ypt/aguia.webp') {
      resolve(fallback);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(fallback);
        return;
      }

      canvas.width = 50;
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);

      try {
        const imageData = ctx.getImageData(0, 0, 50, 50).data;
        let r = 0, g = 0, b = 0, count = 0;

        // Simple pixel average
        for (let i = 0; i < imageData.length; i += 16) {
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
          count++;
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        // Boost saturation for better UI pop
        const max = Math.max(r, g, b);
        if (max > 0) {
          const multiplier = 255 / max;
          r = Math.min(255, Math.floor(r * multiplier * 0.8));
          g = Math.min(255, Math.floor(g * multiplier * 0.8));
          b = Math.min(255, Math.floor(b * multiplier * 0.8));
        }

        resolve(`rgb(${r}, ${g}, ${b})`);
      } catch (e) {
        resolve(fallback);
      }
    };
    img.onerror = () => resolve(fallback);
    img.src = imageUrl;
  });
};


export default function App() {
  const [activeTab, setActiveTab] = useState<'player' | 'eq' | 'library' | 'arch' | 'dsp' | 'settings'>('player');
  const [isPlaying, setIsPlaying] = useState(false);
  const [accentColor, setAccentColor] = useState('#EAB308');
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const [trackInfo, setTrackInfo] = useState({
    title: 'No Track Selected',
    artist: 'Upload from Library',
    coverUrl: '',
    lyrics: ''
  });
  const [volume, setVolume] = useState(0.8);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isHiRes, setIsHiRes] = useState(false);
  const [is24Bit, setIs24Bit] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  // Refs — all persistent, never recreated on tab switch
  const audioRef = useRef<HTMLAudioElement>(null);
  const crossfadeAudioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [isCrossfading, setIsCrossfading] = useState(false);

  // Queue and Library
  const [queue, setQueue] = useState<any[]>([]);
  const [libraryTracks, setLibraryTracks] = useState<any[]>([]);
  const [recentTracks, setRecentTracks] = useState<any[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // EQ & DSP State
  const [eqGains, setEqGains] = useState<number[]>(new Array(15).fill(0));
  const [qFactor, setQFactor] = useState(1.41);
  const [dspSettings, setDspSettings] = useState({
    aiUpsampling: true,
    upsamplingLevel: 2,
    smartCrossfade: true,
    crossfadeDuration: 3.5,
    phaseCorrection: true
  });

  // ─── Initialize AudioContext once (called on first real user gesture) ───────
  const initAudioContext = () => {
    if (audioCtxRef.current || !audioRef.current) return;
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx();

    // Create Analyser
    const analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 256;

    // Create EQ nodes
    const bands = [20, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000, 20000];
    const filters = bands.map((freq) => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = qFactor;
      filter.gain.value = 0;
      return filter;
    });

    // Create DSP nodes
    const compression = ctx.createDynamicsCompressor();
    compression.threshold.setValueAtTime(-24, ctx.currentTime);
    compression.knee.setValueAtTime(30, ctx.currentTime);
    compression.ratio.setValueAtTime(12, ctx.currentTime);
    compression.attack.setValueAtTime(0.003, ctx.currentTime);
    compression.release.setValueAtTime(0.25, ctx.currentTime);

    try {
      const src = ctx.createMediaElementSource(audioRef.current);

      // Chain: Source -> Filters -> Compression -> Analyser -> Destination
      let lastNode: AudioNode = src;
      filters.forEach(f => {
        lastNode.connect(f);
        lastNode = f;
      });
      lastNode.connect(compression);
      compression.connect(analyserNode);
      analyserNode.connect(ctx.destination);

      audioCtxRef.current = ctx;
      setAnalyser(analyserNode);

      // Store filters in ref for real-time updates
      (window as any)._audioFilters = filters;
      (window as any)._audioCompressor = compression;

    } catch (err) {
      console.warn('AudioContext init error:', err);
    }
  };

  // Sync EQ Gains to nodes
  useEffect(() => {
    const filters = (window as any)._audioFilters;
    if (filters) {
      eqGains.forEach((gain, i) => {
        if (filters[i]) filters[i].gain.setTargetAtTime(gain, audioCtxRef.current?.currentTime || 0, 0.05);
      });
    }
  }, [eqGains]);

  useEffect(() => {
    const filters = (window as any)._audioFilters as BiquadFilterNode[];
    if (filters) {
      filters.forEach(f => f.Q.setTargetAtTime(qFactor, audioCtxRef.current?.currentTime || 0, 0.05));
    }
  }, [qFactor]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Load tracks from IndexedDB and auto-select last played
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const storedTracks = await getAllTracks();
        if (storedTracks.length > 0) {
          setLibraryTracks(storedTracks);

          // Check for last played track
          const lastPlayedId = localStorage.getItem('lastPlayedTrackId');
          if (lastPlayedId) {
            const track = storedTracks.find(t => t.id === Number(lastPlayedId));
            if (track) {
              // Initial load without autoplay
              handleSelectTrack(track, false);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load library:', err);
      }
    };
    loadLibrary();
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  // ─── Android Back Button Interception ─────────────────────────────────────────
  useEffect(() => {
    // Push an initial state so the back button doesn't close the app by default
    window.history.pushState({ noBackExitsApp: true }, '');

    const handlePopState = (e: PopStateEvent) => {
      // Whenever the user presses "Back", they pop our dummy state.
      // We immediately push it back again so the app stays open.
      window.history.pushState({ noBackExitsApp: true }, '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ─── Media Session API (Background Audio on OS) ───────────────────────────
  useEffect(() => {
    if ('mediaSession' in navigator && audioSource) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: trackInfo.title,
        artist: trackInfo.artist,
        artwork: trackInfo.coverUrl ? [
          { src: trackInfo.coverUrl, sizes: '512x512', type: 'image/jpeg' },
          { src: trackInfo.coverUrl, sizes: '512x512', type: 'image/png' },
          { src: trackInfo.coverUrl, sizes: '512x512', type: 'image/webp' }
        ] : []
      });

      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('previoustrack', handlePreviousTrack);
      navigator.mediaSession.setActionHandler('nexttrack', handleNextTrack);
    }
  }, [trackInfo, audioSource]); // Hook relies on track info natively so OS notifications update

  // ─── Playback: react to audioSource change ────────────────────────────────
  useEffect(() => {
    if (!audioRef.current) return;
    if (audioSource && !isCrossfading) {
      // audioSource change already updates <audio src> via React render.
      // We need to call load() so the browser picks up the new src,
      // then play().
      audioRef.current.load();
      initAudioContext();
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else if (!isCrossfading) {
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
    if (audioRef.current && !isCrossfading) audioRef.current.volume = volume;
  }, [volume, isCrossfading]);

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

  const handleSelectTrack = (file: File | any, shouldPlay: boolean = true) => {
    if (audioSource) URL.revokeObjectURL(audioSource);
    if (trackInfo.coverUrl && trackInfo.coverUrl.startsWith('blob:')) {
      URL.revokeObjectURL(trackInfo.coverUrl);
    }

    // Save playing track to local storage
    if (file && file.id) {
      localStorage.setItem('lastPlayedTrackId', file.id.toString());
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
              coverUrl: coverUrl,
              lyrics: fileToProcess.type === 'audio/unknown' ? '' : (file as any).lyrics || '' // default empty if local, wait for state map
            });
            if (coverUrl) {
              extractDominantColor(coverUrl).then(setAccentColor);
            } else {
              setAccentColor('#EAB308');
            }
          },
          onError: (error: any) => {
            console.warn('Error reading tags:', error);
            setTrackInfo({ title: trackTitle, artist: trackArtist, coverUrl: '', lyrics: (file as any).lyrics || '' });
          }
        });
      } else {
        setTrackInfo({ title: trackTitle, artist: trackArtist, coverUrl: '', lyrics: (file as any).lyrics || '' });
        // Fallback to AI Cover if not in history or similar
        fetchAICover(trackTitle, trackArtist);
      }
    };

    const fetchAICover = async (title: string, artist: string) => {
      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
      if (!apiKey) return;

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `Generate a short search query for the album cover of "${title}" by "${artist}". Return ONLY the query string, e.g. "Abbey Road Beatles". No quotes.` }]
            }]
          })
        });
        const data = await response.json();
        const query = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || `${title} ${artist}`;
        // Using LoremFlickr for stable, tag-based music imagery
        const dynamicUrl = `https://loremflickr.com/800/800/music,album,${encodeURIComponent(query.replace(/\s+/g, ','))}/all`;

        setTrackInfo(prev => ({
          ...prev,
          coverUrl: dynamicUrl
        }));
        extractDominantColor(dynamicUrl).then(setAccentColor);
      } catch (err) {
        console.warn('AI Cover error:', err);
      }
    };

    if (file instanceof File) {
      processFile(file, file.name.replace(/\.[^/.]+$/, ''), 'Local File');
      // If we just played a single file, make sure it's in a temporary queue context or similar
      const newTrack = { id: Date.now(), title: file.name.replace(/\.[^/.]+$/, ''), artist: 'Local File', isFile: true, file };
      setQueue([newTrack]);
      setCurrentQueueIndex(0);
      setRecentTracks(prev => [newTrack, ...prev.filter(t => t.id !== newTrack.id)].slice(0, 20));
      fetchAICover(newTrack.title, newTrack.artist);
    } else if (file.isFile && file.file) {
      processFile(file.file, file.title, file.artist);

      let idx = queue.findIndex(t => t.id === file.id);
      if (idx === -1) {
        // If playing from library and not in queue, sync library to queue
        const libIdx = libraryTracks.findIndex(t => t.id === file.id);
        if (libIdx !== -1) {
          setQueue([...libraryTracks]);
          setCurrentQueueIndex(libIdx);
        }
      } else {
        setCurrentQueueIndex(idx);
      }
      setRecentTracks(prev => [file, ...prev.filter(t => t.id !== file.id)].slice(0, 20));
      if (!file.coverUrl) fetchAICover(file.title, file.artist);
    } else {
      setAudioSource(null);
      setTrackInfo({ title: file.title, artist: file.artist, coverUrl: '', lyrics: file.lyrics || '' });
      setAccentColor('#EAB308');
      setCurrentQueueIndex(queue.findIndex(t => t.id === file.id));
      setRecentTracks(prev => [file, ...prev.filter(t => t.id !== file.id)].slice(0, 20));
      fetchAICover(file.title, file.artist);
    }

    // Detect quality
    const format = (file as any).format || (file instanceof File ? file.name.split('.').pop()?.toUpperCase() : '');
    const highRes = ['FLAC', 'WAV', 'ALAC', 'AIFF'].includes(format || '');
    setIsHiRes(highRes);
    setIs24Bit(highRes);

    // If it's the initial load, we don't switch to player or auto-play
    if (shouldPlay && !isCrossfading) {
      setActiveTab('player');
      setIsPlaying(true);
    } else if (!isCrossfading) {
      setActiveTab('player'); // start on player, but don't play
    }
  };

  const handleAddTracks = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const audioFiles = fileArray.filter(f => f.type.startsWith('audio/') || f.name.endsWith('.mp3') || f.name.endsWith('.flac') || f.name.endsWith('.wav'));
    const lrcFiles = fileArray.filter(f => f.name.endsWith('.lrc'));

    const lrcMap = new Map<string, string>();
    for (const lrc of lrcFiles) {
      try {
        const text = await lrc.text();
        const baseName = lrc.name.replace(/\.[^/.]+$/, '');
        lrcMap.set(baseName, text);
      } catch (err) {
        console.warn('Failed to read LRC file:', err);
      }
    }

    const newTracks: any[] = audioFiles.map(file => {
      // In a real mobile environment, we might get webkitRelativePath if the user uploads a folder
      const path = (file as any).webkitRelativePath || '';
      const folderName = path.split('/')[0] || 'Biblioteca';
      const baseName = file.name.replace(/\.[^/.]+$/, '');

      return {
        id: Math.random() + Date.now(),
        title: baseName,
        artist: 'Local File',
        isFile: true,
        file,
        format: file.name.split('.').pop()?.toUpperCase(),
        folder: folderName,
        lyrics: lrcMap.get(baseName) || ''
      };
    });

    setLibraryTracks(prev => [...prev, ...newTracks]);

    // Persist to IndexedDB
    for (const track of newTracks) {
      try {
        await saveTrack(track);
      } catch (err) {
        console.warn('Failed to save track to DB:', err);
      }
    }
  };

  const handleRemoveTrack = async (id: number) => {
    setLibraryTracks(prev => prev.filter(t => t.id !== id));
    setQueue(prev => prev.filter(t => t.id !== id));
    setRecentTracks(prev => prev.filter(t => t.id !== id));
    try {
      await deleteTrack(id);
    } catch (err) {
      console.warn('Failed to delete track from DB:', err);
    }
  };

  const handleRenameTrack = async (id: number, newName: string) => {
    const updateList = (list: any[]) => list.map(t => t.id === id ? { ...t, title: newName } : t);

    setLibraryTracks(prev => updateList(prev));
    setQueue(prev => updateList(prev));
    setRecentTracks(prev => updateList(prev));

    setTrackInfo(prev => {
      // Se a música atual for a que está sendo renomeada (e não estiver usando metadados originais de arquivo fixo)
      // Como não temos o ID atual no trackInfo facilmente, nós podemos atualizar condicionalmente:
      // Apenas atualize state; o trackInfo da próxima vez que tocar vai puxar do state, ou podemos ignorar por ser um detalhe menor.
      // Vou focar apenas nos arrays e no banco de dados.
      return prev;
    });

    const trackToUpdate = libraryTracks.find(t => t.id === id) || queue.find(t => t.id === id) || recentTracks.find(t => t.id === id);
    if (trackToUpdate) {
      try {
        await saveTrack({ ...trackToUpdate, title: newName });
      } catch (err) {
        console.warn('Failed to update track in DB:', err);
      }
    }
  };

  const handleTrackEnded = () => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      handleNextTrack();
    }
  };

  const handleNextTrack = () => {
    const activeQueue = queue.length > 0 ? queue : libraryTracks;
    if (activeQueue.length > 0) {
      if (isShuffle) {
        let nextIndex = Math.floor(Math.random() * activeQueue.length);
        if (activeQueue.length > 1 && nextIndex === currentQueueIndex) {
          nextIndex = (nextIndex + 1) % activeQueue.length;
        }
        handleSelectTrack(activeQueue[nextIndex]);
      } else if (currentQueueIndex < activeQueue.length - 1) {
        const next = activeQueue[currentQueueIndex + 1];
        handleSelectTrack(next);
      } else {
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const handlePreviousTrack = () => {
    const activeQueue = queue.length > 0 ? queue : libraryTracks;
    if (activeQueue.length > 0) {
      if (audioRef.current && audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
      } else if (isShuffle) {
        let prevIndex = Math.floor(Math.random() * activeQueue.length);
        if (activeQueue.length > 1 && prevIndex === currentQueueIndex) {
          prevIndex = (prevIndex + 1) % activeQueue.length;
        }
        handleSelectTrack(activeQueue[prevIndex]);
      } else if (currentQueueIndex > 0) {
        const prev = activeQueue[currentQueueIndex - 1];
        handleSelectTrack(prev);
      } else {
        if (audioRef.current) audioRef.current.currentTime = 0;
      }
    }
  };

  // ─── Crossfade Logic ──────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !dspSettings.smartCrossfade || isRepeat) return;

    let crossfadeInterval: any;

    const onTimeUpdate = () => {
      const activeQueue = queue.length > 0 ? queue : libraryTracks;
      const nextTrack = activeQueue[currentQueueIndex + 1];

      if (!nextTrack || isCrossfading || audio.duration <= dspSettings.crossfadeDuration) return;

      const timeLeft = audio.duration - audio.currentTime;
      if (timeLeft <= dspSettings.crossfadeDuration) {
        // Init Crossfade
        setIsCrossfading(true);

        // Prepare next track audio
        if (crossfadeAudioRef.current) {
          const nextFile = nextTrack.file || nextTrack; // handle file vs blobl url if needed
          const processCrossfadeFile = (f: File) => URL.createObjectURL(f);

          let nextUrl = '';
          if (nextFile instanceof File) nextUrl = processCrossfadeFile(nextFile);

          if (nextUrl) {
            crossfadeAudioRef.current.src = nextUrl;
            crossfadeAudioRef.current.volume = 0;
            crossfadeAudioRef.current.play().catch(e => console.warn("Crossfade play blocked:", e));
          }
        }

        const steps = 20;
        const stepTime = (dspSettings.crossfadeDuration * 1000) / steps;
        let currentStep = 0;

        crossfadeInterval = setInterval(() => {
          currentStep++;
          const progress = currentStep / steps;

          if (audioRef.current) {
            audioRef.current.volume = Math.max(0, volume * (1 - progress));
          }
          if (crossfadeAudioRef.current) {
            crossfadeAudioRef.current.volume = Math.min(volume, volume * progress);
          }

          if (currentStep >= steps) {
            clearInterval(crossfadeInterval);
            handleNextTrack();
            setIsCrossfading(false);
            if (audioRef.current) audioRef.current.volume = volume;
            if (crossfadeAudioRef.current) {
              crossfadeAudioRef.current.pause();
              URL.revokeObjectURL(crossfadeAudioRef.current.src);
              crossfadeAudioRef.current.src = '';
            }
          }
        }, stepTime);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      if (crossfadeInterval) clearInterval(crossfadeInterval);
    };
  }, [currentQueueIndex, queue, libraryTracks, dspSettings.smartCrossfade, dspSettings.crossfadeDuration, isCrossfading, volume, isRepeat]);

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
        onEnded={handleTrackEnded}
        style={{ display: 'none' }}
      />
      <audio
        ref={crossfadeAudioRef}
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
            {installPrompt && (
              <button
                onClick={handleInstallClick}
                className="p-2 rounded-xl bg-accent text-black hover:scale-110 transition-all shadow-[0_0_15px_rgba(234,179,8,0.4)] animate-pulse"
              >
                <Zap size={16} fill="currentColor" />
              </button>
            )}
            <button
              onClick={() => setActiveTab(activeTab === 'arch' ? 'player' : 'arch')}
              className={`p-2 rounded-xl glass-card transition-all ${activeTab === 'arch' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
            >
              <Info size={16} />
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'settings' ? 'player' : 'settings')}
              className={`p-2 rounded-xl glass-card transition-all ${activeTab === 'settings' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'text-white/60 hover:text-white'}`}
            >
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
                  isHiRes={isHiRes}
                  is24Bit={is24Bit}
                  nextTrack={queue[currentQueueIndex + 1] || libraryTracks[0]}
                  isShuffle={isShuffle}
                  setIsShuffle={setIsShuffle}
                  isRepeat={isRepeat}
                  setIsRepeat={setIsRepeat}
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
                <Equalizer
                  accentColor={accentColor}
                  eqGains={eqGains}
                  setEqGains={setEqGains}
                  qFactor={qFactor}
                  setQFactor={setQFactor}
                />
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
                  onAddTracks={handleAddTracks}
                  onRemoveTrack={handleRemoveTrack}
                  onRenameTrack={handleRenameTrack}
                  tracks={libraryTracks}
                  recentTracks={recentTracks}
                  queue={queue}
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
                <DSPSettings
                  accentColor={accentColor}
                  settings={dspSettings}
                  setSettings={setDspSettings}
                />
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
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 h-full"
              >
                <Settings
                  accentColor={accentColor}
                  setAccentColor={setAccentColor}
                />
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
