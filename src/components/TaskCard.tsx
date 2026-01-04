import { motion } from "framer-motion";
import { Check, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  title: string;
  scheduled_time: string | null;
  duration_minutes: number;
  completed: boolean;
  priority: string;
}

interface TaskCardProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete?: () => void;
  index?: number;
  delay?: number;
}

export function TaskCard({ task, onToggle, onDelete, index = 0, delay }: TaskCardProps) {
  const animationDelay = delay ?? index * 0.05;
  const getPriorityStyles = () => {
    switch (task.priority) {
      case 'high':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium':
        return 'bg-warning/20 text-warning border-warning/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animationDelay }}
      className={`glass-card p-4 flex items-center gap-3 ${task.completed ? "opacity-60" : ""}`}
    >
      <button
        onClick={() => onToggle(task.id, task.completed)}
        className={`checkbox-custom ${task.completed ? "checked" : ""}`}
      >
        {task.completed && <Check className="w-4 h-4 text-primary-foreground" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {task.scheduled_time && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.scheduled_time.slice(0, 5)}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityStyles()}`}>
            {task.priority.toUpperCase()}
          </span>
        </div>
      </div>

      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
}
