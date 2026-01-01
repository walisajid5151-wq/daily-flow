import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, RotateCcw, Check, Coffee, Brain } from "lucide-react";
import { usePomodoroTimer } from "@/hooks/usePomodoroTimer";
import { useNotification } from "@/hooks/useNotification";
import confetti from "canvas-confetti";

const WORK_DURATIONS = [15, 25, 30, 45, 60];
const BREAK_DURATION = 5;

const QUOTES = [
  "Small progress is still progress.",
  "Focus on the step in front of you, not the whole staircase.",
  "You're doing better than you think.",
  "One task at a time. You've got this.",
  "Rest is part of the process.",
  "Every focused minute counts.",
  "Your future self will thank you.",
  "Breathe. Focus. Achieve.",
];

export default function Focus() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { notify, playSound } = useNotification();
  const [workDuration, setWorkDuration] = useState(25);
  const [currentQuote, setCurrentQuote] = useState("");
  
  const timer = usePomodoroTimer(workDuration, BREAK_DURATION);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    setCurrentQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, [timer.isComplete]);

  // Handle session completion
  useEffect(() => {
    if (timer.isComplete && timer.timeLeft === 0) {
      handleSessionComplete();
    }
  }, [timer.isComplete, timer.timeLeft]);

  const handleSessionComplete = async () => {
    // Play alarm sound and show notification
    playSound("alarm");
    notify(timer.sessionType === "work" ? "Focus Complete! 🎉" : "Break Over!", {
      body: timer.sessionType === "work" 
        ? "Great work! Take a well-deserved break." 
        : "Ready to get back to work?",
      sound: "success"
    });

    // Fire confetti for work sessions
    if (timer.sessionType === "work") {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#1d9b8a', '#f59e0b', '#22c55e']
      });
      
      timer.completeSession();

      if (user) {
        await supabase.from("focus_sessions").insert({
          user_id: user.id,
          duration_minutes: workDuration,
          session_type: "focus",
          completed: true,
          ended_at: new Date().toISOString()
        });
      }
    }
  };

  const selectWorkDuration = (mins: number) => {
    setWorkDuration(mins);
    timer.setWorkDurationMin(mins);
  };

  const startNextSession = () => {
    if (timer.sessionType === "work") {
      timer.startSession("break");
    } else {
      timer.startSession("work");
    }
  };

  const progress = timer.sessionType === "work"
    ? ((workDuration * 60 - timer.timeLeft) / (workDuration * 60)) * 100
    : ((BREAK_DURATION * 60 - timer.timeLeft) / (BREAK_DURATION * 60)) * 100;
  
  const minutes = Math.floor(timer.timeLeft / 60);
  const seconds = timer.timeLeft % 60;

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-bold">Pomodoro Focus</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Brain className="w-4 h-4" />
          <span>{timer.sessionsCompleted} sessions</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <AnimatePresence mode="wait">
          {timer.isComplete ? (
            <motion.div
              key="complete"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center w-full max-w-sm"
            >
              <motion.div 
                className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  timer.sessionType === "work" ? "bg-gradient-success" : "bg-gradient-accent"
                }`}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5 }}
              >
                {timer.sessionType === "work" ? (
                  <Check className="w-16 h-16 text-success-foreground" />
                ) : (
                  <Coffee className="w-16 h-16 text-accent-foreground" />
                )}
              </motion.div>
              
              <h2 className="text-2xl font-display font-bold mb-2">
                {timer.sessionType === "work" ? "Great work!" : "Break's over!"}
              </h2>
              
              {/* Highlighted Quote Card */}
              <motion.div 
                className="quote-card my-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-lg font-medium relative z-10">{currentQuote}</p>
              </motion.div>

              <div className="space-y-3">
                <Button 
                  onClick={startNextSession} 
                  className="w-full bg-gradient-primary glow-primary"
                >
                  {timer.sessionType === "work" ? (
                    <>
                      <Coffee className="w-4 h-4 mr-2" />
                      Start 5 min Break
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Start {workDuration} min Focus
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={timer.reset}>
                  Back to Timer
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="timer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center w-full"
            >
              {/* Session Type Tabs */}
              <div className="flex justify-center gap-2 mb-6">
                <button
                  onClick={() => !timer.isRunning && timer.startSession("work")}
                  disabled={timer.isRunning}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    timer.sessionType === "work"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  } ${timer.isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Brain className="w-4 h-4" />
                  Focus
                </button>
                <button
                  onClick={() => !timer.isRunning && timer.startSession("break")}
                  disabled={timer.isRunning}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    timer.sessionType === "break"
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  } ${timer.isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Coffee className="w-4 h-4" />
                  Break
                </button>
              </div>

              {/* Duration Selector (only for work sessions when not running) */}
              {!timer.isRunning && timer.sessionType === "work" && (
                <div className="flex justify-center gap-2 mb-8">
                  {WORK_DURATIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => selectWorkDuration(d)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        workDuration === d
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
                    stroke={timer.sessionType === "work" ? "hsl(var(--primary))" : "hsl(var(--accent))"}
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
                  <span className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                    {timer.sessionType === "work" ? (
                      <><Brain className="w-3 h-3" /> {timer.isRunning ? "Stay focused" : "Ready to focus?"}</>
                    ) : (
                      <><Coffee className="w-3 h-3" /> {timer.isRunning ? "Relax..." : "Ready for break?"}</>
                    )}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                <Button variant="outline" size="icon" onClick={timer.reset} className="w-12 h-12 rounded-full">
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => timer.isRunning ? timer.pause() : timer.start()}
                  className={`w-16 h-16 rounded-full ${
                    timer.sessionType === "work" 
                      ? "bg-gradient-primary glow-primary" 
                      : "bg-gradient-accent glow-accent"
                  }`}
                >
                  {timer.isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
