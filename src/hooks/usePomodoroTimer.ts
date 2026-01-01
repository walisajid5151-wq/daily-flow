import { useState, useEffect, useCallback, useRef } from "react";

interface PomodoroState {
  timeLeft: number;
  isRunning: boolean;
  sessionType: "work" | "break";
  sessionsCompleted: number;
}

const STORAGE_KEY = "planit_pomodoro_state";

export function usePomodoroTimer(workDuration: number, breakDuration: number = 5) {
  const [state, setState] = useState<PomodoroState>(() => {
    // Restore from localStorage for offline support
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Calculate elapsed time if timer was running
        if (parsed.isRunning && parsed.lastUpdate) {
          const elapsed = Math.floor((Date.now() - parsed.lastUpdate) / 1000);
          const newTimeLeft = Math.max(0, parsed.timeLeft - elapsed);
          return { ...parsed, timeLeft: newTimeLeft };
        }
        return parsed;
      } catch {
        return { timeLeft: workDuration * 60, isRunning: false, sessionType: "work", sessionsCompleted: 0 };
      }
    }
    return { timeLeft: workDuration * 60, isRunning: false, sessionType: "work", sessionsCompleted: 0 };
  });

  const intervalRef = useRef<number | null>(null);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      lastUpdate: Date.now()
    }));
  }, [state]);

  // Timer logic
  useEffect(() => {
    if (state.isRunning && state.timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning]);

  // Check for completion
  useEffect(() => {
    if (state.timeLeft === 0 && state.isRunning) {
      setState(prev => ({ ...prev, isRunning: false }));
    }
  }, [state.timeLeft, state.isRunning]);

  const start = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: true }));
  }, []);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      timeLeft: prev.sessionType === "work" ? workDuration * 60 : breakDuration * 60,
      isRunning: false
    }));
  }, [workDuration, breakDuration]);

  const setWorkDurationMin = useCallback((mins: number) => {
    setState(prev => ({
      ...prev,
      timeLeft: prev.sessionType === "work" && !prev.isRunning ? mins * 60 : prev.timeLeft
    }));
  }, []);

  const startSession = useCallback((type: "work" | "break") => {
    setState(prev => ({
      ...prev,
      sessionType: type,
      timeLeft: type === "work" ? workDuration * 60 : breakDuration * 60,
      isRunning: true
    }));
  }, [workDuration, breakDuration]);

  const completeSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      sessionsCompleted: prev.sessionType === "work" ? prev.sessionsCompleted + 1 : prev.sessionsCompleted,
      isRunning: false
    }));
  }, []);

  const clearState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ timeLeft: workDuration * 60, isRunning: false, sessionType: "work", sessionsCompleted: 0 });
  }, [workDuration]);

  return {
    ...state,
    start,
    pause,
    reset,
    setWorkDurationMin,
    startSession,
    completeSession,
    clearState,
    isComplete: state.timeLeft === 0
  };
}
