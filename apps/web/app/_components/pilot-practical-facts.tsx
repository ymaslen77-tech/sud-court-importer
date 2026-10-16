import raw from '../lib/pilot-practical-source-facts.json';

type PracticalFact={category:string;title:string;description:string};
type PilotFacts={source_url:string;source_stated_updated:string|null;researched_on:string;editorially_verified_current:boolean;items:PracticalFact[]};
const factsByCourt=raw as Record<string,PilotFacts>;

function isOfficial(url:string):boolean{
 try{
  const u=new URL(url);
  return u.protocol==='https:'&&!u.username&&!u.password&&u.port===''&&
   (u.hostname==='sudrf.ru'||u.hostname.endsWith('.sudrf.ru'));
 }catch{return false;}
}

export function PilotPracticalFacts({code}:{code:string}){
 const info=factsByCourt[code];
 if(!info||!isOfficial(info.source_url)||info.editorially_verified_current!==false||
    !info.items?.length)return null;
 return <section className="court-section" id="pilot-useful-facts">
  <span className="eyebrow">Практические сведения по конкретному суду</span>
  <h2>Подразделения, обращения и услуги</h2>
  <p>Здесь приведены сведения из опубликованных разделов именно этого суда, чтобы не искать их
   по разным страницам ведомственного сайта. Даты публикаций не означают подтверждения их
   неизменности на сегодняшний день.</p>
  <div className="court-practical-grid">
   {info.items.map((fact,i)=><article key={fact.title+'-'+i}>
    <span className="eyebrow">{fact.category}</span>
    <h3>{fact.title}</h3>
    <p>{fact.description}</p>
   </article>)}
  </div>
  <p className="court-source">
   Исследовано: {info.researched_on}.
   {info.source_stated_updated?' Дата изменения первоисточника: '+info.source_stated_updated+'.':''}
   {' '}<a href={info.source_url} rel="noopener noreferrer" target="_blank">
     Официальная публикация суда ↗
   </a>.
   Перед обращением уточните часы, контакты и действующие процессуальные правила.
  </p>
 </section>;
}
