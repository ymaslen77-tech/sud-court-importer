import Link from 'next/link';
import type {Metadata} from 'next';
import {moscowCourts} from '../../lib/moscow-courts';
import {regionalArbitrationCourts,regionalArbitrationHref} from '../../lib/regional-arbitration';
export const metadata:Metadata={
 title:'Суды Москвы: 12 подробных справочных карточек, дела и подсудность',
 description:'Районные суды Москвы: индивидуальные адреса, официальные дела, правила подачи документов и проверка территориальной подсудности.',
 robots:{index:false,follow:true},alternates:{canonical:'/courts/moscow'}
};
export default function MoscowDirectory(){
 const courts=moscowCourts();
 const arbitration=regionalArbitrationCourts('moscow');
 return <>
  <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды России</Link><span>/</span>Москва</div>
  <section className="section-hero">
   <span className="kicker">Московская серия · редакционная подготовка</span>
   <h1>Районные суды Москвы</h1>
   <p className="lead">12 индивидуальных досье: адрес, связь с приёмной, какие виды дел рассматриваются, пример дела из официального реестра, проверка подсудности и процессуальные инструкции.</p>
   <div className="notice" role="note">Материалы находятся на исследовательской проверке. Факты из официальных публичных страниц не равны подтверждению их актуальности сегодня. Полные уличные и домовые границы не перенесены.</div>
  </section>
  <section className="section-wrap">
   <h2>Выберите районный суд</h2>
   <div className="results">{courts.map(item=><Link className="result-row" href={'/courts/moscow/'+item.slug} key={item.slug}>
    <span><strong>{item.name}</strong><small>{item.address}</small>
    <small>Официальная выдача: {item.case_examples.map(c=>c.number).join(', ')} · статус: требует редакционной сверки</small></span>
    <span aria-hidden="true">↗</span>
   </Link>)}</div>
  </section>
  {arbitration.length>0?<section className="section-wrap" aria-labelledby="moscow-arbitration">
    <div className="section-intro">
      <span className="eyebrow">Официальный справочный перечень · не проверен повторно</span>
      <h2 id="moscow-arbitration">Арбитражные суды Москвы</h2>
      <p>Названия из перечня арбитражного портала. Территориальная компетенция кассационного округа подтверждается законом;
      остальные контактные сведения и составы могут нуждаться в сверке.</p>
    </div>
    <div className="results">{arbitration.map(item=><Link key={item.slug} className="result-row"
      href={regionalArbitrationHref('moscow',item.slug)}>
      <span><strong>{item.courtName}</strong><small>Справочная запись · требуется сверка</small></span>
      <span aria-hidden="true">↗</span>
    </Link>)}</div>
  </section>:null}
  <section className="callout"><div><h2>Нужно определить суд по адресу?</h2>
   <p>Официальный сервис требует ввод улицы и полного номера дома, корпуса и строения. Без подтверждённой адресной границы мы не назначаем суд автоматически.</p></div>
   <a className="text-link" href="https://mos-gorsud.ru/territorial" target="_blank" rel="noopener noreferrer">Проверить адрес на портале судов Москвы ↗</a>
  </section>
 </>;
}
