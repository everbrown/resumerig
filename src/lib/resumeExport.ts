import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  LevelFormat,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";

/**
 * Parse the tuned resume text into structured sections.
 */
interface ResumeSection {
  heading?: string;
  lines: string[];
}

const SECTION_HEADINGS = [
  "SUMMARY", "PROFESSIONAL SUMMARY", "OBJECTIVE", "PROFILE",
  "EXPERIENCE", "PROFESSIONAL EXPERIENCE", "WORK EXPERIENCE", "EMPLOYMENT HISTORY", "RELEVANT EXPERIENCE",
  "EDUCATION", "ACADEMIC BACKGROUND", "EDUCATIONAL BACKGROUND",
  "SKILLS", "TECHNICAL SKILLS", "CORE COMPETENCIES", "KEY SKILLS",
  "CERTIFICATIONS", "CERTIFICATES", "LICENSES",
  "PROJECTS", "AWARDS", "VOLUNTEER", "PUBLICATIONS", "INTERESTS",
];

function isHeadingLine(trimmed: string): boolean {
  const upper = trimmed.toUpperCase().replace(/[:\s]+$/g, "");
  if (SECTION_HEADINGS.includes(upper)) return true;
  return (
    trimmed.length > 2 &&
    trimmed.length < 60 &&
    trimmed === trimmed.toUpperCase() &&
    /[A-Z]/.test(trimmed) &&
    !/^\d/.test(trimmed)
  );
}

function parseResumeSections(text: string): ResumeSection[] {
  const lines = text.split("\n");
  const sections: ResumeSection[] = [];
  let current: ResumeSection = { lines: [] };

  for (const line of lines) {
    const trimmed = line.trim();

    if (isHeadingLine(trimmed)) {
      if (current.lines.length > 0 || current.heading) {
        sections.push(current);
      }
      current = { heading: trimmed.replace(/[:\s]+$/g, ""), lines: [] };
    } else {
      current.lines.push(line);
    }
  }

  if (current.lines.length > 0 || current.heading) {
    sections.push(current);
  }

  return sections;
}

function isBullet(line: string): boolean {
  return /^\s*[•\-\*▪●]\s/.test(line) || /^\s*\d+[\.\)]\s/.test(line);
}

function cleanBullet(line: string): string {
  return line.replace(/^\s*[•\-\*▪●]\s*/, "").replace(/^\s*\d+[\.\)]\s*/, "").trim();
}

function isEntryLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length >= 80) return false;
  if (trimmed.includes("|") && trimmed.length > 10) return true;
  if (/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+\d{4}/i.test(trimmed)) return true;
  if (/\b\d{4}\s*[-–—]\s*(?:\d{4}|present|current)\b/i.test(trimmed)) return true;
  return false;
}

/**
 * Sanitize text for jsPDF (Helvetica only supports basic Latin).
 */
function sanitizeForPdf(text: string): string {
  let s = text;
  s = s.replace(/[\u00C4\u2022\u25C6\u25CF\u2666\u00B7\u2043\u25AA\u25AB\u25E6\u2219\u00A4\u2023]/g, "|");
  s = s.replace(/\s*[""]\s*/g, " | ");
  s = s.replace(/[\u2018\u2019\u201A]/g, "'");
  s = s.replace(/[\u201C\u201D\u201E]/g, '"');
  s = s.replace(/[\u2013\u2014]/g, "-");
  s = s.replace(/\u2026/g, "...");
  s = s.replace(/[^\x00-\x7F\u00C0-\u00FF]/g, () => " ");
  s = s.replace(/\s*\|\s*\|\s*/g, " | ");
  s = s.replace(/\s{2,}/g, " ");
  s = s.replace(/https?:\/\/(www\.)?/g, "");
  s = s.replace(/\/+(\s|$)/g, "$1");
  return s.trim();
}

// Brand color matching the on-screen display
const BRAND_GREEN = "2B5C3F";
const BRAND_GREEN_RGB: [number, number, number] = [43, 92, 63];

export async function downloadAsDocx(resumeText: string, filename?: string): Promise<void> {
  const sections = parseResumeSections(resumeText);
  const children: Paragraph[] = [];

  const numbering = {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 540, hanging: 270 },
              },
            },
          },
        ],
      },
    ],
  };

  for (const section of sections) {
    if (section.heading) {
      // Add spacing before heading
      children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

      // Section heading: uppercase, bold, green, with bottom border — matches on-screen style
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 120 },
          children: [
            new TextRun({
              text: section.heading.toUpperCase(),
              bold: true,
              size: 22, // 11pt
              font: "Calibri",
              color: BRAND_GREEN,
              characterSpacing: 80, // wide letter-spacing like the UI
            }),
          ],
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 4,
              color: BRAND_GREEN,
              space: 4,
            },
          },
        })
      );
    }

    for (const line of section.lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        children.push(new Paragraph({ spacing: { before: 40 }, children: [] }));
        continue;
      }

      if (isBullet(trimmed)) {
        children.push(
          new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            spacing: { before: 30, after: 30, line: 276 }, // 1.15x line spacing
            children: [
              new TextRun({
                text: cleanBullet(trimmed),
                size: 21, // 10.5pt
                font: "Calibri",
                color: "1E1E1E",
              }),
            ],
          })
        );
      } else {
        const isSubheading = isEntryLine(trimmed);

        children.push(
          new Paragraph({
            spacing: { before: isSubheading ? 120 : 40, after: 30, line: 276 },
            children: [
              new TextRun({
                text: trimmed,
                size: isSubheading ? 22 : 21,
                font: "Calibri",
                bold: isSubheading,
                color: "1E1E1E",
              }),
            ],
          })
        );
      }
    }
  }

  const doc = new Document({
    numbering,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 21 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename || "aligned-resume.docx");
}

export function downloadAsPdf(resumeText: string, options?: { onePage?: boolean }): void {
  const isOnePage = options?.onePage ?? false;
  const format = isOnePage ? "a4" : "letter";

  const pdf = new jsPDF({ unit: "pt", format });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = isOnePage ? 40 : 50;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const baseFontSize = isOnePage ? 9.5 : 10.5;
  const headingFontSize = isOnePage ? 11 : 11;
  const lineSpacing = isOnePage ? 1.25 : 1.35;
  const sectionGap = isOnePage ? 6 : 12;
  const bulletGap = isOnePage ? 1 : 2;
  const emptyLineGap = isOnePage ? 3 : 4;

  const sections = parseResumeSections(sanitizeForPdf(resumeText));

  const addText = (
    text: string,
    opts: {
      fontSize?: number;
      bold?: boolean;
      indent?: number;
      color?: [number, number, number];
    } = {}
  ) => {
    const { fontSize = baseFontSize, bold = false, indent = 0, color = [30, 30, 30] } = opts;

    pdf.setFontSize(fontSize);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setTextColor(...color);

    const lines = pdf.splitTextToSize(text, maxWidth - indent);
    const lineHeight = fontSize * lineSpacing;

    for (const line of lines) {
      if (!isOnePage && y + lineHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      if (y + lineHeight <= pageHeight - margin) {
        pdf.text(line, margin + indent, y);
      }
      y += lineHeight;
    }
  };

  for (const section of sections) {
    if (section.heading) {
      y += sectionGap;

      if (!isOnePage && y + 30 > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }

      // Heading text in brand green, uppercase, with letter-spacing
      pdf.setFontSize(headingFontSize);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...BRAND_GREEN_RGB);

      // Simulate letter-spacing by printing each character manually
      const headingText = section.heading.toUpperCase();
      const charSpacing = 1.5; // extra pt per character
      let xPos = margin;
      for (let i = 0; i < headingText.length; i++) {
        pdf.text(headingText[i], xPos, y);
        xPos += pdf.getTextWidth(headingText[i]) + charSpacing;
      }

      // Underline below descenders
      const underlineY = y + headingFontSize * 0.45;
      pdf.setDrawColor(...BRAND_GREEN_RGB);
      pdf.setLineWidth(0.5);
      pdf.line(margin, underlineY, pageWidth - margin, underlineY);

      // Gap after rule
      const bodyLineHeight = baseFontSize * lineSpacing;
      y = underlineY + bodyLineHeight * 1.6;
    }

    for (const line of section.lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        y += emptyLineGap;
        continue;
      }

      if (isBullet(trimmed)) {
        // Draw a small filled circle bullet like the UI
        const bulletY = y - baseFontSize * 0.25;
        pdf.setFillColor(30, 30, 30);
        pdf.circle(margin + 5, bulletY, 1.5, "F");
        addText(cleanBullet(trimmed), { indent: 14 });
      } else {
        const isSubheading = isEntryLine(trimmed);
        addText(trimmed, {
          bold: isSubheading,
          fontSize: isSubheading ? baseFontSize + 0.5 : baseFontSize,
        });
      }
      y += bulletGap;
    }
  }

  pdf.save(isOnePage ? "one-page-resume.pdf" : "aligned-resume.pdf");
}
