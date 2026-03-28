import { Textarea } from "@/components/ui/textarea";

interface ResumeInputProps {
  label: string;
  sublabel: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  icon: React.ReactNode;
}

const ResumeInput = ({ label, sublabel, placeholder, value, onChange, icon }: ResumeInputProps) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20 text-secondary">
        {icon}
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground">{label}</h3>
        <p className="text-sm text-muted-foreground font-body">{sublabel}</p>
      </div>
    </div>
    <Textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-[220px] resize-y font-body text-sm leading-relaxed bg-card border-border focus:ring-2 focus:ring-secondary/40 transition-shadow"
    />
  </div>
);

export default ResumeInput;
