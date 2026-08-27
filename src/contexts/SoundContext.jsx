import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const SoundContext = createContext(null);

const ALERT_SOUND_URL = 'https://res.cloudinary.com/dyw2bm0p4/video/upload/v1772804255/universfield-ringtone-026-376909_p71yak.mp3';
const SUCCESS_SOUND_URL = 'https://res.cloudinary.com/dyw2bm0p4/video/upload/v1773627092/soundreality-notification-tone-443095_rdzsjb.mp3';

export function SoundProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const alertAudioRef = useRef(null);
  const successAudioRef = useRef(null);
  const audioCtxRef = useRef(null);

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

  // Web Audio synth chime fallback
  const playSynthBeep = (freq = 880, type = 'sine', duration = 0.25) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context not allowed or unsupported
    }
  };

  const playAlert = () => {
    if (!soundEnabled) return;
    if (alertAudioRef.current) {
      alertAudioRef.current.currentTime = 0;
      alertAudioRef.current.play().catch(() => {
        // Fallback to synth alert chords
        playSynthBeep(587.33, 'triangle', 0.2);
        setTimeout(() => playSynthBeep(880, 'triangle', 0.35), 180);
      });
    } else {
      playSynthBeep(880, 'triangle', 0.3);
    }
  };

  const playSuccess = () => {
    if (!soundEnabled) return;
    if (successAudioRef.current) {
      successAudioRef.current.currentTime = 0;
      successAudioRef.current.play().catch(() => {
        playSynthBeep(523.25, 'sine', 0.15);
        setTimeout(() => playSynthBeep(659.25, 'sine', 0.15), 120);
        setTimeout(() => playSynthBeep(783.99, 'sine', 0.25), 240);
      });
    } else {
      playSynthBeep(659.25, 'sine', 0.25);
    }
  };

  const playDriverAlert = () => {
    if (!soundEnabled) return;
    playAlert();
    // Repeating double chime for driver attention
    setTimeout(() => playSynthBeep(987.77, 'sawtooth', 0.2), 350);
    setTimeout(() => playSynthBeep(1174.66, 'sine', 0.3), 550);
  };

  const playWarning = () => {
    if (!soundEnabled) return;
    playSynthBeep(440, 'sawtooth', 0.2);
    setTimeout(() => playSynthBeep(370, 'sawtooth', 0.3), 150);
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
        playWarning,
        playDriverAlert,
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

