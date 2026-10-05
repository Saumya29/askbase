export type Chunk = {
  content: string;
  index: number;
};

const DEFAULT_MAX_CHARS = 1200;
const DEFAULT_OVERLAP = 200;

export function chunkText(text: string, maxChars = DEFAULT_MAX_CHARS, overlap = DEFAULT_OVERLAP): Chunk[] {
  if (!Number.isInteger(maxChars) || maxChars <= 0 || !Number.isInteger(overlap) || overlap < 0 || overlap >= maxChars) {
    throw new RangeError("Chunk size must be positive and overlap must be smaller than chunk size.");
  }
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleaned) {
    return [];
  }

  const chunks: Chunk[] = [];
  let start = 0;
  while (start < cleaned.length) {
    let end = Math.min(start + maxChars, cleaned.length);
    if (end < cleaned.length) {
      // Prefer a paragraph boundary when it leaves room for forward progress.
      const boundary = cleaned.lastIndexOf("\n\n", end - 2);
      if (boundary + 2 > start + overlap && boundary >= start) end = boundary + 2;
    }
    const content = cleaned.slice(start, end).trim();
    if (content) chunks.push({ content, index: chunks.length });
    if (end === cleaned.length) break;
    start = end - overlap;
  }

  return chunks;
}
