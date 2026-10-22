/** A shared, auditable completion matrix, reused on every family of court cards.
 * 'source' means there is supporting official material, NOT that it is current.
 * 'pending' is the safe default; never infer correctness from an existing link.
 */
export type CourtDossierCategory =
  'identity'|'contacts'|'staff'|'judges'|'hours'|'jurisdiction'|'magistrates'|
  'cases'|'filing'|'fees'|'map'|'accessibility'|'sources';
const SECTIONS:ReadonlyArray<{key:CourtDossierCategory;title:string}>=[
 {key:'identity',title:'Тип и идентификация суда'},
 {key:'contacts',title:'Адреса и контакты подразделений'},
 {key:'judges',title:'Судьи и акты назначения'},
 {key:'staff',title:'Аппарат и сотрудники'},
 {key:'hours',title:'График работы и приёма'},
 {key:'jurisdiction',title:'Компетенция и территориальная подсудность'},
 {key:'magistrates',title:'Связанные суды и участки'},
 {key:'cases',title:'Дела, акты и заседания'},
 {key:'filing',title:'Инструкция по подаче документов'},
 {key:'fees',title:'Пошлина и реквизиты'},
 {key:'map',title:'Карта и проезд'},
 {key:'accessibility',title:'Доступная среда'},
 {key:'sources',title:'Источники, изменения и дата проверки'}
];

export function CourtDossierCompleteness({withSources=[],title='Полнота сведений о суде'}:
 {withSources?:CourtDossierCategory[];title?:string}){
 const covered=new Set(withSources);
 return <details className="court-section">
  <summary><strong>{title}</strong> — раскрыть перечень обязательных разделов</summary>
  <p>Официальная публикация найдена не для каждого поля. Наличие источника не гарантирует актуальность факта;
  данные с незавершённой проверкой не заменяют официальный сайт суда.</p>
  <div className="court-evidence-grid">{SECTIONS.map(s=><article className="evidence-item" key={s.key}>
   <h3>{s.title}</h3>
   <p>{covered.has(s.key)?'Есть исходные официальные сведения · требуется проверка актуальности':'Материалы ожидают проверки и заполнения'}</p>
  </article>)}</div>
 </details>;
}
