import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Timer, BookOpen, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const actions = [
  { icon: Plus, label: "Add Task", path: "/tasks", color: "bg-primary", type: "navigate" },
  { icon: Timer, label: "Focus", path: "/focus", color: "bg-accent", type: "navigate" },
  { icon: BookOpen, label: "Exams", path: "/exams", color: "bg-success", type: "addExam" },
  { icon: Zap, label: "Practice", path: "/skills", color: "bg-warning", type: "addSkill" },
];

interface QuickActionsProps {
  onRefresh?: () => void; // callback to refresh dashboard
  userId?: string;
}

export function QuickActions({ onRefresh, userId }: QuickActionsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAction = async (actionType: string) => {
    if (!userId) {
      toast({ title: "Please log in to save your progress." });
      return;
    }

    try {
      if (actionType === "addSkill") {
        const { error } = await supabase
          .from("skills")
          .insert([{ name: "New Skill", target_minutes_daily: 30, streak_count: 0, user_id: userId }]);
        if (error) throw error;
        toast({ title: "Skill added ✅" });
      }

      if (actionType === "addExam") {
        const today = new Date().toISOString().split("T")[0];
        const { error } = await supabase
          .from("exams")
          .insert([{ title: "New Exam", exam_date: today, exam_time: null, subject: null, user_id: userId }]);
        if (error) throw error;
        toast({ title: "Exam created ✅" });
      }

      if (onRefresh) onRefresh(); // refresh dashboard after adding
    } catch (err: any) {
      toast({ title: `Error: ${err.message}` });
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ icon: Icon, label, path, color, type }, i) => (
        <motion.button
          key={label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.05 }}
          onClick={() => (type === "navigate" ? navigate(path) : handleAction(type))}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/50 hover:shadow-md transition-all touch-feedback"
        >
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </motion.button>
      ))}
    </div>
  );
}
