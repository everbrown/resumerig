import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Translation {
  oldTerm: string;
  newTerm: string;
  why: string;
}

interface PreviewResult {
  translations: Translation[];
  tunedBullet: string;
}

interface BulletPreviewProps {
  onWantMore: () => void;
}

const BulletPreview = ({ onWantMore }: BulletPreviewProps) => {
  const [bullet, setBullet] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [error, setError] = useState("");
  const [hasUsedPreview, setHasUsedPreview] = useState(
    () => sessionStorage.getItem("rr_preview_used") === "true"
  );

  const canSubmit = bullet.trim().length >= 10 && !loading && !hasUsedPreview;

  const handlePreview = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("preview-bullet", {
        body: { bullet: bullet.trim(), targetRole: targetRole.trim() || undefined },
      });

      if (fnError) throw new Error(fnError.message || "Preview failed");
      if (data?.error) throw new Error(data.error);

      setResult(data as PreviewResult);
      setHasUsedPreview(true);
      sessionStorage.setItem("rr_preview_used", "true");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mx-auto mt-10 max-w-2xl"
    >
      <div className="rounded-2xl border border-secondary/30 bg-background/10 backdrop-blur-sm p-6 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-secondary" />
          <p className="font-display text-sm font-semibold text-primary-foreground tracking-wide uppercase">
            Instant Preview — No Account Needed
          </p>
        </div>
        <p className="font-body text-base text-primary-foreground/80 mb-4 leading-relaxed">
          Paste your toughest bullet point below. See it <strong className="text-secondary">hard-coded</strong> for your target domain instantly.
        </p>

        {!result ? (
          <div className="space-y-3">
            <Textarea
              placeholder="e.g. Led a platoon of 40 soldiers through complex field operations across 3 deployment cycles..."
              value={bullet}
              onChange={(e) => setBullet(e.target.value.slice(0, 500))}
              disabled={loading || hasUsedPreview}
              className="min-h-[80px] bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground/60 font-body text-sm resize-none"
              rows={3}
            />
            <Input
              placeholder="Target role (optional) — e.g. Senior Project Manager"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value.slice(0, 100))}
              disabled={loading || hasUsedPreview}
              className="bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground/60 font-body text-sm"
            />
            {error && (
              <p className="text-xs text-destructive font-body">{error}</p>
            )}
            {hasUsedPreview && !result && (
              <p className="text-xs text-muted-foreground font-body">
                You've already used your free preview. Sign up to align your full resume!
              </p>
            )}
            <Button
              onClick={handlePreview}
              disabled={!canSubmit}
              className="w-full gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold rounded-xl shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Translate This Bullet — Free
                </>
              )}
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Tuned bullet */}
              <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-secondary mb-2">
                  Your Bullet — Hard-Coded
                </p>
                <p className="font-body text-sm text-primary-foreground leading-relaxed">
                  • {result.tunedBullet}
                </p>
              </div>

              {/* Domain Alignment Key */}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/60 mb-2">
                  Domain Alignment Key
                </p>
                <div className="space-y-2">
                  {result.translations.map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-lg border border-border/30 bg-background/60 p-3"
                    >
                      <div className="flex items-center gap-2 text-sm font-body">
                        <span className="text-muted-foreground line-through">{t.oldTerm}</span>
                        <ArrowRight className="h-3 w-3 text-secondary shrink-0" />
                        <span className="text-primary-foreground font-semibold">{t.newTerm}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground font-body">{t.why}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* CTA to full alignment */}
              <div className="rounded-xl border border-secondary/40 bg-secondary/10 p-4 text-center space-y-3">
                <p className="font-body text-sm text-primary-foreground/80">
                  That was <strong className="text-secondary">one bullet</strong>. Imagine your entire resume hard-coded like this — with a full match score, cover letter, and outreach messages.
                </p>
                <Button
                  onClick={onWantMore}
                  className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold rounded-xl shadow-lg shadow-secondary/30 animate-pulse hover:animate-none"
                >
                  Hard-Code My Full Resume — Free First Try
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default BulletPreview;
