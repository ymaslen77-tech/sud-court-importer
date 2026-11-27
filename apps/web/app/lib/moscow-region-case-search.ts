/**
 * Search ONLY the metadata already attached to an official court/case source.
 * No names of litigants, reconstructed decisions, or inferred appeal outcomes.
 */
export type SourceBoundCaseSearchFields={
 number:string;
 firstInstanceNumber:string|null;
 appealNumber:string|null;
 appealDocket:string|null;
 category:string;
 courtName:string;
 judgeName:string|null;
 disposition:string|null;
};
export function normalizeMoscowCaseQuery(value:string):string{
 return value.toLocaleLowerCase('ru').replace(/ё/g,'е')
  .replace(/[‐‑‒–—−]/g,'-')
  .replace(/\s*([/-])\s*/g,'$1')
  .replace(/\s+/g,' ').trim();
}
export function matchesSourceBoundMoscowCase(
 row:SourceBoundCaseSearchFields,query:string
):boolean{
 const q=normalizeMoscowCaseQuery(query);
 if(!q)return true;
 return normalizeMoscowCaseQuery([
  row.number,row.firstInstanceNumber??'',row.appealNumber??'',
  row.appealDocket??'',row.category,row.courtName,
  row.judgeName??'',row.disposition??''
 ].join(' ')).includes(q);
}

/** A past appointment is only an expired date in an older docket snapshot.
 * It does NOT prove the hearing occurred, was postponed, or yielded an order.
 * Optional asOfDate makes this deterministic in source and regression tests.
 */
export function isPastPublishedHearingDate(
 hearingDate:string,asOfDate:string=new Date().toISOString().slice(0,10)
):boolean{
 return /^20\d{2}-\d{2}-\d{2}$/.test(hearingDate)
  &&/^20\d{2}-\d{2}-\d{2}$/.test(asOfDate)
  &&hearingDate<asOfDate;
}
