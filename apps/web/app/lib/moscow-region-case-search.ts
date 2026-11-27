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
