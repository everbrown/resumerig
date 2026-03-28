import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ResumeInputProps {
  label: string;
  sublabel: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  icon: React.ReactNode;
  allowFileUpload?: boolean;
}

const ResumeInput = ({
  label,
  sublabel,
  placeholder,
  value,
  onChange,
  icon,
  allowFileUpload = false,
}: ResumeInputProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        toast.success("Resume extracted successfully!");
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to extract text from file.";
      toast.error(msg);
    } finally {
      setExtracting(false);
      // Reset input so the same file can be re-uploaded
      if (fileRef.current) fileRef.current.value = "";
    }
  };

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
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[220px] resize-y font-body text-sm leading-relaxed bg-card border-border focus:ring-2 focus:ring-secondary/40 transition-shadow"
      />
    </div>
  );
};

export default ResumeInput;
