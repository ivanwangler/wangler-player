import React from 'react';
import { motion } from 'motion/react';
import { Search, Folder, Music2, Heart, MoreVertical, PlayCircle, Upload } from 'lucide-react';

interface Track {
  id: number;
  title: string;
  artist: string;
  format?: string;
  duration?: string;
}

interface LibraryProps {
  accentColor: string;
  onSelectTrack: (track: File | Track) => void;
  onPlayNext: (track: File | Track) => void;
  onAddToQueue: (track: File | Track) => void;
  onAddTracks: (files: FileList | File[]) => void;
  tracks: Track[];
  recentTracks: Track[];
  queue: Track[];
  currentTrackId?: number;
}

type TabType = 'Biblioteca' | 'Fila' | 'Recentes' | 'Pastas';

export default function Library({
  accentColor,
  onSelectTrack,
  onPlayNext,
  onAddToQueue,
  onAddTracks,
  tracks,
  recentTracks,
  queue,
  currentTrackId
}: LibraryProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>('Biblioteca');
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (files.length === 1) {
        onSelectTrack(files[0]);
        onAddTracks([files[0]]);
      } else {
        onAddTracks(files);
      }
    }
  };

  const folders = React.useMemo(() => {
    const map = new Map<string, Track[]>();
    tracks.forEach(t => {
      const folder = (t as any).folder || 'Biblioteca';
      if (!map.has(folder)) map.set(folder, []);
      map.get(folder)!.push(t);
    });
    return Array.from(map.entries());
  }, [tracks]);

  const renderTrackItem = (track: Track, i: number) => (
    <motion.div
      key={track.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      className={`group flex items-center p-3 rounded-3xl transition-all cursor-pointer border ${currentTrackId === track.id ? 'bg-accent/15 border-accent/30 shadow-lg' : 'hover:bg-white/5 border-transparent hover:border-white/5'}`}
    >
      <div
        onClick={() => onSelectTrack(track)}
        className="relative w-14 h-14 rounded-2xl overflow-hidden mr-4 shadow-xl flex-shrink-0 bg-white/5 flex items-center justify-center"
      >
        <Music2 size={24} className="text-white/20" />
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${currentTrackId === track.id ? 'opacity-100 bg-accent/20' : 'opacity-0 group-hover:opacity-100 bg-black/40'}`}>
          <PlayCircle size={24} className="text-white drop-shadow-lg" />
        </div>
      </div>

      <div
        onClick={() => onSelectTrack(track)}
        className="flex-1 min-w-0"
      >
        <h4 className={`text-sm font-display font-bold truncate transition-colors ${currentTrackId === track.id ? 'text-accent' : 'text-white/90 group-hover:text-white'}`}>{track.title}</h4>
        <div className="flex items-center space-x-2 mt-0.5">
          <span className="text-[10px] text-white/40 truncate font-medium">{track.artist}</span>
          {track.format && (
            <span className="text-[8px] px-2 py-0.5 rounded-lg bg-white/10 border border-white/10 text-white/30 font-mono font-bold">{track.format}</span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 ml-4">
        <button
          onClick={(e) => { e.stopPropagation(); onPlayNext(track); }}
          className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-accent sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-lg"
          title="Tocar próxima"
        >
          <Music2 size={16} />
        </button>
        <button className="p-2 text-white/20 hover:text-white transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>
    </motion.div>
  );

  const getDisplayTracks = () => {
    switch (activeTab) {
      case 'Fila': return queue;
      case 'Recentes': return recentTracks;
      case 'Biblioteca': return tracks;
      case 'Pastas': return selectedFolder ? (folders.find(f => f[0] === selectedFolder)?.[1] || []) : [];
      default: return tracks;
    }
  };

  const displayTracks = getDisplayTracks();

  return (
    <div className="flex flex-col h-full px-6 pt-4 pb-8 overflow-hidden bg-black/20 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-white/90">Music Hub</h2>
          {activeTab === 'Pastas' && selectedFolder && (
            <button
              onClick={() => setSelectedFolder(null)}
              className="text-[10px] text-accent font-bold uppercase tracking-widest mt-1 flex items-center space-x-1"
            >
              <span>← Voltar para pastas</span>
            </button>
          )}
        </div>
        <div className="flex space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="audio/*"
            multiple
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-2xl bg-accent text-black hover:bg-accent/80 transition-all border border-white/5 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
          >
            <Upload size={20} />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex space-x-3 mb-8 overflow-x-auto no-scrollbar pb-2">
        {(['Biblioteca', 'Fila', 'Recentes', 'Pastas'] as TabType[]).map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveTab(cat); setSelectedFolder(null); }}
            className={`px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest font-display font-bold transition-all border whitespace-nowrap ${activeTab === cat ? 'bg-accent border-accent text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Track List or Folder List */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
        {activeTab === 'Pastas' && !selectedFolder ? (
          <div className="grid grid-cols-2 gap-3">
            {folders.map(([folder, tracks]) => (
              <motion.div
                key={folder}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedFolder(folder)}
                className="p-5 rounded-[32px] bg-white/5 border border-white/5 hover:border-accent/30 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
              >
                <div className="p-4 rounded-3xl bg-accent/10 text-accent mb-3 group-hover:scale-110 transition-transform">
                  <Folder size={32} />
                </div>
                <h4 className="text-xs font-display font-bold text-white/90 truncate w-full px-2">{folder}</h4>
                <p className="text-[10px] text-white/20 font-mono mt-1 uppercase tracking-tighter">{tracks.length} Músicas</p>
              </motion.div>
            ))}
            {folders.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-20 opacity-40">
                <Folder size={40} className="text-white/20 mb-3" />
                <p className="text-xs font-display font-medium">Nenhuma pasta encontrada</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {displayTracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-40 text-center px-8">
                <div className="p-6 rounded-full bg-white/5 mb-4">
                  <Music2 size={40} className="text-white/60" />
                </div>
                <p className="text-sm font-display font-medium text-white/80">Vazio</p>
                <p className="text-[10px] text-white/40 mt-1">
                  {activeTab === 'Recentes' ? 'Músicas que você tocar aparecerão aqui' : 'Toque no botão de upload para adicionar músicas'}
                </p>
              </div>
            ) : (
              displayTracks.map((track, i) => renderTrackItem(track, i))
            )}
          </>
        )}
      </div>

      {/* Storage Info */}
      <div className="mt-6 p-5 rounded-3xl glass-card border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-accent/10 text-accent">
            <Folder size={18} />
          </div>
          <div>
            <p className="text-[10px] font-display font-bold uppercase tracking-wider">Local Storage</p>
            <p className="text-[9px] text-white/30 font-mono">128 GB / 512 GB used</p>
          </div>
        </div>
        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-accent shadow-[0_0_10px_rgba(0,212,255,0.5)] w-1/4" />
        </div>
      </div>
    </div>
  );
}
