import Link from 'next/link';
import { CourtSearch } from './_components/court-search';

const features = [
  { index: '01', icon: '§', title: 'Суды России', text: 'Реестр судебных органов, адреса, контакты и официальные ссылки.', href: '/courts', tone: 'red' },
  { index: '02', icon: '◈', title: 'Судьи', text: 'Состав судов, назначения и проверенные профессиональные сведения.', href: '/judges', tone: 'neutral' },
  { index: '03', icon: '≡', title: 'Законодательство', text: 'Кодексы, статьи, действующие редакции и история изменений.', href: '/laws', tone: 'neutral' },
  { index: '04', icon: '⌘', title: 'Судебная практика', text: 'Решения и определения судов, поиск по делам и темам.', href: '/practice', tone: 'neutral' },
  { index: '05', icon: '⌖', title: 'Подсудность', text: 'Определение компетентного суда по характеру спора и адресу.', href: '/jurisdiction', tone: 'neutral' },
  { index: '06', icon: '↗', title: 'Документы и сервисы', text: 'Подготовка обращений, инструкции и юридические калькуляторы.', href: '/services', tone: 'neutral' },
];

export default function Home() {
  return <>
    <section className="hero">
      <div className="hero-copy">
        <div className="hero-eyebrow"><span className="eyebrow-line"/> ПРАВОВОЙ ИНФОРМАЦИОННЫЙ ПОРТАЛ</div>
        <h1>Правосудие.<br/><span className="headline-accent">Понятно и по делу.</span></h1>
        <p className="hero-lead">Суды России, судьи, законодательство и судебная практика — в единой информационной системе. Проверенные сведения и понятная навигация.</p>
        <CourtSearch/>
        <div className="hero-disclaimer"><span className="status-indicator"/> Каталог наполняется. Результаты разделены на проверенные и предварительные записи.</div>
      </div>
      <div className="hero-graphic" aria-hidden="true">
        <div className="graphic-label">СУДЕБНАЯ СИСТЕМА РОССИИ <span>01 / 04</span></div>
        <div className="building-graphic"><div className="building-roof"/><div className="building-architrave"/><div className="building-pillars"><i/><i/><i/><i/><i/></div><div className="building-steps"><b/><b/><b/></div></div>
        <div className="graphic-caption"><span>ОТКРЫТЫЕ ДАННЫЕ</span><strong>Единая точка поиска.</strong></div>
      </div>
    </section>
    <section className="trust-strip" aria-label="Принципы проекта">
      <span><b>01</b> Официальные первоисточники</span>
      <span><b>02</b> Прозрачность обновлений</span>
      <span><b>03</b> Единая навигация</span>
    </section>
    <section className="section-wrap" id="catalog">
      <div className="section-intro with-action"><div><span className="eyebrow">ВСЁ В ОДНОМ МЕСТЕ</span><h2>Найдите нужную информацию</h2><p>От поиска суда до понимания порядка обращения — разделы портала связаны между собой.</p></div><Link className="text-link" href="/courts">Все суды <span aria-hidden="true">↗</span></Link></div>
      <div className="feature-grid">
        {features.map((f) => <Link key={f.href} className={'home-feature ' + (f.tone === 'red' ? 'highlight-feature' : '')} href={f.href}>
          <div className="feature-top"><span className="feature-icon" aria-hidden="true">{f.icon}</span><span className="feature-index">{f.index}</span></div>
          <h3>{f.title}</h3><p>{f.text}</p><div className="feature-bottom"><span>Перейти в раздел</span><span className="round-arrow" aria-hidden="true">↗</span></div>
        </Link>)}
      </div>
    </section>
    <section className="journey">
      <div className="journey-heading"><span className="eyebrow">ЛОГИКА СЕРВИСА</span><h2>От вопроса<br/>к конкретному действию</h2><p>Платформа развивается как единый правовой маршрут, а не набор несвязанных справочников.</p><Link className="text-link" href="/guides">О юридических инструкциях ↗</Link></div>
      <div className="journey-steps">
        <div><span>01</span><h3>Найдите суд</h3><p>По названию или региону. В будущем — по правилам подсудности.</p></div>
        <div><span>02</span><h3>Проверьте нормы</h3><p>Изучите применимое законодательство и требования к обращению.</p></div>
        <div><span>03</span><h3>Подготовьте документы</h3><p>Используйте инструкции и сервисы по мере их запуска.</p></div>
      </div>
    </section>
    <section className="data-block">
      <div className="data-stamp" aria-hidden="true"><span>VERIFIED</span><strong>✓</strong><span>SOURCES</span></div>
      <div><span className="eyebrow">ОСНОВА ДОВЕРИЯ</span><h2>Каждый факт должен<br/>иметь источник</h2><p>Контакты, информация о судьях и границах подсудности меняются. Мы строим систему, которая сохраняет происхождение сведений, дату проверки и историю обновлений.</p><Link className="button button-dark" href="/sources">Как проверяются данные <span aria-hidden="true">→</span></Link></div>
    </section>
    <section className="bottom-cta"><div><span className="eyebrow">НАЧНИТЕ С ПОИСКА</span><h2>Ищете конкретный суд?</h2><p>Откройте каталог регионов или воспользуйтесь поиском по названию.</p></div><Link className="button button-red" href="/courts">Перейти к каталогу <span aria-hidden="true">→</span></Link></section>
  </>;
}
