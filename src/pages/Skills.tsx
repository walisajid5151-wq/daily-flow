 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { motion, AnimatePresence } from "framer-motion";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { useToast } from "@/hooks/use-toast";
 import { BottomNav } from "@/components/BottomNav";
 import { ArrowLeft, Plus, Zap, Flame, Play, Check } from "lucide-react";
 import confetti from "canvas-confetti";
 
 interface Skill {
   id: string;
   name: string;
   target_minutes_daily: number;
   streak_count: number;
   last_practiced_at: string | null;
 }
 
 export default function Skills() {
-  const { user, loading } = useAuth();
+  const { user, supabaseUser, loading } = useAuth();
   const navigate = useNavigate();
   const { toast } = useToast();
   const [skills, setSkills] = useState<Skill[]>([]);
   const [isOpen, setIsOpen] = useState(false);
   const [practicing, setPracticing] = useState<string | null>(null);
   const [showCelebration, setShowCelebration] = useState(false);
   const [completedSkillName, setCompletedSkillName] = useState("");
   const [newSkill, setNewSkill] = useState({ name: "", target: "30" });
 
   const quotes: Record<string, string[]> = {
     default: [
       "Consistency beats intensity.",
       "You showed up. That's what matters.",
       "Progress, not perfection."
     ]
   };
 
   useEffect(() => {
     if (!loading && !user) navigate("/auth");
   }, [user, loading, navigate]);
 
   useEffect(() => {
-    if (user) fetchSkills();
-  }, [user]);
+    if (supabaseUser) fetchSkills();
+  }, [supabaseUser]);
 
   const fetchSkills = async () => {
-    const { data } = await supabase.from("skills").select("*").order("created_at");
+    if (!supabaseUser) return;
+    const { data } = await supabase.from("skills").select("*").eq("user_id", supabaseUser.id).order("created_at");
     if (data) setSkills(data);
   };
 
   const addSkill = async () => {
     if (!newSkill.name.trim()) return;
-    await supabase.from("skills").insert({
-      user_id: user!.id,
+    const { error } = await supabase.from("skills").insert({
+      user_id: supabaseUser!.id,
       name: newSkill.name,
       target_minutes_daily: parseInt(newSkill.target)
     });
+    if (error) {
+      toast({ title: "Failed to add skill", description: error.message });
+      return;
+    }
     setNewSkill({ name: "", target: "30" });
     setIsOpen(false);
     fetchSkills();
     toast({ title: "Skill added!" });
   };
 
   const completePractice = async (skill: Skill) => {
+    if (!supabaseUser) return;
     const today = new Date().toISOString().split("T")[0];
     const isNewStreak = skill.last_practiced_at !== today;
     
-    await supabase.from("skills").update({
+    const { error: updateError } = await supabase.from("skills").update({
       last_practiced_at: today,
       streak_count: isNewStreak ? skill.streak_count + 1 : skill.streak_count
     }).eq("id", skill.id);
 
-    await supabase.from("skill_logs").insert({
-      user_id: user!.id,
+    if (updateError) {
+      toast({ title: "Failed to update streak", description: updateError.message });
+      return;
+    }
+
+    const { error: logError } = await supabase.from("skill_logs").insert({
+      user_id: supabaseUser!.id,
       skill_id: skill.id,
       duration_minutes: skill.target_minutes_daily
     });
+    if (logError) {
+      toast({ title: "Failed to log practice", description: logError.message });
+      return;
+    }
 
     setPracticing(null);
     setCompletedSkillName(skill.name);
     setShowCelebration(true);
     
     confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
     
     setTimeout(() => setShowCelebration(false), 3000);
     fetchSkills();
   };
 
   if (loading) return null;
 
   const randomQuote = quotes.default[Math.floor(Math.random() * quotes.default.length)];
 
   return (
     <div className="min-h-screen bg-gradient-hero pb-24">
       <AnimatePresence>
         {showCelebration && (
           <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.8 }}
             className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
           >

