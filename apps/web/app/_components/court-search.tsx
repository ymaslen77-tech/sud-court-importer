import {COURT_CATEGORIES} from '../lib/court-taxonomy';
import {ALL_REGIONS,REGIONS_WITH_LOCAL_CARDS} from '../lib/regions';

type Props={initialValue?:string;initialKind?:string;initialRegion?:string;compact?:boolean};
export function CourtSearch({initialValue='',initialKind='',initialRegion='',compact=false}:Props){
  const id=compact?'court-search-compact':'court-search-full';
  return <form role="search" className={'court-advanced-search'+(compact?' court-advanced-compact':'')} method="get" action="/search">
    <div className="court-filter-grid">
      <label htmlFor={id+'-kind'}>Вид суда
        <select id={id+'-kind'} name="kind" defaultValue={initialKind}>
          <option value="">Все виды судов</option>
          {COURT_CATEGORIES.map(c=><option key={c.slug} value={c.slug}>{c.short}</option>)}
        </select>
      </label>
      <label htmlFor={id+'-region'}>Регион
        <select id={id+'-region'} name="region" defaultValue={initialRegion}>
          <option value="">Все регионы России</option>
          {ALL_REGIONS.map(r=><option key={r.slug} value={r.slug}>{r.name}{REGIONS_WITH_LOCAL_CARDS.has(r.slug)?' — есть карточки':' — предварительный список судов'}</option>)}
        </select>
      </label>
      <label className="filter-full" htmlFor={id+'-query'}>Название, адрес суда или классификационный код
        <input id={id+'-query'} name="q" type="search" defaultValue={initialValue}
          minLength={2} maxLength={100} placeholder="Например: Барабинский районный суд или 54RS0012"
          autoComplete="off"/>
      </label>
    </div>
    <div className="court-filter-actions">
      <button className="button button-red" type="submit">Найти суд →</button>
      <a className="text-link" href="/jurisdiction">Найти по адресу и подсудности ↗</a>
    </div>
    <small className="court-form-hint">Можно выбрать только регион или вид суда — вводить название необязательно. В каталоге есть московские справочные карточки и предварительные региональные списки; это ещё не все суды России.</small>
  </form>;
}
