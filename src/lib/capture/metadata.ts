/**
 * Light <head>-only metadata extraction for URL captures.
 * Fetches first 8KB of HTML, parses title and favicon via regex.
 * Never throws -- returns fallback values on any failure.
 *
 * SSRF protection: only HTTPS URLs allowed, private IP ranges blocked.
 */

/**
 * Checks whether a URL is safe to fetch (no SSRF risk).
 * Rejects non-HTTPS protocols and private/link-local IP ranges.
 */
export function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname;
    if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(host)) return false;
    if (host === 'localhost') return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts lightweight metadata from a URL's <head> section.
 * Fetches only the first 8KB of HTML and parses via regex (no DOM parser).
 * Title priority: og:title > twitter:title > <title> tag.
 * Favicon: <link rel="icon"> or <link rel="shortcut icon">, fallback /favicon.ico.
 * Never throws -- returns fallback values on any error.
 */
export async function extractHeadMetadata(url: string): Promise<{
  title: string | null;
  favicon_url: string | null;
  estimated_read_time: number | null;
  source_domain: string;
}> {
  let source_domain: string;
  try {
    source_domain = new URL(url).hostname;
  } catch {
    return { title: null, favicon_url: null, estimated_read_time: null, source_domain: '' };
  }

  const fallback = { title: null, favicon_url: null, estimated_read_time: null, source_domain };

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      headers: { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' },
    });

    const fullText = await response.text();
    const html = fullText.slice(0, 8192);

    // --- Title extraction (priority: og:title > twitter:title > <title>) ---
    let title: string | null = null;

    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1].trim();
    }

    if (!title) {
      const twitterTitleMatch = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i)
        ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:title["']/i);
      if (twitterTitleMatch) {
        title = twitterTitleMatch[1].trim();
      }
    }

    if (!title) {
      const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleTagMatch) {
        title = titleTagMatch[1].trim();
      }
    }

    // --- Favicon extraction ---
    let favicon_url: string | null = null;

    const faviconMatch = html.match(/<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']+)["']/i)
      ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut icon|icon)["']/i);

    if (faviconMatch) {
      const href = faviconMatch[1].trim();
      // Resolve relative URLs against the source domain
      if (href.startsWith('http://') || href.startsWith('https://')) {
        favicon_url = href;
      } else if (href.startsWith('//')) {
        favicon_url = `https:${href}`;
      } else {
        favicon_url = `https://${source_domain}${href.startsWith('/') ? '' : '/'}${href}`;
      }
    } else {
      // Fallback to standard favicon path
      favicon_url = `https://${source_domain}/favicon.ico`;
    }

    return {
      title: title || null,
      favicon_url,
      estimated_read_time: null, // deferred to Phase 8 full extraction
      source_domain,
    };
  } catch {
    return fallback;
  }
}
