import type {CaseTopic} from './moscow-case-topics';

export type SearchCase={number:string;subject:string;disposition?:string;case_type?:string};
export const TOPIC_SEARCH_ALIASES:Record<string,string[]>={
 family:['алимент','развод','расторжен','родител','ребен','детей','детск','опек','брак','супруг','отцовств','усынов'],
 labor:['увол','увольн','сокращ','зарплат','заработн','работодател','трудов','восстановлен','невыплат','отпускн','трудоустройств'],
 housing:['жилищ','жкх','коммунальн','выселен','квартир','собственник квартир','найм жил','перепланиров'],
 property:['долев','застройщик','недвижим','аренд','договор','собственност','стройк','строительств','неосновательн обогащен'],
 consumer:['потребител','товар','услуг','возврат покупк','некачествен','продавец','магазин'],
 credit:['кредит','заем','займ','задолжен','долг','банковск','микрозаем'],
 damage:['дтп','авари','дорожн','ущерб','моральн вред','вред здоров'],
 fraud:['мошенн','159 ук','уголовн мошен'],
 'other-criminal':['уголовн дел','преступлен','приговор'],
 bailiffs:['пристав','фссп','исполнительн производств','бездействи пристав'],
 kas:['кас рф','административн иск','призывн комисси','орган власт'],
 social:['пенсион','пенси','социальн выплат','пособи','соцзащит'],
 other:['прочие гражданск','иное гражданск']
};

const STOPWORDS=new Set(['по','на','в','во','из','за','об','о','от','и','или','для','с','со','как','дело','дела','суд','спор','споры']);
export function normalizeCaseQuery(s:string):string{
 return s.normalize('NFKC').toLocaleLowerCase('ru-RU').replace(/ё/g,'е')
  .replace(/[«»"']/g,'').replace(/\s+/g,' ').trim();
}
function queryTerms(q:string):string[]{
 const normalized=normalizeCaseQuery(q);
 // Preserve case identifiers such as 02-5195/2026 as one token.
 return normalized.split(/[\s,;:!?()[\]]+/).filter(x=>x.length>1&&!STOPWORDS.has(x));
}
function wordMatch(term:string,text:string):boolean{
 const n=normalizeCaseQuery(text);
 if(n.includes(term))return true;
 if(term.length>=6 && !/\d/.test(term) && n.includes(term.slice(0,-2)))return true;
 return false;
}
export function topicMatchesSearch(topic:CaseTopic,query:string):boolean{
 const terms=queryTerms(query);
 if(!terms.length)return false;
 const text=[topic.title,topic.description,topic.law].join(' ');
 const aliases=TOPIC_SEARCH_ALIASES[topic.id]??[];
 return terms.every(term=>
  wordMatch(term,text)||
  aliases.some(alias=>{
   const n=normalizeCaseQuery(alias);
   return (term.length>=4&&(term.startsWith(n)||n.startsWith(term)))||
     (n.includes(' ')&&n.includes(term)&&term.length>=5);
  }));
}
export function caseMatchesSearch(item:SearchCase,query:string):boolean{
 const terms=queryTerms(query);
 if(!terms.length)return false;
 const text=[item.number,item.subject,item.disposition??'',item.case_type??''].join(' ');
 return terms.every(term=>wordMatch(term,text));
}
export function isBroadTopicQuery(topic:CaseTopic,query:string):boolean{
 const q=normalizeCaseQuery(query);
 if(q.length<3)return false;
 const title=normalizeCaseQuery(topic.title);
 return title.includes(q) || q===title;
}
export function collectSearchMatches<D extends SearchCase,O extends SearchCase>(
 topic:CaseTopic,query:string,
 decided:ReadonlyArray<D>,other:ReadonlyArray<O>
){
 const searching=normalizeCaseQuery(query).length>0;
 const matchedTopic=searching&&topicMatchesSearch(topic,query);
 const broadTopic=matchedTopic&&isBroadTopicQuery(topic,query);
 const decidedMatches=searching?decided.filter(c=>caseMatchesSearch(c,query)):Array.from(decided);
 const otherMatches=searching?other.filter(c=>caseMatchesSearch(c,query)):Array.from(other);
 return {
  matchedTopic, broadTopic,
  matched:!searching || matchedTopic || decidedMatches.length>0 || otherMatches.length>0,
  decidedMatches: broadTopic?Array.from(decided):decidedMatches,
  otherMatches: broadTopic?Array.from(other):otherMatches,
  exactDecidedCount:decidedMatches.length,
  exactOtherCount:otherMatches.length,
  allDecidedCount:decided.length,
  allOtherCount:other.length
 };
}
