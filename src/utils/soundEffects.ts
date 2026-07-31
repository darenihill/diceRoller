import { ROLL_TICK_INTERVAL_MS, ROLL_DURATION_MS } from './constants';

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
};

/**
 * Synthesizes a single quick wooden/plastic dice rattle click
 * entirely client-side using the browser's built-in Web Audio API.
 */
export const playRattleSound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Dice collision rattle is a fast mid-to-high frequency pitch sweep
    osc.type = 'triangle';
    const startFreq = 800 + Math.random() * 400; // Wood/resin high transient
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(140 + Math.random() * 50, now + 0.02);
    
    // Fast exponential amplitude decay for the tap
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
    
    osc.start(now);
    osc.stop(now + 0.03);
  } catch (e) {
    console.error("Failed to play synthesized rattle sound:", e);
  }
};

/**
 * Synthesizes a single heavy felt impact thud when the dice land
 * entirely client-side using the browser's built-in Web Audio API.
 */
export const playThudSound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    const oscThud = ctx.createOscillator();
    const gainThud = ctx.createGain();
    
    oscThud.connect(gainThud);
    gainThud.connect(ctx.destination);
    
    oscThud.type = 'sine';
    oscThud.frequency.setValueAtTime(200, now);
    oscThud.frequency.exponentialRampToValueAtTime(55, now + 0.07);
    
    gainThud.gain.setValueAtTime(0, now);
    gainThud.gain.linearRampToValueAtTime(0.22, now + 0.004);
    gainThud.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    oscThud.start(now);
    oscThud.stop(now + 0.09);

    // Trigger mobile haptic vibration on landing impact
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([15, 30, 15]);
    }
  } catch (e) {
    console.error("Failed to play synthesized thud sound:", e);
  }
};

/**
 * Schedules a sequence of rattle clicks aligned with visual ticks (0ms, 200ms, 400ms, 600ms)
 * followed by a final impact thud at 800ms when the dice land.
 * Automatically clears any pending timers from previous rolls.
 */
export const playRollSequence = (soundTimersRef: React.MutableRefObject<number[]>) => {
  // Clear any active timers
  soundTimersRef.current.forEach(id => clearTimeout(id));
  soundTimersRef.current = [];

  // Play immediately at 0ms
  playRattleSound();

  const t1 = window.setTimeout(() => playRattleSound(), ROLL_TICK_INTERVAL_MS);
  const t2 = window.setTimeout(() => playRattleSound(), ROLL_TICK_INTERVAL_MS * 2);
  const t3 = window.setTimeout(() => playRattleSound(), ROLL_TICK_INTERVAL_MS * 3);
  const t4 = window.setTimeout(() => playThudSound(), ROLL_DURATION_MS);

  soundTimersRef.current = [t1, t2, t3, t4];
};
