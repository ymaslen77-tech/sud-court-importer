import Link from 'next/link';

const navigation = [
  { href: '/courts', label: 'Суды' },
  { href: '/jurisdiction', label: 'Подсудность по адресу' },
  { href: '/judges', label: 'Судьи' },
  { href: '/laws', label: 'Законодательство' },
  { href: '/practice', label: 'Судебная практика' },
  { href: '/guides', label: 'Инструкции' },
];

export function SiteHeader() {
  return <header className="site-header">
    <div className="container header-inner">
      <Link className="logo" href="/" aria-label="Суды России — главная">
        <span className="logo-mark" aria-hidden="true">§</span>
        <span className="logo-copy">СУДЫ <span>РОССИИ</span><small>Правовой информационный портал</small></span>
      </Link>
      <nav aria-label="Основная навигация" className="main-nav">
        {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
      </nav>
      <Link href="/search" className="header-search" aria-label="Поиск по судам">Поиск <span aria-hidden="true">↗</span></Link>
    </div>
  </header>;
}
