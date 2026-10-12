import type {Metadata} from 'next';
import Link from 'next/link';
import {MagistrateList} from './registry';
import data from '../../data/official-khabarovsk-magistrates.json';

export const metadata:Metadata={
 title:'Судебные участки мировых судей — Хабаровский край',
 description:'Коды и названия судебных участков мировых судей Хабаровского края из справочника ГАС «Правосудие». Требуют актуальной проверки.',
 robots:{index:false,follow:true}
};
export default function MagistratePilot(){
 return <>
  <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды</Link><span>/</span>Мировые судьи</div>
  <section className="section-hero">
   <span className="kicker">Пилотная региональная выборка</span>
   <h1>Судебные участки мировых судей</h1>
   <p className="lead">Хабаровский край. {data.length} наименований участков с классификационными кодами, опубликованными в ГАС «Правосудие».</p>
   <div className="notice" role="note"><span className="notice-dot" aria-hidden="true"/>
    Сведения приведены как предварительный источник для проверки. Наличие участка не подтверждает действующего судью, актуальный адрес, границы подсудности или приём граждан.
   </div>
  </section>
  <section className="section-wrap">
    <div className="section-intro">
      <span className="eyebrow">Официальный источник</span>
      <h2>Список судебных участков</h2>
      <p>Показаны только наименования и классификационные коды из региональной выдачи. Публикация полноценной карточки потребует проверки органа обеспечения деятельности мировых судей и действующего назначения.</p>
      <a className="text-link" href="https://sudrf.ru/index.php?act=go_ms_search&court_subj=27&id=300&ms_type=ms&searchtype=ms&var=true" target="_blank" rel="noopener noreferrer">Проверить на ГАС «Правосудие» ↗</a>
    </div>
    <MagistrateList items={data.map(x=>({courtCode:x.courtCode,courtName:x.courtName}))}/>
  </section>
  <section className="callout"><div><h2>Другие судебные системы</h2><p>Перейдите к общему каталогу или списку арбитражных судов.</p></div><Link className="button button-outline" href="/courts">Все разделы →</Link></section>
 </>;
}
