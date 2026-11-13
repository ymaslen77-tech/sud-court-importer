import Link from 'next/link';
import type {Metadata} from 'next';
import catalog from '../../../data/moscow-official-dataset-catalog.json';

export const metadata:Metadata={
 title:'Официальные открытые данные судов Москвы — каталог источников | Суды России',
 description:'Справочный каталог 40 наборов официальных открытых данных судебной системы Москвы. Источники и ограничения юридической проверки.',
 robots:{index:false,follow:true},
 alternates:{canonical:'/courts/moscow/sources'}
};

const groups=[
 {role:'first',title:'Первая инстанция',intro:'Наборы о производстве и рассмотрении дел. Доступность конкретных архивов и актуальность записей требуют отдельной проверки.'},
 {role:'appeal',title:'Апелляционные данные',intro:'Официальные реестры апелляционного рассмотрения. Совпадение реквизитов не подтверждает мотивировку судебного акта.'},
 {role:'index',title:'Предметные указатели дел',intro:'Списки и указатели по видам производства; могут включать пересечения с другими наборами.'},
 {role:'context',title:'Справочные и контекстные сведения',intro:'Контакты, расписания и другая справочная информация. Даты и значения меняются.'}
] as const;

export default function MoscowOfficialSources(){
 const available=catalog.datasets.filter(dataset=>dataset.role!=='excluded');
 const excluded=catalog.datasets.length-available.length;
 return <main>
  <nav className="breadcrumb"><Link href="/">Главная</Link><span>/</span>
   <Link href="/courts">Суды России</Link><span>/</span>
   <Link href="/courts/moscow">Москва</Link><span>/</span>Источники данных</nav>
  <section className="section-hero">
   <span className="kicker">Москва · официальный каталог первоисточников</span>
   <h1>Источники судебных данных Москвы</h1>
   <p className="lead">Навигатор по опубликованным наборам данных Московского городского суда. Здесь представлены описания и адреса источников, а не выгруженные материалы конкретных дел.</p>
   <div className="moscow-registry-summary">
    <div><strong>{catalog.datasets.length}</strong><span>Наборов в учтённом каталоге</span></div>
    <div><strong>{available.length}</strong><span>Наборов для отдельной проверки</span></div>
    <div><strong>{excluded}</strong><span>Исключены из автоматической обработки</span></div>
   </div>
   <div className="notice" role="note">Ссылки на паспорта и файлы получены из структуры официального реестра, но их текущая работоспособность и условия повторного использования не подтверждены для каждого набора. Мы не публикуем необезличенные сведения об участниках процессов и не представляем данные реестра как проверенные тексты судебных решений.</div>
   <p><Link href="/courts/moscow" className="button button-red">Перейти к карточкам судов Москвы →</Link></p>
   <nav className="court-toc" aria-label="Разделы источников">
    <strong>Категории</strong>
    {groups.map(group=><a key={group.role} href={'#source-'+group.role}>{group.title}</a>)}
   </nav>
  </section>
  {groups.map(group=><section className="section-wrap" id={'source-'+group.role} key={group.role}>
   <div className="section-intro">
    <span className="eyebrow">Официальный каталог</span>
    <h2>{group.title}</h2>
    <p>{group.intro}</p>
   </div>
   <div className="results">
    {available.filter(dataset=>dataset.role===group.role).map(dataset=><article className="result-row" key={dataset.id}>
     <span>
      <strong>{dataset.title}</strong>
      <small>Идентификатор: {dataset.id}</small>
      <small>Содержимое исходной выгрузки не размещено в публичной базе «Судов России» без проверки источника и правомерности повторного использования.</small>
      <small><a href={dataset.officialPage} target="_blank" rel="noopener noreferrer">Официальная страница набора ↗</a></small>
     </span>
    </article>)}
   </div>
  </section>)}
  <section className="section-wrap">
   <h2>Как мы проверяем и используем сведения</h2>
   <p>Сначала проверяется актуальность паспорта набора и допустимость повторного использования, затем структура, идентификаторы суда и дела, даты, статус публикации и отсутствие запрещённых персональных сведений. Разночтения между официальными публикациями сохраняются для дополнительной проверки, а не устраняются предположениями.</p>
   <p>Полные тексты судебных актов, мотивировки и исходы обжалования не восстанавливаются по неполным метаданным. Отсутствие дела в нашей выборке не означает его отсутствие в судебном реестре.</p>
   <p>Вернитесь к <Link href="/courts/moscow">справочнику районных судов</Link> или откройте <Link href="/courts/moscow/judges">каталог судей Москвы</Link>.</p>
  </section>
 </main>;
}
