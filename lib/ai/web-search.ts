/**
 * Web Search Helper for Kuya Nicolai AI Assistant
 * Provides fallback real-time DuckDuckGo web search synthesis when offline or using simulated fallback.
 */

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    const cleanQuery = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${cleanQuery}&format=json&no_html=1&skip_disambig=1`,
      {
        headers: { "User-Agent": "ScholarMe-AI/1.0" },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    const results: SearchResult[] = [];

    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        snippet: data.AbstractText,
        url: data.AbstractURL || "https://duckduckgo.com",
      });
    }

    if (Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (topic.Text && topic.FirstURL && results.length < 3) {
          results.push({
            title: topic.Text.slice(0, 60),
            snippet: topic.Text,
            url: topic.FirstURL,
          });
        }
      }
    }

    return results;
  } catch {
    return [];
  }
}
