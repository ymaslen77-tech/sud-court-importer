import Link from 'next/link';
import {moscowDistrictTopicHref} from '../lib/moscow-district-topics';
import {MoscowDistrictAddressLookup} from './moscow-district-address-lookup';
import type {MoscowOfficialMinimumCourt} from '../lib/moscow-official-minimum';

type Props={court:MoscowOfficialMinimumCourt};
const OFFICIAL={
 directory:'https://mos-gorsud.ru/rs',
 jurisdiction:'https://mos-gorsud.ru/territorial',
 cases:'https://mos-gorsud.ru/search',
 account:'https://mos-gorsud.ru/lk',
 faq:'https://mos-gorsud.ru/faq',
 mgs:'https://mos-gorsud.ru/mgs'
} as const;

/** First-stage verified-source guide for district courts without a research dossier.
 * No invented local boundary, judges, direct phone numbers, cases, or fees.
 */
export function MoscowDistrictRegistryGuide({court}:{court:MoscowOfficialMinimumCourt}){
 const items=[
  ['jurisdiction','Подсудность по адресу'],
  ['competence','Какие дела рассматриваются'],
  ['filing','Как подать документы'],
  ['cases','Поиск дел и заседаний'],
  ['appeal','Как обжаловать решение'],
  ['fees','Госпошлина'],
  ['judges','Судьи и отделы'],
  ['faq','Ответы на вопросы']
 ] as const;
 return <>
  <section className="court-section" id="district-guide">
   <span className="eyebrow">Практическое досье · 8 разделов</span>
   <h2>Как обратиться в {court.name}</h2>
   <p>Ниже — краткие справочные сведения; восемь отдельных страниц дают пошаговые инструкции и индивидуальные источники по этому суду. Сведения о судьях, делах и адресных границах указываются только в объёме, подтверждённом официальными публикациями.</p>
   <p>Рекомендуемый путь: <Link href={moscowDistrictTopicHref(court.slug,'jurisdiction')}>проверить подсудность</Link> → <Link href={moscowDistrictTopicHref(court.slug,'competence')}>установить компетенцию</Link> → <Link href={moscowDistrictTopicHref(court.slug,'filing')}>подготовить документы</Link>. Можно сразу перейти к официальному источнику — обязательных промежуточных переходов нет.</p>
   <nav className="court-toc" aria-label="Практические вопросы по суду">
    <strong>Выберите вопрос</strong>
    {items.map(([id,title])=><Link key={id} href={moscowDistrictTopicHref(court.slug,id)}>{title} →</Link>)}
   </nav>
  </section>
  <section className="court-section" id="district-jurisdiction">
   <span className="eyebrow">01 · Территориальная подсудность</span>
   <h2>Относится ли ваш адрес к суду?</h2>
   <p>Наличие адреса суда в районе не означает, что дело подсудно именно этому суду. В официальном поиске введите улицу и номер дома, а также корпус и строение при наличии. Сверьте полученное название суда с «{court.name}». Затем проверьте, относится ли вид спора к компетенции районного суда.</p>
   <ol>
    <li>Выберите улицу в официальном справочнике.</li>
    <li>Укажите дом, корпус и строение при наличии — без номера квартиры и ФИО.</li>
    <li>Сверьте найденный суд с названием в этой карточке; при сомнении уточните в канцелярии.</li>
   </ol>
   <p><a className="text-link" href={OFFICIAL.jurisdiction} rel="noopener noreferrer" target="_blank">Проверить адрес на официальном портале Москвы ↗</a></p>
   <p className="court-source">Наша локальная база не подтверждает полный перечень домов. Результат проверки по адресу не определяет автоматически исключительную или альтернативную подсудность.</p>
   <MoscowDistrictAddressLookup courtName={court.name}/>
  </section>
  <section className="court-section" id="district-competence">
   <span className="eyebrow">02 · Компетенция</span>
   <h2>Какие дела может рассматривать районный суд</h2>
   <div className="court-practical-grid">
    <article><h3>Гражданские споры</h3><p>Иски по семейным, трудовым, жилищным, договорным и иным вопросам — только если спор по ГПК РФ относится к районному, а не мировому, арбитражному или другому суду.</p></article>
    <article><h3>Административные дела</h3><p>Отдельные публично-правовые споры по КАС РФ. Требуется проверить предмет и установленные законом исключения.</p></article>
    <article><h3>Уголовные дела</h3><p>Дела, отнесённые к районному суду по УПК РФ, а также отдельные процессуальные материалы и ходатайства.</p></article>
    <article><h3>Дела по КоАП РФ</h3><p>Определённые дела и жалобы по правилам КоАП РФ. Место совершения правонарушения и специальные нормы могут влиять на подсудность.</p></article>
   </div>
   <p className="court-source">Общие ориентиры: статьи 23–24 ГПК РФ, статьи 17.1–21 КАС РФ, статья 31 УПК РФ, статья 23.1 и глава 30 КоАП РФ. Для конкретного дела проверяйте действующую редакцию.</p>
   <p><Link className="text-link" href="/jurisdiction">Как различить виды подсудности →</Link></p>
  </section>
  <section className="court-section" id="district-filing">
   <span className="eyebrow">03 · Подача документов</span>
   <h2>Как подать иск, жалобу или ходатайство</h2>
   <ol>
    <li>Определите вид процесса и проверьте суд по адресу и предмету обращения.</li>
    <li>Подготовьте документы и приложения по соответствующему процессуальному кодексу.</li>
    <li>Для электронной подачи используйте предусмотренный официальный личный кабинет; обычное письмо на e-mail не является процессуальной подачей.</li>
    <li>Сохраните подтверждение отправки или приёма и проверьте регистрацию обращения.</li>
   </ol>
   <p><a href={OFFICIAL.account} target="_blank" rel="noopener noreferrer" className="text-link">Официальный личный кабинет московских судов ↗</a></p>
   <p className="court-source">Электронная приёмная по обращениям граждан и процессуальная подача документов — разные процедуры.</p>
  </section>
  <section className="court-section" id="district-cases">
   <span className="eyebrow">04 · Делопроизводство</span>
   <h2>Где найти номер дела, заседание и судебный акт</h2>
   <p>На официальном московском портале выберите «{court.name}», затем откройте поиск судебных дел. Используйте номер, год и вид производства. Для участия в заседании ориентируйтесь на официальное судебное извещение и проверяйте возможный перенос.</p>
   <p><a href={OFFICIAL.cases} target="_blank" rel="noopener noreferrer" className="text-link">Официальный поиск судебных дел ↗</a></p>
   <p className="court-source">В этой карточке пока не публикуются неподтверждённые номера дел, результаты или обезличенные «примеры» без первоисточников.</p>
  </section>
  <section className="court-section" id="district-appeal">
   <span className="eyebrow">05 · Обжалование</span>
   <h2>Как обжаловать решение суда</h2>
   <p>В гражданском процессе апелляционным судом для решений районных судов Москвы обычно выступает Московский городской суд. Как правило, апелляционная жалоба подаётся через суд, вынесший решение. Для административных, уголовных дел и КоАП действуют отдельные сроки и процедуры.</p>
   <p><Link href="/courts/moscow/registry/moscow-city-court/info/appeals" className="text-link">Подробно об апелляциях в Московском городском суде →</Link></p>
  </section>
  <section className="court-section" id="district-fees">
   <span className="eyebrow">06 · Платежи</span>
   <h2>Государственная пошлина и реквизиты</h2>
   <p>Сумма зависит от характера заявления, цены иска, статуса заявителя, льгот и действующего НК РФ. Перед оплатой найдите реквизиты именно выбранного суда на его официальной странице: не используйте неподтверждённую квитанцию или депозитные реквизиты вместо госпошлины.</p>
   <p><a className="text-link" href={OFFICIAL.directory} target="_blank" rel="noopener noreferrer">Выбрать суд в официальном каталоге и проверить платежи ↗</a></p>
  </section>
  <section className="court-section" id="district-judges">
   <span className="eyebrow">07 · Подразделения</span>
   <h2>Судьи, канцелярии, архив и ознакомление</h2>
   <p>Для уточнения персонального состава, режима работы конкретного отдела или записи на ознакомление с материалами выберите «{court.name}» на официальном портале. Общий график из справочника не является подтверждением часов каждой канцелярии.</p>
   <p><a className="text-link" href={OFFICIAL.directory} rel="noopener noreferrer" target="_blank">Официальный список московских судов ↗</a></p>
   <p className="court-source">Персональные назначения, биографии и прямые номера телефонов этого суда ещё требуют индивидуальной проверки.</p>
  </section>
  <section className="court-section" id="district-faq">
   <span className="eyebrow">08 · Частые вопросы</span>
   <h2>Полезные ответы о {court.name}</h2>
   <div className="moscow-faq">
    <details><summary>Можно ли определить суд только по названию района?</summary><p>Нет. Требуется точный адрес с номером дома, корпусом и строением при наличии. <a href={OFFICIAL.jurisdiction} target="_blank" rel="noopener noreferrer">Проверить официальный адресный поиск ↗</a></p></details>
    <details><summary>Можно ли отправить иск на электронную почту суда?</summary><p>Нет. Обычный e-mail предназначен для справочной корреспонденции, а процессуальные документы подаются установленными законом способами. <a href={OFFICIAL.faq} target="_blank" rel="noopener noreferrer">Разъяснение официального портала ↗</a></p></details>
    <details><summary>Как узнать, где пройдёт заседание?</summary><p>Сверьте официальную карточку дела и судебное извещение. В случае временного переезда используйте адрес помещения именно для вашего дела.</p></details>
   </div>
  </section>
 </>;
}
