'use client';

import { useState, useRef, useEffect } from 'react';

export default function BackgroundMusic() {
  const musicRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = volume;
      musicRef.current.muted = isMuted;
    }
    
  }, [volume, isMuted]);

  useEffect(() => {
    const playAudio = () => {
      if (musicRef.current && !hasStarted) {
        musicRef.current.play().then(() => setHasStarted(true)).catch(err => console.log(err));
      }
      
    };
    playAudio();
    window.addEventListener('click', playAudio);
    window.addEventListener('keydown', playAudio);
    return () => {
      window.removeEventListener('click', playAudio);
      window.removeEventListener('keydown', playAudio);
    };
  }, [hasStarted]);

  // Listen for settings changes from SettingsMenu
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (musicRef.current) {
        musicRef.current.muted = !detail.musicOn;
      }
      
    };
    window.addEventListener('settingsChanged', handler);
    return () => window.removeEventListener('settingsChanged', handler);
  }, []); // __settingsListenerAdded

  const setVol = (v: number) => { setVolume(v); if (v > 0) setIsMuted(false); };
  const toggleMute = () => setIsMuted(prev => !prev);

  const handleSliderInteraction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    const update = (clientY: number) => {
      const y = clientY - rect.top;
      const pct = 1 - Math.max(0, Math.min(1, y / rect.height));
      setVol(pct);
    };
    if ('touches' in e) {
      update(e.touches[0].clientY);
      const move = (ev: TouchEvent) => update(ev.touches[0].clientY);
      const end = () => {
        window.removeEventListener('touchmove', move);
        window.removeEventListener('touchend', end);
      };
      window.addEventListener('touchmove', move);
      window.addEventListener('touchend', end);
    } else {
      update(e.clientY);
      const move = (ev: MouseEvent) => update(ev.clientY);
      const end = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', end);
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', end);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col items-center gap-1 bg-black/70 p-2 rounded-lg pointer-events-auto border-2 border-gray-600">
      <audio ref={musicRef} src="/assets/audio/gameaudio.mp3" loop />


      <div className="text-white text-[9px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
        VOL
      </div>

      <button
        onClick={() => setVol(Math.min(volume + 0.1, 1))}
        className="w-7 h-6 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-bold"
      >+</button>

      <div
        className="relative w-6 h-32 bg-gray-900 border-2 border-gray-600 rounded cursor-pointer"
        onMouseDown={handleSliderInteraction}
        onTouchStart={handleSliderInteraction}
      >
        <div
          className="absolute bottom-0 left-0 right-0 rounded-b"
          style={{
            height: (isMuted ? 0 : volume) * 100 + '%',
            backgroundColor: isMuted ? '#DC2626' : '#22C55E',
            transition: 'height 0.05s'
          }}
        />
        <div
          className="absolute left-1/2 w-5 h-2 bg-yellow-400 border border-black rounded"
          style={{
            bottom: 'calc(' + (isMuted ? 0 : volume) * 100 + '% - 4px)',
            transform: 'translateX(-50%)',
            transition: 'bottom 0.05s'
          }}
        />
      </div>

      <button
        onClick={() => setVol(Math.max(volume - 0.1, 0))}
        className="w-7 h-6 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-bold"
      >-</button>

      <div className="text-white text-[8px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
        {isMuted ? 'MUTE' : Math.round(volume * 100) + '%'}
      </div>

      <button
        onClick={toggleMute}
        className={'w-7 h-6 rounded text-xs font-bold ' + (isMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500') + ' text-white'}
      >{isMuted ? 'X' : 'M'}</button>
    </div>
  );
}




