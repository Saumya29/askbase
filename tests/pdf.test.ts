import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extractPdfText } from "../lib/pdf";
import { POST as upload } from "../app/api/upload/route";
import { env } from "../lib/env";
import { Embeddings } from "openai/resources/embeddings";

const filenames = ["Harbour_AI_Product_Brief.pdf", "Harbour_AI_Pilot_Results.pdf", "Harbour_AI_Safety_Policy.pdf"];

test("sample PDFs extract readable text through the upload parser", async () => {
  for (const name of filenames) {
    const parsed = await extractPdfText(readFileSync(`public/sample-documents/${name}`));
    assert.equal(parsed.total, 1);
    assert.match(parsed.text, /fictional/i);
    assert.ok(parsed.text.length > 1000);
  }
});

test("valid generated PDF uploads are parsed, embedded and stored", async (t) => {
  t.mock.getter(env, "openaiApiKey", () => "test-key");
  t.mock.getter(env, "supabaseUrl", () => "https://storage.example.com");
  t.mock.getter(env, "supabaseServiceKey", () => "test-key");
  t.mock.method(Embeddings.prototype, "create", async (body: { input: string[] }) => ({
    data: body.input.map((_, index) => ({ index, embedding: Array(1536).fill(0.1) })),
  }));
  let chunksStored = 0;
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith("https://storage.example.com/rest/v1/documents")) return Response.json({ id: "sample-document" });
    if (url.startsWith("https://storage.example.com/rest/v1/chunks")) {
      const rows = JSON.parse(init?.body as string);
      assert.ok(rows.every((row: { content: string; embedding: number[] }) => row.content.length <= 1200 && row.embedding.length === 1536));
      chunksStored = rows.length;
      return new Response(null, { status: 201 });
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  const form = new FormData();
  form.set("file", new File([readFileSync(`public/sample-documents/${filenames[0]}`)], filenames[0], { type: "application/pdf" }));
  const response = await upload(new Request("http://localhost/api/upload", { method: "POST", body: form }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.chunks, chunksStored);
  assert.ok(chunksStored >= 2);
});
