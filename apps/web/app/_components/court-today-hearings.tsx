import {getCourtHearingsToday} from '../lib/official-hearings';
export async function CourtTodayHearings({code}:{code:string}){
 const report=await getCourtHearingsToday(code);
 const day=report.date.split('-').reverse().join('.');
 return <section className="court-section" id="pilot-today">
  <span className="eyebrow">Официальное судебное делопроизводство</span>
  <h2>Заседания на сегодня — {day}</h2>
  <p>Показаны только дела, назначенные на выбранную календарную дату по местному времени суда.
    Доступность списка зависит от официального сервиса. Сведения могут изменяться в течение дня.</p>
  {report.state==='available'?<>
    <p className="court-source">Получено {report.checkedAt?new Date(report.checkedAt).toLocaleString('ru-RU',{timeZone:'Asia/Omsk'}):''}. 
      {report.truncated?' Показаны первые 400 позиций по порядку официальной таблицы.':''}
      {' '}Участники дел и прочие персональные данные не копируются.</p>
    <div className="court-today-table-wrap"><table className="court-today-table">
      <thead><tr><th>Время</th><th>Номер дела</th><th>Зал</th><th>Судья</th></tr></thead>
      <tbody>{report.hearings.map((h,i)=><tr key={h.caseNumber+'-'+i}>
       <td><strong>{h.time}</strong></td>
       <td>{h.url?<a href={h.url} rel="noopener noreferrer" target="_blank">{h.caseNumber} ↗</a>:h.caseNumber}</td>
       <td>{h.room||'Не указан'}</td><td>{h.judge||'Не указан'}</td>
      </tr>)}</tbody>
    </table></div>
  </>:<div className="court-schedule-state">
     <strong>{report.state==='empty'?'На сегодня дела не назначены по опубликованным данным':'Сегодняшнее расписание временно недоступно'}</strong>
     <p>{report.message} Если сайт суда недоступен, не показываем сохранённое расписание за вчера или старую веб-копию.</p>
  </div>}
  <p className="court-source">
   <a href={report.sourceUrl} target="_blank" rel="noopener noreferrer">Открыть расписание на указанную дату на сайте суда ↗</a>
   {' '}Расписание не является полным перечнем всех производств суда.
  </p>
 </section>;
}
