export type Court = {
  id: string;
  name: string;
  slug: string;
  court_type: string;
  address: string | null;
  phone?: string | null;
  email?: string | null;
  official_url?: string | null;
  verified_at: string;
  region_slug?: string;
  region_name?: string;
};
export type SearchCourt = Court & { region_slug: string; region_name: string };
export type Region = { slug: string; name: string; court_count: number };

const api = process.env.API_URL ?? 'http://localhost:4000';
async function get<T>(path: string): Promise<T> {
  const response = await fetch(api + path, { next: { revalidate: 1800 } });
  if (response.status === 404) throw new Error('NOT_FOUND');
  if (!response.ok) throw new Error('UPSTREAM_UNAVAILABLE');
  return await response.json() as T;
}
export async function getRegions() {
  return get<Region[]>('/api/v1/regions');
}
export async function getRegionCourts(region: string) {
  return get<Court[]>('/api/v1/regions/' + encodeURIComponent(region) + '/courts');
}
export async function getCourt(region: string, court: string): Promise<Court | null> {
  try {
    return await get<Court>('/api/v1/regions/' + encodeURIComponent(region) + '/courts/' + encodeURIComponent(court));
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') return null;
    throw error;
  }
}
export async function searchCourts(q: string) {
  return get<SearchCourt[]>('/api/v1/courts/search?q=' + encodeURIComponent(q));
}
export function safeOfficialUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch { return null; }
}
