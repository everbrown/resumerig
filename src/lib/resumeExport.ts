import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  LevelFormat,
  BorderStyle,
  TabStopType,
  TabStopPosition,
} from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";

/**
 * Harvard-style (Classic ATS) resume export.
 * - Times New Roman, 11pt body, black text
 * - Centered name + contact header
 * - ALL CAPS section headings with full-width bottom rule
 * - Bold entry titles, dates right-aligned via tab stops where possible
 * - Standard bullets, 0.75" margins
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

// Headings styled but NOT suppressed in Harvard style — recruiters expect "SUMMARY" header
const SUPPRESSED_HEADINGS: string[] = [];

function isHeadingLine(trimmed: string): boolean {
  if (!trimmed) return false;
  const upper = trimmed.toUpperCase().replace(/[:\s]+$/g, "");
  if (SECTION_HEADINGS.includes(upper)) return true;
  if (
    trimmed.length > 2 &&
    trimmed.length <= 45 &&
    /^[A-Za-z][A-Za-z\s/&-]*:?$/.test(trimmed) &&
    !/^\d/.test(trimmed)
  ) {
    if (trimmed === trimmed.toUpperCase()) return true;
  }
  return false;
}

function isBullet(line: string): boolean {
  return /^\s*[•\-\*▪●]\s/.test(line) || /^\s*\d+[\.\)]\s/.test(line);
}

function cleanBullet(line: string): string {
  return line.replace(/^\s*[•\-\*▪●]\s*/, "").replace(/^\s*\d+[\.\)]\s*/, "").trim();
}

function isEntryLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length >= 100) return false;
  if (trimmed.includes("|") && trimmed.length > 10) return true;
  if (/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+\d{4}/i.test(trimmed)) return true;
  if (/\b\d{4}\s*[-–—]\s*(?:\d{4}|present|current)\b/i.test(trimmed)) return true;
  return false;
}

/** Detect contact-info-looking lines (emails, phone numbers, urls, addresses with bullets/pipes). */
function looksLikeContactLine(trimmed: string): boolean {
  if (!trimmed) return false;
  if (/@\S+\.\S+/.test(trimmed)) return true;
  if (/(\+?\d[\d\s().\-]{7,})/.test(trimmed)) return true;
  if (/\b(linkedin|github|portfolio|www\.|https?:\/\/)/i.test(trimmed)) return true;
  if (/[•|·]/.test(trimmed) && trimmed.length < 120) return true;
  return false;
}

/** Detect a name line: short, mostly letters, title case or all caps, no numbers or @. */
function looksLikeName(trimmed: string): boolean {
  if (!trimmed || trimmed.length > 60) return false;
  if (/[@\d]/.test(trimmed)) return false;
  if (isHeadingLine(trimmed)) return false;
  const words = trimmed.split(/\s+/);
  if (words.length < 2 || words.length > 5) return false;
  return words.every((w) => /^[A-Z][a-zA-Z'\-]*$|^[A-Z]+$/.test(w));
}

/** Split header (name + contact) from body before first heading. */
function extractHeader(text: string): { headerLines: string[]; bodyText: string } {
  const lines = text.split("\n");
  const headerLines: string[] = [];
  let bodyStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      if (headerLines.length > 0) {
        bodyStart = i + 1;
        break;
      }
      continue;
    }
    if (isHeadingLine(trimmed)) {
      bodyStart = i;
      break;
    }
    // Accept name as first non-empty, contact lines as following
    if (headerLines.length === 0 && looksLikeName(trimmed)) {
      headerLines.push(trimmed);
    } else if (headerLines.length > 0 && (looksLikeContactLine(trimmed) || trimmed.length < 100)) {
      headerLines.push(trimmed);
      // Stop after 3 header lines to be safe
      if (headerLines.length >= 3) {
        bodyStart = i + 1;
        break;
      }
    } else if (headerLines.length === 0) {
      // No name detected — give up on header extraction
      break;
    } else {
      bodyStart = i;
      break;
    }
  }

  if (headerLines.length === 0) {
    return { headerLines: [], bodyText: text };
  }
  return { headerLines, bodyText: lines.slice(bodyStart).join("\n") };
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

/** Sanitize text for jsPDF (Times font supports Latin-1). */
function sanitizeForPdf(text: string): string {
  let s = text;
  s = s.replace(/[\u2022\u25C6\u25CF\u2666\u00B7\u2043\u25AA\u25AB\u25E6\u2219\u2023]/g, "•");
  s = s.replace(/[\u2018\u2019\u201A]/g, "'");
  s = s.replace(/[\u201C\u201D\u201E]/g, '"');
  s = s.replace(/[\u2013\u2014]/g, "-");
  s = s.replace(/\u2026/g, "...");
  s = s.replace(/[^\x00-\x7F\u00C0-\u00FF\u2022]/g, " ");
  s = s.replace(/\s{2,}/g, " ");
  return s;
}

// ============== DOCX EXPORT (Harvard style) ==============

const FONT = "Times New Roman";
const COLOR_BLACK = "000000";

export async function downloadAsDocx(resumeText: string, filename?: string): Promise<void> {
  const { headerLines, bodyText } = extractHeader(resumeText);
  const sections = parseResumeSections(bodyText);
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
              paragraph: { indent: { left: 360, hanging: 220 } },
            },
          },
        ],
      },
    ],
  };

  // === Header: centered name + contact ===
  if (headerLines.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: headerLines[0].toUpperCase(),
            bold: true,
            size: 32, // 16pt
            font: FONT,
            color: COLOR_BLACK,
            characterSpacing: 40,
          }),
        ],
      })
    );

    for (let i = 1; i < headerLines.length; i++) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: headerLines[i],
              size: 20, // 10pt
              font: FONT,
              color: COLOR_BLACK,
            }),
          ],
        })
      );
    }
  }

  for (const section of sections) {
    const isSuppressed = section.heading && SUPPRESSED_HEADINGS.includes(section.heading.toUpperCase().replace(/[:\s]+$/g, ""));

    if (section.heading && !isSuppressed) {
      children.push(
        new Paragraph({
          spacing: { before: 240, after: 80 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BLACK, space: 2 },
          },
          children: [
            new TextRun({
              text: section.heading.toUpperCase(),
              bold: true,
              size: 24, // 12pt
              font: FONT,
              color: COLOR_BLACK,
              characterSpacing: 30,
            }),
          ],
        })
      );
    }

    for (const line of section.lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (isBullet(trimmed)) {
        children.push(
          new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            spacing: { before: 20, after: 20, line: 264 },
            children: [
              new TextRun({
                text: cleanBullet(trimmed),
                size: 22, // 11pt
                font: FONT,
                color: COLOR_BLACK,
              }),
            ],
          })
        );
      } else if (isEntryLine(trimmed)) {
        // Try to split "Title | Company | Date" — last segment right-aligned if it looks like a date
        const parts = trimmed.split("|").map((p) => p.trim()).filter(Boolean);
        const lastIsDate =
          parts.length >= 2 &&
          /\d{4}|present|current/i.test(parts[parts.length - 1]);

        if (lastIsDate) {
          const left = parts.slice(0, -1).join(" | ");
          const right = parts[parts.length - 1];
          children.push(
            new Paragraph({
              spacing: { before: 140, after: 20, line: 264 },
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({ text: left, bold: true, size: 22, font: FONT, color: COLOR_BLACK }),
                new TextRun({ text: "\t", font: FONT }),
                new TextRun({ text: right, italics: true, size: 22, font: FONT, color: COLOR_BLACK }),
              ],
            })
          );
        } else {
          children.push(
            new Paragraph({
              spacing: { before: 140, after: 20, line: 264 },
              children: [
                new TextRun({ text: trimmed, bold: true, size: 22, font: FONT, color: COLOR_BLACK }),
              ],
            })
          );
        }
      } else {
        children.push(
          new Paragraph({
            spacing: { before: 20, after: 20, line: 264 },
            children: [
              new TextRun({ text: trimmed, size: 22, font: FONT, color: COLOR_BLACK }),
            ],
          })
        );
      }
    }
  }

  const doc = new Document({
    numbering,
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
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

// ============== PDF EXPORT (Harvard style) ==============

export function downloadAsPdf(resumeText: string, options?: { onePage?: boolean }): void {
  const isOnePage = options?.onePage ?? false;
  const format = isOnePage ? "a4" : "letter";
  const pdf = new jsPDF({ unit: "pt", format });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = isOnePage ? 40 : 54; // ~0.75"
  const maxWidth = pageWidth - margin * 2;

  // Match .docx Times 11pt body, 12pt headings, 16pt name, 1.2 line spacing
  const baseFontSize = isOnePage ? 10 : 11;
  const headingFontSize = isOnePage ? 11 : 12;
  const nameFontSize = isOnePage ? 15 : 16;
  const contactFontSize = isOnePage ? 9 : 10;
  const lineSpacing = isOnePage ? 1.18 : 1.22;

  // Match .docx spacing (twips → pts: 20 twips = 1pt)
  const sectionGapBefore = isOnePage ? 9 : 12;   // 240 twips before heading
  const headingGapAfter = isOnePage ? 4 : 6;     // 80 twips after heading rule
  const entryTopGap = isOnePage ? 5 : 7;         // 140 twips before entry
  const bulletIndent = isOnePage ? 14 : 18;
  const bulletDotX = isOnePage ? 6 : 8;
  const bulletGap = isOnePage ? 1 : 1.5;         // 20 twips before/after bullet
  const paragraphGap = isOnePage ? 1 : 1.5;      // 20 twips after body line

  // y is the TOP of the next line. We add fontSize before drawing so the baseline lands correctly.
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (!isOnePage && y + needed > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  const drawText = (
    text: string,
    opts: {
      fontSize?: number;
      bold?: boolean;
      italic?: boolean;
      indent?: number;
      align?: "left" | "center" | "right";
      afterGap?: number;
    } = {}
  ) => {
    const {
      fontSize = baseFontSize,
      bold = false,
      italic = false,
      indent = 0,
      align = "left",
      afterGap = paragraphGap,
    } = opts;
    const style = bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal";
    pdf.setFontSize(fontSize);
    pdf.setFont("times", style);
    pdf.setTextColor(0, 0, 0);

    const wrapWidth = maxWidth - indent;
    const lines = pdf.splitTextToSize(text, wrapWidth);
    const lineHeight = fontSize * lineSpacing;
    const ascent = fontSize * 0.85;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      ensureSpace(lineHeight);
      let x = margin + indent;
      if (align === "center") {
        x = (pageWidth - pdf.getTextWidth(line)) / 2;
      } else if (align === "right") {
        x = pageWidth - margin - pdf.getTextWidth(line);
      }
      pdf.text(line, x, y + ascent);
      y += lineHeight;
    }
    y += afterGap;
  };

  const safeText = sanitizeForPdf(resumeText);
  const { headerLines, bodyText } = extractHeader(safeText);
  const sections = parseResumeSections(bodyText);

  // === Header: centered name + contact ===
  if (headerLines.length > 0) {
    drawText(headerLines[0].toUpperCase(), {
      fontSize: nameFontSize,
      bold: true,
      align: "center",
      afterGap: 3,
    });
    for (let i = 1; i < headerLines.length; i++) {
      drawText(headerLines[i], {
        fontSize: contactFontSize,
        align: "center",
        afterGap: 2,
      });
    }
    y += 6;
  }

  for (const section of sections) {
    const isSuppressed =
      section.heading &&
      SUPPRESSED_HEADINGS.includes(section.heading.toUpperCase().replace(/[:\s]+$/g, ""));

    if (section.heading && !isSuppressed) {
      y += sectionGapBefore;
      const headingHeight = headingFontSize * lineSpacing;
      ensureSpace(headingHeight + 8);

      pdf.setFontSize(headingFontSize);
      pdf.setFont("times", "bold");
      pdf.setTextColor(0, 0, 0);
      const ascent = headingFontSize * 0.85;
      pdf.text(section.heading.toUpperCase(), margin, y + ascent);

      const borderY = y + headingHeight + 1;
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.7);
      pdf.line(margin, borderY, pageWidth - margin, borderY);

      y = borderY + headingGapAfter;
    }

    for (const line of section.lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (isBullet(trimmed)) {
        y += bulletGap;
        // Draw bullet dot aligned with first text line baseline
        const bulletY = y + baseFontSize * 0.55;
        pdf.setFillColor(0, 0, 0);
        pdf.circle(margin + bulletDotX, bulletY, 1.4, "F");
        drawText(cleanBullet(trimmed), { indent: bulletIndent, afterGap: bulletGap });
      } else if (isEntryLine(trimmed)) {
        y += entryTopGap;
        const parts = trimmed.split("|").map((p) => p.trim()).filter(Boolean);
        const lastIsDate =
          parts.length >= 2 && /\d{4}|present|current/i.test(parts[parts.length - 1]);

        if (lastIsDate) {
          const left = parts.slice(0, -1).join(" | ");
          const right = parts[parts.length - 1];
          const lineHeight = baseFontSize * lineSpacing;
          ensureSpace(lineHeight);
          pdf.setFontSize(baseFontSize);
          pdf.setTextColor(0, 0, 0);

          pdf.setFont("times", "italic");
          const rightWidth = pdf.getTextWidth(right);

          pdf.setFont("times", "bold");
          const maxLeftWidth = maxWidth - rightWidth - 14;
          let leftDraw = left;
          while (pdf.getTextWidth(leftDraw) > maxLeftWidth && leftDraw.length > 4) {
            leftDraw = leftDraw.slice(0, -2);
          }
          if (leftDraw !== left && !leftDraw.endsWith("…")) leftDraw = leftDraw.replace(/\s*$/, "…");
          const ascent = baseFontSize * 0.85;
          pdf.text(leftDraw, margin, y + ascent);

          pdf.setFont("times", "italic");
          pdf.text(right, pageWidth - margin - rightWidth, y + ascent);

          y += lineHeight + paragraphGap;
        } else {
          drawText(trimmed, { bold: true });
        }
      } else {
        drawText(trimmed);
      }
    }
  }

  pdf.save(isOnePage ? "one-page-resume.pdf" : "aligned-resume.pdf");
}

