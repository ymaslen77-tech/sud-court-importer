export function CourtSearch({ initialValue = '', compact = false }: { initialValue?: string; compact?: boolean }) {
  return <form role="search" className={'search-form' + (compact ? ' search-form-compact' : '')} method="get" action="/search">
    <label className="sr-only" htmlFor={compact ? 'court-query-compact' : 'court-query'}>Название, адрес или код суда</label>
    <span className="search-glass" aria-hidden="true">⌕</span>
    <input
      id={compact ? 'court-query-compact' : 'court-query'}
      name="q"
      type="search"
      defaultValue={initialValue}
      minLength={2}
      maxLength={100}
      placeholder="Название, адрес или код суда (77RS0014)"
      autoComplete="off"
      required
    />
    <button className="button button-red" type="submit">Найти суд <span aria-hidden="true">→</span></button>
  </form>;
}
