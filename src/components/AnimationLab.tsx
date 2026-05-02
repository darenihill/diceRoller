import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';
import styles from './Dice.module.css';

const VARIANTS = [
  {
    name: "1. Overshoot Tick (0.5s)",
    initial: { rotate: 0, color: "#FFFFFF" },
    animate: { 
      rotate: [0, -45, 10, 0], 
      color: ["#FFFFFF", "#FFD700", "#FFD700"],
      transition: { duration: 0.5, ease: "easeInOut" } as any
    },
    exit: { 
      rotate: [0, -45, 10, 0], 
      color: ["#FFD700", "#FFA500", "#FFFFFF"],
      transition: { duration: 0.5, ease: "easeInOut" } as any
    }
  },
  {
    name: "2. The Wiggle (0.5s)",
    initial: { rotate: 0, color: "#FFFFFF" },
    animate: { 
      rotate: [0, -35, 20, -10, 0], 
      color: ["#FFFFFF", "#FFD700"],
      transition: { duration: 0.5, ease: "easeInOut" } as any
    },
    exit: { 
      rotate: [0, -35, 20, -10, 0], 
      color: ["#FFD700", "#FFFFFF"],
      transition: { duration: 0.5, ease: "easeInOut" } as any
    }
  }
];

export const AnimationLab = () => {
  const [heldStates, setHeldStates] = useState(Array(2).fill(false));

  const toggleHold = (index: number) => {
    const newStates = [...heldStates];
    newStates[index] = !newStates[index];
    setHeldStates(newStates);
  };

  return (
    <div style={{ padding: 64, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, margin: 32, textAlign: 'center' }}>
      <h2 style={{ color: '#fff', fontSize: '2.5rem', marginBottom: 24, marginTop: 0 }}>🧪 Animation Testing Lab</h2>
      <p style={{ color: '#aaa', fontSize: '1.25rem', marginBottom: 40 }}>Click the dice below to test 8 different lock animations. Let me know which one you prefer!</p>
      
      <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
        {VARIANTS.map((variant, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ color: '#FFD700', fontSize: '1.8rem', fontWeight: 'bold' }}>#{i + 1}</div>
            <div 
              className={styles.dice}
              style={{ backgroundColor: '#E9EAEC', position: 'relative', width: 160, height: 160 }}
              onClick={() => toggleHold(i)}
            >
              <div className={styles.number} style={{ fontSize: 64, color: '#000' }}>?</div>
              
              <motion.div 
                animate={{
                  rotate: heldStates[i] 
                    ? variant.animate.rotate.map((v: number, idx: number) => idx === 1 ? v + 0.01 : v)
                    : variant.animate.rotate.map((v: number, idx: number) => idx === 1 ? v - 0.01 : v),
                  color: heldStates[i] ? ["#FFFFFF", "#FFD700"] : ["#FFD700", "#FFFFFF"]
                }}
                transition={variant.animate.transition}
                className={`${styles.actionBtn} ${styles.holdIcon}`}
                style={{ opacity: 1 }}
              >
                <div style={{ position: 'relative', width: 36, height: 36 }}>
                  <motion.div 
                    animate={{ opacity: heldStates[i] ? 1 : 0 }}
                    transition={{ duration: variant.animate.transition.duration, ease: "easeInOut" }}
                    style={{ position: 'absolute', top: 0, left: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Lock size={36} color="currentColor" />
                  </motion.div>
                  <motion.div 
                    animate={{ opacity: heldStates[i] ? 0 : 1 }}
                    transition={{ duration: variant.animate.transition.duration, ease: "easeInOut" }}
                    style={{ position: 'absolute', top: 0, left: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Unlock size={36} color="currentColor" />
                  </motion.div>
                </div>
              </motion.div>
            </div>
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>{variant.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
