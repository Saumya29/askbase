import OpenAI from "openai";
import { env } from "@/lib/env";

export function getOpenAIClient() {
  if (!env.openaiApiKey) {
    return null;
  }
  return new OpenAI({ apiKey: env.openaiApiKey });
}
