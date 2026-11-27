'use client';
import Script from 'next/script';
import {usePathname} from 'next/navigation';

const init=`
(function(m,e,t,r,i,k,a){
    if (location.hostname !== 'sud-russia.ru' && location.hostname !== 'www.sud-russia.ru') return;
    if (/^\\/editor(?:\\/|$)/.test(location.pathname)) return;
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=114727256', 'ym');
if (window.ym && (location.hostname === 'sud-russia.ru' || location.hostname === 'www.sud-russia.ru') && !/^\\/editor(?:\\/|$)/.test(location.pathname)) {
    ym(114727256, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
}
`;

export function YandexMetrika(){
 const pathname=usePathname();
 if(pathname==='/editor'||pathname.startsWith('/editor/'))return null;
 return <Script id="yandex-metrika-114727256" strategy="afterInteractive">{init}</Script>;
}
