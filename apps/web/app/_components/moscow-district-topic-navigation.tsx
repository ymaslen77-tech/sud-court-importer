import Link from 'next/link';
import type {MoscowOfficialMinimumCourt} from '../lib/moscow-official-minimum';
import {moscowDistrictTopicHref,MOSCOW_DISTRICT_TOPICS} from '../lib/moscow-district-topics';

/** Shared practical navigation; pages are informative and freely reachable.
 * Source links stay available directly at their relevant verified facts.
 */
export function MoscowDistrictTopicNavigation({court}:{court:MoscowOfficialMinimumCourt}){
 return <section className="court-section" id="moscow-court-guide">
  <span className="eyebrow">Всё о вашем суде</span>
  <h2>Подготовьтесь к обращению — от выбора суда до результата дела</h2>
  <p>Здесь собраны восемь подробных разделов именно о «{court.name}».
   Начните с подсудности или сразу выберите нужную тему: порядок обращения,
   поиск дела, госпошлину, обжалование, работу суда и судей.</p>
  <nav className="court-toc" aria-label={'Разделы справочника '+court.name}>
   <strong>Что вам необходимо узнать?</strong>
   {MOSCOW_DISTRICT_TOPICS.map(topic=><Link key={topic.slug}
     href={moscowDistrictTopicHref(court.slug,topic.slug)}>
     {topic.order.toString().padStart(2,'0')}. {topic.title} →</Link>)}
  </nav>
  <p>Рекомендуемая последовательность: <Link href={moscowDistrictTopicHref(court.slug,'jurisdiction')}>проверить подсудность</Link>,
   затем <Link href={moscowDistrictTopicHref(court.slug,'filing')}>подготовить документы</Link>,
   после подачи <Link href={moscowDistrictTopicHref(court.slug,'cases')}>отслеживать дело</Link>,
   при необходимости <Link href={moscowDistrictTopicHref(court.slug,'appeal')}>изучить обжалование</Link>.
   Все разделы доступны сразу, без обязательных промежуточных переходов.</p>
 </section>;
}
