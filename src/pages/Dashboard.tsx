import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { TaskCard } from "@/components/TaskCard";
import { QuickActions } from "@/components/QuickActions";
import { ProgressRing } from "@/components/ProgressRing";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { Plus, Calendar, Target, Flame, Quote } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  scheduled_time: string | null;
  duration_minutes: number;
  completed: boolean;
  priority: string;
}

const MOTIVATIONAL_MESSAGES = [
  "Small steps lead to big wins. You've got this.",
  "Focus on progress, not perfection.",
  "Every task you complete is a win.",
  "Your future self will thank you.",
  "One thing at a time. Start now.",
  "You're closer than you think.",
  "Consistency beats intensity.",
  "Today's effort shapes tomorrow's success.",
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [streak, setStreak] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationQuote, setCelebrationQuote] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTasks();
      generateMotivation();
      fetchStreak();
    }
  }, [user]);

  const fetchTasks = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("scheduled_date", today)
      .order("scheduled_time");
    if (data) setTasks(data);
  };

  const fetchStreak = async () => {
    if (!user) return;
    const { data: reviews } = await supabase
      .from("daily_reviews")
      .select("review_date, all_completed")
      .eq("user_id", user.id)
      .order("review_date", { ascending: false })
      .limit(30);

    if (reviews && reviews.length > 0) {
      let currentStreak = 0;
      const dates = reviews.filter(r => r.all_completed).map(r => r.review_date);
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        if (dates.includes(dateStr)) {
          currentStreak++;
        } else if (i > 0) {
          break;
        }
      }
      setStreak(currentStreak);
    }
  };

  const generateMotivation = () => {
    setMotivationalMessage(MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]);
  };

  const toggleTask = async (id: string, completed: boolean) => {
    const task = tasks.find(t => t.id === id);
    await supabase.from("tasks").update({ 
      completed: !completed, 
      completed_at: !completed ? new Date().toISOString() : null 
    }).eq("id", id);
    
    fetchTasks();
    
    if (!completed) {
      // Show celebration with task-specific quote
      setCelebrationQuote(`"${task?.title}" - Done! Keep crushing it.`);
      setShowCelebration(true);
      toast({ title: "Task completed! 🎉" });
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length ? (completedCount / tasks.length) * 100 : 0;

  if (loading) return <div className="min-h-screen bg-gradient-hero flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-hero pb-24">
      <CelebrationOverlay 
        show={showCelebration} 
        quote={celebrationQuote}
        onComplete={() => setShowCelebration(false)} 
      />

      <header className="p-4 pt-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{format(new Date(), "EEEE, MMMM d")}</p>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}
            </h1>
          </div>
          {streak > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="streak-badge"
            >
              <Flame className="w-4 h-4" />
              {streak} day{streak !== 1 ? 's' : ''}
            </motion.div>
          )}
        </motion.div>
      </header>

      <main className="px-4 space-y-6">
        {/* Progress Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4">
          <div className="flex items-center gap-4">
            <ProgressRing progress={progress} size={80} />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Today's Progress</p>
              <p className="text-2xl font-display font-bold">{completedCount}/{tasks.length} tasks</p>
            </div>
          </div>
        </motion.div>

        {/* Motivational Quote Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.15 }}
          className="quote-card"
        >
          <div className="flex items-start gap-3">
            <Quote className="w-5 h-5 opacity-60 flex-shrink-0 mt-0.5" />
            <p className="text-base font-medium">{motivationalMessage}</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Today's Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Today's Tasks
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/tasks")} className="text-primary">
              See all
            </Button>
          </div>
          
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 text-center">
                <Target className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No tasks for today</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/tasks")}>
                  <Plus className="w-4 h-4 mr-1" /> Add Task
                </Button>
              </motion.div>
            ) : (
              tasks.slice(0, 5).map((task, i) => (
                <TaskCard key={task.id} task={task} onToggle={toggleTask} delay={i * 0.05} />
              ))
            )}
          </div>
        </section>
      </main>

      <button onClick={() => navigate("/focus")} className="fab">
        <Target className="w-6 h-6" />
      </button>

      <BottomNav />
    </div>
  );
}