/** Navigation-only editorial taxonomy. The topic pages add the specific court
 * record and its dated sources instead of pretending to have house-level boundaries.
 */
export const MOSCOW_DISTRICT_TOPICS=[
 {slug:'jurisdiction',title:'Подсудность по адресу',description:'Как найти районный суд по улице, дому, корпусу и строению и проверить компетенцию.',order:1},
 {slug:'competence',title:'Какие дела рассматривает суд',description:'Как отличить районный суд от мирового, арбитражного и городского.',order:2},
 {slug:'filing',title:'Как подать документы',description:'Подготовка иска, заявления, ходатайства или жалобы и выбор допустимого канала подачи.',order:3},
 {slug:'cases',title:'Поиск дел и заседаний',description:'Как найти сведения по делу и проверить дату заседания по официальному реестру.',order:4},
 {slug:'appeal',title:'Порядок обжалования',description:'Куда направить жалобу на акт районного суда с учётом вида производства.',order:5},
 {slug:'fees',title:'Государственная пошлина',description:'Как проверить льготы, размер платежа и актуальные реквизиты именно выбранного суда.',order:6},
 {slug:'judges',title:'Судьи и структура суда',description:'Опубликованный состав судей, приказы и назначения, контакты аппарата.',order:7},
 {slug:'faq',title:'Адреса, контакты и вопросы',description:'Что проверить перед посещением, включая временные помещения и связь с канцелярией.',order:8}
] as const;
export type MoscowDistrictTopicSlug=typeof MOSCOW_DISTRICT_TOPICS[number]['slug'];
export function moscowDistrictTopic(slug:string){return MOSCOW_DISTRICT_TOPICS.find(x=>x.slug===slug);}
export function moscowDistrictTopicHref(courtSlug:string,topic:string){
 return '/courts/moscow/registry/'+courtSlug+'/info/'+topic;
}
export function moscowDistrictTopicNext(slug:string){
 const position=MOSCOW_DISTRICT_TOPICS.findIndex(x=>x.slug===slug);
 return position<0||position>=MOSCOW_DISTRICT_TOPICS.length-1?null:MOSCOW_DISTRICT_TOPICS[position+1];
}
