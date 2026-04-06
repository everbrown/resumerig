import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getHistory, deleteHistoryEntry, type ResumeHistoryEntry } from "@/lib/resumeHistory";
import { getCreditStatus, createCheckoutSession, type CreditStatus } from "@/lib/credits";
import { Clock, Trash2, ArrowLeft, Eye, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import FuelLoop from "@/components/FuelLoop";
import Footer from "@/components/Footer";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<ResumeHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [creditStatus, setCreditStatus] = useState<CreditStatus>({
    hasUsedFreeCredit: false,
    balance: 0,
    isAuthenticated: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      Promise.all([getHistory(), getCreditStatus()]).then(([h, cs]) => {
        setHistory(h);
        setCreditStatus(cs);
        setLoading(false);
      });
    }
  }, [user, authLoading, navigate]);

  const handleDelete = async (id: string) => {
    try {
      await deleteHistoryEntry(id);
      setHistory((prev) => prev.filter((e) => e.id !== id));
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const refreshCredits = () => {
    getCreditStatus().then(setCreditStatus);
  };

  const handlePurchase = async (pack: "starter" | "power") => {
    setPurchaseLoading(pack);
    try {
      const url = await createCheckoutSession(pack);
      window.location.href = url;
    } catch (err: any) {
      toast.error(err?.message || "Checkout failed");
    } finally {
      setPurchaseLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse font-body text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Your <span className="text-secondary">Dashboard</span>
              </h1>
              <p className="font-body text-sm text-muted-foreground">
                Past refinements & referral credits
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`font-mono text-sm ${creditStatus.balance > 0 ? 'text-secondary' : 'text-muted-foreground'} bg-secondary/10 border border-secondary/30 rounded-full px-3 py-1`}>
              {creditStatus.balance} credit{creditStatus.balance !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        {/* Buy Credits Section */}
        {creditStatus.balance <= 0 && creditStatus.hasUsedFreeCredit && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-secondary/30 bg-secondary/5 p-6"
          >
            <div className="text-center mb-5">
              <h3 className="font-display text-lg font-bold text-foreground">Need more credits?</h3>
              <p className="font-body text-sm text-muted-foreground mt-1">
                Unlock more refinements, cover letters, and outreach messages.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 max-w-md mx-auto">
              <button
                onClick={() => handlePurchase("starter")}
                disabled={purchaseLoading !== null}
                className="rounded-xl border border-border bg-card p-4 text-center space-y-1 hover:border-secondary/50 transition-colors"
              >
                <Zap className="h-6 w-6 text-secondary mx-auto" />
                <p className="font-display text-lg font-bold text-foreground">$9</p>
                <p className="text-xs font-body text-muted-foreground">3 Credits</p>
                <span className="inline-block mt-1 text-xs font-mono text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                  {purchaseLoading === "starter" ? "Redirecting..." : "Unlock Full Alignment"}
                </span>
              </button>
              <button
                onClick={() => handlePurchase("power")}
                disabled={purchaseLoading !== null}
                className="rounded-xl border-2 border-secondary bg-card p-4 text-center space-y-1 relative"
              >
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  BEST VALUE
                </span>
                <Crown className="h-6 w-6 text-secondary mx-auto" />
                <p className="font-display text-lg font-bold text-foreground">$27</p>
                <p className="text-xs font-body text-muted-foreground">12 Credits</p>
                <span className="inline-block mt-1 text-xs font-mono text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                  {purchaseLoading === "power" ? "Redirecting..." : "Best Value"}
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Referral Panel */}
        <FuelLoop isAuthenticated={!!user} creditBalance={creditStatus.balance} onCreditsChanged={refreshCredits} />

        {/* History */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-secondary" />
            <h2 className="font-display text-xl font-bold text-foreground">Refinement History</h2>
          </div>

          {history.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center"
            >
              <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-body text-muted-foreground">
                No refinements yet. Go refine your first resume!
              </p>
              <Button
                onClick={() => navigate("/")}
                className="mt-4 gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body rounded-xl"
              >
                Get Started
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-3">
                      {entry.target_role && (
                        <span className="font-mono text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                          {entry.target_role}
                        </span>
                      )}
                      <span className="font-mono text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-body text-sm text-foreground truncate">
                      {entry.job_description.slice(0, 100)}...
                    </p>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-muted-foreground">Before: {entry.before_score}%</span>
                      <span className="text-secondary font-semibold">After: {entry.after_score}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => {
                        navigator.clipboard.writeText(entry.tuned_resume);
                        toast.success("Resume copied!");
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
