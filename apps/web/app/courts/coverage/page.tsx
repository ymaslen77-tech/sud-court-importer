import Link from 'next/link';
import type {Metadata} from 'next';
import {researchRegions,researchCourtsByRegion} from '../../lib/research-courts';
import {regionalArbitrationCourts} from '../../lib/regional-arbitration';
import {ALL_REGIONS} from '../../lib/regions';
import {MOSCOW_OFFICIAL_MINIMUM_COURTS} from '../../lib/moscow-official-minimum';
import {moscowCourts} from '../../lib/moscow-courts';

export const metadata:Metadata={
  title:'Наполненность каталога судов — исследовательские данные',
  description:'Фактическое покрытие предварительных судебных карточек по открытым источникам.',
  robots:{index:false,follow:true},
};

export default function CourtCoveragePage(){
  const regions=researchRegions();
  const arbitration=regionalArbitrationCourts();
  const moscowTotal=MOSCOW_OFFICIAL_MINIMUM_COURTS.length;
  const moscowDistricts=MOSCOW_OFFICIAL_MINIMUM_COURTS.filter(c=>c.kind==='general-district').length;
  const moscowRich=moscowCourts().length;
  const withPreliminaryNames=ALL_REGIONS.filter(region=>regionalArbitrationCourts(region.slug).length>0).length;
  const rows=regions.map(region=>{
    const courts=researchCourtsByRegion(region.slug);
    return {
      ...region,
      addresses:courts.filter(x=>Boolean(x.address)).length,
      phones:courts.filter(x=>Boolean(x.phone)).length,
      emails:courts.filter(x=>Boolean(x.email)).length,
      sites:courts.filter(x=>Boolean(x.website)).length,
    };
  });
  const sum=(key:'count'|'addresses'|'phones'|'emails'|'sites')=>
    rows.reduce((total,row)=>total+row[key],0);
  return <>
    <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>
      <Link href="/courts">Суды России</Link><span>/</span>Наполненность</div>
    <section className="section-hero">
      <span className="kicker">Достоверность данных · открытая статистика</span>
      <h1>Наполненность каталога судов</h1>
      <p className="lead">Здесь показаны фактические поля исследовательских страниц из открытых официальных списков. Это не отчёт о полном числе действующих судов России.</p>
      <div className="notice"><span className="notice-dot" aria-hidden="true"/>
        Предварительные записи не равны редакционно подтверждённым карточкам.
        Регулярный автоматический сбор не включён.
      </div>
    </section>
    <div className="editor-summary" aria-label="Сводка предварительного наполнения">
      <article><strong>{sum('count')}</strong><span>Исследовательских страниц</span></article>
      <article><strong>{regions.length}</strong><span>Регионов с подготовленными списками</span></article>
      <article><strong>{sum('addresses')}</strong><span>Адресов из исходных реестров</span></article>
      <article><strong>0</strong><span>Редакционно одобренных в этом наборе</span></article>
    </div>
    <section className="section-wrap" id="moscow-coverage">
      <div className="section-intro">
        <span className="eyebrow">Отдельная подтверждённая по перечню партия</span>
        <h2>Москва: {moscowTotal} судов в справочнике</h2>
        <p>Из официального московского перечня перенесены {moscowDistricts} районных судов и Московский городской суд. Для {moscowRich} районных судов уже есть отдельные расширенные досье, остальные {moscowDistricts-moscowRich} районных судов имеют справочные карточки с практическими разделами, но ещё требуют персональной сверки.</p>
        <p><Link href="/courts/moscow" className="text-link">Открыть все 36 карточек Москвы →</Link></p>
      </div>
    </section>
    <section className="section-wrap">
      <div className="section-intro">
        <span className="eyebrow">Следующий этап · справочник названий</span>
        <h2>Арбитражные суды по регионам</h2>
        <p>{arbitration.length} исходных наименований распределены по {withPreliminaryNames} регионам.
        Они доступны в региональных каталогах с пометкой «на проверке».
        Это не {arbitration.length} юридически утверждённых карточек: ни адреса, ни составы судей в этой партии не подтверждены.</p>
        <p><Link href="/courts/arbitration" className="text-link">Общий перечень арбитражных судов →</Link></p>
      </div>
    </section>
    <section className="section-wrap">
      <div className="section-intro">
        <span className="eyebrow">Поля источников</span>
        <h2>Срез по регионам</h2>
        <p>Наличие поля отражает информацию в исходной записи, а не доказательство того, что контакт по-прежнему действует.</p>
      </div>
      <div className="coverage-scroll">
        <table className="coverage-table">
          <thead><tr>
            <th scope="col">Регион</th><th scope="col">Записей</th>
            <th scope="col">Адресов</th><th scope="col">Телефонов</th>
            <th scope="col">E-mail</th><th scope="col">Сайтов</th>
          </tr></thead>
          <tbody>
            {rows.map(region=><tr key={region.slug}>
              <th scope="row"><Link href={'/courts/'+region.slug}>{region.name} ↗</Link></th>
              <td>{region.count}</td><td>{region.addresses}</td><td>{region.phones}</td>
              <td>{region.emails}</td><td>{region.sites}</td>
            </tr>)}
            <tr className="coverage-total">
              <th scope="row">Итого</th><td>{sum('count')}</td><td>{sum('addresses')}</td>
              <td>{sum('phones')}</td><td>{sum('emails')}</td><td>{sum('sites')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <section className="callout">
      <div><span className="eyebrow">Что ещё нужно заполнить</span>
        <h2>От исследовательской записи к полноценной странице</h2>
        <p>Нужна текущая проверка каждого адреса и контакта, расписания, границ подсудности, судейских назначений, судебных дел и происхождения фотографий. Только после этого карточка получает статус подтверждённой.</p>
      </div>
      <div className="callout-links"><Link href="/courts">Каталог судов →</Link>
        <Link href="/sources">Методология источников →</Link></div>
    </section>
  </>;
}
