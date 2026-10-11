import Link from 'next/link';
import type { Metadata } from 'next';
type Court = { id: string; name: string; slug: string; court_type: string; address: string | null };
type Props = { params: Promise<{region:string}> };
const origin = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
export async function generateMetadata({params}:Props):Promise<Metadata> { const {region}=await params; return { title: `Суды региона: ${region}`, robots: { index: false, follow: true } }; }
export default async function RegionPage({params}:Props) {
  const {region}=await params;
  let courts:Court[]=[]; let failed=false;
  try { const r=await fetch(`${origin}/api/v1/regions/${encodeURIComponent(region)}/courts`, {next:{revalidate:3600}}); if(!r.ok) throw Error(); courts=await r.json() as Court[]; } catch { failed=true; }
  return <><p><Link href="/">Главная</Link> / {region}</p><h1>Суды региона: {region}</h1>{failed?<p role="alert">Данные временно недоступны.</p>:courts.length===0?<p>Проверенные карточки ещё не опубликованы.</p>:<ul>{courts.map(c=><li key={c.id}><Link href={`/courts/${region}/${c.slug}`}>{c.name}</Link> — {c.address ?? 'Адрес уточняется'}</li>)}</ul>}</>;
}
