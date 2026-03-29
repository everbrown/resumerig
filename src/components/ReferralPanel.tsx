import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Copy, Check, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getOrCreateReferralCode, redeemReferralCode, hasRedeemedAnyCode, type ReferralInfo } from "@/lib/referrals";

interface ReferralPanelProps {
  isAuthenticated: boolean;
  onCreditsChanged: () => void;
}

const ReferralPanel = ({ isAuthenticated, onCreditsChanged }: ReferralPanelProps) => {
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [hasRedeemed, setHasRedeemed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    Promise.all([getOrCreateReferralCode(), hasRedeemedAnyCode()]).then(
      ([info, redeemed]) => {
        setReferralInfo(info);
        setHasRedeemed(redeemed);
        setLoading(false);
      }
    );
  }, [isAuthenticated]);

  const handleCopy = () => {
    if (!referralInfo) return;
    const url = `${window.location.origin}?ref=${referralInfo.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      const result = await redeemReferralCode(redeemCode.trim());
      switch (result) {
        case "success":
          toast.success("Code redeemed! You earned 1 free credit.");
          setHasRedeemed(true);
          onCreditsChanged();
          break;
        case "already_redeemed":
          toast.error("You've already redeemed a referral code.");
          break;
        case "invalid_code":
          toast.error("Invalid referral code.");
          break;
        case "own_code":
          toast.error("You can't use your own referral code!");
          break;
        case "code_exhausted":
          toast.error("This code has reached its maximum uses.");
          break;
        default:
          toast.error("Something went wrong.");
      }
    } catch {
      toast.error("Failed to redeem code.");
    } finally {
      setRedeeming(false);
      setRedeemCode("");
    }
  };

  if (!isAuthenticated) return null;
  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-secondary/20 bg-card p-6 space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
          <Gift className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Referral Credits</h3>
          <p className="font-body text-sm text-muted-foreground">
            Give a free refinement, get one back
          </p>
        </div>
      </div>

      {/* Share section */}
      {referralInfo && (
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Your referral link</p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={`${window.location.origin}?ref=${referralInfo.code}`}
              className="font-mono text-xs bg-muted/50"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="gap-1.5 shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {referralInfo.uses} friend{referralInfo.uses !== 1 ? "s" : ""} referred
          </div>
        </div>
      )}

      {/* Redeem section */}
      {!hasRedeemed && (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Have a referral code?</p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter code (e.g. RIG-XXXX)"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              size="sm"
              onClick={handleRedeem}
              disabled={!redeemCode.trim() || redeeming}
              className="gap-1.5 shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              <ArrowRight className="h-4 w-4" />
              {redeeming ? "..." : "Redeem"}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ReferralPanel;