'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="section-hero"><span className="kicker">Временная ошибка</span><h1>Не удалось загрузить данные</h1><p className="lead">Сервис может быть временно недоступен. Повторите попытку.</p><div className="button-row"><button className="button button-red" onClick={() => reset()}>Повторить</button><Link className="button button-outline" href="/">На главную</Link></div></section>;
}
