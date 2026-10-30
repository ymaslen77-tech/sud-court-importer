'use client';

import {useState} from 'react';
import Link from 'next/link';

type Answer='yes'|'no'|'unknown';
type CriterionId='norm'|'applied'|'rights'|'exhaustion'|'deadline'|'attachments';
type Guidance={heading:string;detail:string;action:string};
type Criterion={
 id:CriterionId;
 title:string;
 explanation:string;
 reference:string;
 sourceUrl:string;
 category:'subject'|'admissibility'|'documents';
 guidance:Record<Answer,Guidance>;
};
export const QUESTIONS:readonly Criterion[]=[
 {
  id:'norm',category:'subject',
  title:'Вы можете точно назвать нормативное положение, конституционность которого оспариваете?',
  explanation:'КС РФ проверяет конституционность нормативных актов в пределах полномочий. Несогласие лишь с оценкой доказательств или обстоятельств дела не заменяет такого предмета обращения.',
  reference:'Статьи 3 и 96 ФКЗ № 1-ФКЗ',
  sourceUrl:'https://www.ksrf.ru/about/legalbases/FCLM/Article96.php',
  guidance:{
   yes:{heading:'Норма определена — проверьте её вид',detail:'По вашему ответу конкретная норма названа. Однако не всякий акт можно обжаловать в этой процедуре.',action:'Проверьте, входит ли издавший орган и вид нормативного акта в перечень статьи 96; зафиксируйте номер, дату, пункт и официальный источник опубликования.'},
   no:{heading:'Не определён предмет конституционного контроля',detail:'Без конкретной нормы нельзя проверить, относится ли вопрос к полномочиям КС РФ. Спор только о фактах дела сам по себе не является предметом конституционной жалобы.',action:'Выпишите точную статью, часть или пункт из судебного решения. Если спор касается лишь оценки доказательств, выясните доступный обычный процессуальный способ защиты.'},
   unknown:{heading:'Неясно, какой акт обжалуется',detail:'Сначала следует отделить нормативное положение от судебного решения и индивидуального акта по вашему делу.',action:'Откройте мотивировочную часть судебного решения, найдите применённую норму и проверьте вид акта по статье 96.'}
  }
 },
 {
  id:'applied',category:'admissibility',
  title:'Это положение уже применено судом в конкретном деле с вашим участием?',
  explanation:'Применение оспариваемой нормы в конкретном деле необходимо подтвердить судебным актом. Для жалобы в интересах другого лица действуют специальные правила статьи 96.',
  reference:'Статьи 96 и 97 ФКЗ № 1-ФКЗ',
  sourceUrl:'https://www.ksrf.ru/about/legalbases/FCLM/Article97.php',
  guidance:{
   yes:{heading:'Применение нормы заявлено — подтвердите актом',detail:'Ваш ответ указывает, что норма уже использовалась судом в конкретном деле. Для обращения одного утверждения недостаточно.',action:'Выделите в судебном решении место, где применена норма, подготовьте копию решения и проверьте, относится ли дело к вам или лицу, в интересах которого допускается обращение.'},
   no:{heading:'Нет подтверждённого применения нормы судом',detail:'Для индивидуальной конституционной жалобы это существенный признак возможной недопустимости: предполагаемое будущее применение нормы недостаточно.',action:'Проверьте, имеется ли уже судебное решение с применением нормы. Если его нет, не подменяйте этим обращением обычные процессуальные средства защиты.'},
   unknown:{heading:'Нужно установить применение нормы в деле',detail:'Упоминание закона в переписке, иске или административном документе не равнозначно подтверждению его применения судом.',action:'Изучите судебные акты своего дела. Если неясно, на каком положении основан итоговый вывод, проверьте мотивировочную и резолютивную части.'}
  }
 },
 {
  id:'rights',category:'admissibility',
  title:'Вы объяснили, какие именно конституционные права затронуты применением этой нормы?',
  explanation:'Нужно обосновать связь между оспариваемой нормой, её применением и признаками нарушения конституционных прав заявителя.',
  reference:'Пункт 1 статьи 97 ФКЗ № 1-ФКЗ',
  sourceUrl:'https://www.ksrf.ru/about/legalbases/FCLM/Article97.php',
  guidance:{
   yes:{heading:'Доводы о нарушении прав сформулированы',detail:'По вашему ответу вы можете указать конституционные права и последствия применения нормы. Это пока не проверка обоснованности доводов.',action:'Назовите статьи Конституции РФ и объясните, как именно содержание применённой нормы, а не только ошибка суда, затрагивает эти права.'},
   no:{heading:'Не раскрыта связь нормы с конституционными правами',detail:'Общие слова о несправедливом решении без объяснения конституционной проблемы не подтверждают условие пункта 1 статьи 97.',action:'Укажите затронутое право, конкретную норму и последствия её применения; сформулируйте правовой довод, почему именно норма противоречит Конституции.'},
   unknown:{heading:'Конституционно-правовая проблема требует уточнения',detail:'Необходимо отличить нарушение, связанное с самим содержанием нормы, от несогласия с действиями участников дела или оценкой доказательств.',action:'Сопоставьте текст применённой нормы со статьями Конституции РФ и изложите причинную связь на примере судебного акта.'}
  }
 },
 {
  id:'exhaustion',category:'admissibility',
  title:'Вы проверили исчерпание необходимых внутригосударственных средств судебной защиты?',
  explanation:'Как правило, требуется кассационное обжалование в максимально высокой для категории дела инстанции или предусмотренное надзорное обжалование. Статья 97 предусматривает исключительную оценку сложившейся практики.',
  reference:'Пункт 3 статьи 97 ФКЗ № 1-ФКЗ',
  sourceUrl:'https://www.ksrf.ru/about/legalbases/FCLM/Article97.php',
  guidance:{
   yes:{heading:'Порядок обжалования проверен — подтвердите решениями',detail:'По вашему ответу необходимые средства защиты использованы или имеется отдельное обоснование исключения.',action:'Укажите кассационную или надзорную инстанцию, судебные акты и то, что вопрос применения оспариваемой нормы ставился при обжаловании. Исключение по устойчивой практике оценивает сам КС РФ.'},
   no:{heading:'Не подтверждено исчерпание судебной защиты',detail:'Одна апелляция обычно недостаточна. Возможность исключения при устойчивой практике или официальном толковании оценивает исключительно Конституционный Суд.',action:'Определите максимально высокую кассационную инстанцию для своего вида дела либо предусмотренный надзорный путь; соберите решения. Если ссылаетесь на исключение, обоснуйте его официальной практикой.'},
   unknown:{heading:'Не определён необходимый путь судебного обжалования',detail:'Стадии зависят от вида судопроизводства. Ответ нельзя получить простым подсчётом инстанций, которые рассматривали дело.',action:'Составьте последовательность судебных актов с датами, определите доступную кассацию или надзор и проверьте специальное условие пункта 3 статьи 97.'}
  }
 },
 {
  id:'deadline',category:'admissibility',
  title:'Вы проверили годичный срок и то, от какого судебного решения он исчисляется?',
  explanation:'Общий срок — не позднее года после решения, исчерпывающего внутригосударственные средства защиты. Для отказа из-за пропуска срока обжалования предусмотрена иная точка отсчёта.',
  reference:'Пункт 2 статьи 97 ФКЗ № 1-ФКЗ',
  sourceUrl:'https://www.ksrf.ru/about/legalbases/FCLM/Article97.php',
  guidance:{
   yes:{heading:'Срок проверен — сохраните расчёт дат',detail:'Вы сообщаете, что рассчитали годичный срок. Самопроверка не сверяет календарные даты и не подтверждает своевременность подачи.',action:'Запишите дату решения, которым исчерпаны средства защиты, и дату планируемой подачи. Отдельно изучите правило об отказе в пересмотре из-за пропуска срока.'},
   no:{heading:'Есть риск пропуска годичного срока',detail:'Пункт 2 статьи 97 предусматривает предельный срок. Его начало зависит от процессуальной истории; автоматического восстановления срока этой памяткой не предусмотрено.',action:'Срочно определите дату решения об исчерпании средств защиты. Если было отказано в пересмотре из-за пропуска процессуального срока, проверьте специальный способ исчисления по последнему решению с применением нормы.'},
   unknown:{heading:'Невозможно оценить срок без дат судебных актов',detail:'Дата решения первой инстанции не всегда является началом годичного срока обращения в КС РФ.',action:'Соберите даты и копии всех итоговых судебных актов. Найдите решение, исчерпывающее доступные средства защиты, и сопоставьте его с пунктом 2 статьи 97.'}
  }
 },
 {
  id:'attachments',category:'documents',
  title:'У вас есть копии судебных решений, текст оспариваемой нормы и остальные требуемые приложения?',
  explanation:'В состав приложений входят судебные решения, текст нормы, подтверждение госпошлины или ходатайство о льготе, документы представителя при его участии и дополнительные копии для бумажной подачи.',
  reference:'Статьи 37–39 и 96 ФКЗ № 1-ФКЗ',
  sourceUrl:'https://www.ksrf.ru/Petition/PrimerOfStructure.php',
  guidance:{
   yes:{heading:'Комплект документов собран — проверьте содержание',detail:'По вашему ответу необходимые приложения подготовлены. Формальные требования могут различаться в зависимости от способа обращения.',action:'Сверьте каждый документ с официальной примерной структурой, проверьте полномочия представителя, пошлину или льготу и копии для бумажного обращения.'},
   no:{heading:'Пакет документов пока неполный',detail:'Даже при наличии конституционно-правового вопроса отсутствие необходимых приложений создаёт самостоятельную проблему оформления обращения.',action:'Приложите текст оспариваемой нормы, судебные решения о её применении и об исчерпании защиты, подтверждение госпошлины либо ходатайство, документы представителя и необходимые копии.'},
   unknown:{heading:'Неясно, все ли приложения подготовлены',detail:'Наличие только судебного решения и текста жалобы ещё не подтверждает комплектность.',action:'Пройдите официальный перечень приложений по пунктам. Отдельно проверьте выбранный способ подачи, уплату пошлины и документы представителя.'}
  }
 }
] as const;

type Tone='idle'|'attention'|'caution'|'ready';
type Assessment={tone:Tone;title:string;summary:string;next:string};
export function assess(answers:Partial<Record<CriterionId,Answer>>,count:number):Assessment{
 const status=(id:CriterionId)=>answers[id];
 if(!count)return {
  tone:'idle',title:'Начните самопроверку',summary:'Выберите ответ на каждый вопрос. Вместо одинакового заключения по каждому ответу появятся конкретные последствия и дальнейшие действия.',next:'Начните с определения оспариваемого нормативного положения.'
 };
 if(status('applied')==='no')return {
  tone:'attention',title:'Существенное препятствие: применение нормы судом не подтверждено',
  summary:'Для индивидуальной жалобы необходимо судебное решение о применении оспариваемой нормы в конкретном деле. Само предположение о будущем нарушении обычно не отвечает этому требованию.',
  next:'В первую очередь проверьте судебный акт, указанный в пункте 2, и официальные статьи 96–97.'
 };
 if(status('norm')==='no')return {
  tone:'attention',title:'Не определён предмет обращения в Конституционный Суд',
  summary:'Пока не названа проверяемая норма, нельзя соотнести вопрос с компетенцией суда и подготовить мотивированную жалобу.',
  next:'Сначала установите оспариваемое положение из судебного акта.'
 };
 if(status('deadline')==='no')return {
  tone:'attention',title:'Приоритетная проблема: годичный срок обращения',
  summary:'По вашему ответу срок не проверен или есть риск его нарушения. Это самостоятельное условие допустимости, требующее анализа дат судебных актов.',
  next:'Проверьте пункт 2 статьи 97 и процессуальную историю дела до подготовки жалобы.'
 };
 if(status('exhaustion')==='no')return {
  tone:'attention',title:'Не подтверждено исчерпание средств судебной защиты',
  summary:'Обычной апелляции, как правило, недостаточно. Возможное исключение по устоявшейся практике решает оценивать Конституционный Суд.',
  next:'Уточните кассационный или надзорный путь и доказательства его прохождения.'
 };
 if(status('rights')==='no')return {
  tone:'attention',title:'Не сформулирована конституционно-правовая проблема',
  summary:'Для жалобы требуется связь между применённой нормой и предполагаемым нарушением конституционных прав, а не только спор с выводами суда.',
  next:'Сформулируйте нарушенное право и причинную связь с текстом нормы.'
 };
 if(status('attachments')==='no')return {
  tone:'attention',title:'Необходимые приложения требуют дополнения',
  summary:'По вашим ответам есть недостаток в документах. Это вопрос оформления, который следует исправить независимо от оценки допустимости.',
  next:'Соберите приложения по официальной примерной структуре жалобы.'
 };
 if(count<QUESTIONS.length)return {
  tone:'idle',title:'Предварительный результат — проверка продолжается',
  summary:'Промежуточные ответы уже разобраны ниже. Пока не все критерии заполнены, общий вывод преждевременен.',
  next:'Заполните оставшиеся вопросы; появится конкретная рекомендация по каждому пункту.'
 };
 if(QUESTIONS.some(q=>status(q.id)==='unknown'))return {
  tone:'caution',title:'Недостаточно сведений для предварительной оценки',
  summary:'Хотя прямых отрицательных ответов нет, по некоторым условиям ещё отсутствуют подтверждённые сведения.',
  next:'Уточните вопросы, отмеченные «Не знаю», по судебным актам и официальным нормам.'
 };
 return {
  tone:'ready',title:'По вашим ответам основные условия предварительно учтены',
  summary:'Все шесть ответов положительные, но они не проверены документально. Это не означает признания жалобы допустимой или гарантии её принятия.',
  next:'Перед подачей сверьте судебные решения, срок, нормативный акт и приложения по первоисточникам.'
 };
}

export function ConstitutionalComplaintSelfCheck(){
 const [answers,setAnswers]=useState<Partial<Record<CriterionId,Answer>>>({});
 const count=QUESTIONS.filter(q=>answers[q.id]).length;
 const passed=QUESTIONS.filter(q=>answers[q.id]==='yes');
 const no=QUESTIONS.filter(q=>answers[q.id]==='no');
 const uncertain=QUESTIONS.filter(q=>answers[q.id]==='unknown');
 const missing=QUESTIONS.filter(q=>!answers[q.id]);
 const assessment=assess(answers,count);
 const byAnswer=(answer:Answer)=>QUESTIONS.filter(q=>answers[q.id]===answer);
 function guidanceList(answer:Answer){
  return <ul className="ksrf-selfcheck-findings">
   {byAnswer(answer).map((question)=>{
    const advice=question.guidance[answer];
    return <li className="ksrf-selfcheck-finding" key={question.id} data-criterion={question.id}>
     <div className="ksrf-selfcheck-finding-top">
      <span className="ksrf-selfcheck-finding-index">{QUESTIONS.indexOf(question)+1}</span>
      <strong>{advice.heading}</strong>
     </div>
     <p>{advice.detail}</p>
     <p><strong>Что делать:</strong> {advice.action}</p>
     <a href={question.sourceUrl} target="_blank" rel="noopener noreferrer">
      {question.reference} — первоисточник ↗
     </a>
    </li>;
   })}
  </ul>;
 }
 return <section className="ksrf-selfcheck" aria-labelledby="ksrf-selfcheck-title">
  <div className="ksrf-selfcheck-head">
   <div>
    <span className="eyebrow">Интерактивная памятка</span>
    <h2 id="ksrf-selfcheck-title">Предварительная самопроверка жалобы</h2>
    <p>Шесть вопросов для ориентировочной проверки индивидуальной жалобы. Результат формируется отдельно по каждому вашему ответу и не заменяет решение Конституционного Суда. Ответы остаются в этой вкладке браузера.</p>
   </div>
   <strong aria-live="polite" className="ksrf-selfcheck-progress">{count} из {QUESTIONS.length}</strong>
  </div>
  <ol className="ksrf-selfcheck-questions">
   {QUESTIONS.map((q,i)=><li key={q.id}>
    <fieldset>
     <legend><span>{String(i+1).padStart(2,'0')}</span> {q.title}</legend>
     <p>{q.explanation}</p>
     <small>{q.reference}</small>
     <div className="ksrf-selfcheck-answers" role="group" aria-label={'Ваш ответ: '+q.title}>
      {([['yes','Да'],['no','Нет'],['unknown','Не знаю']] as const).map(([value,label])=>
       <button key={value} type="button" aria-pressed={answers[q.id]===value}
        onClick={()=>setAnswers(current=>({...current,[q.id]:value}))}>{label}</button>)}
     </div>
    </fieldset>
   </li>)}
  </ol>
  <section className={'ksrf-selfcheck-result ksrf-selfcheck-result--'+assessment.tone}
   aria-labelledby="ksrf-selfcheck-result-title" data-tone={assessment.tone}>
   <div className="ksrf-selfcheck-result-banner">
    <p className="ksrf-selfcheck-result-kicker">{count===QUESTIONS.length?'Результат вашей самопроверки':'Предварительный результат'}</p>
    <h3 id="ksrf-selfcheck-result-title">{assessment.title}</h3>
    <p>{assessment.summary}</p>
    <p className="ksrf-selfcheck-result-next"><strong>Следующий шаг:</strong> {assessment.next}</p>
   </div>
   <div className="ksrf-selfcheck-totals" role="status" aria-live="polite">
    <span><strong>{passed.length}</strong> ответов «Да»</span>
    <span><strong>{no.length}</strong> ответов «Нет»</span>
    <span><strong>{uncertain.length}</strong> ответов «Не знаю»</span>
    <span><strong>{missing.length}</strong> без ответа</span>
   </div>
   {no.length>0?<section className="ksrf-selfcheck-finding-group ksrf-selfcheck-finding-group--no">
    <h4>Выявленные проблемы — что исправить</h4>{guidanceList('no')}
   </section>:null}
   {uncertain.length>0?<section className="ksrf-selfcheck-finding-group ksrf-selfcheck-finding-group--unknown">
    <h4>Неизвестные условия — как их проверить</h4>{guidanceList('unknown')}
   </section>:null}
   {passed.length>0?<section className="ksrf-selfcheck-finding-group ksrf-selfcheck-finding-group--yes">
    <h4>Что вы указали как выполненное — что подтвердить</h4>{guidanceList('yes')}
   </section>:null}
   {missing.length>0&&count>0?<p className="ksrf-selfcheck-pending">
    Не заполнено: {missing.map(q=>String(QUESTIONS.indexOf(q)+1)).join(', ')}. Общий результат может измениться после ответов.
   </p>:null}
   <p className="ksrf-selfcheck-legal-note">
    <strong>Важно:</strong> это информационная самопроверка по вашим ответам, а не юридическое заключение. Допустимость жалобы и предусмотренные законом исключения оценивает исключительно Конституционный Суд РФ.
   </p>
   <div className="ksrf-selfcheck-links">
    <Link href="/courts/reference/constitutional-court-rf/check/documents">Шаг 3: структура жалобы и документы →</Link>
    <Link href="/courts/reference/constitutional-court-rf/info/complaint">Порядок обращения и частые вопросы →</Link>
    <Link href="/courts/reference/constitutional-court-rf/documents/complaint">Подготовить проект жалобы →</Link>
   </div>
   <details className="ksrf-guide-source">
    <summary>Проверить юридическую основу по официальным источникам</summary>
    <ul>
     <li><a href="https://www.ksrf.ru/Petition/algo/" target="_blank" rel="noopener noreferrer">Официальная самопроверка КС РФ ↗</a></li>
     <li><a href="https://www.ksrf.ru/about/legalbases/FCLM/Article97.php" target="_blank" rel="noopener noreferrer">Статья 97 ФКЗ № 1-ФКЗ ↗</a></li>
     <li><a href="https://www.ksrf.ru/Petition/PrimerOfStructure.php" target="_blank" rel="noopener noreferrer">Структура жалобы и приложения ↗</a></li>
    </ul>
   </details>
   {count>0?<button type="button" className="ksrf-selfcheck-reset" onClick={()=>setAnswers({})}>Начать проверку заново</button>:null}
  </section>
 </section>;
}
