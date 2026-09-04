import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, ListMusic, Plus, Trash2, X, Move, ChevronUp, ChevronDown } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  artist: string;
  bpm?: number;
  url: string;
}

const DEFAULT_PLAYLIST: Track[] = [
  {
    id: '1',
    name: 'Cadence 90 RPM Techno Drive',
    artist: 'Cycling Beats',
    bpm: 90,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=electronic-future-beats-117997.mp3'
  },
  {
    id: '2',
    name: 'Sweetspot Threshold Pulse 95 BPM',
    artist: 'Aero Tempo',
    bpm: 95,
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=tomp-10874.mp3'
  },
  {
    id: '3',
    name: 'Endurance Zone 2 Chill Ride',
    artist: 'Lo-Fi Wheels',
    bpm: 85,
    url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_7315124ec6.mp3?filename=lofi-study-112191.mp3'
  }
];

export const LiquidMusicPlayer: React.FC<{ isStandalonePage?: boolean }> = ({ isStandalonePage = false }) => {
  const [playlist, setPlaylist] = useState<Track[]>(() => {
    const saved = localStorage.getItem('yolo_cycling_playlist');
    return saved ? JSON.parse(saved) : DEFAULT_PLAYLIST;
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [showPlaylistDrawer, setShowPlaylistDrawer] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // New Song Form
  const [newSongName, setNewSongName] = useState<string>('');
  const [newSongUrl, setNewSongUrl] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Save playlist
  useEffect(() => {
    localStorage.setItem('yolo_cycling_playlist', JSON.stringify(playlist));
  }, [playlist]);

  // Audio setup
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => handleNext();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    if (!audioRef.current || playlist.length === 0) return;
    const track = playlist[currentTrackIndex] || playlist[0];
    if (track) {
      audioRef.current.src = track.url;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.warn('Autoplay blocked:', e));
      }
    }
  }, [currentTrackIndex]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.warn('Play error:', e));
    }
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  const addCustomTrack = () => {
    if (!newSongUrl) return;
    const newTrack: Track = {
      id: Date.now().toString(),
      name: newSongName || '自定义骑行音频',
      artist: 'Custom User Track',
      url: newSongUrl
    };
    setPlaylist(prev => [...prev, newTrack]);
    setNewSongName('');
    setNewSongUrl('');
  };

  const removeTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaylist(prev => prev.filter(t => t.id !== id));
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec <= 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  // If standalone full page
  if (isStandalonePage) {
    return (
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Music className="w-3.5 h-3.5" />
              骑行踏频节奏电台
            </div>
            <h1 className="text-2xl font-bold text-slate-100">骑行节奏与动感音乐播放器</h1>
            <p className="text-slate-400 text-sm mt-1">
              匹配 85~105 BPM 黄金踏频节奏曲目，支持在训练与巡航中保持专注力。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Big Player Card */}
          <div className="lg:col-span-6 space-y-6">
            <div className="glass-panel p-8 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-cyan-950/30 text-center space-y-6">
              <div className="w-40 h-40 mx-auto rounded-3xl bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center relative group">
                <Music className={`w-16 h-16 text-cyan-400 ${isPlaying ? 'animate-pulse' : ''}`} />
                {currentTrack?.bpm && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 font-bold">
                    {currentTrack.bpm} BPM
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-100">{currentTrack?.name || '未播放'}</h2>
                <p className="text-xs text-slate-400 mt-1">{currentTrack?.artist || 'YOLO Cycling Station'}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6 pt-2">
                <button
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 transition transform hover:scale-105"
                >
                  {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                </button>
                <button
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center justify-center gap-3 pt-2 max-w-xs mx-auto text-xs text-slate-400">
                <Volume2 className="w-4 h-4" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Playlist & Add Song */}
          <div className="lg:col-span-6 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-cyan-400" />
                骑行播放列表 ({playlist.length} 首)
              </h3>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {playlist.map((t, idx) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setCurrentTrackIndex(idx);
                      setIsPlaying(true);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      currentTrackIndex === idx
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-500 w-4">{idx + 1}</span>
                      <div>
                        <div className="text-xs font-semibold">{t.name}</div>
                        <div className="text-[10px] text-slate-500">{t.artist}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {t.bpm && <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">{t.bpm} BPM</span>}
                      {playlist.length > 1 && (
                        <button
                          onClick={(e) => removeTrack(t.id, e)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom URL */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold text-slate-400">添加自定义骑行音频链接</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="曲目名称 (可选)"
                    value={newSongName}
                    onChange={(e) => setNewSongName(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  />
                  <input
                    type="url"
                    placeholder="直接音频链接 (.mp3/.wav/.ogg)"
                    value={newSongUrl}
                    onChange={(e) => setNewSongUrl(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <button
                  onClick={addCustomTrack}
                  disabled={!newSongUrl}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  添加到当前歌单
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Floating Widget Mode
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className="glass-panel p-3.5 rounded-2xl border border-slate-700 shadow-2xl bg-slate-950/90 backdrop-blur-xl w-80 space-y-3">
        {/* Widget Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Music className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse' : ''}`} />
            </div>
            <div className="truncate max-w-[140px]">
              <span className="text-xs font-semibold text-slate-200 block truncate">{currentTrack?.name || '骑行音乐'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <button
              onClick={() => setShowPlaylistDrawer(!showPlaylistDrawer)}
              className={`p-1 rounded hover:bg-slate-800 transition ${showPlaylistDrawer ? 'text-cyan-400' : ''}`}
            >
              <ListMusic className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded hover:bg-slate-800 transition"
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Progress */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-1">
              <button onClick={handlePrev} className="p-1.5 text-slate-400 hover:text-slate-200">
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow font-bold"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button onClick={handleNext} className="p-1.5 text-slate-400 hover:text-slate-200">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Playlist Drawer */}
            {showPlaylistDrawer && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5 max-h-40 overflow-y-auto">
                {playlist.map((t, idx) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setCurrentTrackIndex(idx);
                      setIsPlaying(true);
                    }}
                    className={`p-2 rounded-lg text-xs flex justify-between items-center cursor-pointer transition ${
                      currentTrackIndex === idx ? 'bg-cyan-500/15 text-cyan-400 font-semibold' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    {t.bpm && <span className="text-[9px] font-mono text-slate-500">{t.bpm} BPM</span>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
