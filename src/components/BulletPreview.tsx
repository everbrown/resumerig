import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getFingerprint, hasUsedFreeTrial, markTrialUsed, isAllowlistedEmail } from "@/lib/abuse";

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

const FREE_LIMIT = 3;
const STORAGE_KEY = "rr_preview_count";

const BulletPreview = ({ onWantMore }: BulletPreviewProps) => {
  const [bullet, setBullet] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [error, setError] = useState("");
  const [serverLocked, setServerLocked] = useState(false);
  const [allowlisted, setAllowlisted] = useState(false);
  const [usedCount, setUsedCount] = useState(() => {
    if (hasUsedFreeTrial()) return FREE_LIMIT;
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  });

  // Warm up fingerprint + check if signed-in user is allowlisted.
  useEffect(() => {
    getFingerprint().catch(() => {});
    supabase.auth.getUser().then(({ data }) => {
      if (isAllowlistedEmail(data.user?.email)) {
        setAllowlisted(true);
        setServerLocked(false);
      }
    }).catch(() => {});
  }, []);

  const remaining = allowlisted ? Infinity : Math.max(0, FREE_LIMIT - usedCount);
  const limitReached = !allowlisted && (remaining <= 0 || serverLocked);
  const canSubmit = bullet.trim().length >= 10 && !loading && !limitReached;

  const handlePreview = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const fingerprint = allowlisted ? null : await getFingerprint();
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email ?? null;

      const { data, error: fnError } = await supabase.functions.invoke("preview-bullet", {
        body: {
          bullet: bullet.trim(),
          targetRole: targetRole.trim() || undefined,
          fingerprint,
          email: userEmail,
        },
      });

      if (fnError) throw new Error(fnError.message || "Preview failed");
      if (data?.error) {
        if (data.code === "fingerprint_exhausted" || data.code === "ip_rate_limited") {
          setServerLocked(true);
          markTrialUsed();
          setUsedCount(FREE_LIMIT);
        }
        throw new Error(data.error);
      }

      setResult(data as PreviewResult);
      if (!allowlisted) {
        const next = usedCount + 1;
        setUsedCount(next);
        localStorage.setItem(STORAGE_KEY, String(next));
        if (next >= FREE_LIMIT) markTrialUsed();
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTryAnother = () => {
    setResult(null);
    setBullet("");
    setError("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mx-auto mt-10 max-w-2xl"
    >
      <div className="rounded-2xl border border-secondary/30 bg-background/10 backdrop-blur-sm p-6 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-secondary" />
            <p className="font-display text-sm font-semibold text-primary-foreground tracking-wide uppercase">
              Try 3 Free Alignments — No Account Needed
            </p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-secondary bg-secondary/10 border border-secondary/30 rounded-full px-2 py-0.5">
            {allowlisted ? "Unlimited" : `${remaining}/${FREE_LIMIT} left`}
          </span>
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
              disabled={loading || limitReached}
              className="min-h-[80px] bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground/60 font-body text-sm resize-none"
              rows={3}
            />
            <Input
              placeholder="Target role (optional) — e.g. Senior Project Manager"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value.slice(0, 100))}
              disabled={loading || limitReached}
              className="bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground/60 font-body text-sm"
            />
            {error && (
              <p className="text-xs text-destructive font-body">{error}</p>
            )}
            {limitReached && (
              <div className="rounded-lg border border-secondary/40 bg-secondary/10 p-3 text-center space-y-2">
                <p className="text-sm font-body text-primary-foreground">
                  {serverLocked
                    ? "This device has reached its free alignment limit. Upgrade to the Bypass Pack to continue."
                    : <>You've used all <strong className="text-secondary">3 free alignments</strong>. Sign up to align your full resume.</>}
                </p>
                <Button
                  onClick={onWantMore}
                  size="sm"
                  className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold rounded-xl"
                >
                  {serverLocked ? "Get the Bypass Pack" : "Sign Up & Align Full Resume"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
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
                  Translate This Bullet — Free {allowlisted ? "(Unlimited)" : `(${remaining} left)`}
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

              {/* CTA: try another or go full */}
              <div className="rounded-xl border border-secondary/40 bg-secondary/10 p-4 text-center space-y-3">
                {remaining > 0 ? (
                  <>
                    <p className="font-body text-sm text-primary-foreground/80">
                      Nice. You have <strong className="text-secondary">{remaining} free alignment{remaining !== 1 ? "s" : ""}</strong> left, or jump straight to your full resume.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        onClick={handleTryAnother}
                        variant="outline"
                        size="sm"
                        className="gap-2 font-body font-semibold rounded-xl border-secondary/40 text-primary-foreground bg-background/40 hover:bg-background/60"
                      >
                        Try Another Bullet
                      </Button>
                      <Button
                        onClick={onWantMore}
                        size="sm"
                        className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold rounded-xl shadow-lg shadow-secondary/30"
                      >
                        Align My Full Resume
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-body text-sm text-primary-foreground/80">
                      That was your <strong className="text-secondary">3rd free alignment</strong>. Sign up to align your full resume — first one's free.
                    </p>
                    <Button
                      onClick={onWantMore}
                      className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold rounded-xl shadow-lg shadow-secondary/30 animate-pulse hover:animate-none"
                    >
                      Sign Up & Align My Full Resume
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default BulletPreview;
