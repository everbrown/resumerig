import { useState, useEffect } from "react";
import ResumeDisplay from "@/components/ResumeDisplay";
import { motion } from "framer-motion";
import { FileText, Target, ArrowRight, Sparkles, Send, LogIn, LogOut, Copy, Download, Check, FileDown, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import ResumeInput from "@/components/ResumeInput";
import TranslatorTable from "@/components/TranslatorTable";
import ResultSection from "@/components/ResultSection";
import PivotPitch from "@/components/PivotPitch";
import MatchScore from "@/components/MatchScore";
import JargonRadar from "@/components/JargonRadar";
import ComparisonSlider from "@/components/ComparisonSlider";
import DraftingState from "@/components/DraftingState";
import DiscoveryRadar from "@/components/DiscoveryRadar";
import OutreachPanel from "@/components/OutreachPanel";
import PaywallModal from "@/components/PaywallModal";
import Footer from "@/components/Footer";
import BeforeAfterShowcase from "@/components/BeforeAfterShowcase";
import ATSScore from "@/components/ATSScore";
import CoverLetterPanel from "@/components/CoverLetterPanel";
import FuelLoop from "@/components/FuelLoop";
import BulletPreview from "@/components/BulletPreview";
import OnePageResume from "@/components/OnePageResume";
import { analyzeCareerPivot, type AnalysisResult } from "@/lib/analyzeCareerPivot";
import { generateOutreach, type OutreachResult } from "@/lib/linkedinOutreach";
import { confirmCheckoutSession, getCreditStatus, markFreeCreditUsed, deductCredit, consumeExport, type CreditStatus } from "@/lib/credits";
import { downloadAsDocx, downloadAsPdf } from "@/lib/resumeExport";
import { saveToHistory } from "@/lib/resumeHistory";
import { redeemReferralCode } from "@/lib/referrals";

const EMPTY_CREDIT_STATUS: CreditStatus = {
  hasUsedFreeCredit: false,
  balance: 0,
  isAuthenticated: false,
  passExpiresAt: null,
  exportsRemaining: 0,
  hasActivePass: false,
};

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pendingActionKey = "rr_pending_paid_action";
  const [resume, setResume] = useState(() => sessionStorage.getItem("rr_resume") || "");
  const [jobDescription, setJobDescription] = useState(() => sessionStorage.getItem("rr_jd") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [outreachResult, setOutreachResult] = useState<OutreachResult | null>(null);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<"alignments" | "export">("alignments");
  const [needsReview, setNeedsReview] = useState(false);
  const [creditStatus, setCreditStatus] = useState<CreditStatus>(EMPTY_CREDIT_STATUS);
  const [creditLoading, setCreditLoading] = useState(true);

  // Refresh credits whenever auth state changes
  const refreshCredits = async () => {
    if (!user) {
      setCreditStatus(EMPTY_CREDIT_STATUS);
      setCreditLoading(false);
      return EMPTY_CREDIT_STATUS;
    }

    setCreditLoading(true);
    try {
      const nextStatus = await getCreditStatus();
      setCreditStatus(nextStatus);
      return nextStatus;
    } finally {
      setCreditLoading(false);
    }
  };

  const getPendingPaidAction = () =>
    sessionStorage.getItem(pendingActionKey) as "analyze" | "outreach" | null;

  const clearPendingPaidAction = () => {
    sessionStorage.removeItem(pendingActionKey);
  };

  const openPaywall = (action?: "analyze" | "outreach" | "export") => {
    if (action === "export") {
      setPaywallReason("export");
      clearPendingPaidAction();
    } else {
      setPaywallReason("alignments");
      if (action) {
        sessionStorage.setItem(pendingActionKey, action);
      } else {
        clearPendingPaidAction();
      }
    }
    setShowPaywall(true);
  };

  useEffect(() => {
    void refreshCredits();
  }, [user]);

  // Handle referral code from URL
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode && user) {
      // Store and attempt to redeem after auth
      const alreadyTried = sessionStorage.getItem("rr_ref_tried");
      if (alreadyTried !== refCode) {
        sessionStorage.setItem("rr_ref_tried", refCode);
        redeemReferralCode(refCode).then((result) => {
          if (result === "success") {
            toast.success("Referral registered! You'll earn 3 bonus domain credits after your first purchase. 🎉");
            refreshCredits();
          }
        }).catch(() => {});
      }
    } else if (refCode && !user && !authLoading) {
      // Store for after login
      sessionStorage.setItem("rr_pending_ref", refCode);
    }
  }, [searchParams, user, authLoading]);

  // Redeem pending referral after login
  useEffect(() => {
    if (user) {
      const pending = sessionStorage.getItem("rr_pending_ref");
      if (pending) {
        sessionStorage.removeItem("rr_pending_ref");
        redeemReferralCode(pending).then((result) => {
          if (result === "success") {
            toast.success("Referral registered! You'll earn 3 bonus domain credits after your first purchase. 🎉");
            refreshCredits();
          }
        }).catch(() => {});
      }
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    const sessionId = params.get("session_id");
    if (!paymentStatus) return;

    let cancelled = false;

    const syncCreditsAndResumeAction = async () => {
      if (paymentStatus === "canceled") {
        clearPendingPaidAction();
        toast.info("Payment was canceled.");
        window.history.replaceState({}, "", "/");
        return;
      }

      toast.success("Payment successful! Syncing your credits...");
      setShowPaywall(false);

      let latestStatus: CreditStatus | null = null;

      if (sessionId) {
        try {
          latestStatus = await confirmCheckoutSession(sessionId);
          if (cancelled) return;
          setCreditStatus(latestStatus);
          setCreditLoading(false);
        } catch {
          latestStatus = null;
        }
      }

      const hasAccessNow = (s: CreditStatus | null) =>
        !!s && s.balance > 0;

      if (!hasAccessNow(latestStatus)) {
        for (let attempt = 0; attempt < 10; attempt += 1) {
          latestStatus = await refreshCredits();
          if (cancelled) return;

          if (hasAccessNow(latestStatus)) break;

          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      window.history.replaceState({}, "", "/");

      if (!hasAccessNow(latestStatus)) {
        toast.error("Your payment went through, but credits are still syncing. Please refresh in a moment.");
        return;
      }

      const pendingAction = getPendingPaidAction();
      clearPendingPaidAction();
      toast.success(`Payment successful! ${latestStatus!.balance} Full Alignment${latestStatus!.balance !== 1 ? "s" : ""} added.`);

      if (pendingAction === "analyze") {
        await handleAnalyze(latestStatus!);
      } else if (pendingAction === "outreach") {
        await handleOutreach(latestStatus!);
      }
    };

    syncCreditsAndResumeAction();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => { sessionStorage.setItem("rr_resume", resume); }, [resume]);
  useEffect(() => { sessionStorage.setItem("rr_jd", jobDescription); }, [jobDescription]);

  const canSubmit = resume.trim().length > 20 && jobDescription.trim().length > 20;
  const showRadar = jobDescription.trim().length > 30 && !result;

  const handleAnalyze = async (statusOverride?: CreditStatus) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (needsReview) {
      toast.warning("Please review the extracted text first and click 'Text looks good' before proceeding.");
      return;
    }

    const activeCreditStatus = statusOverride ?? await refreshCredits();
    const hasFirstFree = !activeCreditStatus.hasUsedFreeCredit;
    const hasAccess = activeCreditStatus.hasActivePass || activeCreditStatus.balance > 0 || hasFirstFree;

    if (!hasAccess) {
      openPaywall("analyze");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await analyzeCareerPivot(resume, jobDescription);
      setResult(data);

      // Save to history
      const targetRole = jobDescription.match(/(?:title|role|position)[:\s]+([^\n,]+)/i)?.[1]?.trim();
      saveToHistory(resume, jobDescription, data, targetRole).catch(console.error);

      // Pass active = unlimited, no consumption
      if (activeCreditStatus.hasActivePass) {
        // no-op
      } else if (hasFirstFree) {
        await markFreeCreditUsed();
      } else {
        await deductCredit();
      }
      // Refresh status to reflect any change
      void refreshCredits();
    } catch (err: any) {
      const msg = err?.message || "Something went wrong. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOutreach = async (statusOverride?: CreditStatus) => {
    if (!result) return;

    const activeCreditStatus = statusOverride ?? await refreshCredits();
    const hasAccess = activeCreditStatus.hasActivePass || activeCreditStatus.balance > 0;

    if (!hasAccess) {
      openPaywall("outreach");
      return;
    }

    setOutreachLoading(true);
    setOutreachResult(null);

    try {
      const data = await generateOutreach(
        result.tunedResume,
        jobDescription,
        result.pivotPitch
      );
      setOutreachResult(data);
      refreshCredits(); // Refresh from server — deduction happened server-side
      toast.success("Outreach messages generated!");
    } catch (err: any) {
      const msg = err?.message || "Outreach generation failed.";
      if (msg.includes("No credits") || msg.includes("No access")) {
        openPaywall("outreach");
      } else {
        toast.error(msg);
      }
    } finally {
      setOutreachLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        {/* Auth bar */}
        <div className="relative z-10 flex justify-end px-6 pt-4">
          {authLoading ? (
            <div className="h-6" /> 
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-primary-foreground/60">{user.email}</span>
              <span className={`font-mono text-xs ${creditStatus.hasActivePass ? 'text-secondary' : 'text-primary-foreground/60'} bg-secondary/10 border border-secondary/30 rounded-full px-2 py-0.5`}>
                {creditLoading
                  ? "Syncing..."
                  : creditStatus.hasActivePass
                    ? `24h Pass · ${creditStatus.exportsRemaining} export${creditStatus.exportsRemaining !== 1 ? "s" : ""}`
                    : creditStatus.hasUsedFreeCredit ? "No active pass" : "1 free alignment"}
              </span>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-1 text-xs font-body text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-1 text-xs font-body text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="flex items-center gap-1.5 text-sm font-body text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </button>
          )}
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(210 20% 96%) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5 text-sm font-body text-secondary">
              <Sparkles className="h-4 w-4" />
              AI-Powered Resume Translator
            </div>
            
            <h1
              className="font-display text-5xl font-bold tracking-tight text-primary-foreground sm:text-6xl lg:text-8xl cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setResume("");
                setJobDescription("");
                setResult(null);
                setOutreachResult(null);
                setError("");
                setNeedsReview(false);
                setCopied(false);
                sessionStorage.removeItem("rr_resume");
                sessionStorage.removeItem("rr_jd");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Resume<span className="text-secondary">Rig</span>
            </h1>
            <h2 className="mt-4 font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-primary-foreground leading-tight max-w-3xl mx-auto">
              Hard-Code Your Career Pivot for the Price of a Coffee.
            </h2>
            <p className="mt-3 font-body text-base sm:text-lg text-secondary font-semibold">
              Try 3 alignments for free.
            </p>
            <p className="mt-4 font-body text-base sm:text-lg text-primary-foreground/60 max-w-2xl mx-auto leading-relaxed">
               Your experience is elite, but <strong className="text-primary-foreground font-semibold">recruiters won't connect the dots for you.</strong> Resume Rig identifies your target domain and <strong className="text-primary-foreground font-semibold">hard-codes your professional data</strong> to speak its language.
            </p>
             {user && (
               <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-secondary/30 bg-background/10 p-5 text-left shadow-[var(--shadow-elevated)] backdrop-blur-sm">
                 <div className="flex items-start justify-between gap-4">
                   <div>
                     <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary-foreground/60">
                       Your Access
                     </p>
                     <p className="mt-2 font-display text-3xl font-bold text-primary-foreground">
                       {creditLoading
                         ? "..."
                         : creditStatus.hasActivePass
                           ? "24h Pass · Unlimited"
                           : creditStatus.hasUsedFreeCredit
                             ? "No active pass"
                             : "1 free alignment"}
                     </p>
                   </div>
                   <div className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-mono text-secondary">
                     {creditStatus.exportsRemaining > 0
                       ? `${creditStatus.exportsRemaining} export${creditStatus.exportsRemaining !== 1 ? "s" : ""}`
                       : "0 exports"}
                   </div>
                 </div>
                 <p className="mt-3 font-body text-sm text-primary-foreground/70">
                   {creditLoading
                     ? "Checking your latest access now."
                     : creditStatus.hasActivePass && creditStatus.passExpiresAt
                       ? `Unlimited alignments until ${new Date(creditStatus.passExpiresAt).toLocaleString()}.`
                       : creditStatus.hasUsedFreeCredit
                         ? "Get the $1.99 Bypass for unlimited alignments + 1 export."
                         : "Your first alignment is still available for free."}
                 </p>
               </div>
             )}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                onClick={() => document.getElementById('resume-input-section')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold text-base px-8 py-6 rounded-xl shadow-[var(--shadow-elevated)] transition-all hover:shadow-lg"
              >
                GET STARTED FOR FREE
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
            {/* Anonymous bullet preview */}
            {!user && (
              <BulletPreview
                onWantMore={() => {
                  const el = document.getElementById('resume-input-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            )}
          </motion.div>
        </div>
      </header>

      {/* Before/After Showcase - only show when no results */}
      {!result && <BeforeAfterShowcase />}

      {/* Input Section */}
      <main id="resume-input-section" className="mx-auto max-w-4xl px-6 py-12 space-y-12">
        {/* Pulsing arrow CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="text-destructive mt-1"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid gap-8 md:grid-cols-2"
        >
          <ResumeInput
            label="Your Current Resume"
            sublabel="Paste or upload your resume"
            placeholder="Paste your full resume here — or click Upload File to extract from PDF, Word, or image..."
            value={resume}
            onChange={(val) => {
              setResume(val);
              // If the value is being set from extraction (long text appearing at once),
              // we flag it for review. Manual typing won't trigger this.
              if (val.length > 200 && resume.length < 50) {
                setNeedsReview(true);
              }
            }}
            icon={<FileText className="h-5 w-5" />}
            allowFileUpload
            autoExpand
            needsReview={needsReview}
            onReviewConfirmed={() => {
              setNeedsReview(false);
              toast.success("Great — launching alignment!");
              // Auto-trigger the analysis after confirming review
              setTimeout(() => {
                document.getElementById("rr-analyze-btn")?.click();
              }, 100);
            }}
          />
          <ResumeInput
            label="Target Job Description"
            sublabel="The role you're targeting"
            placeholder="Paste the job description for the role you're targeting..."
            value={jobDescription}
            onChange={setJobDescription}
            icon={<Target className="h-5 w-5" />}
            autoExpand
          />
        </motion.div>

        {showRadar && <JargonRadar jobDescription={jobDescription} />}

        <div className="flex justify-center">
          <Button
            id="rr-analyze-btn"
            onClick={() => {
              void handleAnalyze();
            }}
            disabled={!canSubmit || loading}
            size="lg"
            className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold text-base px-8 py-6 rounded-xl shadow-[var(--shadow-elevated)] transition-all hover:shadow-lg disabled:opacity-50"
          >
            {creditStatus.hasActivePass ? "ALIGN MY RESUME" : creditStatus.hasUsedFreeCredit ? "ALIGN — UNLOCK FOR $1.99" : "HARD-CODE MY RESUME — FREE"}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {loading && <DraftingState />}

        {error && (
          <p className="text-center text-destructive font-body">{error}</p>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-10 pb-16">
            {/* ATS Score + Match Score side by side */}
            <div className="grid gap-6 md:grid-cols-2">
              <MatchScore beforeScore={result.beforeScore} afterScore={result.afterScore} beforeBreakdown={result.beforeBreakdown} afterBreakdown={result.afterBreakdown} />
              <ATSScore beforeScore={result.beforeScore} afterScore={result.afterScore} />
            </div>

            <ResultSection number="01" title="Domain Alignment Key" delay={0.1}>
              <TranslatorTable entries={result.translatorTable} />
            </ResultSection>

            <ResultSection number="02" title="Re-Engineered Bullets" delay={0.2}>
              <ComparisonSlider
                originalBullets={result.originalBullets || []}
                tunedBullets={result.tunedBullets || []}
              />
            </ResultSection>

            <ResultSection number="03" title="Your Aligned Resume" delay={0.25}>
              {result.titleChanges && result.titleChanges.length > 0 && (
                <div className="mb-4 rounded-lg border border-secondary/30 bg-secondary/5 p-4 space-y-2">
                  <p className="font-mono text-xs uppercase tracking-wider text-secondary font-semibold">Suggested Title Updates</p>
                  {result.titleChanges.map((tc, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm font-body">
                      <span className="line-through text-muted-foreground">{tc.originalTitle}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-secondary shrink-0" />
                      <span className="text-secondary font-semibold bg-secondary/10 px-2 py-0.5 rounded">{tc.suggestedTitle}</span>
                    </div>
                  ))}
                </div>
              )}
              <ResumeDisplay text={result.tunedResume} />
              <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 font-body"
                  onClick={() => {
                    navigator.clipboard.writeText(result.tunedResume);
                    setCopied(true);
                    toast.success("Copied to clipboard!");
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 font-body"
                  onClick={async () => {
                    if (creditStatus.exportsRemaining <= 0) {
                      openPaywall("export");
                      return;
                    }
                    try {
                      const remaining = await consumeExport();
                      if (remaining < 0) {
                        openPaywall("export");
                        return;
                      }
                      await downloadAsDocx(result.tunedResume);
                      toast.success("DOCX downloaded!");
                      void refreshCredits();
                    } catch {
                      toast.error("Failed to generate DOCX");
                    }
                  }}
                >
                  <FileDown className="h-4 w-4" />
                  Download .docx{creditStatus.exportsRemaining > 0 ? ` (${creditStatus.exportsRemaining} left)` : ""}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 font-body"
                  onClick={async () => {
                    if (creditStatus.exportsRemaining <= 0) {
                      openPaywall("export");
                      return;
                    }
                    try {
                      const remaining = await consumeExport();
                      if (remaining < 0) {
                        openPaywall("export");
                        return;
                      }
                      downloadAsPdf(result.tunedResume);
                      toast.success("PDF downloaded!");
                      void refreshCredits();
                    } catch {
                      toast.error("Failed to generate PDF");
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download .pdf{creditStatus.exportsRemaining > 0 ? ` (${creditStatus.exportsRemaining} left)` : ""}
                </Button>
              </div>
            </ResultSection>

            {/* 1-Page Resume Condenser */}
            <ResultSection number="04" title="1-Page Resume Generator" delay={0.28}>
              <OnePageResume
                tunedResume={result.tunedResume}
                jobDescription={jobDescription}
                hasCredits={creditStatus.hasActivePass || creditStatus.balance > 0 || !creditStatus.hasUsedFreeCredit}
                 onCreditsNeeded={() => openPaywall()}
                onCreditUsed={refreshCredits}
              />
            </ResultSection>

            <ResultSection number="05" title="Your Pivot Pitch" delay={0.3}>
              <PivotPitch pitch={result.pivotPitch} />
            </ResultSection>

            {/* Cover Letter Generator */}
            <ResultSection number="06" title="Cover Letter Generator" delay={0.33}>
              <CoverLetterPanel
                tunedResume={result.tunedResume}
                jobDescription={jobDescription}
                pivotPitch={result.pivotPitch}
                hasCredits={creditStatus.hasActivePass || creditStatus.balance > 0 || !creditStatus.hasUsedFreeCredit}
                 onCreditsNeeded={() => openPaywall()}
                onCreditUsed={refreshCredits}
              />
            </ResultSection>

            {/* Outreach Section */}
            <ResultSection number="07" title="Outreach Message Generator" delay={0.35}>
              {!outreachResult && !outreachLoading && (
                <div className="text-center space-y-4">
                  <p className="font-body text-muted-foreground">
                    Generate role-based outreach templates for hiring managers, peers, and recruiters at <strong className="text-foreground">{jobDescription.match(/(?:at|@)\s+(\S.+?)(?:\.|,|\n|$)/i)?.[1] || "the target company"}</strong>.
                  </p>
                  <p className="font-body text-xs text-muted-foreground/70 max-w-md mx-auto">
                    These are AI-generated message templates based on typical org structures — not real LinkedIn profiles. Customize before sending.
                    {creditStatus.balance > 0 ? (
                      <span className="font-mono text-xs ml-2 text-secondary">
                        1 Credit · {creditStatus.balance} remaining
                      </span>
                    ) : null}
                  </p>
                  <Button
                    onClick={() => {
                      void handleOutreach();
                    }}
                    className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold rounded-xl shadow-[var(--shadow-elevated)]"
                  >
                    <Send className="h-4 w-4" />
                    Generate Outreach Messages
                  </Button>
                </div>
              )}
              {outreachLoading && <DiscoveryRadar />}
              {outreachResult && <OutreachPanel result={outreachResult} />}
            </ResultSection>

            {/* Fuel Loop panel after results */}
            {user && (
              <FuelLoop isAuthenticated={true} creditBalance={creditStatus.balance} onCreditsChanged={refreshCredits} />
            )}
          </div>
        )}
      </main>

      <Footer />
      <PaywallModal
        open={showPaywall}
        reason={paywallReason}
        onClose={() => {
          clearPendingPaidAction();
          setShowPaywall(false);
        }}
      />
    </div>
  );
};

export default Index;