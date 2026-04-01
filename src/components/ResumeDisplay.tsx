import { useMemo } from "react";

interface ResumeDisplayProps {
  text: string;
}

type LineType = "heading" | "entry" | "bullet" | "text" | "blank";

interface ParsedLine {
  type: LineType;
  content: string;
}

const SECTION_HEADINGS = [
  "SUMMARY", "PROFESSIONAL SUMMARY", "OBJECTIVE",
  "EXPERIENCE", "PROFESSIONAL EXPERIENCE", "WORK EXPERIENCE", "EMPLOYMENT HISTORY", "RELEVANT EXPERIENCE",
  "EDUCATION", "ACADEMIC BACKGROUND", "EDUCATIONAL BACKGROUND",
  "SKILLS", "TECHNICAL SKILLS", "CORE COMPETENCIES", "KEY SKILLS",
  "CERTIFICATIONS", "CERTIFICATES", "LICENSES",
  "PROJECTS", "AWARDS", "VOLUNTEER", "PUBLICATIONS", "INTERESTS",
];

const isHeading = (line: string) => {
  const trimmed = line.trim().toUpperCase().replace(/[:\s]+$/g, "");
  return SECTION_HEADINGS.includes(trimmed) || /^[A-Z][A-Z\s/&-]{2,}$/.test(trimmed) && trimmed.length <= 45;
};

const isBullet = (line: string) => /^\s*(?:[-*•▪●]|\d+[.)])\s+/.test(line);

const isEntryLine = (line: string) => {
  const trimmed = line.trim();
  // Lines with pipes (structured entries like "Title | Company | Date")
  if (trimmed.includes("|") && trimmed.length > 10) return true;
  // Lines with dates pattern
  if (/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+\d{4}/i.test(trimmed)) return true;
  if (/\b\d{4}\s*[-–—]\s*(?:\d{4}|present|current)\b/i.test(trimmed)) return true;
  return false;
};

const parseLine = (line: string): ParsedLine => {
  const trimmed = line.trim();
  if (!trimmed) return { type: "blank", content: "" };
  if (isHeading(trimmed)) return { type: "heading", content: trimmed.replace(/[:\s]+$/g, "") };
  if (isBullet(trimmed)) return { type: "bullet", content: trimmed.replace(/^\s*(?:[-*•▪●]|\d+[.)])\s+/, "") };
  if (isEntryLine(trimmed)) return { type: "entry", content: trimmed };
  return { type: "text", content: trimmed };
};

const ResumeDisplay = ({ text }: ResumeDisplayProps) => {
  const sections = useMemo(() => {
    const lines = text.split("\n");
    const parsed = lines.map(parseLine);

    // Group into sections
    const groups: { heading?: string; items: ParsedLine[] }[] = [];
    let current: { heading?: string; items: ParsedLine[] } = { items: [] };

    parsed.forEach((line) => {
      if (line.type === "heading") {
        if (current.heading || current.items.length > 0) {
          groups.push(current);
        }
        current = { heading: line.content, items: [] };
      } else if (line.type !== "blank") {
        current.items.push(line);
      }
    });
    if (current.heading || current.items.length > 0) {
      groups.push(current);
    }

    return groups;
  }, [text]);

  return (
    <div className="space-y-5 overflow-visible">
      {sections.map((section, si) => (
        <div key={si}>
          {section.heading && (
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-secondary border-b border-secondary/30 pb-1.5 mb-3">
              {section.heading}
            </h3>
          )}
          <div className="space-y-1 overflow-visible">
            {section.items.map((item, ii) => {
              if (item.type === "entry") {
                return (
                  <p key={ii} className="font-body text-sm font-semibold text-foreground mt-3 first:mt-0">
                    {item.content}
                  </p>
                );
              }
                if (item.type === "bullet") {
                  return (
                    <div key={ii} className="flex items-start gap-2 overflow-visible">
                      <span
                        aria-hidden="true"
                        className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/80"
                      />
                      <p className="min-w-0 flex-1 whitespace-pre-wrap break-words font-body text-sm leading-relaxed text-foreground/85">
                        {item.content}
                      </p>
                    </div>
                  );
                }
              return (
                <p key={ii} className="font-body text-sm text-foreground/90 leading-relaxed">
                  {item.content}
                </p>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResumeDisplay;
