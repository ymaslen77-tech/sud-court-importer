'use client';

import {useState} from 'react';

type Answer='yes'|'no'|'unknown';
type Question={
 id:string;
 title:string;
 explanation:string;
 reference:string;
};
const QUESTIONS:readonly Question[]=[
 {
  id:'norm',title:'Вы можете точно назвать нормативное положение, конституционность которого оспариваете?',
  explanation:'КС РФ проверяет конституционность нормативного акта. Несогласие лишь с выводами суда о фактах или доказательствах не заменяет предмет жалобы.',
  reference:'Статьи 3 и 96 ФКЗ № 1-ФКЗ'
 },
 {
  id:'applied',title:'Это положение уже применено судом в конкретном деле с вашим участием?',
  explanation:'Для индивидуальной жалобы необходимо подтвердить судебным решением применение нормы. Если дело ещё рассматривается, возможны другие процессуальные действия, а не индивидуальная жалоба в КС.',
  reference:'Статьи 96–97 ФКЗ № 1-ФКЗ'
 },
 {
  id:'rights',title:'Вы объяснили, какие именно конституционные права затронуты применением этой нормы?',
  explanation:'Нужна аргументированная связь между содержанием нормы, её применением и предполагаемым нарушением конституционных прав.',
  reference:'Статья 97 ФКЗ № 1-ФКЗ'
 },
 {
  id:'exhaustion',title:'Вы проверили исчерпание необходимых внутригосударственных средств судебной защиты?',
  explanation:'Как правило, речь идёт о кассационном обжаловании в максимально высокой для этой категории дел инстанции либо предусмотренном законом надзорном пути. Закон знает специальные исключения, поэтому ответа об одной апелляции недостаточно.',
  reference:'Пункт 3 статьи 97 ФКЗ № 1-ФКЗ'
 },
 {
  id:'deadline',title:'Вы проверили годичный срок и то, от какого судебного решения он исчисляется?',
  explanation:'Обычно срок составляет один год после решения, которым исчерпаны средства защиты. При отказе в пересмотре из-за пропуска срока обжалования предусмотрено особое правило. Не вычисляйте срок только по дате решения первой инстанции.',
  reference:'Пункт 2 статьи 97 ФКЗ № 1-ФКЗ'
 },
 {
  id:'attachments',title:'У вас есть копии судебных решений, текст оспариваемой нормы и остальные требуемые приложения?',
  explanation:'Проверьте полномочия представителя при его участии, уплату пошлины или ходатайство о льготе, а также количество копий и способ удостоверения документов.',
  reference:'Статьи 37–39 и 96 ФКЗ № 1-ФКЗ'
 }
] as const;

export function ConstitutionalComplaintSelfCheck(){
 const [answers,setAnswers]=useState<Record<string,Answer>>({});
 const count=QUESTIONS.filter(q=>answers[q.id]).length;
 const no=QUESTIONS.filter(q=>answers[q.id]==='no');
 const uncertain=QUESTIONS.filter(q=>answers[q.id]==='unknown');
 const complete=count===QUESTIONS.length;
 const hasProblems=no.length>0||uncertain.length>0;
 return <section className="ksrf-selfcheck" aria-labelledby="ksrf-selfcheck-title">
  <div className="ksrf-selfcheck-head">
   <div><span className="eyebrow">Интерактивная памятка</span>
    <h2 id="ksrf-selfcheck-title">Предварительная самопроверка жалобы</h2>
    <p>Шесть вопросов по обычной индивидуальной жалобе гражданина или организации. Ответы остаются в вашем браузере и не отправляются на сервер нашего сайта.</p>
   </div>
   <strong aria-live="polite">{count} из {QUESTIONS.length}</strong>
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
  <div className="ksrf-selfcheck-result" aria-live="polite" role="status">
   {!complete?<><strong>Самопроверка не завершена</strong>
    <p>Ответьте на оставшиеся вопросы. Промежуточные ответы не определяют допустимость жалобы.</p></>:
    hasProblems?<><strong>Есть вопросы, требующие дополнительной проверки</strong>
      <p>{no.length?('Ответов «нет»: '+no.length+'. '):''}{uncertain.length?('Ответов «не знаю»: '+uncertain.length+'. '):''}
       Это не означает автоматическую недопустимость жалобы: учитываются категория дела и предусмотренные законом исключения.</p>
     </>:<><strong>По вашим ответам очевидных пробелов в этой памятке не обнаружено</strong>
      <p>Это не заключение о допустимости и не гарантия принятия обращения Конституционным Судом. Проверьте документы, основания и сроки по первоисточникам.</p></>}
   <div className="ksrf-selfcheck-links">
    <a href="https://www.ksrf.ru/Petition/algo/" target="_blank" rel="noopener noreferrer">Официальный алгоритм самопроверки ↗</a>
    <a href="https://www.ksrf.ru/about/legalbases/FCLM/Article97.php" target="_blank" rel="noopener noreferrer">Статья 97 ФКЗ № 1-ФКЗ ↗</a>
    <a href="https://www.ksrf.ru/Petition/PrimerOfStructure.php" target="_blank" rel="noopener noreferrer">Структура жалобы и приложения ↗</a>
   </div>
   {count>0?<button type="button" className="ksrf-selfcheck-reset" onClick={()=>setAnswers({})}>Начать заново</button>:null}
  </div>
 </section>;
}
