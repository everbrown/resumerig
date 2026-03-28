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

export function downloadAsPdf(resumeText: string): void {
  const pdf = new jsPDF({
    unit: "pt",
    format: "letter",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 54; // 0.75 inch
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

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
    const { fontSize = 11, bold = false, indent = 0, color = [30, 30, 30] } = opts;

    pdf.setFontSize(fontSize);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setTextColor(...color);

    const lines = pdf.splitTextToSize(text, maxWidth - indent);
    const lineHeight = fontSize * 1.4;

    for (const line of lines) {
      if (y + lineHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin + indent, y);
      y += lineHeight;
    }
  };

  for (const section of sections) {
    if (section.heading) {
      y += 8;

      if (y + 30 > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }

      addText(section.heading, { fontSize: 13, bold: true, color: [43, 92, 63] });

      // Underline
      pdf.setDrawColor(43, 92, 63);
      pdf.setLineWidth(0.8);
      pdf.line(margin, y - 2, pageWidth - margin, y - 2);
      y += 6;
    }

    for (const line of section.lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        y += 6;
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
      y += 2;
    }
  }

  pdf.save("refined-resume.pdf");
}
