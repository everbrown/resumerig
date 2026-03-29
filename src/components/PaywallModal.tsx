import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/credits";
import { toast } from "sonner";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

const PaywallModal = ({ open, onClose }: PaywallModalProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (pack: "starter" | "power") => {
    setLoading(pack);
    try {
      const url = await createCheckoutSession(pack);
      window.open(url, "_blank");
    } catch (err: any) {
      toast.error(err?.message || "Checkout failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elevated)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 border border-secondary/30 px-4 py-1.5 text-sm font-mono text-secondary mb-4">
                <Sparkles className="h-4 w-4" />
                Credits Exhausted
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Your first one was on us!
              </h2>
              <p className="mt-2 font-body text-muted-foreground max-w-sm mx-auto">
                Get more industry-specific tunes and Pivot Pitches to land your dream role.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Starter Pack */}
              <div className="rounded-xl border border-border bg-background p-6 text-center space-y-3 hover:border-secondary/50 transition-colors">
                <Zap className="h-8 w-8 text-secondary mx-auto" />
                <h3 className="font-display text-lg font-bold text-foreground">Starter</h3>
                <div className="font-display text-3xl font-bold text-foreground">
                  $9
                </div>
                <p className="text-sm font-body text-muted-foreground">3 Career Credits</p>
                <p className="text-xs font-mono text-accent">$3 per refinement</p>
                <Button
                  onClick={() => handlePurchase("starter")}
                  disabled={loading !== null}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold rounded-xl"
                >
                  {loading === "starter" ? "Redirecting..." : "Unlock Full Alignment"}
                </Button>
              </div>

              {/* Power Pack */}
              <div className="rounded-xl border-2 border-secondary bg-background p-6 text-center space-y-3 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-xs font-mono font-bold px-3 py-1 rounded-full">
                  BEST VALUE
                </div>
                <Crown className="h-8 w-8 text-secondary mx-auto" />
                <h3 className="font-display text-lg font-bold text-foreground">Power Pack</h3>
                <div className="font-display text-3xl font-bold text-foreground">
                  $27
                </div>
                <p className="text-sm font-body text-muted-foreground">12 Career Credits</p>
                <p className="text-xs font-mono text-accent">$2.25 per refinement</p>
                <Button
                  onClick={() => handlePurchase("power")}
                  disabled={loading !== null}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold rounded-xl"
                >
                  {loading === "power" ? "Redirecting..." : "Best Value"}
                </Button>
              </div>
            </div>

            <p className="mt-6 text-center text-xs font-body text-muted-foreground">
              Secure checkout powered by Stripe · Apple Pay & Google Pay accepted
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaywallModal;
