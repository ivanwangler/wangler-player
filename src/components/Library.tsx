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
  tracks: Track[];
}

export default function Library({ accentColor, onSelectTrack, tracks }: LibraryProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectTrack(file);
    }
  };

  return (
    <div className="flex flex-col h-full px-6 pt-4 pb-8 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-display font-bold tracking-tight">Library</h2>
        <div className="flex space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="audio/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <Upload size={18} />
          </button>
          <button className="p-2.5 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex space-x-3 mb-8 overflow-x-auto no-scrollbar pb-2">
        {['Tracks', 'Albums', 'Artists', 'Folders', 'Playlists'].map((cat, i) => (
          <button
            key={cat}
            className={`px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-display font-bold transition-all ${i === 0 ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
        {tracks.map((track, i) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelectTrack(track)}
            className="group flex items-center p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer"
          >
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden mr-4 shadow-lg">
              <img
                src={`https://picsum.photos/seed/${track.id}/100/100`}
                alt={track.title}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-accent/20 backdrop-blur-sm">
                <PlayCircle size={24} className="text-white drop-shadow-lg" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-display font-bold truncate group-hover:text-accent transition-colors">{track.title}</h4>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-[10px] text-white/30 truncate font-medium">{track.artist}</span>
                <span className="text-[8px] px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/40 font-mono font-bold">{track.format}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 ml-4">
              <span className="timecode text-[10px] text-white/30">{track.duration}</span>
              <button className="text-white/20 hover:text-white transition-colors">
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
