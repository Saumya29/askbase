export type Chunk = {
  content: string;
  index: number;
};

const DEFAULT_MAX_CHARS = 1200;
const DEFAULT_OVERLAP = 200;

export function chunkText(text: string, maxChars = DEFAULT_MAX_CHARS, overlap = DEFAULT_OVERLAP): Chunk[] {
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleaned) {
    return [];
  }

  const paragraphs = cleaned.split("\n\n");
  const chunks: Chunk[] = [];
  let current = "";
  let index = 0;

  const pushChunk = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    chunks.push({ content: trimmed, index });
    index += 1;
  };

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length <= maxChars) {
      current = current ? `${current}\n\n${para}` : para;
      continue;
    }

    if (current) {
      pushChunk(current);
      const overlapText = current.slice(-overlap);
      current = overlapText ? `${overlapText}\n\n${para}` : para;
      continue;
    }

    let start = 0;
    while (start < para.length) {
      const slice = para.slice(start, start + maxChars);
      pushChunk(slice);
      start += maxChars - overlap;
    }
  }

  if (current) {
    pushChunk(current);
  }

  return chunks;
}
