import { useState } from "react";
import { motion } from "framer-motion";

interface ComparisonSliderProps {
  originalBullets: string[];
  tunedBullets: string[];
}

const ComparisonSlider = ({ originalBullets, tunedBullets }: ComparisonSliderProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const maxLen = Math.max(originalBullets.length, tunedBullets.length);

  return (
    <div className="space-y-3">
      {Array.from({ length: maxLen }).map((_, i) => {
        const original = originalBullets[i] || "";
        const tuned = tunedBullets[i] || "";
        const isExpanded = expandedIndex === i;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg border border-border overflow-hidden cursor-pointer"
            onClick={() => setExpandedIndex(isExpanded ? null : i)}
          >
            {/* Tuned version always visible */}
            <div className="p-4 bg-card">
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5 inline-block h-2 w-2 rounded-full bg-green-500" />
                <p className="font-body text-sm text-foreground leading-relaxed">{tuned}</p>
              </div>
            </div>

            {/* Original shown on expand */}
            {isExpanded && original && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-border bg-muted/50 p-4"
              >
                <div className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 inline-block h-2 w-2 rounded-full bg-muted-foreground/40" />
                  <p className="font-body text-sm text-muted-foreground leading-relaxed line-through decoration-muted-foreground/30">
                    {original}
                  </p>
                </div>
              </motion.div>
            )}

            {original && (
              <div className="px-4 pb-2 pt-0 bg-card">
                <button className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {isExpanded ? "Hide original" : "Show original"}
                </button>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default ComparisonSlider;
