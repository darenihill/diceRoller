import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';
import styles from './Dice.module.css';

const VARIANTS = [
  {
    name: "1. Gentle Rock",
    initial: { opacity: 0, rotate: 0, color: "#FFFFFF" },
    animate: { 
      opacity: 1, 
      rotate: [0, -30, 0], 
      color: ["#FFFFFF", "#FFD700"],
      transition: { duration: 0.4, ease: "easeInOut" } as any
    },
    exit: { 
      opacity: 0, 
      rotate: [0, 30, 0], 
      color: ["#FFD700", "#FFFFFF"],
      transition: { duration: 0.4, ease: "easeInOut" } as any
    }
  },
  {
    name: "2. Snappy Snap",
    initial: { opacity: 0, rotate: 0, color: "#FFFFFF" },
    animate: { 
      opacity: 1, 
      rotate: [0, -45, 0], 
      color: ["#FFFFFF", "#FFD700"],
      transition: { type: "spring", stiffness: 400, damping: 15 } as any
    },
    exit: { 
      opacity: 0, 
      rotate: [0, 45, 0], 
      color: ["#FFD700", "#FFFFFF"],
      transition: { type: "spring", stiffness: 400, damping: 15 } as any
    }
  },
  {
    name: "3. Overshoot Tick",
    initial: { opacity: 0, rotate: 0, color: "#FFFFFF" },
    animate: { 
      opacity: 1, 
      rotate: [0, -45, 10, 0], 
      color: ["#FFFFFF", "#FFD700", "#FFD700"],
      transition: { duration: 0.5, times: [0, 0.6, 0.8, 1] } as any
    },
    exit: { 
      opacity: 0, 
      rotate: [0, 45, -10, 0], 
      color: ["#FFD700", "#FFA500", "#FFFFFF"],
      transition: { duration: 0.5, times: [0, 0.6, 0.8, 1] } as any
    }
  },
  {
    name: "4. The Wiggle",
    initial: { opacity: 0, rotate: 0, color: "#FFFFFF" },
    animate: { 
      opacity: 1, 
      rotate: [0, -35, 20, -10, 0], 
      color: ["#FFFFFF", "#FFD700"],
      transition: { duration: 0.6, ease: "easeInOut" } as any
    },
    exit: { 
      opacity: 0, 
      rotate: [0, 35, -20, 10, 0], 
      color: ["#FFD700", "#FFFFFF"],
      transition: { duration: 0.6, ease: "easeInOut" } as any
    }
  },
  {
    name: "5. Slow Windup",
    initial: { opacity: 0, rotate: 0, color: "#FFFFFF" },
    animate: { 
      opacity: 1, 
      rotate: [0, -45, -45, 0], 
      color: ["#FFFFFF", "#FFA500", "#FFD700"],
      transition: { duration: 0.6, times: [0, 0.3, 0.7, 1] } as any
    },
    exit: { 
      opacity: 0, 
      rotate: [0, 45, 45, 0], 
      color: ["#FFD700", "#FFA500", "#FFFFFF"],
      transition: { duration: 0.6, times: [0, 0.3, 0.7, 1] } as any
    }
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
                    <Lock size={20} color="currentColor" />
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
