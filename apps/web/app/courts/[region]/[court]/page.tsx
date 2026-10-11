import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
type Court={id:string;name:string;slug:string;court_type:string;address:string|null;verified_at:string};
type Props={params:Promise<{region:string;court:string}>};
const origin=process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
async function getCourt(region:string,court:string):Promise<Court|null>{try{const r=await fetch(`${origin}/api/v1/regions/${encodeURIComponent(region)}/courts/${encodeURIComponent(court)}`,{next:{revalidate:3600}}); if(r.status===404)return null;if(!r.ok)throw Error();return await r.json() as Court;}catch{return null;}}
export async function generateMetadata({params}:Props):Promise<Metadata>{const p=await params;const c=await getCourt(p.region,p.court);return c?{title:c.name,description:`${c.name}: проверенные справочные сведения, адрес и информация о суде.`}:{title:'Суд не найден',robots:{index:false}};}
export default async function CourtPage({params}:Props){const p=await params;const c=await getCourt(p.region,p.court);if(!c)notFound();return <><p><Link href={`/courts/${p.region}`}>Суды региона</Link></p><h1>{c.name}</h1><div className="card"><p><strong>Тип:</strong> {c.court_type}</p><p><strong>Адрес:</strong> {c.address ?? 'Данные уточняются'}</p><p className="muted">Проверено: {new Date(c.verified_at).toLocaleDateString('ru-RU',{timeZone:'UTC'})}</p></div><p>Сведения о подсудности, контактах и судьях будут добавляться только с подтверждёнными первоисточниками.</p></>;}
