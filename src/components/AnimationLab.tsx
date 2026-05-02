import { useState } from 'react';
import { motion } from 'framer-motion';
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
    <div style={{ padding: 48, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, margin: 32, textAlign: 'center' }}>
      <h2 style={{ color: '#fff', fontSize: '2.2rem', marginBottom: 24, marginTop: 0 }}>🧪 Animation Testing Lab</h2>
      <p style={{ color: '#aaa', fontSize: '1.15rem', marginBottom: 32 }}>Click the dice below to test 4 different lock animations. Let me know which one you prefer!</p>
      
      <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
        {VARIANTS.map((variant, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div 
              className={styles.dice}
              style={{ backgroundColor: '#E9EAEC', position: 'relative', width: 140, height: 140 }}
              onClick={() => toggleHold(i)}
            >
              <div className={styles.number} style={{ fontSize: 56, color: '#000' }}>?</div>
              
              <motion.div 
                animate={{
                  rotate: heldStates[i] 
                    ? variant.animate.rotate.map((v: number, idx: number) => idx === 1 ? v + 0.01 : v)
                    : variant.animate.rotate.map((v: number, idx: number) => idx === 1 ? v - 0.01 : v),
                  color: heldStates[i] ? ["#FFFFFF", "#FFD700"] : ["#FFD700", "#FFFFFF"]
                }}
                transition={{ duration: 0.6, ease: "easeInOut" } as any}
                className={`${styles.actionBtn} ${styles.holdIcon}`}
                style={{ opacity: 1 }}
              >
                <div style={{ position: 'relative', width: 28, height: 28 }}>
                  <motion.div 
                    animate={{ opacity: heldStates[i] ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ position: 'absolute', top: 0, left: 0, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Lock size={28} color="currentColor" />
                  </motion.div>
                  <motion.div 
                    animate={{ opacity: heldStates[i] ? 0 : 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ position: 'absolute', top: 0, left: 0, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Unlock size={28} color="currentColor" />
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
