import Link from 'next/link';
import type {Metadata} from 'next';
const base='/courts/reference/constitutional-court-rf';
const structure=[
 ['01','Заявитель и представитель','ФИО или наименование, гражданство для физического лица, адрес, необходимые данные представителя и его полномочия.'],
 ['02','Орган, принявший нормативный акт','Наименование и адрес государственного органа, издавшего оспариваемый акт.'],
 ['03','Оспариваемая норма','Точный вид акта, номер, дата, источник публикации и конкретная статья, часть или пункт.'],
 ['04','Право на обращение и допустимость','Нормы Конституции РФ и ФКЗ № 1-ФКЗ, подтверждающие компетенцию КС РФ и ваше право обратиться.'],
 ['05','Обстоятельства судебного дела','Каким судебным актом норма применена, что произошло в деле, какие судебные средства защиты исчерпаны и когда.'],
 ['06','Конституционно-правовое обоснование','Какие права затронуты и почему проблема содержится в норме, а не только в оценке доказательств по делу.'],
 ['07','Просьба к КС РФ','Сформулированное требование о конституционности точно обозначенного положения.'],
 ['08','Дата и подпись','Собственноручная подпись заявителя либо надлежащего представителя; для электронного обращения действуют специальные правила.']
] as const;
const attachments=[
 'Текст оспариваемых нормативных положений.',
 'Судебные акты, подтверждающие применение нормы и исчерпание средств судебной защиты.',
 'Документы о полномочиях представителя, если он участвует.',
 'Документ об оплате пошлины или мотивированное ходатайство о льготе, уменьшении, отсрочке либо рассрочке с доказательствами.',
 'Перевод на русский язык и дополнительные экземпляры документов в случаях, предусмотренных правилами подачи.'
] as const;
export const metadata:Metadata={
 title:'Самопроверка жалобы КС РФ — шаг 3: текст, приложения, подача',
 description:'Компактная схема структуры конституционной жалобы, приложения, госпошлина, направление и статус обращения; документы на сайте и официальные первоисточники.',
 robots:{index:false,follow:true}
};
export default function ConstitutionalComplaintDocumentGuide(){
 return <article className="constitutional-reference-page ksrf-guide">
  <nav className="breadcrumb" aria-label="Навигация"><Link href="/">Главная</Link><span>/</span><Link href={base}>КС РФ</Link><span>/</span><Link href={base+'/check'}>Самопроверка</Link><span>/</span>Документы и подача</nav>
  <div className="ksrf-guide-stepper" aria-label="Порядок самопроверки">
   <Link href={base+'/check'}>1. Предмет</Link><Link href={base+'/check/eligibility'}>2. Допустимость</Link><strong aria-current="step">3. Документы и подача</strong>
  </div>
  <section className="section-hero constitutional-reference-hero">
   <span className="kicker">Шаг 3 из 3 · Подготовка документов</span>
   <h1>Структура жалобы и приложения</h1>
   <p className="lead">Восемь элементов жалобы, перечень основных приложений, госпошлина и способы направления — в одной короткой памятке с переходами к нашим генераторам.</p>
   <p className="constitutional-small">Перечень составлен по официальной примерной структуре КС РФ, статьям 37–39, 96–97 ФКЗ № 1-ФКЗ. Подробности и специальные условия проверяйте перед подписанием.</p>
  </section>
  <section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Текст документа</span><h2>Что написать в жалобе</h2></div>
   <ol className="ksrf-guide-list">{structure.map(([n,title,desc])=><li key={n}><span>{n}</span><div><h3>{title}</h3><p>{desc}</p></div></li>)}</ol>
  </section>
  <section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Перед отправкой</span><h2>Основные приложения</h2></div>
   <ul className="ksrf-guide-checklist">{attachments.map(x=><li key={x}>{x}</li>)}</ul>
   <p className="constitutional-small">Вопросы представительства и количества копий зависят от статуса заявителя и способа подачи. Если обращение в интересах другого лица подаёт специально уполномоченный субъект, может потребоваться письменное согласие; законное представительство рассматривается отдельно.</p>
  </section>
  <section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Практический маршрут</span><h2>Подготовить, проверить, направить</h2></div>
   <div className="ksrf-guide-actions-grid">
    <Link href={base+'/documents/complaint'}><strong>Генератор жалобы</strong><span>Заполнить проект и получить файл →</span></Link>
    <Link href={base+'/documents/fee-relief'}><strong>Ходатайство по госпошлине</strong><span>Подготовить проект при наличии оснований →</span></Link>
    <Link href={base+'/info/payment'}><strong>Госпошлина</strong><span>Суммы, льготы и проверка реквизитов →</span></Link>
    <Link href={base+'/info/reception'}><strong>Способы подачи</strong><span>Почта, приёмная и электронная подача →</span></Link>
   </div>
   <p className="ksrf-guide-note"><strong>Предварительное рассмотрение:</strong> после регистрации Секретариат проверяет требования к обращению. Неисправленная формальная ошибка и вопрос допустимости — разные основания. Подробности можно изучить в <Link href={base+'/info/complaint'}>нашем разделе о порядке обращения</Link>.</p>
  </section>
  <section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Третий шаг завершён</span><h2>Дальше — продолжить на сайте или сверить первоисточник</h2></div>
   <div className="ksrf-guide-action">
    <Link className="button button-red" href={base+'/documents/complaint'}>Составить проект жалобы →</Link>
    <Link className="button button-outline" href={base+'/check/eligibility'}>← Вернуться к самопроверке</Link>
   </div>
   <details className="ksrf-guide-source" open>
    <summary>Официальные материалы КС РФ — доступны для проверки</summary>
    <p>Вся памятка составлена в собственном изложении; следующие документы являются исходными официальными источниками, их можно открыть в любой момент.</p>
    <ul>
     <li><a href="https://www.ksrf.ru/Petition/PrimerOfStructure.php" target="_blank" rel="noopener noreferrer">Примерная структура жалобы и приложения ↗</a></li>
     <li><a href="https://www.ksrf.ru/Petition/algo/" target="_blank" rel="noopener noreferrer">Официальный алгоритм самопроверки ↗</a></li>
     <li><a href="https://www.ksrf.ru/Petition/Resolve.php" target="_blank" rel="noopener noreferrer">Предварительное рассмотрение обращения ↗</a></li>
     <li><a href="https://www.ksrf.ru/Petition/Requisites.php" target="_blank" rel="noopener noreferrer">Действующие реквизиты госпошлины ↗</a></li>
     <li><a href="https://www.ksrf.ru/Petition/CurrentStatus.php" target="_blank" rel="noopener noreferrer">Статус обращения ↗</a></li>
    </ul>
   </details>
  </section>
 </article>;
}
