import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

export type CrawledPage = {
  url: string;
  title: string;
  text: string;
};

type CrawlOptions = {
  maxPages?: number;
};

const MAX_PAGES_DEFAULT = 25;
const FETCH_TIMEOUT = 10_000;
const RATE_LIMIT_MS = 200;
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024;
const MIN_TEXT_LENGTH = 50;
const USER_AGENT = "AskBase/1.0";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(url: string): Promise<{ html: string; contentType: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) return null;

    const contentType = res.headers.get("content-type") || "";
    const html = await res.text();
    if (html.length > MAX_RESPONSE_SIZE) return null;

    return { html, contentType };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

function extractText(html: string, url: string): { title: string; text: string } | null {
  try {
    const { document } = parseHTML(html);
    const reader = new Readability(document as unknown as Document);
    const article = reader.parse();
    if (article && article.textContent && article.textContent.trim().length >= MIN_TEXT_LENGTH) {
      return { title: article.title || new URL(url).pathname, text: article.textContent.trim() };
    }
  } catch {
    // fall through to cheerio fallback
  }

  // Cheerio fallback
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, aside, noscript, iframe").remove();
  const title = $("title").text().trim() || new URL(url).pathname;
  const text = $("body").text().replace(/\s+/g, " ").trim();
  if (text.length < MIN_TEXT_LENGTH) return null;
  return { title, text };
}

function isSitemapContent(html: string, contentType: string): boolean {
  return (
    contentType.includes("xml") ||
    html.trimStart().startsWith("<?xml") ||
    html.includes("<urlset") ||
    html.includes("<sitemapindex")
  );
}

function parseSitemapUrls(xml: string): string[] {
  const $ = cheerio.load(xml, { xml: true });
  const urls: string[] = [];

  // Sitemap index — collect nested sitemap URLs
  $("sitemapindex sitemap loc").each((_, el) => {
    urls.push($(el).text().trim());
  });

  // Standard sitemap — collect page URLs
  $("urlset url loc").each((_, el) => {
    urls.push($(el).text().trim());
  });

  return urls;
}

function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const links: string[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.origin !== base.origin) return;
      resolved.hash = "";
      links.push(resolved.toString());
    } catch {
      // skip invalid URLs
    }
  });

  return links;
}

export async function* crawlSite(
  startUrl: string,
  options?: CrawlOptions
): AsyncGenerator<CrawledPage & { queued: number }> {
  const maxPages = options?.maxPages ?? MAX_PAGES_DEFAULT;
  const visited = new Set<string>();
  const queue: string[] = [startUrl];
  let pagesYielded = 0;

  while (queue.length > 0 && pagesYielded < maxPages) {
    const url = queue.shift()!;
    const normalized = url.replace(/\/$/, "");
    if (visited.has(normalized)) continue;
    visited.add(normalized);

    const result = await fetchPage(url);
    if (!result) continue;

    const { html, contentType } = result;

    // Handle sitemap
    if (url.includes("sitemap") && isSitemapContent(html, contentType)) {
      const sitemapUrls = parseSitemapUrls(html);
      for (const sitemapUrl of sitemapUrls) {
        if (!visited.has(sitemapUrl.replace(/\/$/, ""))) {
          queue.push(sitemapUrl);
        }
      }
      // If it's a sitemap index, the nested sitemaps will also be fetched and parsed
      // since they'll pass through the same check
      continue;
    }

    // Skip non-HTML
    if (!contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/xhtml")) {
      continue;
    }

    const extracted = extractText(html, url);
    if (!extracted) continue;

    // Extract links for BFS
    const links = extractLinks(html, url);
    for (const link of links) {
      if (!visited.has(link.replace(/\/$/, ""))) {
        queue.push(link);
      }
    }

    pagesYielded++;
    yield { url, title: extracted.title, text: extracted.text, queued: queue.length };

    await sleep(RATE_LIMIT_MS);
  }
}
