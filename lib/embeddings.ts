import { getOpenAIClient } from "@/lib/openai";

export const EMBEDDING_DIMENSIONS = 1536;
const EMBEDDING_MODEL = "text-embedding-3-small";

export async function embedTexts(texts: string[]) {
  if (!texts.length) return [];
  const client = getOpenAIClient();
  if (!client) {
    throw new Error("OpenAI is not configured. Embeddings could not be created.");
  }

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}
