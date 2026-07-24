export interface TLEEntry {
  name: string;
  line1: string;
  line2: string;
}

const CELESTRAK_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle';
const CACHE_KEY = 'orbit-watch-tle-cache-v1';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // TLEs drift slowly — a couple hours is plenty fresh

/**
 * Parses a Celestrak-style TLE text dump. Tolerates both 2-line (bare orbital elements) and
 * 3-line (name + elements) formats, since we can't confirm from here which one a given
 * endpoint/query actually returns — any line pair starting with "1 "/"2 " is treated as one
 * satellite, with the preceding non-TLE line (if present) used as its name.
 */
function parseTleText(text: string): TLEEntry[] {
  const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l.length > 0);
  const entries: TLEEntry[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line1 = lines[i];
    const line2 = lines[i + 1];
    if (!line1.startsWith('1 ') || !line2?.startsWith('2 ')) continue;
    const prev = lines[i - 1];
    const name = prev && !prev.startsWith('1 ') && !prev.startsWith('2 ') ? prev.trim() : `SAT ${line1.substring(2, 7).trim()}`;
    entries.push({ name, line1, line2 });
    i += 1; // skip line2, already consumed
  }
  return entries;
}

interface CacheShape {
  fetchedAt: number;
  entries: TLEEntry[];
}

function loadCache(): TLEEntry[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheShape;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    if (!Array.isArray(parsed.entries) || parsed.entries.length === 0) return null;
    return parsed.entries;
  } catch {
    return null;
  }
}

function saveCache(entries: TLEEntry[]): void {
  try {
    const payload: CacheShape = { fetchedAt: Date.now(), entries };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Storage full/unavailable (e.g. private browsing) — caching is an optimization, not required.
  }
}

/** Fetches the full active-satellite catalog from Celestrak in one request, with local caching. */
export async function fetchBulkTles(): Promise<TLEEntry[]> {
  const cached = loadCache();
  if (cached) return cached;

  const resp = await fetch(CELESTRAK_URL);
  if (!resp.ok) throw new Error(`Celestrak request failed (${resp.status})`);
  const text = await resp.text();
  const entries = parseTleText(text);
  if (entries.length === 0) throw new Error('No satellites parsed from Celestrak response');

  saveCache(entries);
  return entries;
}
