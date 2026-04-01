import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  LevelFormat,
} from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";

/**
 * Parse the tuned resume text into structured sections.
 * Expects a format like:
 *   NAME
 *   contact info
 *   ---
 *   SECTION HEADING
 *   content...
 */
interface ResumeSection {
  heading?: string;
  lines: string[];
}

function parseResumeSections(text: string): ResumeSection[] {
  const lines = text.split("\n");
  const sections: ResumeSection[] = [];
  let current: ResumeSection = { lines: [] };

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headings: all-caps lines, or lines ending with ":"
    const isHeading =
      trimmed.length > 2 &&
      trimmed.length < 60 &&
      (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && !/^\d/.test(trimmed)) ||
      /^(SUMMARY|EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|PROJECTS|AWARDS|OBJECTIVE|PROFILE)/i.test(trimmed);

    if (isHeading && current.lines.length > 0) {
      sections.push(current);
      current = { heading: trimmed, lines: [] };
    } else if (isHeading && current.lines.length === 0 && !current.heading) {
      current.heading = trimmed;
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
  return /^\s*[•\-\*▪]\s/.test(line) || /^\s*\d+[\.\)]\s/.test(line);
}

function cleanBullet(line: string): string {
  return line.replace(/^\s*[•\-\*▪]\s*/, "").replace(/^\s*\d+[\.\)]\s*/, "").trim();
}

export async function downloadAsDocx(resumeText: string): Promise<void> {
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
                indent: { left: 720, hanging: 360 },
              },
            },
          },
        ],
      },
    ],
  };

  for (const section of sections) {
    // Section heading
    if (section.heading) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
          children: [
            new TextRun({
              text: section.heading,
              bold: true,
              size: 26, // 13pt
              font: "Calibri",
            }),
          ],
          border: {
            bottom: {
              style: "single" as any,
              size: 4,
              color: "2B5C3F",
              space: 4,
            },
          },
        })
      );
    }

    // Section content
    for (const line of section.lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        children.push(new Paragraph({ spacing: { before: 60 }, children: [] }));
        continue;
      }

      if (isBullet(trimmed)) {
        children.push(
          new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({
                text: cleanBullet(trimmed),
                size: 22, // 11pt
                font: "Calibri",
              }),
            ],
          })
        );
      } else {
        // Check if it looks like a job title / company line (bold)
        const isSubheading =
          trimmed.length < 80 &&
          (/\|/.test(trimmed) || /\d{4}/.test(trimmed)) &&
          !trimmed.startsWith("(");

        children.push(
          new Paragraph({
            spacing: { before: 80, after: 40 },
            children: [
              new TextRun({
                text: trimmed,
                size: 22, // 11pt
                font: "Calibri",
                bold: isSubheading,
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
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }, // 0.75" margins
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "refined-resume.docx");
}

export function downloadAsPdf(resumeText: string, options?: { onePage?: boolean }): void {
  const isOnePage = options?.onePage ?? false;
  const format = isOnePage ? "a4" : "letter";
  
  const pdf = new jsPDF({
    unit: "pt",
    format,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = isOnePage ? 40 : 54; // tighter margins for 1-page
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  // For one-page mode, use smaller fonts and tighter spacing
  const baseFontSize = isOnePage ? 9.5 : 11;
  const headingFontSize = isOnePage ? 11 : 13;
  const lineSpacing = isOnePage ? 1.25 : 1.4;
  const sectionGap = isOnePage ? 4 : 8;
  const bulletGap = isOnePage ? 1 : 2;
  const emptyLineGap = isOnePage ? 3 : 6;
  const headingUnderGap = isOnePage ? 3 : 6;

  const sections = parseResumeSections(resumeText);

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
      // In one-page mode, just keep writing (overflow hidden by design)
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

      addText(section.heading, { fontSize: headingFontSize, bold: true, color: [43, 92, 63] });

      // Underline
      pdf.setDrawColor(43, 92, 63);
      pdf.setLineWidth(0.8);
      pdf.line(margin, y - 2, pageWidth - margin, y - 2);
      y += headingUnderGap;
    }

    for (const line of section.lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        y += emptyLineGap;
        continue;
      }

      if (isBullet(trimmed)) {
        addText(`\u2022  ${cleanBullet(trimmed)}`, { indent: 14 });
      } else {
        const isSubheading =
          trimmed.length < 80 &&
          (/\|/.test(trimmed) || /\d{4}/.test(trimmed));
        addText(trimmed, { bold: isSubheading });
      }
      y += bulletGap;
    }
  }

  pdf.save(isOnePage ? "one-page-resume.pdf" : "refined-resume.pdf");
}
