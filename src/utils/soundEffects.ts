let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
};

/**
 * Synthesizes a premium, realistic wooden/plastic dice rattle and drop sound
 * entirely client-side using the browser's built-in Web Audio API.
 * This runs offline with zero load latency and zero network overhead.
 */
export const playRollSound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    
    // We synthesize a series of quick "rattle" clicks that gradually slow down,
    // followed by a final solid "impact thud" when the dice land.
    const numClicks = 5 + Math.floor(Math.random() * 4); // 5 to 8 rattle bounces
    let delay = 0;
    
    for (let i = 0; i < numClicks; i++) {
      // Clicks are initially rapid and decelerate as gravity takes hold
      delay += 0.04 + (i * 0.03) + Math.random() * 0.025;
      const clickTime = now + delay;
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Dice collision rattle is a fast mid-to-high frequency pitch sweep
      osc.type = 'triangle';
      const startFreq = 800 + Math.random() * 400; // Wood/resin high transient
      osc.frequency.setValueAtTime(startFreq, clickTime);
      osc.frequency.exponentialRampToValueAtTime(140 + Math.random() * 50, clickTime + 0.02);
      
      // Fast exponential amplitude decay for the tap
      gainNode.gain.setValueAtTime(0, clickTime);
      gainNode.gain.linearRampToValueAtTime(0.12, clickTime + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.022);
      
      osc.start(clickTime);
      osc.stop(clickTime + 0.03);
    }
    
    // Final heavy "impact thud" sound representing the dice landing on felt
    const thudTime = now + delay + 0.04;
    const oscThud = ctx.createOscillator();
    const gainThud = ctx.createGain();
    
    oscThud.connect(gainThud);
    gainThud.connect(ctx.destination);
    
    oscThud.type = 'sine';
    oscThud.frequency.setValueAtTime(200, thudTime);
    oscThud.frequency.exponentialRampToValueAtTime(55, thudTime + 0.07);
    
    gainThud.gain.setValueAtTime(0, thudTime);
    gainThud.gain.linearRampToValueAtTime(0.22, thudTime + 0.004);
    gainThud.gain.exponentialRampToValueAtTime(0.001, thudTime + 0.08);
    
    oscThud.start(thudTime);
    oscThud.stop(thudTime + 0.09);
    
  } catch (e) {
    console.error("Failed to play synthesized roll sound:", e);
  }
};
