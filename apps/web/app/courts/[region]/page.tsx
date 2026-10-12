import Link from 'next/link';
import type {Metadata} from 'next';
import { getRegionCourts, getRegions } from '../../lib/api';

type Props = {params: Promise<{region:string}>};
export const dynamic = 'force-dynamic';

export async function generateMetadata({params}:Props):Promise<Metadata> {
  const {region} = await params;
  try {
    const [courts,regions] = await Promise.all([getRegionCourts(region),getRegions()]);
    const name = regions.find(r => r.slug === region)?.name ?? (region === 'moscow' ? 'Москва' : region);
    return { title: 'Суды региона ' + name, description: 'Проверенный каталог судов региона ' + name + '.', robots: courts.length ? undefined : {index:false,follow:true} };
  } catch { return { title:'Каталог судов', robots:{index:false,follow:true} }; }
}

export default async function RegionPage({params}:Props) {
  const {region} = await params;
  let courts:Awaited<ReturnType<typeof getRegionCourts>> = [];
  let label = region === 'moscow' ? 'Москва' : region;
  let failed=false;
  try {
    const [found,regions] = await Promise.all([getRegionCourts(region),getRegions()]);
    courts=found;
    label=regions.find(r=>r.slug===region)?.name ?? label;
  } catch { failed=true; }
  return <>
    <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды России</Link><span>/</span>{label}</div>
    <section className="section-hero">
      <span className="kicker">Региональный каталог</span>
      <h1>Суды: {label}</h1>
      <p className="lead">Карточки судебных органов с проверенными сведениями. Информация добавляется по мере подтверждения официальных данных.</p>
    </section>
    <section className="section-wrap">
      <div className="section-intro"><span className="eyebrow">Реестр региона</span><h2>Список судов</h2></div>
      {failed ? <div role="alert" className="notice">Данные сейчас недоступны. Попробуйте позже.</div>
        : courts.length ? <div className="results">{courts.map(c=>
          <Link key={c.id} className="result-row" href={'/courts/'+encodeURIComponent(region)+'/'+encodeURIComponent(c.slug)}>
            <span><strong>{c.name}</strong><small>{c.court_type}{c.address?' · '+c.address:''}</small></span><span aria-hidden="true">↗</span>
          </Link>
        )}</div>
        : <div className="empty-state"><h3>Проверенных карточек пока нет</h3><p>Мы не публикуем автоматически собранные адреса и телефоны до подтверждения их достоверности.</p><Link className="text-link" href="/sources">Принципы публикации →</Link></div>}
    </section>
    <section className="callout"><div><h2>Нужен другой регион?</h2><p>Перейдите к общему каталогу опубликованных судов.</p></div><Link className="button button-outline" href="/courts">Все регионы →</Link></section>
  </>;
}
