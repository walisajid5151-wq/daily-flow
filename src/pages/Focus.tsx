import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
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
  const { user, supabaseUser, loading } = useAuth();
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

      if (supabaseUser) {
        await supabase.from("focus_sessions").insert({
          user_id: supabaseUser.id,
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-hero pb-24">
      <header className="p-4 pt-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-display font-bold">Focus Mode</h1>
      </header>

      <main className="px-4 space-y-8">
        {/* Session Type Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            timer.sessionType === "work" 
              ? "bg-primary/20 text-primary" 
              : "bg-success/20 text-success"
          }`}>
            {timer.sessionType === "work" ? (
              <Brain className="w-4 h-4" />
            ) : (
              <Coffee className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {timer.sessionType === "work" ? "Focus Time" : "Break Time"}
            </span>
          </div>
        </motion.div>

        {/* Timer Circle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center"
        >
          <div className="relative w-64 h-64">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                className="text-muted/30"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="120"
                cx="128"
                cy="128"
              />
              <motion.circle
                className={timer.sessionType === "work" ? "text-primary" : "text-success"}
                strokeWidth="8"
                strokeDasharray={753.98}
                strokeDashoffset={753.98 - (progress / 100) * 753.98}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="120"
                cx="128"
                cy="128"
                style={{
                  filter: `drop-shadow(0 0 10px ${timer.sessionType === "work" ? "hsl(var(--primary))" : "hsl(var(--success))"})`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-display font-bold text-foreground">
                {formatTime(timer.timeLeft)}
              </span>
              <span className="text-sm text-muted-foreground mt-2">
                Session {timer.sessionsCompleted + 1}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={timer.reset}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          
          <Button
            size="icon"
            className="w-16 h-16 rounded-full"
            onClick={timer.isRunning ? timer.pause : timer.start}
          >
            {timer.isRunning ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </Button>

          {timer.isComplete && (
            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14 rounded-full"
              onClick={startNextSession}
            >
              <Check className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Duration Selection */}
        {!timer.isRunning && !timer.isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <p className="text-center text-sm text-muted-foreground">Select duration</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {WORK_DURATIONS.map((mins) => (
                <Button
                  key={mins}
                  variant={workDuration === mins ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectWorkDuration(mins)}
                >
                  {mins} min
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="quote-card text-center"
        >
          <p className="text-base font-medium">{currentQuote}</p>
        </motion.div>

        {/* Sessions Stats */}
        <div className="glass-card p-4">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-2xl font-display font-bold text-foreground">
                {timer.sessionsCompleted}
              </p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">
                {timer.sessionsCompleted * workDuration}
              </p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
