import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { SourceCitations } from "../components/SourceCitations";

test("multiple passages from one document retain the model's citation numbers", () => {
  const sources = [
    { id: "a", document_id: "one", document_name: "Guide", content: "First passage", similarity: 0.9 },
    { id: "b", document_id: "one", document_name: "Guide", content: "Second passage", similarity: 0.8 },
    { id: "c", document_id: "two", document_name: "Policy", content: "Policy passage", similarity: 0.7 },
  ];
  const html = renderToStaticMarkup(<SourceCitations sources={sources} expandedSource="b" onToggle={() => {}} />);
  assert.ok(html.includes("[1] Guide"));
  assert.ok(html.includes("[2] Guide"));
  assert.ok(html.includes("[3] Policy"));
  assert.ok(html.includes("Second passage"));
});

test("URL sources offer a full passage preview as well as the original page", () => {
  const content = "x".repeat(400) + "The answer is at the end.";
  const html = renderToStaticMarkup(<SourceCitations sources={[
    { id: "url", document_id: "doc", document_name: "Page", source_url: "https://example.com", content, similarity: 0.8 },
  ]} expandedSource="url" onToggle={() => {}} />);
  assert.ok(html.includes("The answer is at the end."));
  assert.ok(html.includes('href="https://example.com"'));
  assert.ok(html.includes('aria-expanded="true"'));
});
