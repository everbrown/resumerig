import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface MatchScoreProps {
  beforeScore: number;
  afterScore: number;
}

function useAnimatedCount(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setCount(current);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
}

const MatchScore = ({ beforeScore, afterScore }: MatchScoreProps) => {
  const animatedBefore = useAnimatedCount(beforeScore, 800);
  const animatedAfter = useAnimatedCount(afterScore, 1400);
  const improvement = afterScore - beforeScore;

  const getColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-destructive";
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12">
        {/* Before */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-body text-xs uppercase tracking-widest text-muted-foreground">
            Before
          </span>
          <span className={`font-display text-5xl font-bold ${getColor(beforeScore)}`}>
            {animatedBefore}%
          </span>
          <span className="font-body text-xs text-muted-foreground">Original Match</span>
        </div>

        {/* Arrow + Improvement */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex flex-col items-center gap-1"
        >
          <TrendingUp className="h-6 w-6 text-green-500" />
          <span className="font-display text-lg font-bold text-green-500">
            +{improvement}%
          </span>
        </motion.div>

        {/* After */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-body text-xs uppercase tracking-widest text-muted-foreground">
            After
          </span>
          <motion.span
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className={`font-display text-5xl font-bold ${getColor(afterScore)}`}
          >
            {animatedAfter}%
          </motion.span>
          <span className="font-body text-xs text-muted-foreground">Tuned Match</span>
        </div>
      </div>

      {/* Celebration message */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.4 }}
        className="mt-6 text-center font-body text-sm text-muted-foreground"
      >
        Your JD match went from{" "}
        <span className={`font-semibold ${getColor(beforeScore)}`}>{beforeScore}%</span>
        {" "}to{" "}
        <span className={`font-semibold ${getColor(afterScore)}`}>{afterScore}%</span>!
      </motion.p>
    </motion.div>
  );
};

export default MatchScore;
