import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, RotateCcw, Check } from "lucide-react";
import confetti from "canvas-confetti";

const DURATIONS = [15, 25, 30, 45, 60];

export default function Focus() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setIsComplete(true);
      handleComplete();
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft]);

  const handleComplete = async () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    if (user) {
      await supabase.from("focus_sessions").insert({
        user_id: user.id,
        duration_minutes: duration,
        completed: true,
        ended_at: new Date().toISOString()
      });
    }
  };

  const selectDuration = (mins: number) => {
    setDuration(mins);
    setTimeLeft(mins * 60);
    setIsComplete(false);
  };

  const reset = () => {
    setTimeLeft(duration * 60);
    setIsRunning(false);
    setIsComplete(false);
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <header className="p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-display font-bold">Focus Mode</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="complete"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center"
            >
              <div className="w-32 h-32 rounded-full bg-gradient-success flex items-center justify-center mx-auto mb-6">
                <Check className="w-16 h-16 text-success-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Session Complete!</h2>
              <p className="text-muted-foreground mb-6">You focused for {duration} minutes</p>
              <Button onClick={reset}>Start Another</Button>
            </motion.div>
          ) : (
            <motion.div
              key="timer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center w-full"
            >
              {/* Duration Selector */}
              {!isRunning && (
                <div className="flex justify-center gap-2 mb-8">
                  {DURATIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => selectDuration(d)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        duration === d
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              )}

              {/* Timer Circle */}
              <div className="relative w-64 h-64 mx-auto mb-8">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="128" cy="128" r="120" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle
                    cx="128" cy="128" r="120"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={754}
                    strokeDashoffset={754 - (progress / 100) * 754}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-display font-bold text-foreground">
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-muted-foreground mt-2">
                    {isRunning ? "Stay focused" : "Ready?"}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                <Button variant="outline" size="icon" onClick={reset} className="w-12 h-12 rounded-full">
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => setIsRunning(!isRunning)}
                  className="w-16 h-16 rounded-full bg-gradient-primary glow-primary"
                >
                  {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
