import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {getPushkinskyJudge,judgeProfileHref,pushkinskyJudges,type JudgeAppointmentEvidence} from '../../../lib/judge-dossiers';
import {findRegion} from '../../../lib/regions';

type Props={params:Promise<{region:string;slug:string}>};
export const dynamicParams=false;
export function generateStaticParams(){
 return pushkinskyJudges.map(judge=>({region:judge.region,slug:judge.slug}));
}
function dateRu(iso:string){
 const [y,m,d]=iso.split('-');
 return [d,m,y].join('.');
}
const labels:Record<JudgeAppointmentEvidence['verification'],string>={
 official_court:'Сведения опубликованы на официальном сайте суда',
 legal_text_secondary:'Текст нормативного акта в правовой системе; первоисточник требует повторной проверки',
 secondary_reference:'Вторичный источник; оригинал указа требует проверки'
};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {region,slug}=await params;
 const j=getPushkinskyJudge(slug);
 if(!j||j.region!==region)return {title:'Судья не найден',robots:{index:false,follow:false}};
 return {
   title:j.name+' — должность, назначения, судебная практика и источники',
   description:'Справочное досье судьи: опубликованный состав суда, основания назначения, история должностей и официальные ссылки на дела, если они имеются.',
   alternates:{canonical:judgeProfileHref(j)},
   robots:{index:false,follow:true}
 };
}
export default async function JudgeProfilePage({params}:Props){
 const {region,slug}=await params;
 const judge=getPushkinskyJudge(slug);
 if(!judge||region!==judge.region)notFound();
 const regionName=findRegion(judge.region)?.name??judge.region;
 const courtUrl='/courts/'+judge.region+'/'+judge.courtSlug;
 return <>
  <div className="breadcrumb">
    <Link href="/">Главная</Link><span>/</span><Link href="/judges">Судьи России</Link><span>/</span>
    <Link href={'/courts/'+judge.region}>{regionName}</Link><span>/</span>{judge.name}
  </div>
  <section className="section-hero">
    <span className="kicker">Судья · публичная профессиональная информация</span>
    <h1>{judge.name}</h1>
    <p className="lead">{judge.publishedRole} · <Link href={courtUrl}>{judge.courtName}</Link></p>
    <div className="notice" role="note">
      Основа карточки — официальные сведения о кадровом составе суда. Последняя указанная редакция источника: {judge.rosterPublished}.
      Дата исследования: {judge.observedOn}. Без повторной проверки кадровых актов нельзя гарантировать, что полномочия и должность не изменились.
      Контакты суда не являются личными контактами судьи.
    </div>
    <a className="button button-dark" href={judge.rosterSource} target="_blank" rel="noopener noreferrer">Официальный состав суда ↗</a>
  </section>
  <nav className="court-toc" aria-label="Содержание карточки судьи">
    <strong>Разделы</strong>
    <a href="#judge-identity">Суд и должность</a>
    <a href="#judge-appointments">Назначения</a>
    <a href="#judge-case-evidence">Судебные дела</a>
    <a href="#judge-contacts">Обращение в суд</a>
    <a href="#judge-sources">Источники и актуальность</a>
  </nav>
  <div className="court-identity" id="judge-identity">
    <div><strong>ФИО</strong><span>{judge.name}</span></div>
    <div><strong>Должность по опубликованному составу</strong><span>{judge.publishedRole}</span></div>
    <div><strong>Суд</strong><span><Link href={courtUrl}>{judge.courtName} →</Link></span></div>
    <div><strong>Регион</strong><span>{regionName}</span></div>
    <div><strong>Опубликованное основание назначения</strong><span>{judge.publishedAppointment??'Не установлено'}</span></div>
    <div><strong>Статус проверки</strong><span>Исследовательская справочная карточка; текущие полномочия не аттестованы</span></div>
  </div>
  <section className="court-section" id="judge-appointments">
    <span className="eyebrow">Профессиональная биография по документам</span>
    <h2>Назначения и профессиональная деятельность</h2>
    {judge.historicalAppointments.length?
      <ol className="court-changes">{judge.historicalAppointments.map(item=><li key={item.date+'-'+item.document}>
        <strong>{dateRu(item.date)} — {item.role}</strong>
        <p>{item.court}</p>
        <p>{item.document}</p>
        <small>{labels[item.verification]} · <a href={item.source} target="_blank" rel="noopener noreferrer">Посмотреть источник ↗</a></small>
        {item.note?<p className="court-source">{item.note}</p>:null}
      </li>)}</ol>
      :<div className="empty-state">Подтверждённая последовательность предыдущих назначений пока не собрана.
        Известно основание должности из опубликованного состава суда: {judge.publishedAppointment??'источник требует уточнения'}.
      </div>}
    <p className="court-source">Хронология содержит подтверждённые источником назначения, а не непрерывную трудовую биографию.
      Отсутствующие периоды не заполняются предположениями.</p>
  </section>
  <section className="court-section" id="judge-case-evidence">
    <span className="eyebrow">Судебная практика · только проверяемые примеры</span>
    <h2>Судебные дела с указанным судьёй</h2>
    {judge.reviewedCases.length?<ol className="court-changes">{judge.reviewedCases.map(c=><li key={c.url}>
      <strong>Дело № {c.number}</strong>
      <p>{c.category} · дата рассмотрения {dateRu(c.reviewedOn)}</p>
      <p><a href={c.url} target="_blank" rel="noopener noreferrer">Открыть оригинальную карточку дела на ГАС «Правосудие» ↗</a></p>
      <small>{c.note}</small>
    </li>)}</ol>:<div className="empty-state">
      Индивидуальные судебные дела не добавлены без проверки номера, принадлежности судье и официальной ссылки.
    </div>}
    <p className="court-source">Примеры судебных дел не являются статистикой нагрузки, профессиональным рейтингом,
      оценкой законности решений или исчерпывающим списком всех рассмотренных дел.</p>
    <p><a href="https://pushkino--mo.sudrf.ru/modules.php?name=sud_delo" target="_blank" rel="noopener noreferrer">
      Официальная картотека Пушкинского городского суда ↗</a></p>
  </section>
  <section className="court-section" id="judge-contacts">
    <span className="eyebrow">Официальный порядок обращения</span>
    <h2>Как связаться с судом по делу</h2>
    <p>Процессуальные документы адресуются суду в установленном порядке, а не на личную почту судьи.
      По вопросам делопроизводства, заседаний и документов используйте официальную приёмную и электронные сервисы суда.</p>
    <p><Link href={courtUrl}>Адреса, телефоны отделов и способы подачи документов →</Link></p>
    <p><a href="https://ej.sudrf.ru/" target="_blank" rel="noopener noreferrer">Официальная система электронной подачи ↗</a></p>
  </section>
  <section className="court-section" id="judge-sources">
    <span className="eyebrow">Проверка фактов</span>
    <h2>Официальные и дополнительные источники</h2>
    <ul>
      <li><a href={judge.rosterSource} target="_blank" rel="noopener noreferrer">Официальный опубликованный состав и назначения ↗</a></li>
      {judge.extraSources.map(s=><li key={s.url}>
        <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗</a> — {s.note}
      </li>)}
    </ul>
    <p className="court-source">Текст, биография и судебные акты не воспроизводятся целиком из сторонних каталогов.
      Не публикуются домашние адреса, личные телефоны, сведения о семье, неподтверждённые отзывы или оценки личности.</p>
    <p className="court-source">Карточка закрыта от поисковой индексации до завершения индивидуальной редакционной приёмки.</p>
  </section>
  <section className="callout">
    <div><h2>Судьи Пушкинского городского суда</h2>
      <p>Другие персональные карточки с опубликованной должностью и источником сведений.</p></div>
    <div className="callout-links">
      <Link href="/judges">Каталог судей →</Link>
      <Link href={courtUrl}>Карточка суда →</Link>
    </div>
  </section>
 </>;
}
