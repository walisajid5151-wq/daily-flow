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
import { ArrowLeft, Plus, Zap, Flame, Play, Check, Trash2 } from "lucide-react";
import confetti from "canvas-confetti";

interface Skill {
  id: string;
  name: string;
  target_minutes_daily: number;
  streak_count: number;
  last_practiced_at: string | null;
}

export default function Skills() {
  const { user, supabaseUser, loading } = useAuth();
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
    if (supabaseUser) fetchSkills();
  }, [supabaseUser]);

  const fetchSkills = async () => {
    if (!supabaseUser) return;
    const { data } = await supabase
      .from("skills")
      .select("*")
      .eq("user_id", supabaseUser.id)
      .order("created_at");
    if (data) setSkills(data);
  };

  const addSkill = async () => {
    if (!newSkill.name.trim() || !supabaseUser) return;
    const { error } = await supabase.from("skills").insert({
      user_id: supabaseUser.id,
      name: newSkill.name,
      target_minutes_daily: parseInt(newSkill.target)
    });
    if (error) {
      toast({ title: "Failed to add skill", description: error.message });
      return;
    }
    setNewSkill({ name: "", target: "30" });
    setIsOpen(false);
    fetchSkills();
    toast({ title: "Skill added!" });
  };

  const deleteSkill = async (id: string) => {
    if (!supabaseUser) return;
    await supabase.from("skills").delete().eq("id", id);
    fetchSkills();
    toast({ title: "Skill deleted" });
  };

  const completePractice = async (skill: Skill) => {
    if (!supabaseUser) return;
    const today = new Date().toISOString().split("T")[0];
    const isNewStreak = skill.last_practiced_at !== today;
    
    const { error: updateError } = await supabase.from("skills").update({
      last_practiced_at: today,
      streak_count: isNewStreak ? skill.streak_count + 1 : skill.streak_count
    }).eq("id", skill.id);

    if (updateError) {
      toast({ title: "Failed to update streak", description: updateError.message });
      return;
    }

    const { error: logError } = await supabase.from("skill_logs").insert({
      user_id: supabaseUser.id,
      skill_id: skill.id,
      duration_minutes: skill.target_minutes_daily
    });
    if (logError) {
      toast({ title: "Failed to log practice", description: logError.message });
      return;
    }

    setPracticing(null);
    setCompletedSkillName(skill.name);
    setShowCelebration(true);
    
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    
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
            <div className="text-center p-6">
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                🔥
              </motion.div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                {completedSkillName} Complete!
              </h2>
              <p className="text-muted-foreground">{randomQuote}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="p-4 pt-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-display font-bold">Skills Practice</h1>
      </header>

      <main className="px-4 space-y-4">
        <div className="flex justify-end">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> Add Skill</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Skill</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Skill name"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                />
                <div>
                  <label className="text-sm text-muted-foreground">Daily target (minutes)</label>
                  <Input
                    type="number"
                    value={newSkill.target}
                    onChange={(e) => setNewSkill({ ...newSkill, target: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={addSkill}>Add Skill</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {skills.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No skills yet. Add your first skill to start building streaks!</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {skills.map((skill, i) => {
              const today = new Date().toISOString().split("T")[0];
              const practicedToday = skill.last_practiced_at === today;
              const isPracticing = practicing === skill.id;
              
              return (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass-card p-4 border ${practicedToday ? 'border-success/50 bg-success/5' : 'border-border/50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{skill.name}</h3>
                        {practicedToday && (
                          <Check className="w-4 h-4 text-success" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>{skill.target_minutes_daily} min/day</span>
                        <span className="flex items-center gap-1 text-warning">
                          <Flame className="w-3.5 h-3.5" />
                          {skill.streak_count} day streak
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!practicedToday && (
                        <Button
                          size="sm"
                          variant={isPracticing ? "default" : "outline"}
                          onClick={() => isPracticing ? completePractice(skill) : setPracticing(skill.id)}
                        >
                          {isPracticing ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Done
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Start
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteSkill(skill.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
