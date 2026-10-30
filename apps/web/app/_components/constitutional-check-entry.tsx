import Link from 'next/link';

const base='/courts/reference/constitutional-court-rf/check';
export function ConstitutionalCheckEntry(){
 return <section className="ksrf-check-entry" aria-labelledby="ksrf-check-entry-title">
  <div className="ksrf-check-entry-header">
   <span className="eyebrow">Новый формат · Самопроверка КС РФ</span>
   <h2 id="ksrf-check-entry-title">Проверьте жалобу за 3 шага</h2>
   <p>Не длинная анкета внутри карточки суда, а отдельный маршрут с разъяснениями и индивидуальными итогами.</p>
  </div>
  <ol>
   <li><Link href={base}><strong>01 · Что оспариваете</strong><span>Закон, иной нормативный акт, судебное решение или действия органа</span></Link></li>
   <li><Link href={base+'/eligibility'}><strong>02 · Есть ли основания</strong><span>Судебное применение, ваши права, кассация, годичный срок</span></Link></li>
   <li><Link href={base+'/documents'}><strong>03 · Какие документы нужны</strong><span>Структура, приложения, госпошлина, проект жалобы</span></Link></li>
  </ol>
  <div className="ksrf-guide-action">
   <Link className="button button-red" href={base}>Начать самопроверку →</Link>
  </div>
  <details className="ksrf-guide-source"><summary>Официальная основа и первоисточники</summary>
   <p>Маршрут подготовлен в собственном изложении по ФКЗ № 1-ФКЗ и справочным материалам Конституционного Суда; не является официальным алгоритмом.</p>
   <a href="https://www.ksrf.ru/Petition/algo/" target="_blank" rel="noopener noreferrer">Перейти к официальной самопроверке ↗</a>
  </details>
 </section>;
}
