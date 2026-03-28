import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, UserCheck, Users, Briefcase, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { OutreachResult, OutreachLead } from "@/lib/linkedinOutreach";

const typeConfig = {
  hiring_manager: {
    icon: UserCheck,
    label: "Hiring Manager",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/30",
  },
  peer: {
    icon: Users,
    label: "Industry Peer",
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/30",
  },
  recruiter: {
    icon: Briefcase,
    label: "Talent Acquisition",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
  },
};

const LeadCard = ({ lead, index }: { lead: OutreachLead; index: number }) => {
  const [copied, setCopied] = useState<"message" | "subject" | null>(null);
  const config = typeConfig[lead.type];
  const Icon = config.icon;

  const handleCopy = async (text: string, type: "message" | "subject") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 }}
      className={`rounded-xl border ${config.borderColor} bg-card p-6 shadow-[var(--shadow-card)]`}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg ${config.bgColor} p-2`}>
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-foreground">{config.label}</p>
            <p className="font-body text-sm text-muted-foreground">{lead.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              lead.confidence > 80
                ? "bg-secondary"
                : lead.confidence > 60
                ? "bg-accent"
                : "bg-muted-foreground"
            }`}
          />
          <span className="font-mono text-xs text-muted-foreground">
            {lead.confidence}% match
          </span>
        </div>
      </div>

      {/* Message type badge */}
      <div className="mb-3">
        <span className={`inline-flex items-center gap-1 rounded-full ${config.bgColor} px-3 py-1 font-mono text-xs ${config.color}`}>
          <Zap className="h-3 w-3" />
          {lead.messageType}
        </span>
      </div>

      {/* Reasoning */}
      <p className="mb-4 font-body text-sm leading-relaxed text-muted-foreground">
        {lead.reasoning}
      </p>

      {/* Subject line */}
      <div className="mb-3 rounded-lg bg-muted/50 p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            Connection Note
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => handleCopy(lead.subjectLine, "subject")}
          >
            {copied === "subject" ? (
              <Check className="h-3 w-3 text-secondary" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            Copy
          </Button>
        </div>
        <p className="font-body text-sm text-foreground">{lead.subjectLine}</p>
      </div>

      {/* Message */}
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            Outreach Message
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => handleCopy(lead.outreachMessage, "message")}
          >
            {copied === "message" ? (
              <Check className="h-3 w-3 text-secondary" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            Copy
          </Button>
        </div>
        <p className="font-body text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {lead.outreachMessage}
        </p>
      </div>
    </motion.div>
  );
};

const OutreachPanel = ({ result }: { result: OutreachResult }) => {
  return (
    <div className="space-y-6">
      {/* Strategy header */}
      <div className="rounded-xl p-5 overflow-hidden relative" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-10" style={{ background: "var(--gradient-accent)" }} />
        <div className="relative">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-xs text-primary-foreground/60 uppercase tracking-wider">
              {result.companyName} · {result.department}
            </span>
          </div>
          <p className="font-display text-lg italic text-primary-foreground leading-relaxed">
            "{result.strategy}"
          </p>
        </div>
      </div>

      {/* Lead cards */}
      <div className="space-y-4">
        {result.leads.map((lead, i) => (
          <LeadCard key={i} lead={lead} index={i} />
        ))}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="font-body text-xs leading-relaxed text-muted-foreground">
          AI-generated lead. Please verify profile before sending. These are suggested titles and roles
          based on typical organizational structures — actual individuals may differ. Always personalize
          further before reaching out.
        </p>
      </div>
    </div>
  );
};

export default OutreachPanel;
