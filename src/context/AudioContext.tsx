import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface BGMTrack {
  id: string;
  name: string;
  artist: string;
  bpm?: number;
  url: string;
}

export const DEFAULT_BGM_TRACKS: BGMTrack[] = [
  {
    id: '1',
    name: 'Cadence 90 RPM Techno Drive',
    artist: 'Cycling Rhythm',
    bpm: 90,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=electronic-future-beats-117997.mp3'
  },
  {
    id: '2',
    name: 'Sweetspot Threshold Pulse 95 BPM',
    artist: 'Aero Flow',
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

interface AudioContextType {
  isPlaying: boolean;
  toggleBgm: () => void;
  playBgm: () => void;
  pauseBgm: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  currentTrack: BGMTrack;
  currentTrackIndex: number;
  playlist: BGMTrack[];
  setPlaylist: React.Dispatch<React.SetStateAction<BGMTrack[]>>;
  volume: number;
  setVolume: (v: number) => void;
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  selectTrack: (index: number) => void;
  addLocalAudioFile: (file: File) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playlist, setPlaylist] = useState<BGMTrack[]>(() => {
    try {
      const saved = localStorage.getItem('yolo_cycling_bgm_playlist');
      return saved ? JSON.parse(saved) : DEFAULT_BGM_TRACKS;
    } catch {
      return DEFAULT_BGM_TRACKS;
    }
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.6);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('yolo_cycling_bgm_playlist', JSON.stringify(playlist));
    } catch (e) {
      console.warn('Failed to save audio playlist:', e);
    }
  }, [playlist]);

  // Audio setup
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setCurrentTrackIndex(prev => (prev + 1) % playlist.length);
    };

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

  useEffect(() => {
    if (!audioRef.current || playlist.length === 0) return;
    const track = playlist[currentTrackIndex] || playlist[0];
    if (track) {
      audioRef.current.src = track.url;
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.warn('BGM Play error:', e);
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrackIndex]);

  const playBgm = () => {
    if (!audioRef.current) return;
    const track = playlist[currentTrackIndex] || playlist[0];
    if (!audioRef.current.src && track) {
      audioRef.current.src = track.url;
    }
    audioRef.current.play().then(() => setIsPlaying(true)).catch(e => {
      console.warn('Playback error:', e);
      setIsPlaying(false);
    });
  };

  const pauseBgm = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const toggleBgm = () => {
    if (isPlaying) {
      pauseBgm();
    } else {
      playBgm();
    }
  };

  const nextTrack = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex(prev => (prev + 1) % playlist.length);
  };

  const prevTrack = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex(prev => (prev - 1 + playlist.length) % playlist.length);
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  const seek = (time: number) => {
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  const addLocalAudioFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const newTrack: BGMTrack = {
      id: Date.now().toString(),
      name: file.name.replace(/\.[^/.]+$/, ''),
      artist: '本地上传音频',
      url: objectUrl
    };
    setPlaylist(prev => [newTrack, ...prev]);
    setCurrentTrackIndex(0);
    setIsPlaying(true);
  };

  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        toggleBgm,
        playBgm,
        pauseBgm,
        nextTrack,
        prevTrack,
        currentTrack,
        currentTrackIndex,
        playlist,
        setPlaylist,
        volume,
        setVolume,
        currentTime,
        duration,
        seek,
        selectTrack,
        addLocalAudioFile
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
