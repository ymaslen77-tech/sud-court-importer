import Link from 'next/link';
import type {RegionalArbitrationName} from '../lib/regional-arbitration';
import {findRegion} from '../lib/regions';

const official='https://fassko.arbitr.ru';
const sources=[
  ['Официальный сайт суда',official],
  ['Справочник судов Краснодарского края','https://kavkazsky--krd.sudrf.ru/modules.php?name=sud'],
  ['Официальный перечень арбитражных судов','https://arbitr.ru/materials/as'],
  ['Картотека арбитражных дел','https://kad.arbitr.ru/'],
  ['Электронная подача «Мой арбитр»','https://my.arbitr.ru/'],
  ['Судебные акты арбитражных судов','https://ras.arbitr.ru/'],
  ['Калькулятор государственной пошлины','https://my.arbitr.ru/'],
] as const;

const regions=['Адыгея','Дагестан','Ингушетия','Кабардино-Балкария','Калмыкия',
'Карачаево-Черкесия','Северная Осетия — Алания','Чечня','Краснодарский край',
'Ставропольский край','Ростовская область'];

export function NorthCaucasusCourtProfile({court,region}:{court:RegionalArbitrationName;region:string}){
  const regionName=findRegion(region)?.name??'Субъект Российской Федерации';
  const encoded=encodeURIComponent('Краснодар, Рашпилевская улица, 4');
  return <>
    <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>
    <Link href="/courts">Суды России</Link><span>/</span>
    <Link href={'/courts/'+region}>{regionName}</Link><span>/</span>{court.courtName}</div>
    <section className="section-hero">
      <span className="kicker">Арбитражный суд округа · кассационная инстанция</span>
      <h1>{court.courtName}</h1>
      <p className="lead">Рассматривает кассационные жалобы на судебные акты арбитражных судов Северо-Кавказского судебного округа, в том числе Кабардино-Балкарской Республики.</p>
      <div className="notice" role="note">Местонахождение — Краснодар. Выбранный регион «{regionName}» обозначает территорию судебной компетенции, а не физический адрес. Состав судей, расписание заседаний и реквизиты платежа необходимо сверять по действующим официальным данным.</div>
    </section>
    <div className="court-identity">
      <div><strong>Вид суда</strong><span>Арбитражный суд округа (кассация)</span></div>
      <div><strong>Местонахождение</strong><span>Краснодар, Краснодарский край</span></div>
      <div><strong>Судебный округ</strong><span>Северо-Кавказский</span></div>
      <div><strong>Основание полномочий</strong><span>Статья 24 ФКЗ от 28.04.1995 № 1-ФКЗ</span></div>
    </div>
    <div className="court-detail-grid">
      <section className="detail-card">
        <span className="eyebrow">Официальные справочные сведения</span>
        <h2>Адрес и контакты суда</h2>
        <dl className="court-facts">
          <div><dt>Почтовый адрес</dt><dd>350063, Краснодарский край, г. Краснодар, ул. Рашпилевская, д. 4</dd></div>
          <div><dt>Основной телефон</dt><dd><a href="tel:+78612013400">+7 (861) 201-34-00</a></dd></div>
          <div><dt>Справочная</dt><dd><a href="tel:+78612013405">+7 (861) 201-34-05</a> — номер из справочника, уточняйте доступность</dd></div>
          <div><dt>Электронная почта</dt><dd><a href="mailto:info@fassko.arbitr.ru">info@fassko.arbitr.ru</a></dd></div>
          <div><dt>Официальный сайт</dt><dd><a href={official} target="_blank" rel="noopener noreferrer">fassko.arbitr.ru ↗</a></dd></div>
        </dl>
        <p className="court-source">Адрес, общий телефон и почта сверены со справочником судов на официальном портале ГАС «Правосудие». Справочный номер дополнительно встречается в независимом правовом справочнике; перед обращением перепроверьте.</p>
      </section>
      <aside className="detail-card detail-side">
        <span className="eyebrow">Местонахождение</span>
        <h2>На карте Краснодара</h2>
        <p>Поиск по проверенному почтовому адресу. Точная точка входа в здание и доступность для маломобильных посетителей пока не аттестованы.</p>
        <p><a className="text-link" href={'https://yandex.ru/maps/?text='+encoded} target="_blank" rel="noopener noreferrer">Открыть в Яндекс Картах ↗</a></p>
        <p><a className="text-link" href={'https://www.openstreetmap.org/search?query='+encoded} target="_blank" rel="noopener noreferrer">Открыть в OpenStreetMap ↗</a></p>
      </aside>
    </div>
    <section className="court-section">
      <span className="eyebrow">Судебная компетенция</span>
      <h2>Какие регионы входят в округ</h2>
      <p>Суд проверяет вступившие в законную силу судебные акты арбитражных судов следующих субъектов РФ и относящихся к округу апелляционных арбитражных судов. Это не перечень адресов филиалов:</p>
      <ul>{regions.map(r=><li key={r}>{r}</li>)}</ul>
      <p className="court-source"><a href={court.jurisdictionLawUrl} target="_blank" rel="noopener noreferrer">Статья 24 Федерального конституционного закона № 1-ФКЗ ↗</a></p>
    </section>
    <section className="court-section">
      <span className="eyebrow">Практическая инструкция</span>
      <h2>Как подать кассационную жалобу</h2>
      <ol>
        <li>Уточните, относится ли спор к арбитражному судопроизводству и подлежит ли судебный акт кассационному пересмотру.</li>
        <li>Проверьте порядок обжалования и срок по статье 276 АПК РФ: как правило, два месяца со дня вступления обжалуемого акта в законную силу, с предусмотренными законом исключениями.</li>
        <li>Подготовьте жалобу с реквизитами по статье 277 АПК РФ, документами о полномочиях и подтверждением направления копий другим участникам.</li>
        <li>Кассационная жалоба в суд округа обычно подаётся через арбитражный суд, принявший решение (статья 275 АПК РФ), а не напрямую по электронной почте окружного суда.</li>
        <li>Для электронного обращения используйте <a href="https://my.arbitr.ru/" target="_blank" rel="noopener noreferrer">«Мой арбитр» ↗</a> и проверьте госпошлину по Налоговому кодексу РФ и действующим льготам.</li>
        <li>После подачи отслеживайте движение дела и судебные акты через официальный реестр.</li>
      </ol>
      <p className="court-source">Применимые нормы: статьи 273–291 АПК РФ; статьи 333.21 и 333.22 НК РФ. Размер пошлины намеренно не указан без проверки конкретного вида заявителя, требования и действующей редакции закона.</p>
    </section>
    <section className="court-section">
      <span className="eyebrow">Официальные сервисы</span>
      <h2>Поиск дел, решений и заседаний</h2>
      <p>Для конкретного дела используйте номер и название суда в картотеке. Список текущих заседаний нельзя достоверно показывать без действующего официального канала данных.</p>
      <ul>
        <li><a href="https://kad.arbitr.ru/" target="_blank" rel="noopener noreferrer">Картотека арбитражных дел: производство и заседания ↗</a></li>
        <li><a href="https://ras.arbitr.ru/" target="_blank" rel="noopener noreferrer">Банк решений арбитражных судов ↗</a></li>
        <li><a href="https://my.arbitr.ru/" target="_blank" rel="noopener noreferrer">Подача процессуальных документов ↗</a></li>
      </ul>
      <p className="court-source">Указанные сервисы открывают официальный поиск; карточки дел и время заседаний не подставляются без фактической проверки.</p>
    </section>
    <section className="court-section">
      <span className="eyebrow">Актуальность и прозрачность</span>
      <h2>Состав суда, часы работы и реквизиты</h2>
      <p><strong>Судьи и председатель:</strong> опубликованные в сторонних каталогах списки противоречат друг другу. До сверки с актуальным официальным составом и документами о назначении перечислять их как действующих нельзя.</p>
      <p><strong>Часы приёма:</strong> общего подтверждённого графика по приёмной и каждому отделу пока нет; уточняйте на официальном сайте или по телефону.</p>
      <p><strong>Госпошлина и банковские реквизиты:</strong> проверяйте актуальные реквизиты ЕНП/КБК и допустимый способ оплаты перед подачей. Исторические платёжные реквизиты не публикуются.</p>
      <p><strong>Фотография здания:</strong> не размещена до проверки права использования изображения и подтверждения объекта съёмки.</p>
    </section>
    <section className="court-section">
      <span className="eyebrow">Проверяемые первоисточники</span>
      <h2>Источники сведений</h2>
      <ul>{sources.map(([title,url])=><li key={title}><a href={url} target="_blank" rel="noopener noreferrer">{title} ↗</a></li>)}</ul>
      <p className="court-source">Проверено по доступным справочным сведениям 22 октября 2026 года. Официальный сайт суда может ограничивать автоматическое чтение. Незавершённая проверка не означает отсутствия информации у суда.</p>
    </section>
    <section className="callout"><div><span className="eyebrow">Другие суды</span><h2>Вернуться к поиску по региону</h2>
      <p>Сопоставление кассационной инстанции с регионом не заменяет проверку инстанции и подсудности по конкретному делу.</p>
    </div><Link className="button button-outline" href={'/courts/'+region}>К судам региона →</Link></section>
  </>;
}
