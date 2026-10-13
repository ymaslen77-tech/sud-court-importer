export type Court = {
  id: string;
  name: string;
  slug: string;
  court_type: string;
  address: string | null;
  phone?: string | null;
  email?: string | null;
  official_url?: string | null;
  source_url?: string | null;
  verified_at: string;
  region_slug?: string;
  region_name?: string;
};
export type CourtField = {field_name:string;value:string;verified_at:string;source_url:string};
export type CourtJudge = {full_name:string;position:string;starts_on:string|null;source_url:string};
export type CourtPhoto = {image_path:string;author:string;license_name:string;license_url:string;source_url:string};
export type CourtChange = {changed_field:string;old_value:string|null;new_value:string|null;occurred_at:string};
export type CourtDetail = Court & {
  court_kind:string;
  region_name:string;
  fields:CourtField[];
  coordinates:{latitude:number;longitude:number}|null;
  coordinate_source_url:string|null;
  coordinate_verified_at:string|null;
  judges:CourtJudge[];
  contact_sources:{field_name:string;source_url:string;retrieved_at:string}[];
  photo:CourtPhoto|null;
  changes:CourtChange[];
  cases:{case_uid:string;case_number:string;page_url:string;verified_at:string}[];
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
export async function getCourt(region: string, court: string): Promise<CourtDetail | null> {
  try {
    return await get<CourtDetail>('/api/v1/regions/' + encodeURIComponent(region) + '/courts/' + encodeURIComponent(court));
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') return null;
    throw error;
  }
}
export type CourtCategoryResult = { items: SearchCourt[]; total: number; page: number; pageSize: number };
export async function getCourtsByKind(kind: string, page = 1) {
  return get<CourtCategoryResult>('/api/v1/courts/categories/' + encodeURIComponent(kind) + '?page=' + page);
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
