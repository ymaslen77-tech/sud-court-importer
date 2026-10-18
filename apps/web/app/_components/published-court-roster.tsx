import raw from '../lib/published-roster-snapshots.json';

type Group={title:string;people:[string,string,string][]};
type Snapshot={source_url:string;source_updated_on:string;source_description:string;groups:Group[]};
type Published={court_code:string;observed_on:string;current_authority_confirmed:boolean;snapshot:Snapshot;leadership?:{
 source_url:string;source_updated_on:string;historical_observation:string;supersession_note:string
}};
const rosters=raw as unknown as Record<string,Published>;

function officialSource(value:string):boolean{
 try{
  const url=new URL(value);
  return url.protocol==='https:' && url.port==='' && !url.username && !url.password &&
   (url.hostname==='sudrf.ru'||url.hostname.endsWith('.sudrf.ru'));
 }catch{return false;}
}

export function PublishedCourtRoster({code}:{code:string}){
 const record=rosters[code];
 if(!record||record.court_code!==code||record.current_authority_confirmed!==false||
    !officialSource(record.snapshot.source_url)||
    (record.leadership&&!officialSource(record.leadership.source_url)))return null;
 const count=record.snapshot.groups.reduce((sum,g)=>sum+g.people.length,0);
 return <section id="pilot-roster-publication" className="court-section">
   <span className="eyebrow">Официальная публикация · исторический снимок состава</span>
   <h2>Состав судебных коллегий по опубликованному списку</h2>
   <div className="notice" role="note">
    Эти {count} записи взяты с сайта суда в редакции от {record.snapshot.source_updated_on}.
    Сведения исследованы {record.observed_on}. <strong>Это не подтверждение действующих полномочий сегодня:</strong>
    новые назначения, переводы и прекращение полномочий должны быть проверены по отдельным актам.
   </div>
   {record.leadership?<article className="court-roster-leadership">
     <h3>Руководство — согласно опубликованной редакции</h3>
     <p>{record.leadership.historical_observation}</p>
     <p className="court-source">{record.leadership.supersession_note}</p>
     <p className="court-source">Редакция: {record.leadership.source_updated_on}.
       {' '}<a href={record.leadership.source_url} target="_blank" rel="noopener noreferrer">Официальная публикация ↗</a>
     </p>
   </article>:null}
   <p>{record.snapshot.source_description}</p>
   <div className="court-roster-groups">
     {record.snapshot.groups.map((group,i)=><details key={group.title+'-'+i} className="court-source-details">
       <summary>{group.title} — {group.people.length} записей</summary>
       <div className="court-today-table-wrap">
        <table className="court-today-table">
         <thead><tr><th>ФИО из публикации</th><th>Роль на дату публикации</th><th>Указ из публикации</th></tr></thead>
         <tbody>{group.people.map(([name,role,act],j)=><tr key={name+'-'+j}>
           <td>{name}</td><td>{role}</td><td>{act}</td>
         </tr>)}</tbody>
        </table>
       </div>
     </details>)}
   </div>
   <p className="court-source"><a href={record.snapshot.source_url} target="_blank" rel="noopener noreferrer">
    Первоисточник опубликованного состава ↗</a>. Для проверки действующего полномочия каждого судьи
    требуется актуальный судебный реестр и соответствующий акт о назначении или прекращении полномочий.
   </p>
 </section>;
}
