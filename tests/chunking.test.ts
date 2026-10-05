import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkText } from "../lib/chunking";

test("long paragraphs after short paragraphs stay bounded and preserve text", () => {
  const text = "Introduction.\n\n" + "long-passage ".repeat(450) + "END";
  const chunks = chunkText(text);
  assert.ok(chunks.length > 4);
  assert.ok(chunks.every((chunk, index) => chunk.content.length <= 1200 && chunk.index === index));
  assert.ok(chunks[0].content.startsWith("Introduction."));
  assert.ok(chunks.at(-1)?.content.endsWith("END"));
  // Every non-whitespace character must survive extraction, including the middle of the long paragraph.
  let cursor = 0;
  for (const chunk of chunks) {
    const position = text.indexOf(chunk.content, Math.max(0, cursor - 202));
    assert.ok(position >= 0);
    assert.ok(!text.slice(cursor, position).trim(), "no content was skipped between chunks");
    cursor = Math.max(cursor, position + chunk.content.length);
  }
  assert.equal(cursor, text.length);
});

test("overlap is retained for a paragraph without boundaries", () => {
  const text = "0123456789".repeat(20);
  const chunks = chunkText(text, 60, 10);
  assert.equal(chunks[1].content.slice(0, 10), chunks[0].content.slice(-10));
  assert.equal(chunks.at(-1)?.content, text.slice(150));
});

test("empty text and zero overlap work; invalid chunk settings fail immediately", () => {
  assert.deepEqual(chunkText(" \n\t "), []);
  assert.deepEqual(chunkText("abcdef", 3, 0).map((chunk) => chunk.content), ["abc", "def"]);
  for (const [size, overlap] of [[0, 0], [20, 20], [20, -1], [2.5, 0]]) {
    assert.throws(() => chunkText("example", size, overlap), RangeError);
  }
});
