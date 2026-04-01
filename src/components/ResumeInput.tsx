import { useRef, useState, useCallback, useEffect } from "react";
import { Upload, Loader2, FileUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ResumeInputProps {
  label: string;
  sublabel: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  icon: React.ReactNode;
  allowFileUpload?: boolean;
  autoExpand?: boolean;
  needsReview?: boolean;
  onReviewConfirmed?: () => void;
}

const ResumeInput = ({
  label,
  sublabel,
  placeholder,
  value,
  onChange,
  icon,
  allowFileUpload = false,
  autoExpand = false,
  needsReview = false,
  onReviewConfirmed,
}: ResumeInputProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el || !autoExpand) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 220)}px`;
  }, [autoExpand]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const ACCEPTED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/webp",
  ];

  const isAcceptedFile = (file: File) =>
    ACCEPTED_TYPES.includes(file.type) ||
    /\.(pdf|docx?|png|jpe?g|webp)$/i.test(file.name);

  const extractFile = async (file: File) => {
    if (!isAcceptedFile(file)) {
      toast.error("Unsupported file type. Upload a PDF, Word doc, or image.");
      return;
    }

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data, error } = await supabase.functions.invoke("extract-resume", {
        body: formData,
      });

      if (error) throw new Error(error.message || "Extraction failed");
      if (data?.error) throw new Error(data.error);

      if (data?.text) {
        onChange(data.text);
        toast.success("Resume extracted — please review the text below before proceeding.", { duration: 5000 });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to extract text from file.");
    } finally {
      setExtracting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) extractFile(file);
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!allowFileUpload) return;
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    },
    [allowFileUpload]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (!allowFileUpload) return;
      const file = e.dataTransfer.files?.[0];
      if (file) extractFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allowFileUpload]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20 text-secondary">
            {icon}
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">{label}</h3>
            <p className="text-sm text-muted-foreground font-body">{sublabel}</p>
          </div>
        </div>

        {allowFileUpload && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={extracting}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-body font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {extracting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Upload File
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Review banner after file extraction */}
      {needsReview && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-body text-sm font-medium text-foreground">
                Review extracted text
              </p>
              <p className="font-body text-xs text-muted-foreground leading-relaxed">
                PDF extraction can sometimes cut off or merge words. Please scroll through and fix any errors before proceeding. Look for incomplete words, merged sentences, or missing bullet points.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 font-body text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
            onClick={onReviewConfirmed}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Text looks good — proceed
          </Button>
        </div>
      )}

      <div
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`min-h-[220px] font-body text-sm leading-relaxed bg-card border-border focus:ring-2 focus:ring-secondary/40 transition-shadow ${autoExpand ? "resize-none overflow-hidden" : "resize-y"} ${dragOver ? "ring-2 ring-secondary border-secondary" : ""} ${needsReview ? "ring-2 ring-amber-500/40 border-amber-500/40" : ""}`}
        />

        {/* Drag overlay */}
        {allowFileUpload && dragOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-secondary bg-secondary/10 backdrop-blur-sm pointer-events-none">
            <FileUp className="h-8 w-8 text-secondary mb-2" />
            <p className="font-body text-sm font-medium text-secondary">Drop your resume here</p>
            <p className="font-body text-xs text-muted-foreground">PDF, Word, or image</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeInput;
