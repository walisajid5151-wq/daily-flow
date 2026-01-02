import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HighPriorityModalProps {
  isOpen: boolean;
  taskTitle: string;
  onConfirm: () => void;
  onSkip: () => void;
}

export function HighPriorityModal({ isOpen, taskTitle, onConfirm, onSkip }: HighPriorityModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onSkip}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto"
          >
            <div className="glass-card p-6 border border-border/50">
              {/* Close button */}
              <button 
                onClick={onSkip}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-display font-bold text-center text-foreground mb-2">
                Incomplete High Priority
              </h3>
              
              <p className="text-sm text-muted-foreground text-center mb-2">
                You didn't complete this task:
              </p>
              
              <p className="text-base font-medium text-foreground text-center mb-6 px-2">
                "{taskTitle}"
              </p>
              
              <p className="text-sm text-muted-foreground text-center mb-6">
                Add it to tomorrow's schedule?
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onSkip}
                >
                  No, skip
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={onConfirm}
                >
                  <Calendar className="w-4 h-4" />
                  Yes, add
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
