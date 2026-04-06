import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Fuel, Copy, Check, Users, Linkedin, MessageCircle, Share2, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  getOrCreateReferralCode,
  redeemReferralCode,
  hasRedeemedAnyCode,
  getReferralRedemptions,
  type ReferralInfo,
  type ReferralRedemption,
} from "@/lib/referrals";

interface FuelLoopProps {
  isAuthenticated: boolean;
  creditBalance: number;
  onCreditsChanged: () => void;
}

const MAX_GAUGE = 30;

const FuelLoop = ({ isAuthenticated, creditBalance, onCreditsChanged }: FuelLoopProps) => {
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [hasRedeemed, setHasRedeemed] = useState(false);
  const [redemptions, setRedemptions] = useState<ReferralRedemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    Promise.all([
      getOrCreateReferralCode(),
      hasRedeemedAnyCode(),
      getReferralRedemptions(),
    ]).then(([info, redeemed, reds]) => {
      setReferralInfo(info);
      setHasRedeemed(redeemed);
      setRedemptions(reds);
      setLoading(false);
    });
  }, [isAuthenticated]);

  const referralUrl = referralInfo
    ? `${window.location.origin}?ref=${referralInfo.code}`
    : "";

  const handleCopy = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success("Referral link copied — go fuel the rig!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
      "_blank"
    );
  };

  const shareOnX = () => {
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent("I just hard-coded my resume with @ResumeRig. Use my link for bonus domain credits:")}&url=${encodeURIComponent(referralUrl)}`,
      "_blank"
    );
  };

  const shareOnWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Fuel the Rig — hard-code a peer's resume: ${referralUrl}`)}`,
      "_blank"
    );
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      const result = await redeemReferralCode(redeemCode.trim());
      switch (result) {
        case "success":
          toast.success("Code registered! You'll earn 3 bonus domain credits after your first purchase.");
          setHasRedeemed(true);
          break;
        case "already_redeemed":
          toast.error("You've already registered a referral code.");
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
      toast.error("Failed to register code.");
    } finally {
      setRedeeming(false);
      setRedeemCode("");
    }
  };

  if (!isAuthenticated || loading) return null;

  const pendingCount = redemptions.filter((r) => r.status === "pending").length;
  const earnedCount = redemptions.filter((r) => r.status === "earned").length;
  const gaugePercent = Math.min((creditBalance / MAX_GAUGE) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-secondary/20 bg-card p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
          <Fuel className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">The Fuel Loop</h3>
          <p className="font-body text-sm text-muted-foreground">
            Hard-code a peer — earn 3 domain credits each
          </p>
        </div>
      </div>

      {/* Credit Fuel Gauge */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Credit Fuel Gauge
          </p>
          <span className="font-mono text-sm font-bold text-secondary">
            {creditBalance} credit{creditBalance !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="relative">
          <Progress value={gaugePercent} className="h-3 bg-muted/50" />
        </div>
        <p className="font-body text-xs text-muted-foreground">
          {creditBalance === 0
            ? "Empty tank — fuel the rig to keep going"
            : creditBalance < 3
            ? "Running low — refer a peer for 3 bonus credits"
            : "Fueled up and ready to deploy"}
        </p>
      </div>

      {/* Share the Rig */}
      {referralInfo && (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Share2 className="h-3.5 w-3.5" />
            Share the Rig
          </p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={referralUrl}
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

          {/* Social Share Icons */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={shareOnLinkedIn} className="h-8 w-8 p-0" title="Share on LinkedIn">
              <Linkedin className="h-4 w-4 text-muted-foreground hover:text-secondary" />
            </Button>
            <Button size="sm" variant="ghost" onClick={shareOnX} className="h-8 w-8 p-0" title="Share on X">
              <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </Button>
            <Button size="sm" variant="ghost" onClick={shareOnWhatsApp} className="h-8 w-8 p-0" title="Share on WhatsApp">
              <MessageCircle className="h-4 w-4 text-muted-foreground hover:text-secondary" />
            </Button>
          </div>
        </div>
      )}

      {/* Pending vs Earned Tracker */}
      {(pendingCount > 0 || earnedCount > 0) && (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Referral Status
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
              <Clock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <p className="font-mono text-lg font-bold text-muted-foreground">{pendingCount}</p>
              <p className="font-body text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-3 text-center">
              <Sparkles className="h-4 w-4 text-secondary mx-auto mb-1" />
              <p className="font-mono text-lg font-bold text-secondary">{earnedCount}</p>
              <p className="font-body text-xs text-secondary">Earned</p>
            </div>
          </div>
          {referralInfo && (
            <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {referralInfo.uses} peer{referralInfo.uses !== 1 ? "s" : ""} hard-coded
            </div>
          )}
        </div>
      )}

      {/* Redeem section */}
      {!hasRedeemed && (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Have a referral code?
          </p>
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
              {redeeming ? "..." : "Fuel Up"}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FuelLoop;
