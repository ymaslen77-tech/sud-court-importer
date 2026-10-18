import type {MoscowCourt} from '../lib/moscow-courts';
export function MoscowYandexMap({court}:{court:MoscowCourt}){
 const q=court.name+', '+court.address;
 // Lookup by address: do not invent or hardcode precise coordinates.
 const src='https://yandex.ru/map-widget/v1/?'+new URLSearchParams({text:q,z:'15'}).toString();
 const link='https://yandex.ru/maps/?'+new URLSearchParams({text:q}).toString();
 return <section className="court-section" id="msk-map">
  <span className="eyebrow">Адрес на карте · интерактивный поиск</span>
  <h2>Яндекс Карты: местонахождение суда и проезд</h2>
  <p><strong>{court.address}</strong>. Карту можно перемещать и увеличивать, построение маршрута доступно по ссылке.</p>
  <div className="court-yandex-frame">
   <iframe title={'Яндекс Карты — '+court.name} src={src}
    loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
  </div>
  <p className="court-source">Показан результат поиска по тексту адреса; точное положение входа и доступный маршрут ещё не подтверждены.
   {' '}<a href={link} target="_blank" rel="noopener noreferrer">Открыть Яндекс Карты и построить маршрут ↗</a></p>
  <p className="court-source"><strong>Особенности посещения:</strong> {court.notes}</p>
 </section>;
}
