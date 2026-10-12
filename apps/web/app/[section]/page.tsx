import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { sections } from '../lib/sections';

type Props = { params: Promise<{ section: string }> };

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  const data = sections[section];
  if (!data) return { title: 'Раздел не найден', robots: { index: false } };
  return {
    title: data.title,
    description: data.description,
    robots: data.status === 'planned' ? { index: false, follow: true } : undefined,
  };
}
export default async function SectionPage({ params }: Props) {
  const { section } = await params;
  const data = sections[section];
  if (!data) notFound();
  return <>
    <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>{data.title}</div>
    <section className="section-hero">
      <div className="kicker">{data.eyebrow}</div>
      <h1>{data.title}</h1>
      <p className="lead">{data.description}</p>
      <div className="notice"><span className="notice-dot" aria-hidden="true" />{data.featured}</div>
    </section>
    <section aria-label="Возможности раздела" className="section-wrap">
      <div className="section-intro"><span className="eyebrow">Как это устроено</span><h2>Проверенная информация — прежде всего</h2></div>
      <div className="feature-grid two-columns">
        {data.blocks.map((block, index) => <article className="feature-card" key={block.title}>
          <span className="feature-index">{String(index + 1).padStart(2, '0')}</span>
          <h3>{block.title}</h3><p>{block.body}</p>
        </article>)}
      </div>
    </section>
    <section className="callout">
      <div><span className="eyebrow">Продолжить</span><h2>Полезные разделы и официальные ресурсы</h2></div>
      <div className="callout-links">{data.links.map((link) => link.external
        ? <a key={link.href} href={link.href} rel="noopener noreferrer" target="_blank">{link.label} ↗</a>
        : <Link key={link.href} href={link.href}>{link.label} →</Link>
      )}</div>
    </section>
  </>;
}
