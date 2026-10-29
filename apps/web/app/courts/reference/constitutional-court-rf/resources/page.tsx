import Link from 'next/link';
import type {Metadata} from 'next';
const base='/courts/reference/constitutional-court-rf';
export const metadata:Metadata={
 title:'Конституционный Суд РФ — заседания, статистика, обзоры практики и исполнение решений',
 description:'Проверенные официальные источники КС РФ: рассматриваемые дела, правовые позиции, статистика, обзоры и исполнение постановлений.',
 robots:{index:false,follow:true}
};
const groups=[
 {title:'Рассматриваемые дела и посещение',description:'Официальное расписание и доступ на открытые заседания проверяются перед посещением.',items:[
  {name:'Официальные заседания и рассматриваемые дела',href:'https://www.ksrf.ru/Sessions/'},
  {name:'Правила посещения заседаний',href:'https://www.ksrf.ru/Sessions/visit.php'},
  {name:'Прямая трансляция и видеоархив',href:'https://www.ksrf.ru/'}
 ]},
 {title:'Постановления, определения и правовые позиции',description:'Поиск по номеру, дате, норме и тексту решения выполняется в официальной базе; наш каталог — только проверенная подборка.',items:[
  {name:'Решения Конституционного Суда РФ',href:'https://www.ksrf.ru/Decision/'},
  {name:'Расширенный поиск решений',href:'https://www.ksrf.ru/Decision/extsearch.php'},
  {name:'Правовые позиции по правам и обязанностям',href:'https://www.ksrf.ru/Decision/lp/'},
  {name:'Часто обжалуемые статьи кодексов',href:'https://www.ksrf.ru/Decision/CommonComplaintA.php'}
 ]},
 {title:'Обзоры практики, статистика и исполнение решений',description:'Публикуемые данные имеют собственные периоды наблюдения; цифры предыдущего года не следует выдавать за текущие.',items:[
  {name:'Обзоры практики по годам и кварталам',href:'https://www.ksrf.ru/Decision/generalization/'},
  {name:'Статистика по постановлениям и определениям',href:'https://www.ksrf.ru/Decision/Statisticses.php'},
  {name:'Материалы об исполнении решений',href:'https://www.ksrf.ru/about/Maintenance/'}
 ]}
] as const;
export default function ConstitutionalResources(){
 return <article className="constitutional-reference-page">
  <nav className="breadcrumb" aria-label="Навигация"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды России</Link><span>/</span><Link href={base}>КС РФ</Link><span>/</span>Заседания и официальные материалы</nav>
  <section className="section-hero constitutional-reference-hero">
   <span className="kicker">Официальные источники</span><h1>Заседания, обзоры практики и статистика</h1>
   <p className="lead">Проверенные разделы официального сайта КС РФ, сгруппированные по задачам посетителя: заседания, судебные решения, обзоры и исполнение постановлений.</p>
   <p className="constitutional-small">Данные здесь не обновляются автоматически и не подтверждают время текущего заседания. Ссылки и разделы сверены 29 октября 2026 года; текущие сведения следует проверять в первоисточнике.</p>
  </section>
  {groups.map(group=><section className="constitutional-block" key={group.title}>
    <div className="section-intro"><span className="eyebrow">Первоисточники КС РФ</span><h2>{group.title}</h2><p>{group.description}</p></div>
    <ul className="ksrf-related-decisions">{group.items.map(item=><li key={item.href}><a href={item.href} target="_blank" rel="noopener noreferrer">{item.name} ↗</a></li>)}</ul>
   </section>)}
  <section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Редакционная подборка</span><h2>Разобранные постановления на нашем сайте</h2></div>
   <div className="constitutional-source-grid">
    <Link href={base+'/practice'}>Каталог постановлений →</Link>
    <Link href={base+'/positions'}>Правовые позиции по темам →</Link>
    <Link href={base+'/info/complaint'}>Как обратиться в КС РФ →</Link>
    <Link href={base}>Основная карточка КС РФ →</Link>
   </div>
  </section>
 </article>;
}