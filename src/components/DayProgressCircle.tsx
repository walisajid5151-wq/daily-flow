import { motion } from "framer-motion";

interface DayProgressCircleProps {
  progress: number; // 0-100
  completedCount: number;
  totalCount: number;
  size?: number;
  strokeWidth?: number;
}

export function DayProgressCircle({ 
  progress, 
  completedCount, 
  totalCount,
  size = 160, 
  strokeWidth = 12 
}: DayProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  // Color interpolation: Red (0%) → Orange (33%) → Yellow (66%) → Green (100%)
  const getProgressColor = (p: number) => {
    if (p <= 25) {
      // Red to Orange
      return `hsl(${0 + (p / 25) * 30}, 90%, 50%)`;
    } else if (p <= 50) {
      // Orange to Yellow
      return `hsl(${30 + ((p - 25) / 25) * 30}, 90%, 50%)`;
    } else if (p <= 75) {
      // Yellow to Lime
      return `hsl(${60 + ((p - 50) / 25) * 40}, 85%, 45%)`;
    } else {
      // Lime to Green
      return `hsl(${100 + ((p - 75) / 25) * 40}, 80%, 42%)`;
    }
  };

  const progressColor = getProgressColor(progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl opacity-30"
        style={{ backgroundColor: progressColor }}
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <motion.circle
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          strokeLinecap="round"
          stroke={progressColor}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            filter: `drop-shadow(0 0 8px ${progressColor})`,
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-3xl font-display font-bold text-foreground"
          key={progress}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {Math.round(progress)}%
        </motion.span>
        <span className="text-xs text-muted-foreground mt-1">
          {completedCount}/{totalCount} tasks
        </span>
      </div>
    </div>
  );
}
