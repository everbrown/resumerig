import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Target, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResumeInput from "@/components/ResumeInput";
import TranslatorTable from "@/components/TranslatorTable";
import ResultSection from "@/components/ResultSection";
import PivotPitch from "@/components/PivotPitch";

interface AnalysisResult {
  translatorTable: { oldTerm: string; newTerm: string }[];
  tunedResume: string;
  pivotPitch: string;
}

const Index = () => {
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const canSubmit = resume.trim().length > 20 && jobDescription.trim().length > 20;

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze-pivot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDescription }),
      });

      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(40 20% 97%) 1px, transparent 0)',
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
            sublabel="Paste your existing resume"
            placeholder="Paste your full resume here — include job titles, responsibilities, and accomplishments..."
            value={resume}
            onChange={setResume}
            icon={<FileText className="h-5 w-5" />}
          />
          <ResumeInput
            label="Target Job Description"
            sublabel="The role you're pivoting to"
            placeholder="Paste the job description for the new role you're targeting..."
            value={jobDescription}
            onChange={setJobDescription}
            icon={<Target className="h-5 w-5" />}
          />
        </motion.div>

        <div className="flex justify-center">
          <Button
            onClick={handleAnalyze}
            disabled={!canSubmit || loading}
            size="lg"
            className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold text-base px-8 py-6 rounded-xl shadow-[var(--shadow-elevated)] transition-all hover:shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing Your Pivot...
              </>
            ) : (
              <>
                Re-Engineer My Resume
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>

        {error && (
          <p className="text-center text-destructive font-body">{error}</p>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-10 pb-16">
            <ResultSection number="01" title="Industry Translator Key" delay={0}>
              <TranslatorTable entries={result.translatorTable} />
            </ResultSection>

            <ResultSection number="02" title="Your Tuned Resume" delay={0.15}>
              <div className="font-body text-foreground leading-relaxed whitespace-pre-wrap">
                {result.tunedResume}
              </div>
            </ResultSection>

            <ResultSection number="03" title="Your Pivot Pitch" delay={0.3}>
              <PivotPitch pitch={result.pivotPitch} />
            </ResultSection>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
