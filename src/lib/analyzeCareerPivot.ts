export interface AnalysisResult {
  translatorTable: { oldTerm: string; newTerm: string }[];
  tunedResume: string;
  pivotPitch: string;
}

/**
 * Analyzes the career pivot by extracting keywords, mapping skills, and rewriting the resume.
 * Currently runs client-side with heuristic matching. Enable Lovable Cloud for AI-powered analysis.
 */
export async function analyzeCareerPivot(
  resume: string,
  jobDescription: string
): Promise<AnalysisResult> {
  // Simulate processing time
  await new Promise((r) => setTimeout(r, 2000));

  // Extract key action verbs and nouns from JD
  const jdWords = extractKeyTerms(jobDescription);
  const resumeLines = resume.split("\n").filter((l) => l.trim().length > 5);

  // Build translator table from resume terms → JD terms
  const translatorTable = buildTranslatorTable(resume, jdWords);

  // Rewrite resume lines using JD language
  const tunedResume = rewriteResume(resumeLines, jdWords, translatorTable);

  // Generate pivot pitch
  const pivotPitch = generatePivotPitch(resume, jobDescription, jdWords);

  return { translatorTable, tunedResume, pivotPitch };
}

const BUSINESS_VERBS = [
  "Led", "Managed", "Directed", "Orchestrated", "Spearheaded",
  "Delivered", "Drove", "Optimized", "Streamlined", "Scaled",
  "Executed", "Architected", "Launched", "Implemented", "Analyzed"
];

function extractKeyTerms(text: string): string[] {
  const importantPatterns = [
    /stakeholder\s*management/gi, /project\s*management/gi, /revenue\s*growth/gi,
    /KPI/gi, /deployment/gi, /cross-functional/gi, /data-driven/gi,
    /strategic\s*planning/gi, /team\s*leadership/gi, /budget\s*management/gi,
    /client\s*relations/gi, /process\s*improvement/gi, /risk\s*management/gi,
    /agile/gi, /scrum/gi, /ROI/gi, /pipeline/gi, /metrics/gi,
    /compliance/gi, /analytics/gi, /optimization/gi, /scalab/gi,
    /collaboration/gi, /innovation/gi, /communication/gi,
  ];

  const found: string[] = [];
  for (const pat of importantPatterns) {
    const match = text.match(pat);
    if (match) found.push(match[0].trim());
  }

  // Also grab capitalized multi-word phrases
  const phrases = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g) || [];
  for (const p of phrases.slice(0, 5)) {
    if (!found.includes(p)) found.push(p);
  }

  return found.length > 0 ? found.slice(0, 10) : [
    "Stakeholder Management", "Process Improvement", "Strategic Planning",
    "Data-Driven Decisions", "Cross-Functional Collaboration"
  ];
}

function buildTranslatorTable(resume: string, jdTerms: string[]) {
  const resumeLower = resume.toLowerCase();
  
  const mappings: Record<string, string[]> = {
    "teach|instruct|educate|classroom|students|curriculum": ["Stakeholder Management", "Cohort Operations", "Program Delivery"],
    "patient|diagnos|treat|clinical|medical|health": ["Client Assessment", "Risk Analysis", "Compliance Management"],
    "sold|sales|quota|customer|retail|merchandise": ["Revenue Growth", "Pipeline Management", "Client Relations"],
    "deploy|mission|command|personnel|military|unit": ["Team Leadership", "Strategic Operations", "Resource Deployment"],
    "cook|menu|kitchen|restaurant|hospitality|service": ["Operations Management", "Quality Assurance", "Team Coordination"],
    "code|develop|software|engineer|debug|api": ["Technical Architecture", "Product Delivery", "System Optimization"],
    "research|publish|data|analyz|experiment|study": ["Data-Driven Strategy", "Analytics", "Evidence-Based Decision Making"],
    "manag|supervis|lead|team|department|oversee": ["Cross-Functional Leadership", "Organizational Strategy", "Performance Management"],
  };

  const table: { oldTerm: string; newTerm: string }[] = [];

  for (const [patterns, translations] of Object.entries(mappings)) {
    const patternList = patterns.split("|");
    for (const pat of patternList) {
      if (resumeLower.includes(pat)) {
        const relevantTranslation = translations.find(t => 
          jdTerms.some(jt => jt.toLowerCase().includes(t.toLowerCase().split(" ")[0].toLowerCase()))
        ) || translations[0];
        
        table.push({
          oldTerm: pat.charAt(0).toUpperCase() + pat.slice(1) + " (your experience)",
          newTerm: relevantTranslation,
        });
        break;
      }
    }
  }

  // Pad with generic mappings if too few
  const generics = [
    { oldTerm: "Day-to-day responsibilities", newTerm: "Operational Excellence" },
    { oldTerm: "Worked with others", newTerm: "Cross-Functional Collaboration" },
    { oldTerm: "Solved problems", newTerm: "Strategic Problem-Solving" },
    { oldTerm: "Met goals", newTerm: "KPI Achievement" },
    { oldTerm: "Trained others", newTerm: "Talent Development" },
  ];

  while (table.length < 5) {
    const g = generics[table.length];
    if (g) table.push(g);
    else break;
  }

  return table.slice(0, 8);
}

function rewriteResume(lines: string[], jdTerms: string[], table: { oldTerm: string; newTerm: string }[]) {
  const rewritten: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if it looks like a header/title line
    if (trimmed.length < 40 && !trimmed.includes("•") && !trimmed.includes("-")) {
      rewritten.push(trimmed);
      continue;
    }

    // Rewrite bullet points with impact formula
    const verb = BUSINESS_VERBS[Math.floor(Math.random() * BUSINESS_VERBS.length)];
    const cleaned = trimmed.replace(/^[•\-–—*]\s*/, "");
    
    // Try to inject a JD term
    const relevantTerm = jdTerms[rewritten.length % jdTerms.length] || "operational efficiency";
    
    rewritten.push(`• ${verb} ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1)}${cleaned.endsWith('.') ? '' : ','} contributing to ${relevantTerm.toLowerCase()}.`);
  }

  return rewritten.join("\n");
}

function generatePivotPitch(resume: string, jd: string, jdTerms: string[]) {
  const topTerms = jdTerms.slice(0, 3).map(t => t.toLowerCase()).join(", ");
  
  return `My background has given me deep expertise in ${topTerms} — skills I've applied across complex, high-stakes environments. I'm excited to bring that same rigor and results-orientation to this role, where my track record of delivering measurable outcomes translates directly into the impact your team needs.`;
}
