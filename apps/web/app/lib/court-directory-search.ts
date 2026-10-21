export type DirectoryEntry={
 id:string;name:string;kind:string;kindLabel:string;region:string|null;regionName:string|null;
 code:string|null;address:string|null;href:string;sourceUrl:string;status:'research'|'reference'|'names';
};
export type DirectoryFilters={query:string;kind:string;region:string};
export function normalizedCourtSearch(s:string):string{
 return s.normalize('NFKC').toLocaleLowerCase('ru-RU').replace(/ё/g,'е')
 .replace(/[«»"'.,;:()[\]]/g,' ').replace(/\s+/g,' ').trim();
}
function terms(input:string):string[]{
 return normalizedCourtSearch(input).split(' ').filter(Boolean).slice(0,12);
}
export function matchesDirectoryEntry(entry:DirectoryEntry,filters:DirectoryFilters):boolean{
 if(filters.kind&&entry.kind!==filters.kind)return false;
 if(filters.region&&entry.region!==filters.region)return false;
 const q=terms(filters.query);
 if(!q.length)return true;
 const text=normalizedCourtSearch([entry.name,entry.kindLabel,entry.regionName||'',entry.code||'',entry.address||''].join(' '));
 // All words must be present, in any order, but code fragments remain searchable.
 return q.every(word=>text.includes(word) ||
   (word.length>=6&&!/[0-9]/.test(word)&&text.includes(word.slice(0,-1))));
}
export function filterDirectoryEntries(entries:ReadonlyArray<DirectoryEntry>,filters:DirectoryFilters):DirectoryEntry[]{
 return entries.filter(e=>matchesDirectoryEntry(e,filters)).sort((a,b)=>{
  const rank={reference:0,research:1,names:2};
  return rank[a.status]-rank[b.status] || a.name.localeCompare(b.name,'ru') || a.id.localeCompare(b.id);
 });
}
export function paginateDirectoryEntries(entries:ReadonlyArray<DirectoryEntry>,page:number,pageSize=20){
 const size=Math.max(1,Math.min(100,Math.floor(pageSize)||20));
 const total=entries.length,pages=Math.max(1,Math.ceil(total/size));
 const safe=Math.min(pages,Math.max(1,Math.floor(page)||1));
 return {total,pages,page:safe,pageSize:size,items:entries.slice((safe-1)*size,safe*size)};
}
