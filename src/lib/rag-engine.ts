/**
 * HealthAI PRO — Grounded Medical Document RAG Engine
 * Implements document chunking, metadata extraction, hybrid search, context validation, and citation generation.
 */

import { DocumentType } from "@/types/medical";

export interface DocumentChunk {
  id: string;
  patientId: string;
  documentId: string;
  documentType: DocumentType;
  fileName: string;
  date: string;
  page: number;
  section: string;
  content: string;
  keywords: string[];
}

export interface RAGSearchResult {
  chunk: DocumentChunk;
  relevanceScore: number;
  citation: string;
}

export interface GroundedContextResponse {
  hasSufficientContext: boolean;
  retrievedChunks: RAGSearchResult[];
  formattedContext: string;
  citations: string[];
  uncertaintyWarning?: string;
}

// In-Memory Patient Semantic Chunk Store
const PATIENT_RAG_INDEX: Map<string, DocumentChunk[]> = new Map();

export function indexDocumentChunks(input: {
  patientId: string;
  documentId: string;
  documentType: DocumentType;
  fileName: string;
  text: string;
  date?: string;
}): number {
  const patientId = input.patientId;
  const chunks: DocumentChunk[] = [];
  const paragraphs = input.text.split(/\n\s*\n/).filter(p => p.trim().length > 10);

  paragraphs.forEach((p, idx) => {
    const textLower = p.toLowerCase();
    
    // Determine section
    let section = "General Findings";
    if (textLower.includes("cbc") || textLower.includes("hemoglobin") || textLower.includes("blood count")) {
      section = "Complete Blood Count (CBC)";
    } else if (textLower.includes("lipid") || textLower.includes("cholesterol") || textLower.includes("triglyceride")) {
      section = "Lipid Panel";
    } else if (textLower.includes("metabolic") || textLower.includes("glucose") || textLower.includes("creatinine")) {
      section = "Metabolic Panel";
    } else if (textLower.includes("rx") || textLower.includes("tab ") || textLower.includes("dosage") || textLower.includes("mg")) {
      section = "Pharmacotherapy Regimen";
    }

    const keywords = textLower
      .replace(/[^a-z0-9]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 3);

    chunks.push({
      id: `${input.documentId}_chunk_${idx + 1}`,
      patientId,
      documentId: input.documentId,
      documentType: input.documentType,
      fileName: input.fileName,
      date: input.date || new Date().toISOString().split("T")[0],
      page: Math.floor(idx / 3) + 1,
      section,
      content: p.trim(),
      keywords: Array.from(new Set(keywords))
    });
  });

  const existing = PATIENT_RAG_INDEX.get(patientId) || [];
  PATIENT_RAG_INDEX.set(patientId, [...existing, ...chunks]);
  return chunks.length;
}

export function hybridSearchRAG(
  patientId: string,
  query: string,
  topK: number = 3
): GroundedContextResponse {
  const allChunks = PATIENT_RAG_INDEX.get(patientId) || [];
  
  if (allChunks.length === 0) {
    return {
      hasSufficientContext: false,
      retrievedChunks: [],
      formattedContext: "No indexed medical records or laboratory reports found for this patient.",
      citations: [],
      uncertaintyWarning: "Insufficient clinical data: Please upload recent prescriptions or lab reports for grounded analysis."
    };
  }

  const queryTerms = query.toLowerCase().replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(w => w.length > 2);
  const scoredChunks: { chunk: DocumentChunk; score: number }[] = [];

  for (const chunk of allChunks) {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();

    for (const term of queryTerms) {
      if (chunk.keywords.includes(term)) score += 3.0;
      if (contentLower.includes(term)) score += 1.5;
      if (chunk.section.toLowerCase().includes(term)) score += 2.0;
    }

    if (score > 0) {
      scoredChunks.push({ chunk, score });
    }
  }

  scoredChunks.sort((a, b) => b.score - a.score);
  const topMatches = scoredChunks.slice(0, topK);

  if (topMatches.length === 0 || topMatches[0].score < 2.0) {
    return {
      hasSufficientContext: false,
      retrievedChunks: [],
      formattedContext: "Medical documents exist for this patient, but none contain sufficiently relevant data for this specific inquiry.",
      citations: [],
      uncertaintyWarning: "Not enough information: The uploaded documents do not contain explicit references to this question. Consult your attending physician for verification."
    };
  }

  const results: RAGSearchResult[] = topMatches.map(m => {
    const c = m.chunk;
    const citation = `[Source: ${c.fileName} — Section: ${c.section}, Page ${c.page} (${c.date})]`;
    return {
      chunk: c,
      relevanceScore: Math.min(1.0, m.score / 15.0),
      citation
    };
  });

  const formattedContext = results
    .map(r => `--- RETRIEVED MEDICAL RECORD ${r.citation} ---\n${r.chunk.content}\n`)
    .join("\n");

  const citations = Array.from(new Set(results.map(r => r.citation)));

  return {
    hasSufficientContext: true,
    retrievedChunks: results,
    formattedContext,
    citations,
  };
}
