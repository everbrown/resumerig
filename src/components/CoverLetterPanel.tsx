import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Copy, Check, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateCoverLetter } from "@/lib/coverLetter";
import { downloadAsDocx } from "@/lib/resumeExport";

interface CoverLetterPanelProps {
  tunedResume: string;
  jobDescription: string;
  pivotPitch?: string;
  hasCredits: boolean;
  onCreditsNeeded: () => void;
  onCreditUsed: () => void;
}

const CoverLetterPanel = ({
  tunedResume,
  jobDescription,
  pivotPitch,
  hasCredits,
  onCreditsNeeded,
  onCreditUsed,
}: CoverLetterPanelProps) => {
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!hasCredits) {
      onCreditsNeeded();
      return;
    }

    setLoading(true);
    try {
      const result = await generateCoverLetter(tunedResume, jobDescription, pivotPitch);
      setCoverLetter(result);
      onCreditUsed(); // Refresh credit display — deduction already happened server-side
      toast.success("Cover letter generated!");
    } catch (err: any) {
      if (err?.message?.includes("No credits")) {
        onCreditsNeeded();
      } else {
        toast.error(err?.message || "Failed to generate cover letter");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 text-secondary animate-spin" />
        <p className="font-body text-sm text-muted-foreground">Crafting your cover letter...</p>
      </div>
    );
  }

  if (!coverLetter) {
    return (
      <div className="text-center space-y-4">
        <p className="font-body text-muted-foreground">
          Generate a tailored cover letter that uses the same domain-bridging language from your refined resume.
        </p>
        <Button
          onClick={handleGenerate}
          className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold rounded-xl shadow-[var(--shadow-elevated)]"
        >
          <FileText className="h-4 w-4" />
          Generate Cover Letter
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/30 p-6">
        <div className="whitespace-pre-wrap font-body text-sm text-foreground leading-relaxed">
          {coverLetter}
        </div>
      </div>
      <div className="flex gap-3 pt-2 border-t border-border">
        <Button
          size="sm"
          variant="outline"
          className="gap-2 font-body"
          onClick={() => {
            navigator.clipboard.writeText(coverLetter);
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
              await downloadAsDocx(coverLetter);
              toast.success("Cover letter downloaded!");
            } catch {
              toast.error("Failed to download");
            }
          }}
        >
          <Download className="h-4 w-4" />
          Download .docx
        </Button>
      </div>
    </div>
  );
};

export default CoverLetterPanel;
