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
import { DayProgressCircle } from "@/components/DayProgressCircle";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { StreakCard } from "@/components/StreakCard";
import { HighPriorityModal } from "@/components/HighPriorityModal";
import { DaySummaryCard } from "@/components/DaySummaryCard";
import { useExamReminders } from "@/hooks/useExamReminders";
import { useDaySettings } from "@/hooks/useDaySettings";
import { Plus, Calendar, Target, Quote } from "lucide-react";
import { format, addDays } from "date-fns";

interface Task {
  id: string;
  title: string;
  type: "daily" | "exam" | "skill";
  scheduled_date: string | null;
  duration_minutes: number;
  completed: boolean;
  priority: string;
}

interface Skill {
  id: string;
  name: string;
  target_minutes_daily: number;
  streak_count: number;
  last_practiced_at: string | null;
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
  const { isEndOfDay } = useDaySettings();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationQuote, setCelebrationQuote] = useState("");

  // High priority modal state
  const [showHighPriorityModal, setShowHighPriorityModal] = useState(false);
  const [pendingHighPriorityTask, setPendingHighPriorityTask] = useState<Task | null>(null);

  // Enable exam reminders
  useExamReminders(user?.id);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchSkills();
      generateMotivation();
    }
  }, [user]);

  // Check for incomplete high priority tasks at end of day
  useEffect(() => {
    if (isEndOfDay() && tasks.length > 0) {
      const incompleteHighPriority = tasks.filter(
        t => !t.completed && t.priority === "high"
      );

      if (incompleteHighPriority.length > 0 && !showHighPriorityModal) {
        const lastPrompt = localStorage.getItem("planit-last-hp-prompt");
        const today = format(new Date(), "yyyy-MM-dd");

        if (lastPrompt !== today) {
          setPendingHighPriorityTask(incompleteHighPriority[0]);
          setShowHighPriorityModal(true);
          localStorage.setItem("planit-last-hp-prompt", today);
        }
      }
    }
  }, [tasks, isEndOfDay, showHighPriorityModal]);

  const fetchTasks = async () => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("scheduled_date", today)
      .order("scheduled_time");
    if (data) setTasks(data as Task[]);
  };

  const fetchSkills = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("skills")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");
    if (data) setSkills(data as Skill[]);
  };

  const calculateTotalStreak = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const allPracticedToday =
      skills.length > 0 &&
      skills.every(s => s.last_practiced_at === today);

    if (skills.length === 0) return 0;

    const minStreak = Math.min(...skills.map(s => s.streak_count || 0));
    return allPracticedToday ? Math.max(minStreak, 1) : minStreak;
  };

  const generateMotivation = () => {
    setMotivationalMessage(
      MOTIVATIONAL_MESSAGES[
        Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
      ]
    );
  };

  const toggleTask = async (id: string, completed: boolean) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    await supabase
      .from("tasks")
      .update({
        completed: !completed,
        completed_at: !completed ? new Date().toISOString() : null,
      })
      .eq("id", id);

    fetchTasks();

    if (!completed) {
      setCelebrationQuote(`"${task.title}" - Done! Keep crushing it.`);
      setShowCelebration(true);
      toast({ title: "Task completed! 🎉" });
    }
  };

  const addTask = async (
    title: string,
    type: "daily" | "exam" | "skill",
    scheduledDate: string | null = format(new Date(), "yyyy-MM-dd")
  ) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          title,
          type,
          scheduled_date: scheduledDate,
          completed: false,
          user_id: user.id,
          priority: type === "exam" ? "high" : "normal",
        },
      ])
      .select();

    if (error) {
      toast({ title: "Failed to add task", description: error.message });
      return null;
    }

    fetchTasks();
    toast({ title: "Task added!" });
    return data;
  };

  const handleMoveToTomorrow = async () => {
    if (!pendingHighPriorityTask || !user) return;

    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

    await supabase
      .from("tasks")
      .update({
        scheduled_date: tomorrow,
        completed: false,
        completed_at: null,
      })
      .eq("id", pendingHighPriorityTask.id);

    setShowHighPriorityModal(false);
    setPendingHighPriorityTask(null);
    fetchTasks();

    toast({ title: "Task moved to tomorrow" });
  };

  const handleSkipTask = () => {
    setShowHighPriorityModal(false);
    setPendingHighPriorityTask(null);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length ? (completedCount / tasks.length) * 100 : 0;

  const skillStreakData = skills.map(s => ({
    skillName: s.name,
    streak: s.streak_count || 0,
    lastPracticed: s.last_practiced_at,
    targetMinutes: s.target_minutes_daily,
  }));

  const completedTasks = tasks.filter(t => t.completed);
  const skippedTasks = tasks.filter(t => !t.completed);

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-hero pb-24">
      <CelebrationOverlay
        show={showCelebration}
        quote={celebrationQuote}
        onComplete={() => setShowCelebration(false)}
      />

      <HighPriorityModal
        isOpen={showHighPriorityModal}
        taskTitle={pendingHighPriorityTask?.title || ""}
        onConfirm={handleMoveToTomorrow}
        onSkip={handleSkipTask}
      />

      <header className="p-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-muted-foreground text-sm">
              {format(new Date(), "EEEE, MMMM d")}
            </p>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Good{" "}
              {new Date().getHours() < 12
                ? "morning"
                : new Date().getHours() < 18
                ? "afternoon"
                : "evening"}
            </h1>
          </div>
        </motion.div>
      </header>

      <main className="px-4 space-y-6">
        <StreakCard
          skills={skillStreakData}
          totalStreak={calculateTotalStreak()}
          onViewSkills={() => navigate("/skills")}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex flex-col items-center">
            <DayProgressCircle
              progress={progress}
              completedCount={completedCount}
              totalCount={tasks.length}
              size={160}
            />
            <p className="text-sm text-muted-foreground mt-4">
              Today's Progress
            </p>
          </div>
        </motion.div>

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

        <DaySummaryCard
          completedTasks={completedTasks}
          skippedTasks={skippedTasks}
          isEndOfDay={isEndOfDay()}
        />

        {/* Quick Actions: Call addTask on click */}
        <QuickActions addTask={addTask} />

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Today's Tasks
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/tasks")}
              className="text-primary"
            >
              See all
            </Button>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-6 text-center"
              >
                <Target className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No tasks for today</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() =>
                    addTask(
                      "New Task",
                      "daily",
                      format(new Date(), "yyyy-MM-dd")
                    )
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Task
                </Button>
              </motion.div>
            ) : (
              tasks.slice(0, 5).map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  delay={i * 0.05}
                />
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
