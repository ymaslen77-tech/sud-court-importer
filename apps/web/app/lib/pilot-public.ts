import matrix from './pilot-review-matrix.json';
import type {ResearchCourt} from './research-courts';

export type PublicPilotRecord=(typeof matrix.records)[number];

/**
 * Public evidence-led listings are NOT manually approved 'verified' court
 * records. Keep source observations, checked dates, and confidence separate.
 */
const records=matrix.records.filter(item=>
 item.publication_state==='pending' &&
 item.editorial_approved===false &&
 item.https_site_url.startsWith('https://') &&
 item.https_site_url.endsWith('.sudrf.ru/') &&
 item.archived_values.address.trim().length>0 &&
 item.individual_source_url.startsWith(item.https_site_url.slice(0,-1))
);
const byCode=new Map(records.map(item=>[item.external_code,item]));

export function pilotPublicRecord(code:string):PublicPilotRecord|null {
 return byCode.get(code)??null;
}
export function pilotPublicCourts():PublicPilotRecord[] {
 return [...records];
}
export function isPilotPublicCourt(court:ResearchCourt):boolean {
 return Boolean(byCode.get(court.code));
}
