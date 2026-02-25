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
  tracks: Track[];
  currentTrackId?: number;
}

export default function Library({
  accentColor,
  onSelectTrack,
  onPlayNext,
  onAddToQueue,
  tracks,
  currentTrackId
}: LibraryProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectTrack(file);
    }
  };

  return (
    <div className="flex flex-col h-full px-6 pt-4 pb-8 overflow-hidden bg-black/20 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-display font-bold tracking-tight text-white/90">Music Hub</h2>
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
            className="p-3 rounded-2xl bg-white/10 text-white/60 hover:text-white hover:bg-accent/20 transition-all border border-white/5 shadow-lg"
          >
            <Upload size={20} />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex space-x-3 mb-8 overflow-x-auto no-scrollbar pb-2">
        {['Queue', 'Recent', 'Favorites', 'Folders'].map((cat, i) => (
          <button
            key={cat}
            className={`px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest font-display font-bold transition-all border ${i === 0 ? 'bg-accent border-accent text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
        {tracks.map((track, i) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`group flex items-center p-3 rounded-3xl transition-all cursor-pointer border ${currentTrackId === track.id ? 'bg-accent/15 border-accent/30 shadow-lg' : 'hover:bg-white/5 border-transparent hover:border-white/5'}`}
          >
            <div
              onClick={() => onSelectTrack(track)}
              className="relative w-14 h-14 rounded-2xl overflow-hidden mr-4 shadow-xl flex-shrink-0"
            >
              <img
                src={`https://picsum.photos/seed/${track.id}/100/100`}
                alt={track.title}
                className={`w-full h-full object-cover transition-all duration-500 ${currentTrackId === track.id ? 'opacity-100 scale-110' : 'opacity-60 group-hover:opacity-100'}`}
                referrerPolicy="no-referrer"
              />
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
                  <span className="text-[8px] px-2 py-0.5 rounded-lg bg-white/10 border border-white/10 text-white/60 font-mono font-bold">{track.format}</span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={(e) => { e.stopPropagation(); onPlayNext(track); }}
                className="p-2 rounded-xl bg-white/5 text-white/20 hover:text-accent hover:bg-accent/10 transition-all opacity-0 group-hover:opacity-100"
                title="Tocar próxima"
              >
                <Music2 size={16} />
              </button>
              <button className="p-2 text-white/20 hover:text-white transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>
          </motion.div>
        ))}
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
