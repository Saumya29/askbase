import { test } from "node:test";
import assert from "node:assert/strict";
import { POST as chat } from "../app/api/chat/route";
import { POST as upload } from "../app/api/upload/route";
import { POST as crawl } from "../app/api/crawl/route";
import { embedTexts } from "../lib/embeddings";
import { matchChunks } from "../lib/retrieval";
import { env } from "../lib/env";
import { Embeddings } from "openai/resources/embeddings";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
}

const question = { messages: [{ id: "user-1", role: "user", parts: [{ type: "text", text: "When is the workshop?" }] }] };

test("malformed chat input returns 400 rather than crashing", async () => {
  for (const body of [null, {}, { messages: "bad" }, { messages: [{ role: "user", parts: "bad" }] }, { messages: [] }]) {
    assert.equal((await chat(jsonRequest(body))).status, 400);
  }
});

test("missing configuration fails explicitly without outbound requests", async (t) => {
  t.mock.getter(env, "openaiApiKey", () => undefined);
  t.mock.getter(env, "supabaseUrl", () => undefined);
  t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected outbound request"); });
  assert.equal((await chat(jsonRequest(question))).status, 503);
  await assert.rejects(embedTexts(["sample"]), /not configured/);
  await assert.rejects(matchChunks(Array(1536).fill(0.1)), /not configured/);
  const form = new FormData();
  form.set("file", new File(["test"], "sample.pdf", { type: "application/pdf" }));
  assert.equal((await upload(new Request("http://localhost/api/upload", { method: "POST", body: form }))).status, 503);
  assert.equal((await crawl(jsonRequest({ url: "https://example.com" }))).status, 503);
});

test("empty corpus gives a grounded no-sources response without calling the answer model", async (t) => {
  t.mock.getter(env, "openaiApiKey", () => "test-key");
  t.mock.getter(env, "supabaseUrl", () => "https://storage.example.com");
  t.mock.getter(env, "supabaseServiceKey", () => "test-key");
  const embeddingCall = t.mock.method(Embeddings.prototype, "create", async () => ({
    data: [{ index: 0, embedding: Array(1536).fill(0.1) }],
  }));
  const calls: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push(url);
    if (url === "https://storage.example.com/rest/v1/rpc/match_chunks") return Response.json([]);
    throw new Error(`Unexpected request: ${url}`);
  });
  const response = await chat(jsonRequest(question));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-vercel-ai-ui-message-stream"), "v1");
  const events = (await response.text()).split("\n\n").filter((line) => line.startsWith("data: ") && !line.includes("[DONE]")).map((line) => JSON.parse(line.slice(6)));
  const text = events.filter((event) => event.type === "text-delta").map((event) => event.delta).join("");
  assert.match(text, /couldn't find any source passages/);
  assert.equal(events.at(-1).type, "finish");
  assert.equal(calls.length, 1);
  assert.equal(embeddingCall.mock.callCount(), 1);
});

test("database search errors cannot masquerade as an empty corpus", async (t) => {
  t.mock.getter(env, "supabaseUrl", () => "https://storage.example.com");
  t.mock.getter(env, "supabaseServiceKey", () => "test-key");
  t.mock.method(globalThis, "fetch", async () => Response.json({ message: "missing function", code: "PGRST202" }, { status: 404 }));
  await assert.rejects(matchChunks(Array(1536).fill(0.1)), /Document search failed/);
});

test("imports reject invalid URLs and unsuitable uploads", async () => {
  for (const url of [null, 25, "file:///etc/passwd", "httpx://example.com"]) {
    assert.equal((await crawl(jsonRequest({ url }))).status, 400);
  }
  const form = new FormData();
  form.set("file", new File(["text"], "sample.txt", { type: "text/plain" }));
  assert.equal((await upload(new Request("http://localhost/api/upload", { method: "POST", body: form }))).status, 400);
  const big = new FormData();
  big.set("file", new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.pdf", { type: "application/pdf" }));
  assert.equal((await upload(new Request("http://localhost/api/upload", { method: "POST", body: big }))).status, 413);
});

for (const failAt of ["none", "documents", "chunks"]) {
  test(`URL import reports ${failAt === "none" ? "successful indexing" : `${failAt} storage failure`} honestly`, async (t) => {
    t.mock.getter(env, "openaiApiKey", () => "test-key");
    t.mock.getter(env, "supabaseUrl", () => "https://storage.example.com");
    t.mock.getter(env, "supabaseServiceKey", () => "test-key");
    t.mock.method(Embeddings.prototype, "create", async () => ({ data: [{ index: 0, embedding: Array(1536).fill(0.1) }] }));
    let chunksSaved = 0;
    t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url === "https://example.com/") return new Response("<html><head><title>Workshop</title></head><body><p>The workshop takes place on October 24 at 10 AM. Tickets cost AED 40 and include materials. Please bring your laptop.</p></body></html>", { headers: { "Content-Type": "text/html" } });
      if (url.startsWith("https://storage.example.com/rest/v1/documents")) {
        if (failAt === "documents") return Response.json({ message: "Insert failed" }, { status: 500 });
        return Response.json({ id: "doc-1" });
      }
      if (url.startsWith("https://storage.example.com/rest/v1/chunks")) {
        if (failAt === "chunks") return Response.json({ message: "Insert failed" }, { status: 500 });
        chunksSaved = JSON.parse(init?.body as string).length;
        return new Response(null, { status: 201 });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    const response = await crawl(jsonRequest({ url: "https://example.com/" }));
    const events = (await response.text()).trim().split("\n\n").map((line) => JSON.parse(line.slice(6)));
    if (failAt === "none") {
      const completion = events.find((event) => event.type === "complete");
      assert.ok(completion, JSON.stringify(events));
      assert.equal(completion.totalChunks, 1);
      assert.equal(completion.totalChunks, chunksSaved);
    } else {
      assert.ok(events.some((event) => event.type === "error"));
      assert.ok(!events.some((event) => event.type === "complete"));
    }
  });
}
