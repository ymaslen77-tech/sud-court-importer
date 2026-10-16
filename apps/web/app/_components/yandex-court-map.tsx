type Coordinates={lat:number;lon:number;basis:string};
const known:Record<string,Coordinates>={
 '55OS0000':{lat:54.987172,lon:73.296437,basis:'Историческая координата адреса из открытого географического справочника, требует контрольной сверки'},
 '54RS0012':{lat:55.349460,lon:78.336911,basis:'Историческая координата адреса из открытого географического справочника, требует контрольной сверки'},
 '54OS0000':{lat:55.048952,lon:82.913584,basis:'Справочные координаты ул. Писарева, 35, требуют проверки входа'},
 '54AJ0005':{lat:55.039337,lon:82.937965,basis:'Справочные координаты ул. Ломоносова, 57а, требуют проверки входа'}
};
export function YandexCourtMap({code,name,address}:{code:string;name:string;address:string}){
 const point=known[code];
 // Official Yandex iframe: public map widget without JavaScript Geocoder API.
 // 2 known address points are provisional; others use address-search results, never fabricated coordinates.
 const params=new URLSearchParams();
 if(point){
   params.set('ll',point.lon+','+point.lat);
   params.set('z','16');
   params.set('pt',point.lon+','+point.lat+',pm2rdm');
 }else{
   params.set('text',address+' '+name);
   params.set('z','15');
 }
 const iframe='https://yandex.ru/map-widget/v1/?'+params.toString();
 const search='https://yandex.ru/maps/?'+new URLSearchParams({text:address+' '+name}).toString();
 return <section className="court-section" id="pilot-map">
  <span className="eyebrow">Местоположение</span>
  <h2>Суд на Яндекс Картах</h2>
  <p>{address}</p>
  <div className="court-yandex-frame">
   <iframe title={'Интерактивная карта Яндекс Карт — '+name} src={iframe}
    loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
    allowFullScreen />
  </div>
  <p className="court-source">
    {point?'Метка построена по опубликованным координатам адреса; расположение входа требует дополнительной проверки.':
     'Показана интерактивная карта с поиском по названию и адресу; точная метка входа ещё не подтверждена.'}
    {' '}<a href={search} target="_blank" rel="noopener noreferrer">Открыть Яндекс Карты и построить маршрут ↗</a>
  </p>
 </section>;
}
