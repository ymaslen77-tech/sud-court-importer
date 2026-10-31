'use client';

import {useState} from 'react';

type FilingGoal='claim'|'appeal'|'motion'|'information';
type CaseKind='civil'|'public'|'criminal'|'offence'|'business'|'unsure';
type Submission='online'|'office'|'mail'|'unsure';
type Answers=Partial<{
 goal:FilingGoal;
 kind:CaseKind;
 service:'tracking'|'copies'|'contacts';
 court:'yes'|'no'|'unsure';
 actor:'self'|'representative';
 channel:Submission;
 copies:'yes'|'no'|'unsure';
}>;
type Option={value:string;label:string;hint?:string};
type Question={id:keyof Answers;title:string;subtitle?:string;options:Option[]};
type Result={title:string;document:string;destination:string;steps:string[];warnings:string[]};

const goalOptions:Option[]=[
 {value:'claim',label:'Подать новое заявление или иск',hint:'Дело ещё не принято к рассмотрению'},
 {value:'appeal',label:'Обжаловать судебный акт',hint:'Есть решение, определение или постановление'},
 {value:'motion',label:'Подать документ по существующему делу',hint:'Ходатайство, пояснения или доказательства'},
 {value:'information',label:'Найти дело или получить копию документа',hint:'Без нового судебного требования'}
];
const caseOptions:Option[]=[
 {value:'civil',label:'Гражданский спор',hint:'Семья, жильё, работа, договор, потребитель'},
 {value:'public',label:'Спор с государственным органом',hint:'Публично-правовые отношения; возможен КАС РФ'},
 {value:'criminal',label:'Уголовное дело',hint:'Жалобы, ходатайства и обжалование по УПК РФ'},
 {value:'offence',label:'Административное правонарушение',hint:'Штраф, протокол, постановление по КоАП РФ'},
 {value:'business',label:'Экономический спор',hint:'Например, между компаниями или предпринимателями'},
 {value:'unsure',label:'Не знаю, к какому виду относится',hint:'Сначала нужно установить применимые правила'}
];
const courtOptions:Option[]=[
 {value:'yes',label:'Да, относится к этому суду'},
 {value:'no',label:'Нет, относится к другому суду'},
 {value:'unsure',label:'Пока не проверял(а)'}
];
const actorOptions:Option[]=[
 {value:'self',label:'Обращаюсь лично'},
 {value:'representative',label:'Обращается представитель'}
];
const channelOptions:Option[]=[
 {value:'online',label:'Электронно через официальный сервис'},
 {value:'office',label:'Лично через приём документов'},
 {value:'mail',label:'Почтой'},
 {value:'unsure',label:'Пока не выбрал(а) способ'}
];

export function filingQuestions(a:Answers):Question[]{
 const questions:Question[]=[{id:'goal',title:'Что вы хотите сделать?',options:goalOptions}];
 if(!a.goal)return questions;
 if(a.goal==='information'){
  questions.push({id:'service',title:'Какие сведения нужны?',options:[
   {value:'tracking',label:'Найти дело, дату или стадию рассмотрения'},
   {value:'copies',label:'Получить копию судебного акта или ознакомиться с делом'},
   {value:'contacts',label:'Узнать адрес, контакты или часы приёма'}
  ]});
 }else{
  questions.push({id:'kind',title:'К какой категории относится дело?',subtitle:'От вида судопроизводства зависит порядок подачи и обжалования.',options:caseOptions});
 }
 questions.push({id:'court',title:a.goal==='appeal'?'Какой суд вынес обжалуемый акт?':a.goal==='motion'?'В каком суде рассматривается ваше дело?':'Вы проверили, что обращение относится к этому суду?',options:a.goal==='appeal'?
   [{value:'yes',label:'Этот суд'}, {value:'no',label:'Другой суд'}, {value:'unsure',label:'Не уверен(а)'}]:
  a.goal==='motion'?[{value:'yes',label:'Этот суд'}, {value:'no',label:'Другой суд'}, {value:'unsure',label:'Не уверен(а)'}]:courtOptions});
 if(a.goal!=='information'||a.service==='copies'){
  questions.push({id:'actor',title:'Кто будет обращаться?',options:actorOptions});
 }
 if(a.goal!=='information'){
  questions.push({id:'channel',title:'Как удобнее передать документы?',options:channelOptions});
 }
 if(a.goal==='claim'&&a.kind==='civil'){
  questions.push({id:'copies',title:'Вы направили копии иска и приложений другим участникам дела?',subtitle:'Для гражданского иска это предусмотрено статьёй 132 ГПК РФ.',options:[
   {value:'yes',label:'Да, подтверждение есть'},
   {value:'no',label:'Пока нет'},
   {value:'unsure',label:'Не знаю, требуется ли это'}
  ]});
 }
 return questions;
}

export function filingResult(a:Answers,courtName:string):Result{
 const result:Result={title:'Порядок обращения',document:'Определите процессуальный документ.',destination:courtName,steps:[],warnings:[]};
 const goal=a.goal;
 if(goal==='information'){
  if(a.service==='tracking'){
   result.title='Поиск судебного дела';
   result.document='Новый иск или жалоба не требуются для просмотра открытой карточки дела.';
   result.steps=['Откройте официальный поиск дел на портале выбранного суда.','Укажите вид производства, номер и год дела; проверьте судебные извещения и возможные изменения даты заседания.','Если карточка не найдена или сведения противоречат извещению, уточните информацию в канцелярии.'];
  }else if(a.service==='copies'){
   result.title='Получение копии судебного акта или ознакомление с делом';
   result.document='Обращение о выдаче копии или ходатайство об ознакомлении — в зависимости от процессуального положения и вида производства.';
   result.steps=['Подготовьте номер дела, год, сведения о своём процессуальном положении.','Уточните в суде порядок подачи запроса и получения материалов, часы приёма и место нахождения дела.','Возьмите документ, удостоверяющий личность; для представителя проверьте подтверждение полномочий.'];
  }else{
   result.title='Контакты и время приёма суда';
   result.document='Процессуальное заявление обычно не требуется для просмотра опубликованных контактов.';
   result.steps=['Проверьте официальный адрес, возможный временный переезд и часы нужного отдела.','Уточните правила личного приёма и график конкретного подразделения перед посещением.'];
  }
 }else if(goal==='claim'){
  result.title=a.kind==='civil'?'Подача гражданского иска':a.kind==='public'?'Подача административного иска':a.kind==='business'?'Сначала проверьте компетенцию арбитражного суда':'Подготовка нового обращения в суд';
  result.document=a.kind==='civil'?'Исковое заявление по статьям 131–132 ГПК РФ.':
   a.kind==='public'?'Административное исковое заявление по КАС РФ (если спор подлежит рассмотрению по КАС).':
   a.kind==='business'?'Исковое заявление по правилам АПК РФ, если спор относится к компетенции арбитражного суда.':
   a.kind==='criminal'?'Не любой уголовно-правовой вопрос начинается с иска: определите допустимое заявление или жалобу по УПК РФ.':
   a.kind==='offence'?'По КоАП РФ применяются специальные заявления и жалобы, а не универсальный гражданский иск.':
   'Нужно сначала определить вид производства и правильный процессуальный документ.';
  result.steps=['Проверьте родовую и территориальную подсудность с учётом вида спора и точного адреса.','Сформулируйте требование, обстоятельства и доказательства; подготовьте приложения по применимому процессуальному кодексу.','Проверьте обязательный досудебный порядок, если он установлен для вашего спора.','Уточните госпошлину, льготы или возможность ходатайства об отсрочке и проверьте официальные реквизиты.','Передайте документы надлежащим способом, сохраните подтверждение подачи и проверьте регистрацию.'];
  if(a.kind==='civil'){
   result.steps.splice(3,0,'Направьте другим участникам копии искового заявления и отсутствующих у них приложений; сохраните подтверждение направления (ст. 132 ГПК РФ).');
   if(a.copies!=='yes')result.warnings.push('Копии иска другим участникам: подготовьте подтверждение направления до подачи. Проверьте применимость статьи 132 ГПК РФ.');
  }
  if(a.kind==='business')result.warnings.push('Экономический спор может быть подсуден арбитражному, а не выбранному районному суду. Проверьте компетенцию до подачи.');
  if(a.kind==='criminal'||a.kind==='offence'||a.kind==='unsure')result.warnings.push('Тип обращения ещё требует уточнения: универсальный иск для этой категории может быть неподходящим.');
 }else if(goal==='appeal'){
  result.title='Обжалование судебного акта';
  result.document=a.kind==='civil'?'Апелляционная или частная жалоба — в зависимости от обжалуемого акта и его обжалуемости по ГПК РФ.':
   a.kind==='offence'?'Жалоба на постановление или решение по делу об административном правонарушении (КоАП РФ).':
   a.kind==='criminal'?'Апелляционная жалоба или иное предусмотренное УПК РФ обращение — зависит от стадии и судебного акта.':
   a.kind==='public'?'Апелляционная или частная жалоба по КАС РФ — с учётом вида судебного акта.':
   'Определите вид судебного акта, производства и применимый порядок его пересмотра.';
  result.steps=['Уточните вид акта, дату принятия и дату изготовления окончательной формы, если это имеет значение.','Проверьте срок, инстанцию и порядок подачи жалобы по применимому процессуальному кодексу.','Подготовьте доводы, требования и предусмотренные приложения; проверьте госпошлину или льготу, если она применима.','При подаче через суд первой инстанции направьте жалобу именно в суд, вынесший акт; уточните исключения для выбранного вида дела.','Сохраните подтверждение подачи и отслеживайте движение жалобы.'];
  if(a.kind==='civil')result.warnings.push('Для апелляции на решение районного суда Москвы по гражданскому делу обычно вышестоящий суд — Московский городской суд, а подача идёт через суд, вынесший решение. Для определений и иных производств действуют специальные правила.');
  result.warnings.push('Сроки обжалования существенно различаются по видам дел и актов. Опросник не рассчитывает процессуальный срок.');
 }else if(goal==='motion'){
  result.title='Документ по уже существующему делу';
  result.document='Ходатайство, заявление, объяснения или письменные доказательства — в зависимости от цели и процессуального статуса.';
  result.steps=['Укажите суд, номер дела, стороны и своё процессуальное положение.','Сформулируйте конкретную просьбу или пояснения, приложите подтверждающие документы.','Проверьте специальные требования применимого процессуального кодекса и порядок направления материалов другим участникам.','Подайте документ доступным процессуальным способом и сохраните подтверждение.'];
 }
 if(a.actor==='representative'){
  result.steps.push('Для представителя проверьте наличие документа о полномочиях и необходимость указания специальных полномочий на подписание или подачу конкретного обращения.');
 }
 if(a.court==='no'){
  result.destination='Суд, который рассматривает дело или вынес обжалуемый акт; требуется определить его отдельно.';
  result.warnings.unshift('Вы указали другой суд: не отправляйте документы автоматически в '+courtName+'. Проверьте правильного адресата.');
 }else if(a.court==='unsure'){
  result.warnings.unshift('Подсудность или суд, рассматривающий дело, пока не подтверждены. Сначала проверьте адрес и компетенцию на официальном портале.');
 }
 if(a.channel==='online'){
  result.steps.push('Для электронной подачи используйте официальный личный кабинет судов Москвы. Проверьте допустимый формат и требования к электронной подписи для выбранного документа.');
 }else if(a.channel==='office'){
  result.steps.push('При личной подаче уточните часы приёма экспедиции и получите подтверждение принятия документов.');
 }else if(a.channel==='mail'){
  result.steps.push('При почтовой отправке проверьте актуальный почтовый адрес суда и сохраните квитанцию и подтверждение состава отправления.');
 }else if(a.channel==='unsure'&&goal!=='information'){
  result.steps.push('Доступные способы: предусмотренная электронная система, личная подача или почта; выбор зависит от вида производства и особенностей документов.');
 }
 if(goal!=='information')result.warnings.push('Обычная электронная почта суда и электронная приёмная для непроцессуальных обращений не заменяют подачу процессуальных документов.');
 return result;
}

type Props={courtName:string;officialUrl:string;caseSearchUrl?:string};
export function MoscowFilingWizard({courtName,officialUrl,caseSearchUrl}:Props){
 const [answers,setAnswers]=useState<Answers>({});
 const [step,setStep]=useState(0);
 const [completed,setCompleted]=useState(false);
 const questions=filingQuestions(answers);
 const question=questions[step];
 const result=completed?filingResult(answers,courtName):null;
 const progress=completed?100:Math.round((step/Math.max(questions.length,1))*100);
 const chosen=(id:keyof Answers,value:string)=>{
  const kept:Answers={};
  questions.slice(0,step).forEach(q=>{
   const key=q.id;
   if(answers[key])Object.assign(kept,{[key]:answers[key]});
  });
  Object.assign(kept,{[id]:value});
  const next=filingQuestions(kept);
  setAnswers(kept);
  if(step+1>=next.length){setCompleted(true);}
  else{setStep(step+1);setCompleted(false);}
 };
 const back=()=>{if(completed){setCompleted(false);setStep(questions.length-1);}
  else if(step>0){setStep(step-1);}};
 const reset=()=>{setAnswers({});setStep(0);setCompleted(false);};
 const officialLinks=[
  {href:'https://mos-gorsud.ru/territorial',label:'Проверить подсудность по адресу'},
  {href:'https://mos-gorsud.ru/lk',label:'Подать документы через личный кабинет судов Москвы'},
  {href:officialUrl,label:'Официальная страница выбранного суда'}
 ];
 if(answers.goal==='information'&&answers.service==='tracking'){
  officialLinks.unshift({href:caseSearchUrl||'https://mos-gorsud.ru/search',label:'Официальный поиск судебных дел'});
 }
 return <div className="moscow-filing-wizard" aria-label="Опросник подачи документов в суд">
  <div className="moscow-filing-wizard-head">
   <span className="eyebrow">Персональный маршрут обращения</span>
   <p>Ответьте на несколько вопросов — получите порядок действий для выбранной ситуации. Ничего вводить о себе не нужно, ответы не отправляются на сервер.</p>
  </div>
  <div className="moscow-filing-progress" aria-label={completed?'Результат готов':`Шаг ${step+1} из ${questions.length}`}>
   <div style={{width:progress+'%'}}/>
  </div>
  {!completed&&question?<section className="moscow-filing-question" key={question.id} aria-live="polite">
   <p className="moscow-filing-step">Вопрос {step+1}{answers.goal?' из '+questions.length:''}</p>
   <h3>{question.title}</h3>
   {question.subtitle?<p className="court-source">{question.subtitle}</p>:null}
   <div className="moscow-filing-options">
    {question.options.map(o=><button type="button" className="moscow-filing-option" key={o.value} onClick={()=>chosen(question.id,o.value)}>
     <span className="moscow-filing-choice-mark" aria-hidden="true">›</span>
     <span><strong>{o.label}</strong>{o.hint?<small>{o.hint}</small>:null}</span>
    </button>)}
   </div>
  </section>:null}
  {result?<section className="moscow-filing-result" aria-live="polite">
   <span className="eyebrow">Ваш результат</span>
   <h3>{result.title}</h3>
   <div className="moscow-filing-result-key">
    <p><strong>Какой документ:</strong> {result.document}</p>
    <p><strong>Куда обращаться:</strong> {result.destination}</p>
   </div>
   {result.warnings.length>0?<div className="moscow-filing-alert"><strong>Что необходимо уточнить</strong>
    <ul>{result.warnings.map(x=><li key={x}>{x}</li>)}</ul>
   </div>:null}
   <h4>Последовательность действий</h4>
   <ol className="moscow-filing-result-steps">{result.steps.map((text,i)=><li key={i}>{text}</li>)}</ol>
   <h4>Официальные сервисы</h4>
   <ul className="moscow-filing-links">{officialLinks.map(x=><li key={x.href}><a href={x.href} target="_blank" rel="noopener noreferrer">{x.label} ↗</a></li>)}</ul>
   <p className="court-source">Результат носит справочный характер. Он не определяет автоматически подсудность, размер пошлины или срок обжалования и не является подачей документов.</p>
  </section>:null}
  <div className="moscow-filing-controls">
   {(step>0||completed)?<button type="button" className="button button-outline" onClick={back}>← Назад</button>:null}
   {(step>0||completed)?<button type="button" className="button button-outline" onClick={reset}>Начать заново</button>:null}
  </div>
 </div>;
}
