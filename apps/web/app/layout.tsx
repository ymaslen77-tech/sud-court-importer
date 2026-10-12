import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from './_components/site-header';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_SITE_URL ?? 'http://localhost:4173'),
  title: { default: 'Суды России — информационный правовой портал', template: '%s | Суды России' },
  description: 'Суды Российской Федерации: поиск, официальные контакты, судьи, подсудность, законодательство и судебная практика.',
  robots: { index: true, follow: true },
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="ru">
    <body>
      <SiteHeader />
      <main id="main-content" className="container page-shell">{children}</main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-about">
            <Link className="footer-brand" href="/">§ СУДЫ РОССИИ</Link>
            <p>Независимый информационно-справочный портал. Не является официальным сайтом судебных органов.</p>
            <small>Данные публикуются после проверки источников.</small>
          </div>
          <div className="footer-links"><strong>Справочник</strong><Link href="/courts">Суды России</Link><Link href="/judges">Судьи</Link><Link href="/jurisdiction">Подсудность</Link></div>
          <div className="footer-links"><strong>Правовая информация</strong><Link href="/laws">Законодательство</Link><Link href="/practice">Судебная практика</Link><Link href="/guides">Инструкции</Link></div>
          <div className="footer-links"><strong>О проекте</strong><Link href="/sources">Источники данных</Link><Link href="/services">Юридические сервисы</Link></div>
        </div>
        <div className="container footer-bottom">© {new Date().getFullYear()} Суды России <span>Информационный проект · Пилотная версия</span></div>
      </footer>
    </body>
  </html>;
}
