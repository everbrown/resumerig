import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Info } from "lucide-react";
import type { ScoreBreakdown } from "@/lib/analyzeCareerPivot";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MatchScoreProps {
  beforeScore: number;
  afterScore: number;
  beforeBreakdown?: ScoreBreakdown;
  afterBreakdown?: ScoreBreakdown;
}

function useAnimatedCount(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setCount(current);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
}

const dimensions = [
  { key: "keywordMatch" as const, label: "Keywords", weight: "30%" },
  { key: "skillsCoverage" as const, label: "Skills", weight: "25%" },
  { key: "quantification" as const, label: "Metrics", weight: "20%" },
  { key: "toneAlignment" as const, label: "Tone", weight: "15%" },
  { key: "formatCompliance" as const, label: "Format", weight: "10%" },
];

const BreakdownTooltipContent = ({
  label,
  breakdown,
}: {
  label: string;
  breakdown: ScoreBreakdown;
}) => (
  <div className="space-y-2 min-w-[200px]">
    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
      {label} — Score Breakdown
    </p>
    <div className="space-y-1.5">
      {dimensions.map((dim) => {
        const score = breakdown[dim.key];
        return (
          <div key={dim.key} className="flex items-center gap-2">
            <span className="font-body text-xs text-muted-foreground w-[52px] shrink-0">
              {dim.label}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-secondary"
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="font-mono text-xs text-foreground w-[36px] text-right">
              {score}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground w-[28px]">
              ×{dim.weight}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

const MatchScore = ({
  beforeScore,
  afterScore,
  beforeBreakdown,
  afterBreakdown,
}: MatchScoreProps) => {
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
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12">
          {/* Before */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Before
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`font-mono text-5xl font-bold tabular-nums ${getColor(beforeScore)}`}>
                {animatedBefore}%
              </span>
              {beforeBreakdown && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="p-3 max-w-[280px]">
                    <BreakdownTooltipContent label="Original" breakdown={beforeBreakdown} />
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <span className="font-body text-xs text-muted-foreground">Original Match</span>
          </div>

          {/* Arrow + Improvement */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex flex-col items-center gap-1"
          >
            <TrendingUp className="h-6 w-6 text-secondary" />
            <span className="font-mono text-lg font-bold text-secondary">
              +{improvement}%
            </span>
          </motion.div>

          {/* After */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              After
            </span>
            <div className="flex items-center gap-1.5">
              <motion.span
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ delay: 1.2, duration: 0.4 }}
                className={`font-mono text-5xl font-bold tabular-nums ${getColor(afterScore)}`}
              >
                {animatedAfter}%
              </motion.span>
              {afterBreakdown && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="p-3 max-w-[280px]">
                    <BreakdownTooltipContent label="Refined" breakdown={afterBreakdown} />
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <span className="font-body text-xs text-muted-foreground">Refined Match</span>
          </div>
        </div>
      </TooltipProvider>

      {/* Celebration message */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.4 }}
        className="mt-6 text-center font-body text-sm text-muted-foreground"
      >
        Your JD match went from{" "}
        <span className={`font-mono font-semibold ${getColor(beforeScore)}`}>{beforeScore}%</span>
        {" "}to{" "}
        <span className={`font-mono font-semibold ${getColor(afterScore)}`}>{afterScore}%</span>!
      </motion.p>
    </motion.div>
  );
};

export default MatchScore;
