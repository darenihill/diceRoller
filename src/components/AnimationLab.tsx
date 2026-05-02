import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';
import styles from './Dice.module.css';

const VARIANTS = [
  {
    name: "1. Gentle Rock",
    initial: { rotate: 0, color: "#FFFFFF" },
    animate: { 
      rotate: [0, -30, 0], 
      color: ["#FFFFFF", "#FFD700"],
      transition: { duration: 0.6, ease: "easeInOut" } as any
    },
    exit: { 
      rotate: [0, -30, 0], 
      color: ["#FFD700", "#FFFFFF"],
      transition: { duration: 0.6, ease: "easeInOut" } as any
    }
  },
  {
    name: "2. Overshoot Tick",
    initial: { rotate: 0, color: "#FFFFFF" },
    animate: { 
      rotate: [0, -45, 10, 0], 
      color: ["#FFFFFF", "#FFD700", "#FFD700"],
      transition: { duration: 0.6, ease: "easeInOut" } as any
    },
    exit: { 
      rotate: [0, -45, 10, 0], 
      color: ["#FFD700", "#FFA500", "#FFFFFF"],
      transition: { duration: 0.6, ease: "easeInOut" } as any
    }
  },
  {
    name: "3. The Wiggle",
    initial: { rotate: 0, color: "#FFFFFF" },
    animate: { 
      rotate: [0, -35, 20, -10, 0], 
      color: ["#FFFFFF", "#FFD700"],
      transition: { duration: 0.6, ease: "easeInOut" } as any
    },
    exit: { 
      rotate: [0, -35, 20, -10, 0], 
      color: ["#FFD700", "#FFFFFF"],
      transition: { duration: 0.6, ease: "easeInOut" } as any
    }
  },
  {
    name: "4. Slow Windup",
    initial: { rotate: 0, color: "#FFFFFF" },
    animate: { 
      rotate: [0, -45, -45, 0], 
      color: ["#FFFFFF", "#FFA500", "#FFD700"],
      transition: { duration: 0.6, ease: "easeInOut" } as any
    },
    exit: { 
      rotate: [0, -45, -45, 0], 
      color: ["#FFD700", "#FFA500", "#FFFFFF"],
      transition: { duration: 0.6, ease: "easeInOut" } as any
    }
  }
];

export const AnimationLab = () => {
  const [heldStates, setHeldStates] = useState([false, false, false, false]);

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
              
              <AnimatePresence mode="wait">
                {heldStates[i] ? (
                  <motion.div 
                    key="locked"
                    initial={variant.initial}
                    animate={variant.animate}
                    exit={variant.exit}
                    className={`${styles.actionBtn} ${styles.holdIcon}`}
                  >
                    <Lock size={20} color="currentColor" />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="unlocked"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 1 }}
                    className={`${styles.actionBtn} ${styles.unlockIcon}`}
                  >
                    <Unlock size={20} color="currentColor" />
                  </motion.div>
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
