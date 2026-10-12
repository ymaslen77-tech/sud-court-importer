import type { Metadata } from 'next';
import Link from 'next/link';
import { ArbitrationNames } from './registry';
import all from '../../data/official-arbitration-list.json';

export const metadata: Metadata = {
  title: 'Арбитражные суды — перечень из официального реестра',
  description: 'Названия арбитражных судов и судебных присутствий из официального перечня. Контакты и реквизиты требуют независимой проверки.',
  robots: { index: false, follow: true },
};
export default function ArbitrationDirectory() {
  const subjects = all.filter(x=>x.courtKind==='arbitration-subject').length;
  const presences = all.filter(x=>x.courtKind==='arbitration-presence').length;
  return <>
    <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>
      <Link href="/courts">Суды России</Link><span>/</span>Арбитражные суды</div>
    <section className="section-hero">
      <span className="kicker">Первичная выборка из официального перечня</span>
      <h1>Арбитражные суды России</h1>
      <p className="lead">Перечень наименований из официального справочника арбитражных судов. Он помогает ориентироваться в судебной системе, но пока не является проверенной базой адресов, компетенции или статуса каждого суда.</p>
      <div className="notice" role="note"><span className="notice-dot" aria-hidden="true"/>
        Названия извлечены для последующей проверки. Список не подтверждает актуальность контактов или полноту всех арбитражных инстанций.</div>
    </section>
    <section className="section-wrap">
      <div className="section-intro">
        <span className="eyebrow">Источник: официальный арбитражный портал</span>
        <h2>{subjects} наименований судов субъектов и {presences} судебных присутствия</h2>
        <p>Отдельные апелляционные и окружные арбитражные суды будут добавляться после проверки их официальных реестров и классификации.</p>
        <p><a className="text-link" href="https://arbitr.ru/?id_doc=20563&id_sec=353" target="_blank" rel="noopener noreferrer">Проверить первоисточник на arbitr.ru ↗</a></p>
      </div>
      <ArbitrationNames items={all.map(x=>({name:x.courtName,kind:x.courtKind}))}/>
    </section>
    <section className="callout">
      <div><span className="eyebrow">Важное различие</span>
        <h2>Справочный список — не юридическая подсудность</h2>
        <p>Выбор компетентного суда зависит от вида спора, процессуальных правил и действующих судебных округов. Проверяйте сведения на официальных сайтах.</p>
      </div>
      <Link className="button button-outline" href="/jurisdiction">О правилах подсудности →</Link>
    </section>
  </>;
}
