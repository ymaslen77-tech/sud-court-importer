import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {CONSTITUTIONAL_JUDGES,CONSTITUTIONAL_SECRETARIAT,CONSTITUTIONAL_CONTACTS} from '../../../../../lib/constitutional-court-data';
import {
 CONSTITUTIONAL_REFERENCE_BASE,CONSTITUTIONAL_REFERENCE_TOPICS,getConstitutionalTopic
} from '../../../../../lib/constitutional-reference-library';
import {YandexCourtMap} from '../../../../../_components/yandex-court-map';
import {ConstitutionalComplaintSelfCheck} from '../../../../../_components/constitutional-complaint-selfcheck';

type Props={params:Promise<{topic:string}>};
const back='/courts/reference/constitutional-court-rf';
export const dynamic='force-dynamic';

export function generateStaticParams(){
 return CONSTITUTIONAL_REFERENCE_TOPICS.map(topic=>({topic:topic.slug}));
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const t=getConstitutionalTopic((await params).topic);
 if(!t)return {title:'Раздел не найден',robots:{index:false,follow:false}};
 return {
  title:t.title+' — Суды России',
  description:t.summary,
  robots:{index:false,follow:true}
 };
}
export default async function ConstitutionalReferenceTopic({params}:Props){
 const topic=getConstitutionalTopic((await params).topic);
 if(!topic)notFound();
 return <article className="constitutional-reference-page">
  <nav className="breadcrumb" aria-label="Навигация">
   <Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды России</Link><span>/</span>
   <Link href={back}>Конституционный Суд РФ</Link><span>/</span>{topic.shortTitle}
  </nav>
  <section className="section-hero constitutional-reference-hero">
   <span className="kicker">{topic.eyebrow} · подробная справка</span>
   <h1>{topic.title}</h1>
   <p className="lead">{topic.summary}</p>
   <p className="constitutional-small">Сведения из официальных публикаций и ФКЗ № 1-ФКЗ. Дата редакционной сверки: 27 октября 2026 года. Это независимый справочник, а не официальный сайт суда.</p>
   <div className="court-filter-actions">
    <Link className="button button-outline" href={back}>← К общей карточке суда</Link>
    <a className="text-link" href="#primary-source">Проверить первоисточник ↓</a>
   </div>
  </section>

  {topic.slug==='composition'?<div className="constitutional-stats" aria-label="Законная численность и опубликованный список">
    <div><b>11</b><small>судей предусмотрено законом</small></div>
    <div><b>{CONSTITUTIONAL_JUDGES.length}</b><small>в опубликованном персональном списке</small></div>
    <div><b>1</b><small>председатель</small></div>
    <div><b>1</b><small>заместитель председателя</small></div>
   </div>:null}

  {topic.sections.map((section,i)=><section className="constitutional-block constitutional-library-section" key={section.heading}>
   <div className="section-intro">
    <span className="eyebrow">Раздел {String(i+1).padStart(2,'0')}</span>
    <h2>{section.heading}</h2>
   </div>
   {section.paragraphs.map((p,j)=><p className="constitutional-library-paragraph" key={j}>{p}</p>)}
   {section.points?<ul className="constitutional-library-list">
    {section.points.map(point=><li key={point}>{point}</li>)}
   </ul>:null}
  </section>)}

  {topic.slug==='judges'?<section className="constitutional-block" aria-labelledby="reference-judges-title">
   <div className="section-intro">
    <span className="eyebrow">Опубликованный персональный состав</span>
    <h2 id="reference-judges-title">Председатель, заместитель и все судьи</h2>
    <p>Список из {CONSTITUTIONAL_JUDGES.length} персональных карточек. Для каждой указаны должность, дата назначения, биографические сведения и правовая специализация.</p>
   </div>
   <div className="constitutional-judges">
    {CONSTITUTIONAL_JUDGES.map(j=><section className="constitutional-judge" key={j.id} id={'judge-'+j.id}>
     <div className="constitutional-judge-head">
      {j.portrait?<figure>
       <img src={j.portrait} loading="lazy" referrerPolicy="no-referrer" alt={'Портрет: '+j.name}/>
       <figcaption>{j.portraitCredit}</figcaption>
      </figure>:<div className="constitutional-judge-monogram" role="img" aria-label="Лицензионный портрет пока недоступен">
       {j.name.split(' ').slice(0,2).map(p=>p.charAt(0)).join('')}
      </div>}
      <div><span className="constitutional-role">{j.position}</span><h3>{j.name}</h3>
       <p className="constitutional-date">{j.appointed}</p></div>
     </div>
     <p>{j.background}</p><p><strong>Направления профессиональной работы:</strong> {j.focus}</p>
     <p className="constitutional-small"><a href={j.source} target="_blank" rel="noopener noreferrer">Персональный официальный первоисточник</a></p>
    </section>)}
   </div>
   <p className="constitutional-small">Изображения показаны только при наличии указания об открытой лицензии и её правообладателе. Для остальных карточек оставлены монограммы.</p>
  </section>:null}

  {topic.slug==='reception'?<section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Справочные контакты</span><h2>Контакты, карта и проезд</h2></div>
   <div className="constitutional-contact-grid">
    <div className="constitutional-fact"><h3>Адрес для писем</h3>
     <p>190000, Санкт-Петербург, Сенатская площадь, дом 1</p>
     <p>Общая справочная: <a href="tel:+78124043311">+7 (812) 404-33-11</a></p>
     <p>Электронная почта: <a href="mailto:ksrf@ksrf.ru">ksrf@ksrf.ru</a></p>
    </div>
    <div className="constitutional-fact"><h3>Личный приём</h3>
     <p>{CONSTITUTIONAL_CONTACTS.receptionAddress}</p>
     <p>Приёмная: <a href="tel:+78124043199">+7 (812) 404-31-99</a></p>
     <p>Часы и перерыв указаны выше; рекомендуем уточнить режим непосредственно перед посещением.</p>
    </div>
   </div>
   <YandexCourtMap code="constitutional-reception" name="Приёмная Конституционного Суда России" address={CONSTITUTIONAL_CONTACTS.receptionMapAddress}/>
   <section className="constitutional-fact"><h3>Вход на открытые заседания</h3><p>{CONSTITUTIONAL_CONTACTS.hearingAddress}</p><a href={CONSTITUTIONAL_CONTACTS.hearingSource} target="_blank" rel="noopener noreferrer">Официальные правила посещения</a></section>
  </section>:null}

  {topic.slug==='secretariat'?<section className="constitutional-block">
   <div className="section-intro">
    <span className="eyebrow">Структура Секретариата</span>
    <h2>Подразделения и руководители</h2>
    <p>Должности — по опубликованному официальному перечню на дату сверки. Кадровые сведения могут изменяться.</p>
   </div>
   <div className="constitutional-office">{CONSTITUTIONAL_SECRETARIAT.map(x=><div key={x.section}>
    <h3>{x.section}</h3><strong>{x.person}</strong><p>{x.scope}</p>
   </div>)}</div>
  </section>:null}

  {topic.slug==='payment'?<section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Опубликованные размеры</span><h2>Сводка госпошлины</h2></div>
   <div className="constitutional-fees">
    <div><span>Для физического лица</span><strong>450 ₽</strong></div>
    <div><span>Для организации</span><strong>6 750 ₽</strong></div>
    <p>Размеры воспроизведены из справочных данных на дату сверки, но перед оплатой обязательно проверьте действующую норму, льготы и все банковские реквизиты в официальном первоисточнике ниже. На нашем сайте не принимаются платежи.</p>
   </div>
  </section>:null}

  {topic.slug==='complaint'?<section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Подготовка к отправке</span><h2>Что сделать перед подачей</h2>
    <p>Страница помогает собрать сведения, но не определяет автоматически допустимость вашей конкретной жалобы.</p></div>
   <div className="constitutional-process">
    {[['01','Выделите конкретную нормативную норму','Найдите её точные реквизиты и покажите, как она применена в судебном акте.'],
      ['02','Сверьте процессуальную историю','Проверьте, какие внутригосударственные средства судебной защиты уже использованы и соблюдён ли срок.'],
      ['03','Подготовьте письменное обоснование','Свяжите нарушение конституционного права именно с оспариваемым нормативным положением.'],
      ['04','Соберите приложения','Судебные акты, документы о представителе и пошлине либо ходатайство о льготе.'],
      ['05','Выберите допустимый способ подачи','Лично, почтой или через официальный электронный кабинет с соблюдением требований к подписи.']
    ].map(([num,title,desc])=><div key={num}><span>{num}</span><div><h3>{title}</h3><p>{desc}</p></div></div>)}
   </div>
   <ConstitutionalComplaintSelfCheck/>
   <div className="ksrf-selfcheck-links">
    <a href="https://www.ksrf.ru/Petition/PrimerOfStructure.php" target="_blank" rel="noopener noreferrer">Структура жалобы и приложения ↗</a>
    <a href="https://www.ksrf.ru/Petition/Resolve.php" target="_blank" rel="noopener noreferrer">Предварительное рассмотрение ↗</a>
    <a href="https://www.ksrf.ru/Petition/CurrentStatus.php" target="_blank" rel="noopener noreferrer">Узнать статус обращения ↗</a>
    <a href="https://www.ksrf.ru/about/legalbases/FCLM/Article53.php" target="_blank" rel="noopener noreferrer">Требования к представителю ↗</a>
   </div>
   <div className="court-filter-actions"><Link className="button button-outline" href={CONSTITUTIONAL_REFERENCE_BASE+'/reception'}>Адрес и приёмная →</Link><Link className="button button-outline" href={CONSTITUTIONAL_REFERENCE_BASE+'/payment'}>Пошлина →</Link></div>
  </section>:null}

  {(topic.slug==='complaint'||topic.slug==='payment')?<section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Подготовка документов</span><h2>Генераторы проектов документов</h2><p>Формы работают локально в браузере, требуют проверки фактов и не подают документы в суд автоматически.</p></div>
   <div className="constitutional-source-grid">
    <Link href="/courts/reference/constitutional-court-rf/documents/complaint">Составить проект конституционной жалобы →</Link>
    <Link href="/courts/reference/constitutional-court-rf/documents/fee-relief">Подготовить ходатайство по госпошлине →</Link>
   </div>
  </section>:null}

  <aside className="constitutional-primary-source" id="primary-source">
   <span className="eyebrow">Контроль достоверности</span>
   <h2>Официальный первоисточник</h2>
   <p>Основные сведения приведены внутри нашего сайта в собственном изложении. Для проверки изменений, персональных назначений, юридически значимых действий и реквизитов платежа используйте исходную официальную публикацию.</p>
   <a href={topic.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-link">{topic.sourceName} ↗</a>
   <p className="constitutional-small">Последняя редакционная сверка: 27.10.2026. Сведения могут измениться после этой даты.</p>
  </aside>
  <section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Связанные материалы</span><h2>Решения, правовые позиции и документы</h2><p>Внутренние разделы с официальными первоисточниками и практическими инструментами.</p></div>
   <div className="constitutional-source-grid">
    <Link href="/courts/reference/constitutional-court-rf/practice">Поиск решений Конституционного Суда →</Link>
    <Link href="/courts/reference/constitutional-court-rf/positions">Правовые позиции по темам →</Link>
    <Link href="/courts/reference/constitutional-court-rf/resources">Заседания, обзоры и статистика →</Link>
    <Link href="/courts/reference/constitutional-court-rf/effects">Правовые последствия решений и пересмотр →</Link>
    <Link href="/courts/reference/constitutional-court-rf/documents/complaint">Подготовить проект жалобы →</Link>
   </div>
  </section>
  <section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Другие разделы этого суда</span><h2>Продолжить изучение</h2></div>
   <div className="constitutional-source-grid">
    {CONSTITUTIONAL_REFERENCE_TOPICS.filter(x=>x.slug!==topic.slug).map(x=>
      <Link key={x.slug} href={CONSTITUTIONAL_REFERENCE_BASE+'/'+x.slug}>{x.shortTitle} →</Link>)}
   </div>
   <p className="constitutional-small"><Link href={back}>← Вернуться к полной карточке Конституционного Суда РФ</Link></p>
  </section>
 </article>;
}
