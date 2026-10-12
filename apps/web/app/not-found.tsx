import Link from 'next/link';
export default function NotFound() {
  return <section className="section-hero"><span className="kicker">Ошибка 404</span><h1>Страница не найдена</h1><p className="lead">Проверьте адрес страницы или вернитесь к каталогу судов.</p><Link className="button button-red" href="/courts">Перейти к судам →</Link></section>;
}
