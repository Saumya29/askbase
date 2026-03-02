import { getOpenAIClient } from "@/lib/openai";

export const EMBEDDING_DIMENSIONS = 1536;
const EMBEDDING_MODEL = "text-embedding-3-small";

export function emptyEmbedding() {
  return Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0);
}

export async function embedTexts(texts: string[]) {
  const client = getOpenAIClient();
  if (!client) {
    return texts.map(() => emptyEmbedding());
  }

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}
