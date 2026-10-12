'use client';
import {useState} from 'react';

export function VerifiedCourtMap({latitude,longitude,sourceUrl}:{
  latitude:number;longitude:number;sourceUrl:string|null
}){
 const [visible,setVisible]=useState(false);
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180){
  return null;
 }
 const delta=.008;
 const bbox=[
  (longitude-delta).toFixed(5),(latitude-delta*.7).toFixed(5),
  (longitude+delta).toFixed(5),(latitude+delta*.7).toFixed(5)
 ].join(',');
 const embed='https://www.openstreetmap.org/export/embed.html?'+new URLSearchParams({
   bbox,layer:'mapnik',marker:latitude.toFixed(6)+','+longitude.toFixed(6)
 }).toString();
 const mapUrl='https://www.openstreetmap.org/?'+new URLSearchParams({
   mlat:latitude.toFixed(6),mlon:longitude.toFixed(6),
   zoom:'17'
 }).toString();
 return <div className="verified-map">
   {visible
    ? <iframe title="Местоположение суда на OpenStreetMap" src={embed} loading="lazy"
       referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>
    : <div className="map-consent"><p>Координаты суда проверены по источнику. Карта загрузится с сервиса OpenStreetMap только после вашего нажатия.</p>
       <button type="button" className="button button-outline" onClick={()=>setVisible(true)}>Показать карту</button></div>}
   <div className="map-attribution">
    <a target="_blank" rel="noopener noreferrer" href={mapUrl}>Открыть маршрут на карте ↗</a>
    <a target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors · ODbL</a>
    {sourceUrl?<a target="_blank" rel="noopener noreferrer" href={sourceUrl}>Источник координат ↗</a>:null}
   </div>
 </div>;
}
