import { useState } from "react";
import { Minimize2, Loader2, Copy, Check, FileDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ResumeDisplay from "@/components/ResumeDisplay";
import { downloadAsDocx } from "@/lib/resumeExport";

interface CondensedResult {
  condensedResume: string;
  removedCount: number;
  summary: string;
}

interface OnePageResumeProps {
  tunedResume: string;
  jobDescription: string;
  hasCredits: boolean;
  onCreditsNeeded: () => void;
  onCreditUsed: () => void;
}

const OnePageResume = ({
  tunedResume,
  jobDescription,
  hasCredits,
  onCreditsNeeded,
  onCreditUsed,
}: OnePageResumeProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CondensedResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCondense = async () => {
    if (!hasCredits) {
      onCreditsNeeded();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("condense-resume", {
        body: { tunedResume, jobDescription },
      });

      if (error) throw new Error(error.message || "Condensing failed");
      if (data?.error) throw new Error(data.error);

      setResult(data as CondensedResult);
      toast.success("One-page resume generated!");
      onCreditUsed();
    } catch (err: any) {
      const msg = err?.message || "Failed to condense resume.";
      if (msg.includes("No credits")) {
        onCreditsNeeded();
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!result && !loading) {
    return (
      <div className="text-center space-y-4">
        <p className="font-body text-muted-foreground">
          Condense your aligned resume into a <strong className="text-foreground">smart, ATS-optimized one-pager</strong> — AI prioritizes your strongest bullets and trims the rest.
        </p>
        <Button
          onClick={handleCondense}
          className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold rounded-xl shadow-[var(--shadow-elevated)]"
        >
          <Minimize2 className="h-4 w-4" />
          Generate 1-Page Resume
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        <p className="font-body text-sm text-muted-foreground">
          Condensing your resume into a powerful one-pager...
        </p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* Summary badge */}
      <div className="flex items-start gap-2 rounded-lg border border-secondary/30 bg-secondary/5 p-3">
        <Info className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
        <div>
          <p className="font-body text-sm text-foreground">
            <span className="font-semibold text-secondary">{result.removedCount} bullets</span> trimmed or merged.
          </p>
          <p className="font-body text-xs text-muted-foreground mt-0.5">{result.summary}</p>
        </div>
      </div>

      {/* Condensed resume display */}
      <ResumeDisplay text={result.condensedResume} />

      {/* Export actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          size="sm"
          variant="outline"
          className="gap-2 font-body"
          onClick={() => {
            navigator.clipboard.writeText(result.condensedResume);
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
            try {
              await downloadAsDocx(result.condensedResume);
              toast.success("DOCX downloaded!");
            } catch {
              toast.error("Failed to generate DOCX");
            }
          }}
        >
          <FileDown className="h-4 w-4" />
          Download .docx
        </Button>
      </div>

      {/* Regenerate */}
      <div className="text-center pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 font-body text-xs text-muted-foreground"
          onClick={handleCondense}
        >
          <Minimize2 className="h-3.5 w-3.5" />
          Regenerate 1-Pager
        </Button>
      </div>
    </div>
  );
};

export default OnePageResume;