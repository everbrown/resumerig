import { motion } from "framer-motion";

const MatchScore = ({ score }: { score: number }) => {
  const getColor = () => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getLabel = () => {
    if (score >= 90) return "Excellent Match";
    if (score >= 80) return "Strong Match";
    if (score >= 70) return "Good Match";
    if (score >= 60) return "Moderate Match";
    return "Needs Work";
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]"
    >
      <span className="font-body text-sm uppercase tracking-widest text-muted-foreground">
        Match Score
      </span>
      <span className={`font-display text-6xl font-bold ${getColor()}`}>
        {score}
      </span>
      <span className="font-body text-sm text-muted-foreground">{getLabel()}</span>
    </motion.div>
  );
};

export default MatchScore;
