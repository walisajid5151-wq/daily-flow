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
      
      // Quick burst confetti - reduced particles
      confetti({
        particleCount: 25,
        angle: 60,
        spread: 40,
        origin: { x: 0.1, y: 0.6 },
        colors: ['#1d9b8a', '#f59e0b', '#22c55e']
      });
      confetti({
        particleCount: 25,
        angle: 120,
        spread: 40,
        origin: { x: 0.9, y: 0.6 },
        colors: ['#1d9b8a', '#f59e0b', '#22c55e']
      });

      // Auto-hide after 1.5 seconds (shorter)
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 1500);

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
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background/40 backdrop-blur-sm"
          onClick={() => {
            setIsVisible(false);
            onComplete?.();
          }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 400, duration: 0.3 }}
            className="text-center p-6"
          >
            {/* Quick Party Popper */}
            <motion.div
              className="text-6xl mb-4"
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
            >
              🎉
            </motion.div>

            {/* Quote Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="quote-card max-w-xs mx-auto"
            >
              <p className="text-base font-medium">{displayQuote}</p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}