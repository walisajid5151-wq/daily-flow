import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface CelebrationOverlayProps {
  show: boolean;
  quote?: string;
  onComplete?: () => void;
}

const MOTIVATIONAL_QUOTES = [
  "One step closer to your goals.",
  "Progress over perfection.",
  "You're building momentum.",
  "Small wins lead to big victories.",
  "Keep that energy going!",
  "Consistency is your superpower.",
  "You showed up. That matters.",
  "Another win in the books.",
];

export function CelebrationOverlay({ show, quote, onComplete }: CelebrationOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const displayQuote = quote || MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Fire multiple confetti bursts
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      
      const fireConfetti = () => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#1d9b8a', '#f59e0b', '#22c55e', '#8b5cf6', '#ec4899']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#1d9b8a', '#f59e0b', '#22c55e', '#8b5cf6', '#ec4899']
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(fireConfetti);
        }
      };
      
      fireConfetti();

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background/50 backdrop-blur-sm"
          onClick={() => {
            setIsVisible(false);
            onComplete?.();
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="text-center p-8"
          >
            {/* Party Popper Emoji Animation */}
            <motion.div
              className="text-8xl mb-6"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, 0]
              }}
              transition={{ 
                duration: 0.5,
                repeat: 2,
                repeatType: "reverse"
              }}
            >
              🎉
            </motion.div>

            {/* Quote Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="quote-card max-w-sm mx-auto animate-glow-pulse"
            >
              <p className="text-lg font-medium relative z-10">{displayQuote}</p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}