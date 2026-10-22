import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {regionalArbitrationCourt,regionalArbitrationCourts} from '../../../../lib/regional-arbitration';
import {RegionalArbitrationPreview} from '../../../../_components/regional-arbitration-preview';

type Props={params:Promise<{slug:string}>};
export const dynamicParams=false;
export function generateStaticParams(){
  return regionalArbitrationCourts('moscow').map(c=>({slug:c.slug}));
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const court=regionalArbitrationCourt('moscow',(await params).slug);
  return court
    ?{title:court.courtName+' — предварительные сведения',robots:{index:false,follow:true}}
    :{title:'Суд не найден',robots:{index:false,follow:false}};
}
export default async function MoscowArbitrationCourt({params}:Props){
  const court=regionalArbitrationCourt('moscow',(await params).slug);
  if(!court)notFound();
  return <RegionalArbitrationPreview court={court} region="moscow"/>;
}
