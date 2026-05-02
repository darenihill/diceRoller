import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';
import styles from './Dice.module.css';

const VARIANTS = [
  {
    name: "1. Fade Only",
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  {
    name: "2. Drop In",
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  {
    name: "3. Rotate In",
    initial: { opacity: 0, rotate: -90, scale: 0.5 },
    animate: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: 90, scale: 0.5 }
  },
  {
    name: "4. Spring Bounce",
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 500, damping: 15 } },
    exit: { opacity: 0, scale: 0 }
  },
  {
    name: "5. Slide Left",
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  }
];

export const AnimationLab = () => {
  const [heldStates, setHeldStates] = useState([false, false, false, false, false]);

  const toggleHold = (index: number) => {
    const newStates = [...heldStates];
    newStates[index] = !newStates[index];
    setHeldStates(newStates);
  };

  return (
    <div style={{ padding: 24, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, margin: 24, textAlign: 'center' }}>
      <h2 style={{ color: '#fff', marginBottom: 24, marginTop: 0 }}>🧪 Animation Testing Lab</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Click the dice below to test 5 different lock animations. Let me know which one you prefer!</p>
      
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
        {VARIANTS.map((variant, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div 
              className={styles.dice}
              style={{ backgroundColor: '#E9EAEC', position: 'relative', width: 120, height: 120 }}
              onClick={() => toggleHold(i)}
            >
              <div className={styles.number} style={{ fontSize: 48, color: '#000' }}>?</div>
              
              <AnimatePresence>
                {heldStates[i] ? (
                  <motion.div 
                    initial={variant.initial}
                    animate={variant.animate}
                    exit={variant.exit}
                    className={`${styles.actionBtn} ${styles.holdIcon}`}
                  >
                    <Lock size={20} color="#FFD700" />
                  </motion.div>
                ) : (
                  <div className={`${styles.actionBtn} ${styles.unlockIcon}`}>
                    <Unlock size={20} color="currentColor" />
                  </div>
                )}
              </AnimatePresence>
            </div>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{variant.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
