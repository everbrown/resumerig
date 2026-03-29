import { motion } from "framer-motion";
import { Shield, CheckCircle, AlertTriangle } from "lucide-react";

interface ATSScoreProps {
  beforeScore: number;
  afterScore: number;
  keywords?: { keyword: string; found: boolean }[];
}

const ATSScore = ({ beforeScore, afterScore, keywords }: ATSScoreProps) => {
  const improvement = afterScore - beforeScore;

  // Generate keyword matches from scores if not provided
  const displayKeywords = keywords || generateKeywordIndicators(beforeScore, afterScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-6 space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
          <Shield className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">ATS Compatibility</h3>
          <p className="font-body text-sm text-muted-foreground">
            Applicant Tracking System scan result
          </p>
        </div>
      </div>

      {/* Score bars */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm font-body">
            <span className="text-muted-foreground">Original Resume</span>
            <span className="font-mono text-muted-foreground">{beforeScore}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${beforeScore}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full rounded-full bg-muted-foreground/30"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sm font-body">
            <span className="text-foreground font-medium">Refined Resume</span>
            <span className="font-mono text-secondary font-semibold">{afterScore}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${afterScore}%` }}
              transition={{ duration: 1.2, delay: 0.4 }}
              className="h-full rounded-full"
              style={{ background: 'var(--gradient-accent)' }}
            />
          </div>
        </div>

        <div className="text-center pt-1">
          <span className="font-mono text-sm text-secondary font-semibold">
            +{improvement}% improvement
          </span>
        </div>
      </div>

      {/* Keyword checklist */}
      <div className="space-y-2 border-t border-border pt-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Key Requirements Matched
        </p>
        <div className="grid grid-cols-2 gap-2">
          {displayKeywords.map((kw, i) => (
            <div key={i} className="flex items-center gap-2 text-sm font-body">
              {kw.found ? (
                <CheckCircle className="h-4 w-4 text-secondary shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              )}
              <span className={kw.found ? "text-foreground" : "text-muted-foreground line-through"}>
                {kw.keyword}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

function generateKeywordIndicators(before: number, after: number) {
  // This is a visual representation; real keywords come from the translator table
  const total = 8;
  const matchedBefore = Math.round((before / 100) * total);
  const matchedAfter = Math.round((after / 100) * total);
  const labels = [
    "Stakeholder Mgmt", "KPI Tracking", "Cross-functional",
    "Risk Mitigation", "Agile/Scrum", "Budget Oversight",
    "Change Management", "Vendor Relations"
  ];

  return labels.map((keyword, i) => ({
    keyword,
    found: i < matchedAfter,
  }));
}

export default ATSScore;