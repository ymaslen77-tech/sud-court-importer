import imported from '../data/moscow-territorial-approved.json';
import {moscowCourts} from './moscow-courts';

export type TerritoryInput={
 street:string;house:string;corpus:string;structure:string;currentCourtSlug:string
};
export type TerritoryRule={
 street:string;house:string;corpus:string;structure:string;
 courtSlug:string;courtName:string;courtOfficialUrl:string;
 sourceUrl:string;reviewedOn:string;validThrough:string;
 reviewedBy:string;status:'approved'|'pending'|'rejected'
};
type TerritoryResolved={courtSlug:string;courtName:string;courtUrl:string;external:boolean;sourceUrl:string;reviewedOn:string};
export type TerritoryResult=
 |({kind:'match'} & TerritoryResolved)
 |({kind:'other'} & TerritoryResolved)
 |{kind:'unknown';reason:string;code:'invalid_address'|'personal_data'|'not_covered'|'conflicting_records'|'stale_or_unapproved'};

const streetTypes=['улица','ул','ул.','переулок','пер','пер.','проспект','пр-т','проезд','площадь','пл','пл.','бульвар','бул','набережная','наб','шоссе','ш','аллея','тупик','линия'];
const knownTypes=new Set(streetTypes);
function plain(value:string):string {
 return value.normalize('NFKC').toLocaleLowerCase('ru-RU').replace(/ё/g,'е')
 .replace(/[^а-яa-z0-9/\s.-]/g,' ').replace(/\s+/g,' ').trim();
}
const streetAliases:Record<string,string>={'ул':'улица','ул.':'улица','пер':'переулок','пер.':'переулок','пр-т':'проспект','пл':'площадь','пл.':'площадь','бул':'бульвар','наб':'набережная','ш':'шоссе'};
export function normalizeMoscowStreet(value:string):string{
 let s=plain(value).replace(/\b(город|г\.)\s+москва\b/g,'').replace(/\s+/g,' ').trim();
 const parts=s.split(' ');
 if(parts.length>0&&knownTypes.has(parts[0]))parts[0]=streetAliases[parts[0]]??parts[0];
 if(parts.length>1&&knownTypes.has(parts[parts.length-1]))parts[parts.length-1]=streetAliases[parts[parts.length-1]]??parts[parts.length-1];
 return parts.join(' ');
}
function house(value:string):string {
 return plain(value).replace(/\s/g,'').replace(/^(?:д|д\.|дом)/,'');
}
function annex(value:string):string {
 return plain(value).replace(/\s/g,'').replace(/^(?:к|корпус|корп|стр|строение)/,'');
}
function validStreet(value:string):boolean {
 return value.length>=4&&value.length<=120&&/[а-я]/.test(value)&&
 !/(?:^|\s)(?:кв|квартира|помещение|офис|этаж)(?:\s|$)/i.test(value);
}
function validHouse(s:string):boolean{return /^\d{1,5}[а-яa-z]?(?:\/\d{1,5}[а-яa-z]?)?$/.test(s);}
function validAnnex(s:string):boolean{return s===''||/^\d{1,5}[а-яa-z]?$/.test(s);}
function officialUrl(raw:string,expectedCourtSlug:string):boolean{
 try{
  const u=new URL(raw);
  return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&
    ['mos-gorsud.ru','www.mos-gorsud.ru','m.mos-gorsud.ru'].includes(u.hostname)&&
    (u.pathname==='/territorial'||u.pathname.startsWith('/rs/'+expectedCourtSlug+'/'));
 }catch{return false;}
}
function validRule(rule:TerritoryRule,now:string):boolean{
 if(rule.status!=='approved'||!rule.reviewedBy?.trim()||!/^[-a-z]+$/.test(rule.courtSlug)
  ||!/^\d{4}-\d{2}-\d{2}$/.test(rule.reviewedOn)
  ||!/^\d{4}-\d{2}-\d{2}$/.test(rule.validThrough)
  ||rule.reviewedOn>now||rule.validThrough<now)return false;
 const street=normalizeMoscowStreet(rule.street),h=house(rule.house),corpus=annex(rule.corpus),structure=annex(rule.structure);
 if(!validStreet(street)||!validHouse(h)||!validAnnex(corpus)||!validAnnex(structure))return false;
 if(!officialUrl(rule.sourceUrl,rule.courtSlug))return false;
 try{
  const u=new URL(rule.courtOfficialUrl);
  return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&
    ['mos-gorsud.ru','www.mos-gorsud.ru','m.mos-gorsud.ru'].includes(u.hostname)&&
    u.pathname==='/rs/'+rule.courtSlug;
 }catch{return false;}
}
function key(street:string,h:string,c:string,s:string){return [street,h,c,s].join('|');}
function ruleKey(r:TerritoryRule){return key(normalizeMoscowStreet(r.street),house(r.house),annex(r.corpus),annex(r.structure));}
export function approvedMoscowStreets(rules:ReadonlyArray<TerritoryRule>=imported.approvedRules as TerritoryRule[]):string[]{
 // Only verified street names are suggested, and the original rule must be current.
 const today=new Date().toISOString().slice(0,10);
 return [...new Set(rules.filter(r=>validRule(r,today)).map(r=>r.street))]
    .sort((a,b)=>a.localeCompare(b,'ru'));
}
export function resolveMoscowTerritory(
 input:TerritoryInput,
 rules:ReadonlyArray<TerritoryRule>=imported.approvedRules as TerritoryRule[],
 today:string=new Date().toISOString().slice(0,10)
):TerritoryResult{
 const st=normalizeMoscowStreet(input.street),h=house(input.house),c=annex(input.corpus),s=annex(input.structure);
 if(/(?:^|[\s,;])(?:кв\.?|квартира|офис|помещение)(?:$|[\s,;])/i.test([input.street,input.house,input.corpus,input.structure].join(' ')))
  return {kind:'unknown',code:'personal_data',reason:'Номер квартиры и другие персональные сведения для проверки не нужны.'};
 if([input.street,input.house,input.corpus,input.structure].some(v=>v.length>140)||
   !validStreet(st)||!validHouse(h)||!validAnnex(c)||!validAnnex(s)){
  return {kind:'unknown',code:'invalid_address',reason:'Введите точную улицу и номер дома, а при наличии — корпус и строение.'};
 }

 const matches=rules.filter(r=>ruleKey(r)===key(st,h,c,s));
 if(!matches.length)return {kind:'unknown',code:'not_covered',reason:'Адрес пока отсутствует в подтверждённом справочнике подсудности. Это не означает, что он не относится к данному суду.'};
 if(matches.some(r=>!validRule(r,today)))return {kind:'unknown',code:'stale_or_unapproved',reason:'Есть непроверенное или устаревшее правило для этого адреса. Надёжное соответствие не подтверждено.'};
 const slugs=[...new Set(matches.map(r=>r.courtSlug))];
 if(slugs.length!==1)return {kind:'unknown',code:'conflicting_records',reason:'Для адреса найдены противоречащие друг другу соответствия судов. Требуется сверка.'};
 const rule=matches[0];
 const current=moscowCourts().find(c=>c.slug===rule.courtSlug);
 const url=current?'/courts/moscow/'+current.slug:rule.courtOfficialUrl;
 return {kind:rule.courtSlug===input.currentCourtSlug?'match':'other',courtSlug:rule.courtSlug,
   courtName:rule.courtName,courtUrl:url,external:!current,
   sourceUrl:rule.sourceUrl,reviewedOn:rule.reviewedOn};
}
