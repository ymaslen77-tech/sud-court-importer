import Link from 'next/link';
import {constitutionalJudgeProfileHref,constitutionalJudgeProfiles,type ConstitutionalJudgeProfile} from '../lib/constitutional-judge-profiles';

const court='/courts/reference/constitutional-court-rf';
const plain='https://www.ksrf.ru/about/judges/';
export function ConstitutionalJudgePersonalPage({judge}:{judge:ConstitutionalJudgeProfile}){
 const peers=constitutionalJudgeProfiles.filter(j=>j.id!==judge.id).slice(0,4);
 return <article className="judge-personal-page">
  <nav className="breadcrumb" aria-label="Навигация">
   <Link href="/">Главная</Link><span>/</span><Link href="/judges">Судьи</Link><span>/</span>
   <Link href={court}>Конституционный Суд РФ</Link><span>/</span>{judge.name}
  </nav>
  <section className="section-hero judge-personal-hero">
   <span className="kicker">Персональное досье · Конституционный Суд РФ</span>
   <div className="judge-personal-intro">
    {judge.portrait?<figure className="judge-personal-photo">
      <img src={judge.portrait} alt={'Портрет: '+judge.name} referrerPolicy="no-referrer"/>
      <figcaption>{judge.portraitCredit} <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0 ↗</a></figcaption>
     </figure>:<div className="judge-personal-initials" role="img" aria-label="Открыто лицензированная фотография не подтверждена">
       {judge.name.split(' ').slice(0,2).map(n=>n[0]).join('')}
     </div>}
    <div>
     <p className="judge-personal-role">{judge.position}</p>
     <h1>{judge.name}</h1>
     <p className="lead">Профессиональная биография, подтверждённые сведения о назначении и первоисточники.</p>
     <div className="court-filter-actions">
      <a className="button button-dark" href={judge.source} target="_blank" rel="noopener noreferrer">Официальная биография ↗</a>
      <Link className="button button-outline" href={court+'#judges'}>Состав КС РФ →</Link>
     </div>
    </div>
   </div>
   <div className="notice" role="note">
    Это независимый справочник, а не официальный сайт КС РФ. Сведения о профессиональном пути и должности собраны по официальным публикациям; дата сверки — 29.10.2026. Перед юридически значимыми действиями проверяйте актуальный состав суда.
   </div>
  </section>
  <nav className="court-toc" aria-label="Содержание персонального досье">
   <strong>Разделы</strong>
   <a href="#judge-details">Статус и назначение</a>
   <a href="#judge-career">Профессиональный путь</a>
   <a href="#judge-research">Образование и научные работы</a>
   <a href="#judge-judicial-practice">Судебная практика</a>
   <a href="#judge-sources">Источники</a>
  </nav>
  <section className="court-section" id="judge-details">
   <span className="eyebrow">Проверяемые кадровые сведения</span>
   <h2>Должность и назначение</h2>
   <div className="court-identity">
    <div><strong>Фамилия, имя, отчество</strong><span>{judge.name}</span></div>
    <div><strong>Должность по официальному списку</strong><span>{judge.position}</span></div>
    <div><strong>Суд</strong><span><Link href={court}>Конституционный Суд Российской Федерации →</Link></span></div>
    <div><strong>Сведения о назначении</strong><span>{judge.appointed}</span></div>
    <div><strong>Источник</strong><span><a href={judge.source} target="_blank" rel="noopener noreferrer">Персональная страница на ksrf.ru ↗</a></span></div>
    <div><strong>Дата сверки</strong><span>29 октября 2026 года</span></div>
   </div>
  </section>
  <section className="court-section" id="judge-career">
   <span className="eyebrow">Профессиональная биография</span>
   <h2>Карьерный путь и назначение</h2>
   <p className="judge-personal-summary">{judge.background}</p>
   <ol className="judge-personal-timeline">{judge.career.map(item=><li key={item.period}>
    <span className="judge-personal-period">{item.period}</span>
    <p>{item.detail}</p>
   </li>)}</ol>
   <p className="court-source">Это выборка официально опубликованных этапов, а не исчерпывающая непрерывная трудовая биография. Сведения о переводах и прекращении полномочий не дополняются предположениями.</p>
  </section>
  <section className="court-section" id="judge-research">
   <span className="eyebrow">Профессиональная подготовка</span>
   <h2>Образование и научная деятельность</h2>
   <div className="feature-grid two-columns">
    <article className="feature-card"><h3>Образование</h3><p>{judge.education}</p></article>
    <article className="feature-card"><h3>Научная и преподавательская деятельность</h3><p>{judge.scholarship}</p></article>
   </div>
   {judge.recognition?<p className="judge-personal-summary"><strong>Опубликованные профессиональные награды и звания:</strong> {judge.recognition}</p>:null}
   <p className="judge-personal-summary"><strong>Профессиональные направления:</strong> {judge.focus}</p>
   <p className="court-source">Научные интересы, опыт и сферы работы не означают распределения конкретных дел между судьями. Не создаём искусственных «специализаций по категориям дел».</p>
  </section>
  <section className="court-section" id="judge-judicial-practice">
   <span className="eyebrow">Судебная практика</span>
   <h2>Решения Конституционного Суда</h2>
   <p>Постановления КС РФ принимаются судом. Указывать конкретного судью как автора решения, докладчика или участника отдельного дела можно только после подтверждения этой роли самим опубликованным актом.</p>
   <p>Такие индивидуальные связи пока не аттестованы; вместо непроверенного перечня персональных дел предлагаем общий официальный каталог постановлений.</p>
   <div className="court-filter-actions">
    <Link className="button button-outline" href={court+'/practice'}>Решения Конституционного Суда →</Link>
    <Link className="button button-outline" href={court+'/positions'}>Правовые позиции →</Link>
   </div>
  </section>
  <section className="court-section" id="judge-sources">
   <span className="eyebrow">Проверка сведений</span>
   <h2>Официальные источники и актуальность</h2>
   <ul className="judge-personal-source-list">
    <li><a href={judge.source} target="_blank" rel="noopener noreferrer">Персональная биография на официальном сайте КС РФ ↗</a> — образование, карьера, назначения и профессиональные сведения.</li>
    <li><a href={plain} target="_blank" rel="noopener noreferrer">Действующий опубликованный список судей КС РФ ↗</a> — персональный состав и должности.</li>
    <li><a href="https://www.ksrf.ru/about/legalbases/FCLM/Article4.php" target="_blank" rel="noopener noreferrer">Статья 4 ФКЗ «О Конституционном Суде Российской Федерации» ↗</a> — состав и порядок назначения.</li>
   </ul>
   <p className="court-source">Не публикуются домашние адреса, личные телефоны, сведения о семье, неподтверждённые отзывы, рейтинги или обвинения. Контакты для обращений приведены в <Link href={court+'#contacts'}>карточке суда</Link>, не в персональном досье.</p>
   <p className="court-source">Страница остаётся закрытой от индексации до подтверждения постоянного основного домена и финальной редакционной приёмки.</p>
  </section>
  <section className="court-section">
   <span className="eyebrow">Связанные персоналии</span>
   <h2>Другие судьи Конституционного Суда</h2>
   <div className="judge-personal-related">
    {peers.map(j=><Link key={j.id} href={constitutionalJudgeProfileHref(j.id)}>
      <strong>{j.name}</strong><small>{j.position}</small><span aria-hidden="true">→</span>
    </Link>)}
   </div>
   <p><Link href="/judges">Все судьи в каталоге →</Link> · <Link href={court+'/info/judges'}>Полный состав КС РФ →</Link></p>
  </section>
 </article>;
}
