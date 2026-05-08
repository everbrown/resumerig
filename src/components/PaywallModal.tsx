import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Rocket, Star, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession, type PackId } from "@/lib/credits";
import { toast } from "sonner";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  reason?: "alignments" | "export";
}

interface Tier {
  id: PackId;
  name: string;
  price: string;
  credits: number;
  perCredit: string;
  badge?: string;
  icon: typeof Zap;
  highlight?: boolean;
}

const TIERS: Tier[] = [
  { id: "single",  name: "Single",        price: "$1.99", credits: 1,  perCredit: "$1.99 / alignment", icon: Zap },
  { id: "five",    name: "Career Pack",   price: "$4.99", credits: 5,  perCredit: "$1.00 / alignment", icon: Rocket, badge: "Best Value", highlight: true },
  { id: "fifteen", name: "Power Pack",    price: "$9.99", credits: 15, perCredit: "$0.67 / alignment", icon: Star },
];

const PaywallModal = ({ open, onClose, reason = "alignments" }: PaywallModalProps) => {
  const [loadingPack, setLoadingPack] = useState<PackId | null>(null);

  const handlePurchase = async (pack: PackId) => {
    setLoadingPack(pack);
    try {
      const url = await createCheckoutSession(pack);
      window.location.href = url;
    } catch (err: any) {
      toast.error(err?.message || "Checkout failed");
      setLoadingPack(null);
    }
  };

  const headline =
    reason === "export"
      ? "Ready to export your aligned resume?"
      : "You're out of Full Alignments.";

  const subline =
    "1 credit = 1 Full Alignment (up to 25 bullets) — or 1 export. Bullet edits, cover letters & outreach are free.";

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
            className="relative w-full max-w-3xl rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elevated)]"
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
                Full Alignment Packs
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {headline}
              </h2>
              <p className="mt-2 font-body text-muted-foreground text-sm max-w-lg mx-auto">
                {subline}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {TIERS.map((tier) => {
                const Icon = tier.icon;
                const isLoading = loadingPack === tier.id;
                return (
                  <div
                    key={tier.id}
                    className={`relative rounded-xl border-2 ${tier.highlight ? "border-secondary" : "border-border"} bg-background p-5 text-center space-y-3`}
                  >
                    {tier.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-3 py-0.5 text-[10px] font-mono uppercase tracking-wider text-secondary-foreground">
                        {tier.badge}
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2">
                      <Icon className="h-5 w-5 text-secondary" />
                      <h3 className="font-display text-base font-bold text-foreground">{tier.name}</h3>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-bold text-foreground">{tier.price}</div>
                      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">
                        {tier.credits} Full Alignment{tier.credits > 1 ? "s" : ""}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground/80 mt-0.5">{tier.perCredit}</p>
                    </div>
                    <Button
                      onClick={() => handlePurchase(tier.id)}
                      disabled={isLoading || loadingPack !== null}
                      className={`w-full font-body font-semibold rounded-xl ${tier.highlight ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : ""}`}
                      variant={tier.highlight ? "default" : "outline"}
                    >
                      {isLoading ? "..." : `Get ${tier.credits}`}
                    </Button>
                  </div>
                );
              })}
            </div>

            <ul className="mt-6 grid gap-1.5 text-xs font-body text-muted-foreground sm:grid-cols-2">
              <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-secondary shrink-0" /> Free bullet edits — never charged</li>
              <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-secondary shrink-0" /> Cover letters & outreach included</li>
              <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-secondary shrink-0" /> Credits never expire</li>
              <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-secondary shrink-0" /> Apple Pay & Google Pay accepted</li>
            </ul>

            <p className="mt-4 text-center text-xs font-body text-muted-foreground">
              Secure one-time checkout via Stripe · No subscription
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaywallModal;
