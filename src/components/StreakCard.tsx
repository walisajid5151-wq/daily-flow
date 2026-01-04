import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ChevronRight, Zap, Calendar, TrendingUp } from "lucide-react";
import { format, subDays } from "date-fns";

interface Skill {
  id: string;
  name: string;
  target_minutes_daily: number;
  streak_count: number;
  last_practiced_at: string | null;
}

interface StreakCardProps {
  skills: Skill[];
  totalStreak: number;
  userId?: string;
  onViewSkills?: () => void;
}

export function StreakCard({ skills, totalStreak, onViewSkills }: StreakCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const practicedToday = skills.filter(s => s.last_practiced_at === today);
  const pending = skills.filter(s => s.last_practiced_at !== today);

  // Generate last 7 days for streak visualization
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return format(date, "yyyy-MM-dd");
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Main Streak Display */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <motion.div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              totalStreak > 0 ? "bg-gradient-accent" : "bg-muted"
            }`}
            animate={totalStreak > 0 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Flame className={`w-7 h-7 ${totalStreak > 0 ? "text-accent-foreground" : "text-muted-foreground"}`} />
          </motion.div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground">Daily Streak</p>
            <p className="text-2xl font-display font-bold text-foreground">
              {totalStreak} day{totalStreak !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/50"
          >
            {/* 7-Day Activity */}
            <div className="p-4 pb-3">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Last 7 days
              </p>
              <div className="flex justify-between gap-1">
                {last7Days.map((date, i) => {
                  const hasActivity = skills.some(s => s.last_practiced_at === date);
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`w-full aspect-square rounded-lg ${
                          hasActivity ? "bg-primary" : "bg-muted"
                        }`}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(date), "EEE")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skills Progress */}
            <div className="px-4 pb-4 space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Today's Practice
              </p>
              
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No skills added yet</p>
              ) : (
                <>
                  {practicedToday.map(skill => (
                    <div key={skill.id} className="flex items-center gap-2 py-1.5">
                      <div className="w-6 h-6 rounded-lg bg-gradient-success flex items-center justify-center">
                        <Zap className="w-3 h-3 text-success-foreground" />
                      </div>
                      <span className="text-sm text-foreground flex-1">{skill.name}</span>
                      <span className="text-xs text-success">{skill.target_minutes_daily}m ✓</span>
                    </div>
                  ))}
                  {pending.map(skill => (
                    <div key={skill.id} className="flex items-center gap-2 py-1.5 opacity-60">
                      <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
                        <Zap className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-foreground flex-1">{skill.name}</span>
                      <span className="text-xs text-muted-foreground">{skill.target_minutes_daily}m</span>
                    </div>
                  ))}
                </>
              )}

              {onViewSkills && (
                <button
                  onClick={onViewSkills}
                  className="w-full mt-2 py-2 text-sm text-primary hover:underline"
                >
                  View all skills →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
