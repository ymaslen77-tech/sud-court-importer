import Link from 'next/link';
import type {MoscowOfficialMinimumCourt} from '../lib/moscow-official-minimum';
import {moscowJudgeRoster,moscowCourtCaseExamples,moscowCourtJudgeVisits,moscowVerifiedOutcome} from '../lib/moscow-district-source-evidence';
import {moscowJudicialSourceBrief} from '../lib/moscow-judicial-source-briefs';
import {moscowJudgeCareerEvidence} from '../lib/moscow-judge-career-evidence';
import {moscowJudgeSlug} from '../lib/moscow-judge-directory';
import {
 type MoscowDistrictIndividual,moscowDistrictOfficialPages
} from '../lib/moscow-district-individual';

type Props={court:MoscowOfficialMinimumCourt;profile:MoscowDistrictIndividual;legacyPhoneShown?:boolean};

export function MoscowDistrictIndividualDossier({court,profile,legacyPhoneShown=false}:Props){
 const official=moscowDistrictOfficialPages(profile);
 const publishedRoster=moscowJudgeRoster(profile.slug);
 const sourceBrief=moscowJudicialSourceBrief(profile.slug);
 const career=moscowJudgeCareerEvidence(profile.slug);
 const docket=moscowCourtCaseExamples(profile.slug);
 const judgeVisits=moscowCourtJudgeVisits(profile.slug);
 const outcome=moscowVerifiedOutcome(profile.slug);
 const judgesLink=publishedRoster?.sourceUrl??official.courtStructure;
 const emailConflict=Boolean(profile.emailAsPublished&&
  profile.emailAsPublished.toLowerCase()!==court.email.toLowerCase());
 const needsArrivalCheck=Boolean(court.visitor_locations?.length);
 return <>
  <section className="court-section" id="district-individual-dossier">
   <span className="eyebrow">Индивидуальное досье · официальная страница суда</span>
   <h2>Контакты, руководство и сервисы: {court.name}</h2>
   <p>Сведения выделены именно для этого суда из индивидуальной публикации на портале Москвы.
    Источник просмотрен {profile.sourceObservedOn}. Публикация имени или телефона на сайте не означает,
    что кадровый статус или соединение подтверждены в момент вашего обращения.</p>
   <dl className="court-facts">
    {!legacyPhoneShown&&profile.expeditionPhone?<div><dt>Экспедиция — номер, опубликованный на странице суда</dt>
     <dd>{profile.expeditionPhone}</dd></div>:null}
    {profile.chairPublished?<div><dt>{profile.chairStatus==='acting_as_published'?'Исполняющий обязанности (как опубликовано)':'Председатель (как опубликовано)'}</dt>
     <dd>{profile.chairPublished.replace(/^И\. о\. /,'')}</dd></div>:<div><dt>Руководство суда</dt>
     <dd>В опубликованных копиях встречаются разные сведения. Текущий статус нельзя подтвердить без дополнительной сверки.</dd></div>}
    <div><dt>Официальная карточка суда</dt><dd>
     <a href={official.overview} target="_blank" rel="noopener noreferrer">{official.overview} ↗</a>
    </dd></div>
    {profile.emailAsPublished?<div><dt>Почта на индивидуальной странице</dt>
      <dd>{profile.emailAsPublished}
       {emailConflict?<p className="court-source">Не совпадает с адресом из сводного каталога ({court.email}). Перед перепиской уточните правильный адрес; почта не является способом процессуальной подачи.</p>:null}
      </dd></div>:null}
    <div><dt>Проверка актуальности</dt><dd>Последняя редакционная сверка первоисточника: {profile.sourceObservedOn}; персональные назначения и режим отделов требуют проверки перед посещением.</dd></div>
   </dl>
   {profile.remarks.length?<div className="notice" role="note">
    <strong>Что особенно важно для этого суда</strong>
    <ul>{profile.remarks.map(note=><li key={note}>{note}</li>)}</ul>
   </div>:null}
   {needsArrivalCheck?<div className="notice" role="note">
    <strong>Временное помещение и почта — не одно и то же.</strong>
    <p>У этого суда в официальных данных есть отдельные адреса посещения.
     Учитывайте назначение подразделения и адрес, указанный в судебном извещении.</p>
    {court.location_notice_url?<a href={court.location_notice_url} target="_blank" rel="noopener noreferrer">Официальное сообщение о перемещении ↗</a>:null}
   </div>:null}
  </section>
  <section className="court-section" id="district-official-services">
   <span className="eyebrow">Официальные сервисы именно этого суда</span>
   <h2>Где получить сведения по делу и подготовить обращение</h2>
   <div className="court-practical-grid">
    <article><h3>Судебные дела и заседания</h3>
     <p>Выберите категорию производства, укажите номер и год дела. Сверьте стадию и дату заседания с судебным извещением.</p>
     <a href={official.cases} target="_blank" rel="noopener noreferrer" className="text-link">Поиск дел {court.name} ↗</a>
    </article>
    <article><h3>Подсудность по адресу</h3>
     <p>Укажите точный адрес с домом, корпусом и строением. Совпадение района без номера дома недостаточно.</p>
     <a href={official.territory} target="_blank" rel="noopener noreferrer" className="text-link">Территориальный сервис суда ↗</a>
    </article>
    <article><h3>Судьи, состав и аппарат</h3>
     <p>Индивидуальный состав судей и работники аппарата относятся к изменяемым сведениям. Не полагайтесь на старые списки.</p>
     <a href={judgesLink} target="_blank" rel="noopener noreferrer" className="text-link">Список судей на официальном сайте ↗</a>
    </article>
    <article><h3>Госпошлина и документы</h3>
     <p>Уточните платёжные реквизиты по виду обращения, формы заявлений, способ подачи и действующий процессуальный порядок.</p>
     <a href={official.stateDuty} target="_blank" rel="noopener noreferrer" className="text-link">Открыть официальный портал суда ↗</a>
    </article>
   </div>
   <p className="court-source">Ссылки направляют на страницы выбранного суда, а не на случайные источники.
    Мы не подменяем официальный реестр решений и не создаём фиктивные примеры судебных актов.</p>
  </section>
  {judgeVisits?<section className="court-section" id="district-judge-visit-addresses">
   <span className="eyebrow">Существенно · временные адреса заседаний</span>
   <h2>Где проходит заседание конкретного судьи</h2>
   <p>По официальному сообщению суда от {judgeVisits.announcementDate} разные гражданские дела принимаются в разных зданиях. Это адреса рассмотрения дел, а не территориальные границы подсудности. Перед поездкой сверяйте место с извещением по вашему делу.</p>
   <ul>{judgeVisits.judgeVisits.map(item=><li key={item.judge}>
    <strong>{item.judge}:</strong> {item.address} — {item.scope}.
   </li>)}</ul>
   <p>{judgeVisits.otherMatters}</p>
   <p><strong>Адрес для почтовой корреспонденции:</strong> {judgeVisits.postalAddress}.</p>
   <a className="text-link" href={judgeVisits.sourceUrl} target="_blank" rel="noopener noreferrer">Официальное сообщение суда о временных адресах ↗</a>
  </section>:null}
  <section className="court-section" id="district-judicial-roster">
   <span className="eyebrow">Судейский корпус · источник и дата</span>
   <h2>Судьи {court.name}: официально опубликованный список</h2>
   {publishedRoster?<>
    <p>В нашу локальную подборку внесены {publishedRoster.judges.length} ФИО из опубликованной страницы суда. Последняя указанная дата обновления первоисточника: {publishedRoster.sourceLastUpdated}.
     Не следует считать подборку обязательно полной или удостоверением действующего кадрового состава на сегодняшний день.
     Для назначения и полномочий конкретного судьи сверяйте указ Президента РФ и свежие сообщения суда.</p>
    <ul>{publishedRoster.judges.map(name=><li key={name}>
     <Link href={'/courts/moscow/judges/'+court.slug+'/'+moscowJudgeSlug(name)}>{name} →</Link>
     {publishedRoster.appointmentNotes.find(p=>p.name===name)?.decree?
       <span> — {publishedRoster.appointmentNotes.find(p=>p.name===name)?.decree}</span>:null}
    </li>)}</ul>
    <p><Link href="/courts/moscow/judges" className="text-link">Выбрать судью и посмотреть конкретные дела →</Link></p>
    <p><a href={publishedRoster.sourceUrl} className="text-link" target="_blank" rel="noopener noreferrer">Проверить список судей и назначения на сайте суда ↗</a></p>
   </>:<>
    <p>Для этого суда пока нет локальной подборки судей, прошедшей индивидуальную сверку с официальным списком.
     Откройте официальный раздел суда. Мы не показываем устаревшие или неполные ФИО как актуальный полный состав.</p>
    <p><a href={judgesLink} className="text-link" target="_blank" rel="noopener noreferrer">Открыть официальную структуру суда ↗</a></p>
   </>}
  </section>
  {career?<section className="court-section" id="district-career-history">
   <span className="eyebrow">Документированная профессиональная история</span>
   <h2>{career.name}: подтверждённые этапы назначения</h2>
   <ol className="ksrf-guide-list">{career.facts.map(item=><li key={item.date}>
    <span>{item.date.slice(0,4)}</span>
    <div><p>{item.description}</p></div>
   </li>)}</ol>
   <p className="court-source">{career.note} Последняя указанная дата обновления страницы: {career.sourceLastUpdated}.</p>
   <a href={career.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-link">Первоисточник: история суда ↗</a>
  </section>:null}
  {sourceBrief?<section className="court-section" id="district-judicial-publications">
   <span className="eyebrow">Проверенные упоминания · не полный состав</span>
   <h2>{sourceBrief.sourceType==='official_appointment_notices'?'Официальные сообщения о назначении судей':'Судьи, упомянутые в официальном перечне помощников'}</h2>
   <p>{sourceBrief.note}</p>
   <ul>{sourceBrief.people.map((item)=><li key={item.name}>
    <Link href={'/courts/moscow/judges/'+court.slug+'/'+moscowJudgeSlug(item.name)}>{item.name} →</Link> — {item.basis}.
    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"> Проверить источник ↗</a>
   </li>)}</ul>
   <p className="court-source">Проверено по официальным публикациям {sourceBrief.recordDate}. Сведения требуют сопоставления с действующими назначениями.</p>
  </section>:null}
  <section className="court-section" id="district-case-evidence">
   <span className="eyebrow">Судебная практика · проверяемые записи</span>
   <h2>Реальные дела суда: источник, категория и ограничения</h2>
   {docket?<div>
    <p>Номера и категории взяты из официального реестра первой инстанции по состоянию на {docket.sourceObservedOn}.
      Это записи о движении дел, а не подтверждённые опубликованные решения; исход споров неизвестен.</p>
    <ul>{docket.cases.map(item=><li key={item.number}>
     <strong>Дело № {item.number}</strong> — {item.category}. {item.sourceStatus}.
    </li>)}</ul>
    <p><a href={docket.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-link">Сверить номер и движение дела на официальном портале ↗</a></p>
   </div>:<p>Индивидуальные номера дел без проверяемого первоисточника не добавлялись.
    Для поиска по этому суду используйте официальный реестр судебных дел.</p>}
   <p><a href={official.cases} target="_blank" rel="noopener noreferrer" className="text-link">Открыть поиск судебных дел →</a></p>
   <p className="court-source">Не публикуем ФИО участников и не создаём искусственные «правовые позиции» из промежуточных записей.
     Судебная практика с мотивировкой будет добавляться только после проверки текста судебного акта.</p>
  </section>
  {outcome?<section className="court-section" id="district-verified-outcome">
   <span className="eyebrow">Результат по официальной карточке дела</span>
   <h2>Дело № {outcome.number}</h2>
   <p>Уникальный идентификатор: {outcome.uin}. Категория: {outcome.category}.</p>
   <p>Дата рассмотрения: {outcome.adjudicatedOn}; результат по реестру: {outcome.publishedOutcome}; вступило в силу: {outcome.effectiveOn}.</p>
   <p className="court-source">{outcome.note}</p>
   <a className="text-link" href={outcome.sourceUrl} target="_blank" rel="noopener noreferrer">Официальная карточка и доступные документы ↗</a>
  </section>:null}
  <section className="court-section" id="district-next-steps">
   <span className="eyebrow">Связанные правовые вопросы</span>
   <h2>Что делать после определения суда</h2>
   <ol className="ksrf-guide-list">
    <li><span>01</span><div><h3>Установить подсудность</h3>
     <p>Проверить адрес и компетенцию районного суда. Исключительная, альтернативная и родовая подсудность оцениваются отдельно.</p>
     <Link href="/jurisdiction" className="text-link">Виды подсудности →</Link></div></li>
    <li><span>02</span><div><h3>Подготовить документы</h3>
     <p>Выбрать процессуальный кодекс, требования, приложения и допустимый способ подачи. Сохранить подтверждение направления.</p>
     <a href={official.overview} target="_blank" rel="noopener noreferrer" className="text-link">Проверить требования на портале суда ↗</a></div></li>
    <li><span>03</span><div><h3>Отслеживать дело и при необходимости обжаловать</h3>
     <p>Уточнить дату заседания по официальной карточке; в случае несогласия с судебным актом проверить сроки и инстанционный маршрут.</p>
     <Link href="/courts/moscow/registry/moscow-city-court/info/appeals" className="text-link">Апелляция в Московский городской суд →</Link></div></li>
   </ol>
  </section>
 </>;
}
