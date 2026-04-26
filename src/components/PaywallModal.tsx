import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Coffee, Clock, FileDown, Infinity as InfinityIcon, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/credits";
import { toast } from "sonner";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  reason?: "alignments" | "export";
}

const PaywallModal = ({ open, onClose, reason = "alignments" }: PaywallModalProps) => {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const url = await createCheckoutSession("bypass");
      window.location.href = url;
    } catch (err: any) {
      toast.error(err?.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const headline =
    reason === "export"
      ? "Ready to export your aligned resume?"
      : "You've used your 3 free alignments.";

  const subline =
    reason === "export"
      ? "Unlock 1 full PDF/Markdown export plus unlimited alignments for the next 24 hours."
      : "Unlock unlimited alignments for 24 hours plus 1 full PDF/Markdown export — for the price of a coffee.";

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
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elevated)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 border border-secondary/30 px-4 py-1.5 text-sm font-mono text-secondary mb-4">
                <Sparkles className="h-4 w-4" />
                Bypass Fee
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {headline}
              </h2>
              <p className="mt-2 font-body text-muted-foreground text-sm">
                {subline}
              </p>
            </div>

            {/* Single $1.99 tier */}
            <div className="rounded-xl border-2 border-secondary bg-background p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Coffee className="h-7 w-7 text-secondary" />
                <h3 className="font-display text-lg font-bold text-foreground">24-Hour Bypass</h3>
              </div>

              <div>
                <div className="font-display text-5xl font-bold text-foreground">
                  $1.99
                </div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">
                  One-time · No subscription
                </p>
              </div>

              <ul className="space-y-2 text-left text-sm font-body text-foreground">
                <li className="flex items-start gap-2">
                  <InfinityIcon className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <span>Unlimited resume alignments</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <span>Active for 24 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileDown className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <span>1 full PDF/DOCX export</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <span>Cover letters & outreach included</span>
                </li>
              </ul>

              <Button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold rounded-xl text-base py-6"
              >
                {loading ? "Redirecting..." : "Bypass for $1.99"}
              </Button>
            </div>

            <p className="mt-5 text-center text-xs font-body text-muted-foreground">
              Secure checkout via Stripe · Apple Pay & Google Pay accepted
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaywallModal;
