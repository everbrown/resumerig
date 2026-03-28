import { motion } from "framer-motion";

interface ResultSectionProps {
  number: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
}

const ResultSection = ({ number, title, children, delay = 0 }: ResultSectionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="space-y-4"
  >
    <div className="flex items-baseline gap-3">
      <span className="font-display text-3xl font-bold text-secondary/60">{number}</span>
      <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
    </div>
    <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      {children}
    </div>
  </motion.div>
);

export default ResultSection;
