import registry from '../data/approved-jurisdiction-addresses.json';
import {pilotPublicCourts} from './pilot-public';

export type AddressRole='applicant'|'defendant'|'property'|'other';
export type CaseKind='civil'|'consumer'|'family'|'property'|'economic'|'other';
export type CourtLevel='unknown'|'district'|'magistrate'|'arbitration';

export type ResolverRequest={
 region:string;address:string;role:AddressRole;caseKind:CaseKind;courtLevel:CourtLevel
};
type ApprovedRule={
 region:string;addressKey:string;caseKind:CaseKind;role:AddressRole;
 courtLevel:Exclude<CourtLevel,'unknown'>;courtCode:string;
 sourceUrl:string;reviewedBy:string;reviewedOn:string;validThrough:string;
 status:'approved'
};
export type Resolution=
 |{kind:'blocked';code:string;reason:string;hint:string}
 |{kind:'resolved';courtCode:string;courtName:string;courtUrl:string;sourceUrl:string;reviewedOn:string};

export function normalizeAddress(value:string):string {
 // Intentionally conservative: never drop a house number, body, or street type,
 // never match address substrings or a locality alone.
 const aliases:Record<string,string>={
  'г':'город','гор':'город','ул':'улица','пр':'проспект',
  'просп':'проспект','д':'дом','дома':'дом','пер':'переулок',
  'пос':'поселок','рп':'рабочийпоселок','с':'село','ш':'шоссе'
 };
 return value.normalize('NFKC').toLocaleLowerCase('ru-RU').replace(/ё/g,'е')
   .replace(/[.,;:\\]+/g,' ').replace(/\s+/g,' ').trim().split(' ')
   .map(x=>aliases[x]??x).join(' ');
}
function deny(code:string,reason:string,hint:string):Resolution{
 return {kind:'blocked',code,reason,hint};
}
function completeAddress(value:string):boolean{
 const normalized=normalizeAddress(value);
 const tokens=normalized.split(' ');
 // Exact street+building at minimum; rural address with no street needs separately
 // approved rules and the service refuses to guess in their absence.
 const street=tokens.some(x=>['улица','проспект','переулок','шоссе','бульвар','проезд','набережная','площадь'].includes(x));
 const house=tokens.some((x,i)=>x==='дом' && /^\d+[а-яa-z]?(?:\/\d+[а-яa-z]?)?$/.test(tokens[i+1]||''));
 const town=tokens.some(x=>['город','село','поселок','рабочийпоселок','деревня'].includes(x));
 return town && street && house;
}
function vetted(rule:ApprovedRule):boolean{
 const today=new Date().toISOString().slice(0,10);
 const reg=/^region-(27|54|55)$/;
 if(rule.status!=='approved'||!reg.test(rule.region)||!rule.reviewedBy?.trim())return false;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(rule.reviewedOn)||
    !/^\d{4}-\d{2}-\d{2}$/.test(rule.validThrough)||
    rule.reviewedOn>today||rule.validThrough<today)return false;
 try{
  const u=new URL(rule.sourceUrl);
  if(u.protocol!=='https:'||u.username||u.password||u.port)return false;
  const h=u.hostname.toLowerCase();
  if(!(h==='sudrf.ru'||h.endsWith('.sudrf.ru')||h==='pravo.gov.ru'))return false;
 }catch{return false;}
 if(!rule.addressKey || !completeAddress(rule.addressKey) ||
   normalizeAddress(rule.addressKey)!==rule.addressKey)return false;
 return true;
}
export function resolveAddressJurisdiction(input:ResolverRequest,
    suppliedRules:ReadonlyArray<ApprovedRule>=registry.approvedRules as ApprovedRule[]):Resolution {
 const address=normalizeAddress(input.address);
 if(!/^region-(27|54|55)$/.test(input.region))
  return deny('region_unavailable','Для выбранного региона нет проверенного территориального справочника.',
    'Требуется официальный перечень границ и подтверждение действующих судов.');
 if(address.length<12||address.length>180||!completeAddress(input.address))
  return deny('incomplete_address','Адрес не определён с точностью до населённого пункта, улицы и дома.',
    'Укажите область, населённый пункт, улицу и номер дома. Не вводите ФИО и квартиру.');
 const regionalNames:Record<string,string>={'region-27':'хабаровск','region-54':'новосибирск','region-55':'омск'};
 const markers:Object=regionalNames;
 const normalizedNames=Object.entries(regionalNames).filter(([,n])=>address.includes(n));
 if(normalizedNames.length>0 && !normalizedNames.some(([k])=>k===input.region))
  return deny('region_conflict','Адрес противоречит выбранному региону.',
    'Проверьте субъект Российской Федерации и населённый пункт.');
 if(/(?:^| )квартира(?: |$)|(?:^| )кв(?: |$)/.test(address))
  return deny('personal_address','Указан номер квартиры — для определения суда он не требуется.',
    'Уберите номер квартиры и другие персональные данные.');
 if(input.caseKind==='other')
  return deny('case_type_unknown','Не определён вид обращения, который влияет на родовую подсудность.',
    'Уточните предмет спора и применимые процессуальные правила.');
 if(input.courtLevel==='unknown')
  return deny('court_level_unknown','Не выбран уровень суда — мировой, районный или арбитражный.',
    'Определите родовую подсудность по виду и цене требований и выберите соответствующий уровень.');
 if((input.caseKind==='economic')!==(input.courtLevel==='arbitration'))
  return deny('court_level_conflict','Указанные вид спора и судебная система не согласованы.',
    'Для экономического спора проверьте компетенцию арбитражного суда; для остальных — общего.');
 if(input.caseKind==='property' && input.role!=='property')
  return deny('address_role_conflict','Адрес недвижимости подходит не для любого спора о ней.',
    'Для дел с исключительной подсудностью нужен адрес спорного объекта; уточните характер требования.');
 if((input.caseKind==='civil'||input.caseKind==='family'||input.caseKind==='economic') && input.role!=='defendant')
  return deny('address_role_conflict','Указанный адрес не подтверждён как допустимая привязка для данного обращения.',
    'Для общего правила укажите адрес ответчика; исключения требуют отдельной правовой проверки.');
 if(input.caseKind==='consumer' && !['applicant','defendant'].includes(input.role))
  return deny('address_role_conflict','Для защиты прав потребителей необходимо уточнить законный вариант подсудности.',
    'Выберите адрес истца или ответчика и подтвердите применимость выбора.');
 if(input.role==='other')
  return deny('address_role_unknown','Не определено, почему этот адрес должен определять подсудность.',
    'Выберите адрес ответчика, заявителя или недвижимости в зависимости от законного основания.');
 // Never match the town, court name or court building address against the
 // claimant's address: overlapping districts often share the same locality.
 const relevant=suppliedRules.filter(rule=>rule.region===input.region &&
   rule.caseKind===input.caseKind && rule.role===input.role &&
   rule.courtLevel===input.courtLevel && vetted(rule));
 if(!relevant.length)
  return deny('verified_boundaries_missing','Для этого региона, вида дела и уровня суда не загружены проверенные адресные границы.',
    'Необходимо получить официальный перечень территорий, подтвердить конкретную улицу и дом, источник и дату актуальности. До этого результат заблокирован.');
 const matches=relevant.filter(rule=>rule.addressKey===address);
 if(!matches.length)
  return deny('address_not_covered','Конкретный адрес отсутствует в подтверждённой территориальной базе.',
    'Проверьте номер дома, корпус, написание улицы и официальное распределение территории.');
 const codes=[...new Set(matches.map(rule=>rule.courtCode))];
 if(codes.length!==1)
  return deny('ambiguous_boundaries','Официальные правила дают более одного возможного суда.',
    'Требуется разрешить пересечение территорий и проверить правило вручную; варианты не публикуются.');
 const court=pilotPublicCourts().find(c=>c.external_code===codes[0]);
 if(!court)
  return deny('court_not_published','Подтверждённая территориальная привязка указывает на суд, которого нет в проверяемом каталоге.',
    'Сверьте идентификатор суда и его действующий статус по официальному реестру.');
 // A lone match is not enough if any stale, unreviewed or contradictory rule
 // claims the exact same address. Any such evidence must be resolved first.
 const conflicts=suppliedRules.filter(rule=>rule.region===input.region &&
    normalizeAddress(rule.addressKey||'')===address &&
    rule.caseKind===input.caseKind && rule.role===input.role &&
    rule.courtLevel===input.courtLevel &&
    (!vetted(rule)||rule.courtCode!==court.external_code));
 if(conflicts.length)
  return deny('conflicting_or_stale_evidence','Обнаружена устаревшая или противоречивая запись о подсудности.',
    'До повторного подтверждения источника и устранения конфликта определение суда заблокировано.');
 const rule=matches[0];
 return {kind:'resolved',courtCode:court.external_code,courtName:court.official_header_court_name,
  courtUrl:'/courts/region-'+court.region_code+'/sud-'+court.external_code.toLowerCase(),
  sourceUrl:rule.sourceUrl,reviewedOn:rule.reviewedOn};
}
