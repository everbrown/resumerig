import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const DRAFTING_MESSAGES = [
  "Scanning job description for ATS triggers...",
  "Mapping transferable competencies...",
  "Re-engineering bullets for domain alignment...",
  "Applying target-domain terminology...",
  "Bridging cross-industry language gaps...",
  "Quantifying impact statements...",
  "Running domain alignment protocol...",
  "Crafting your pivot pitch...",
  "Finalizing strategic output...",
];

const DraftingState = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % DRAFTING_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="relative">
        <Loader2 className="h-10 w-10 animate-spin text-secondary" />
        <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full bg-secondary/20" />
      </div>
      <div className="h-8 flex items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="font-mono text-sm text-muted-foreground text-center"
          >
            {DRAFTING_MESSAGES[index]}
          </motion.p>
        </AnimatePresence>
      </div>
      {/* Progress dots */}
      <div className="flex gap-1.5">
        {DRAFTING_MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
              i <= index ? "bg-secondary" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default DraftingState;
