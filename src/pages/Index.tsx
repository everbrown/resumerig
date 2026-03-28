import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Target, ArrowRight, Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
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
import { analyzeCareerPivot, type AnalysisResult } from "@/lib/analyzeCareerPivot";
import { generateOutreach, type OutreachResult } from "@/lib/linkedinOutreach";
import { getCreditStatus, markFreeCreditUsed, type CreditStatus } from "@/lib/credits";

const Index = () => {
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [outreachResult, setOutreachResult] = useState<OutreachResult | null>(null);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [creditStatus, setCreditStatus] = useState<CreditStatus>({
    hasUsedFreeCredit: false,
    balance: 0,
    isAuthenticated: false,
  });

  useEffect(() => {
    getCreditStatus().then(setCreditStatus);
    // Check for payment return
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      toast.success("Payment successful! Credits have been added.");
      getCreditStatus().then(setCreditStatus);
      window.history.replaceState({}, "", "/");
    } else if (params.get("payment") === "canceled") {
      toast.info("Payment was canceled.");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const canSubmit = resume.trim().length > 20 && jobDescription.trim().length > 20;
  const showRadar = jobDescription.trim().length > 30 && !result;

  const handleAnalyze = async () => {
    // Check credit status: first-use-free or has credits
    if (creditStatus.hasUsedFreeCredit && creditStatus.balance <= 0) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await analyzeCareerPivot(resume, jobDescription);
      setResult(data);

      // Mark free credit as used after first successful tune
      if (!creditStatus.hasUsedFreeCredit) {
        await markFreeCreditUsed();
        setCreditStatus((prev) => ({ ...prev, hasUsedFreeCredit: true }));
      } else {
        // Deduct a credit for subsequent uses
        const { deductCredit } = await import("@/lib/credits");
        await deductCredit();
        setCreditStatus((prev) => ({ ...prev, balance: prev.balance - 1 }));
      }
    } catch (err: any) {
      const msg = err?.message || "Something went wrong. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOutreach = async () => {
    if (!result) return;
    setOutreachLoading(true);
    setOutreachResult(null);

    try {
      const data = await generateOutreach(
        result.tunedResume,
        jobDescription,
        result.pivotPitch
      );
      setOutreachResult(data);
      toast.success("Outreach messages generated!");
    } catch (err: any) {
      const msg = err?.message || "Outreach generation failed.";
      toast.error(msg);
    } finally {
      setOutreachLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(160 10% 97%) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5 text-sm font-body text-secondary">
              <Sparkles className="h-4 w-4" />
              AI-Powered Resume Translator
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              Career Pivot
            </h1>
            <p className="mt-4 font-body text-lg text-primary-foreground/70 max-w-2xl mx-auto">
              Translate your professional experience into any industry's language.
              Your skills are universal — let's prove it.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Input Section */}
      <main className="mx-auto max-w-4xl px-6 py-12 space-y-12">
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
            onChange={setResume}
            icon={<FileText className="h-5 w-5" />}
            allowFileUpload
          />
          <ResumeInput
            label="Target Job Description"
            sublabel="The role you're pivoting to"
            placeholder="Paste the job description for the new role you're targeting..."
            value={jobDescription}
            onChange={setJobDescription}
            icon={<Target className="h-5 w-5" />}
            autoExpand
          />
        </motion.div>

        {/* Jargon Radar */}
        {showRadar && <JargonRadar jobDescription={jobDescription} />}

        <div className="flex justify-center">
          <Button
            onClick={handleAnalyze}
            disabled={!canSubmit || loading}
            size="lg"
            className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold text-base px-8 py-6 rounded-xl shadow-[var(--shadow-elevated)] transition-all hover:shadow-lg disabled:opacity-50"
          >
            Re-Engineer My Resume
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Drafting State */}
        {loading && <DraftingState />}

        {error && (
          <p className="text-center text-destructive font-body">{error}</p>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-10 pb-16">
            <MatchScore beforeScore={result.beforeScore} afterScore={result.afterScore} />

            <ResultSection number="01" title="Industry Translator Key" delay={0.1}>
              <TranslatorTable entries={result.translatorTable} />
            </ResultSection>

            <ResultSection number="02" title="Before → After Comparison" delay={0.2}>
              <ComparisonSlider
                originalBullets={result.originalBullets || []}
                tunedBullets={result.tunedBullets || []}
              />
            </ResultSection>

            <ResultSection number="03" title="Your Tuned Resume" delay={0.25}>
              <div className="font-body text-foreground leading-relaxed whitespace-pre-wrap">
                {result.tunedResume}
              </div>
            </ResultSection>

            <ResultSection number="04" title="Your Pivot Pitch" delay={0.3}>
              <PivotPitch pitch={result.pivotPitch} />
            </ResultSection>

            {/* Outreach Section */}
            <ResultSection number="05" title="LinkedIn Outreach Agent" delay={0.35}>
              {!outreachResult && !outreachLoading && (
                <div className="text-center space-y-4">
                  <p className="font-body text-muted-foreground">
                    Find decision-makers and generate personalized outreach messages.
                    <span className="font-mono text-xs ml-2 text-secondary">1 Career Credit</span>
                  </p>
                  <Button
                    onClick={handleOutreach}
                    className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold rounded-xl shadow-[var(--shadow-elevated)]"
                  >
                    <Send className="h-4 w-4" />
                    Find Decision-Makers
                  </Button>
                </div>
              )}
              {outreachLoading && <DiscoveryRadar />}
              {outreachResult && <OutreachPanel result={outreachResult} />}
            </ResultSection>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
