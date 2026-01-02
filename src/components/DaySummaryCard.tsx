import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
}

interface DaySummaryCardProps {
  completedTasks: Task[];
  skippedTasks: Task[];
  isEndOfDay: boolean;
}

export function DaySummaryCard({ completedTasks, skippedTasks, isEndOfDay }: DaySummaryCardProps) {
  if (!isEndOfDay || (completedTasks.length === 0 && skippedTasks.length === 0)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Today's Summary
        </h3>
      </div>

      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-success flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Completed ({completedTasks.length})
          </p>
          <div className="space-y-1">
            {completedTasks.slice(0, 3).map(task => (
              <p key={task.id} className="text-sm text-foreground/80 line-through pl-4">
                {task.title}
              </p>
            ))}
            {completedTasks.length > 3 && (
              <p className="text-xs text-muted-foreground pl-4">
                +{completedTasks.length - 3} more
              </p>
            )}
          </div>
        </div>
      )}

      {skippedTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-destructive flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Skipped ({skippedTasks.length})
          </p>
          <div className="space-y-1">
            {skippedTasks.slice(0, 3).map(task => (
              <p key={task.id} className="text-sm text-foreground/60 pl-4">
                {task.title}
                {task.priority === 'high' && (
                  <span className="text-xs text-destructive ml-2">HIGH</span>
                )}
              </p>
            ))}
            {skippedTasks.length > 3 && (
              <p className="text-xs text-muted-foreground pl-4">
                +{skippedTasks.length - 3} more
              </p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
