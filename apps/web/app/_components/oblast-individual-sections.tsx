import Link from 'next/link';
import type {OfficialReferenceCourt} from '../lib/official-reference-courts';
import {MOSCOW_REGION_CASES} from '../lib/moscow-region-case-index';
import {OBLAST_PORTAL_EVIDENCE,OBLAST_PORTAL_OBSERVED_ON,OBLAST_DIRECTORY_SOURCE} from '../lib/oblast-portal-evidence';
import {CourtDossierCompleteness} from './court-dossier-completeness';

export function OblastIndividualSections({court}:{court:OfficialReferenceCourt}){
 const portal=OBLAST_PORTAL_EVIDENCE[court.slug];
 const rows=MOSCOW_REGION_CASES.filter(c=>c.region==='region-50'&&
  (court.kind==='general-regional'||c.courtSlug===court.slug));
 return <>
  <CourtDossierCompleteness withSources={['identity','contacts','sources',...(rows.length?['cases' as const]:[])]}/>
  <nav className="court-toc" aria-label="Разделы досье">
   <strong>Содержание</strong><a href="#oblast-contacts">Контакты</a><a href="#oblast-cases">Дела и акты</a>
   <a href="#oblast-judges">Судьи</a><a href="#oblast-staff">Аппарат и режим работы</a>
   <a href="#oblast-filing">Подача документов</a><a href="#oblast-jurisdiction">Подсудность</a>
   <a href="#oblast-fees">Госпошлина</a><a href="#oblast-sources">Источники</a>
  </nav>
  <section className="court-section" id="oblast-staff">
   <h2>Аппарат, приём граждан и режим работы</h2>
   {portal?.contactNote?<p>{portal.contactNote} <a href={OBLAST_DIRECTORY_SOURCE}>Источник ↗</a></p>:null}
   <p>Проверенные часы работы подразделений и полный телефонный справочник отдельно не приняты. Уточните режим приёма по опубликованным контактам.</p>
   <a href={portal?.information??court.officialUrl} target="_blank" rel="noopener noreferrer">Официальная информация суда ↗</a>
  </section>
  <section className="court-section" id="oblast-filing">
   <h2>Подача иска, заявления или жалобы</h2>
   <p>Перед подачей проверьте компетенцию, требования к документу и приложению, способ подачи и госпошлину. Обычная электронная почта не заменяет процессуальную подачу. {portal?.note}</p>
   <p><a href="https://ej.sudrf.ru/" target="_blank" rel="noopener noreferrer">Официальный сервис электронной подачи ↗</a></p>
  </section>
  <section className="court-section" id="oblast-jurisdiction">
   <h2>Территориальная подсудность и мировые участки</h2>
   <p>Точный перечень улиц, домов и участков для этого суда пока не принят. Не определяйте подсудность по одному названию населённого пункта.</p>
   <Link href="/jurisdiction">Проверить правила подсудности →</Link>
  </section>
  <section className="court-section" id="oblast-fees">
   <h2>Госпошлина, реквизиты и обжалование</h2>
   <p>Не копируем непроверенные платёжные реквизиты или сроки. Сверьте вид обращения, применимый процессуальный порядок и действующие реквизиты непосредственно на официальном ресурсе.</p>
   <a href={portal?.information??court.officialUrl} target="_blank" rel="noopener noreferrer">Сведения о порядке обращения ↗</a>
  </section>
  <section className="court-section" id="oblast-local-cases">
   <h2>Связанные записи судебных дел · {rows.length}</h2>
   <p>Это только локально отобранные метаданные апелляций Московского областного суда, а не все дела и не утверждённые решения.</p>
   {rows.length?<div className="results">{rows.map(c=><article className="result-row" key={c.id}>
    <span><strong>Апелляция № {c.number}</strong><small>Первая инстанция: {c.courtName}, № {c.firstInstanceNumber}</small>
    <small>{c.category} · результат пересмотра не проверен</small>
    <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">Официальная карточка ↗</a></span>
   </article>)}</div>:<p>В локальной подборке пока нет связанных записей. Это не означает отсутствия дел в суде.</p>}
  </section>
  <section className="court-section" id="oblast-sources">
   <h2>Источники и границы проверки</h2>
   <p><a href={court.sourceUrl}>Исходный официальный справочник ↗</a> · дата прежнего изучения {court.observedOn}.</p>
   {portal?<p><a href={portal.url}>Опубликованный раздел делопроизводства ↗</a> · адрес найден в индексированной официальной публикации {OBLAST_PORTAL_OBSERVED_ON}; доступность в текущий момент не проверена.</p>:<p>Прямой адрес раздела делопроизводства ещё не подтверждён.</p>}
   <p>Полный состав судей, тексты актов, актуальное расписание, точные границы подсудности и доступность зданий требуют индивидуальной сверки. Карта по адресу не подтверждает вход или условия доступности.</p>
  </section>
 </>;
}
