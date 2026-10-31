import Link from 'next/link';
import type {MoscowOfficialMinimumCourt} from '../lib/moscow-official-minimum';
import {
 type MoscowDistrictIndividual,moscowDistrictOfficialPages
} from '../lib/moscow-district-individual';

type Props={court:MoscowOfficialMinimumCourt;profile:MoscowDistrictIndividual;legacyPhoneShown?:boolean};

export function MoscowDistrictIndividualDossier({court,profile,legacyPhoneShown=false}:Props){
 const official=moscowDistrictOfficialPages(profile);
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
     <a href={official.courtStructure} target="_blank" rel="noopener noreferrer" className="text-link">Структура на официальном сайте ↗</a>
    </article>
    <article><h3>Госпошлина и документы</h3>
     <p>Уточните платёжные реквизиты по виду обращения, формы заявлений, способ подачи и действующий процессуальный порядок.</p>
     <a href={official.stateDuty} target="_blank" rel="noopener noreferrer" className="text-link">Открыть официальный портал суда ↗</a>
    </article>
   </div>
   <p className="court-source">Ссылки направляют на страницы выбранного суда, а не на случайные источники.
    Мы не подменяем официальный реестр решений и не создаём фиктивные примеры судебных актов.</p>
  </section>
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
