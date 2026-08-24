import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const SoundContext = createContext(null);

const ALERT_SOUND_URL = 'https://res.cloudinary.com/dyw2bm0p4/video/upload/v1772804255/universfield-ringtone-026-376909_p71yak.mp3';
const SUCCESS_SOUND_URL = 'https://res.cloudinary.com/dyw2bm0p4/video/upload/v1773627092/soundreality-notification-tone-443095_rdzsjb.mp3';

export function SoundProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('sound_enabled');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const alertAudioRef = useRef(null);
  const successAudioRef = useRef(null);

  useEffect(() => {
    alertAudioRef.current = new Audio(ALERT_SOUND_URL);
    successAudioRef.current = new Audio(SUCCESS_SOUND_URL);
  }, []);

  useEffect(() => {
    localStorage.setItem('sound_enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  const playAlert = () => {
    if (!soundEnabled || !alertAudioRef.current) return;
    alertAudioRef.current.currentTime = 0;
    alertAudioRef.current.play().catch(e => console.warn('Audio alert play error:', e));
  };

  const playSuccess = () => {
    if (!soundEnabled || !successAudioRef.current) return;
    successAudioRef.current.currentTime = 0;
    successAudioRef.current.play().catch(e => console.warn('Audio success play error:', e));
  };

  const playClick = () => {
    // Subtle click feedback if enabled
  };

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        toggleSound,
        playAlert,
        playSuccess,
        playClick,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}

export default SoundContext;
