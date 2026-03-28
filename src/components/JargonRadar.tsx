import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar } from "lucide-react";

// Common filler words to exclude
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "shall", "can", "need", "must", "that", "this", "these",
  "those", "it", "its", "we", "our", "you", "your", "they", "their", "he",
  "she", "his", "her", "as", "if", "not", "no", "so", "up", "out", "about",
  "into", "over", "after", "all", "also", "than", "more", "some", "such",
  "only", "other", "new", "one", "two", "each", "any", "how", "when", "where",
  "who", "which", "what", "both", "through", "between", "own", "same", "able",
  "just", "well", "use", "using", "work", "working", "etc", "including",
  "across", "within", "per", "based", "ensure", "strong", "role", "team",
  "experience", "years", "required", "preferred", "responsibilities", "qualifications",
  "requirements", "skills", "position", "company", "opportunity", "join",
]);

function extractKeywords(text: string): string[] {
  // Extract meaningful multi-word phrases and single keywords
  const words = text
    .replace(/[^a-zA-Z\s\-\/]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.toLowerCase());

  // Find bigrams first
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1])) {
      bigrams.push(`${words[i]} ${words[i + 1]}`);
    }
  }

  // Count word frequency, excluding stop words
  const freq: Record<string, number> = {};
  words.forEach((w) => {
    if (!STOP_WORDS.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });

  // Sort by frequency and take top keywords
  const topSingle = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([w]) => w);

  // Combine bigrams and singles, deduplicate, capitalize
  const seen = new Set<string>();
  const result: string[] = [];

  [...bigrams.slice(0, 5), ...topSingle].forEach((kw) => {
    const normalized = kw.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(
        kw
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      );
    }
  });

  return result.slice(0, 10);
}

const JargonRadar = ({ jobDescription }: { jobDescription: string }) => {
  const keywords = useMemo(() => extractKeywords(jobDescription), [jobDescription]);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    if (keywords.length === 0) return;

    const interval = setInterval(() => {
      setVisibleCount((c) => {
        if (c >= keywords.length) {
          clearInterval(interval);
          return c;
        }
        return c + 1;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [keywords]);

  if (keywords.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center gap-2 mb-3">
        <Radar className="h-4 w-4 text-secondary" />
        <span className="font-mono text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Jargon Radar — Keywords Detected
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {keywords.slice(0, visibleCount).map((kw, i) => (
            <motion.span
              key={kw}
              initial={{ opacity: 0, scale: 0.7, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="inline-block rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-sm font-body font-medium text-secondary"
            >
              {kw}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default JargonRadar;
