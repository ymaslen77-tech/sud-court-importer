import Link from 'next/link';
import type {Metadata} from 'next';
import {AddressJurisdictionSearch} from '../_components/address-jurisdiction-search';

export const metadata:Metadata={
 title:'Поиск суда по адресу и подсудности',
 description:'Подбор судебных органов по региону, населённому пункту и категории спора с обязательной проверкой территориальной подсудности по официальным источникам.',
 robots:{index:false,follow:true}
};
export default function JurisdictionPage(){
 return <>
  <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>
    <Link href="/courts">Каталог судов</Link><span>/</span>Подсудность по адресу</div>
  <section className="section-hero">
   <span className="kicker">Судебная подсудность</span>
   <h1>Какой суд рассматривает ваше дело?</h1>
   <p className="lead">Выберите регион, категорию дела и укажите адрес заявителя, ответчика или спорного имущества. Сервис покажет подходящие для проверки судебные органы.</p>
   <div className="notice" role="note">
    <span className="notice-dot" aria-hidden="true"/>
    Определение суда только по адресу заявителя может быть неправильным: обычно учитывается адрес ответчика, а иногда действуют альтернативная или исключительная подсудность. Уточняйте результат по процессуальному закону.
   </div>
  </section>
  <AddressJurisdictionSearch/>
  <section className="section-wrap" aria-labelledby="jurisdiction-how">
   <div className="section-intro">
    <span className="eyebrow">Что ещё влияет на выбор суда</span><h2 id="jurisdiction-how">Не только адрес</h2>
    <p>Сначала определяются вид судопроизводства и уровень суда: мировой судья, районный суд, суд субъекта, арбитражный или военный суд. Затем применяются территориальные правила и предусмотренные законом исключения.</p>
   </div>
   <div className="court-jurisdiction-guidance">
    <article><h3>Гражданские иски</h3><p>Обычно рассматриваются по адресу ответчика (ст. 28 ГПК РФ). Для отдельных категорий предусмотрен выбор истца (ст. 29).</p></article>
    <article><h3>Защита прав потребителей</h3><p>Закон может позволить предъявить иск по месту жительства или пребывания истца; конкретные требования и подсудность нужно проверить.</p></article>
    <article><h3>Недвижимое имущество</h3><p>Для предусмотренных законом требований действует исключительная территориальная подсудность по месту нахождения имущества (ст. 30 ГПК РФ).</p></article>
    <article><h3>Экономические споры</h3><p>Вопрос компетенции арбитражного суда решается по АПК РФ; адрес регистрации юридического лица не всегда единственный возможный критерий.</p></article>
   </div>
   <p className="court-source">Источник общих правил: ГПК РФ, статьи 23–30, и АПК РФ, статьи 27–38. Чтобы проверить действующую редакцию, воспользуйтесь <a href="https://pravo.gov.ru/" rel="noopener noreferrer" target="_blank">официальным интернет-порталом правовой информации ↗</a>.</p>
  </section>
  <section className="callout">
   <div><span className="eyebrow">Официальный справочник</span><h2>Не нашли подходящий суд?</h2>
    <p>Откройте каталог судебных органов или официальный справочник ГАС «Правосудие». До заполнения проверенных адресных границ сервис не должен выдавать предположение за точную подсудность.</p>
   </div>
   <div className="callout-links"><Link href="/courts">Каталог судов →</Link>
    <a href="https://sudrf.ru/" target="_blank" rel="noopener noreferrer">ГАС «Правосудие» ↗</a></div>
  </section>
 </>;
}
