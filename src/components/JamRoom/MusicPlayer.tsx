import React, { useEffect, useRef } from 'react';

interface MusicPlayerProps {
  musicUrl: string;
  position?: number;
  isPlaying: boolean;
}

const MusicPlayer = ({ 
  musicUrl, 
  position = 0, 
  isPlaying 
}: MusicPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    
    // Always update position when it changes
    audio.currentTime = position;

    // Play or pause based on isPlaying
    if (isPlaying) {
      audio.play().catch(err => {
        console.error('Playback failed:', err);
      });
    } else {
      audio.pause();
    }
  }, [position, isPlaying]);

  return (
    <audio 
      ref={audioRef} 
      src={musicUrl} 
      preload="auto" 
      hidden  // Hide the native audio controls
    />
  );
};

export default MusicPlayer;