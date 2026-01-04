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
-  const { user, loading } = useAuth();
+  const { user, supabaseUser, loading } = useAuth();
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
 
-      if (user) {
+      if (supabaseUser) {
         await supabase.from("focus_sessions").insert({
-          user_id: user.id,
+          user_id: supabaseUser.id,
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
