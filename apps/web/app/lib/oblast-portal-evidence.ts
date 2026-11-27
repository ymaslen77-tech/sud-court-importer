/** Addresses seen in indexed copies of official court pages on 2026-11-28.
 * A published URL is not proof of present availability or successful search. */
export type OblastPortalEvidence={url:string;information?:string;note?:string;contactNote?:string};
export const OBLAST_PORTAL_EVIDENCE:Readonly<Record<string,OblastPortalEvidence>>={
  "vidnoe-city-court": {
    "url": "https://vidnoe--mo.sudrf.ru/modules.php?name=sud_delo",
    "information": "https://vidnoe--mo.sudrf.ru/modules.php?name=info_court",
    "note": "Сайт суда отдельно предупреждает, что обычная электронная почта и обращения граждан не предназначены для подачи процессуальных документов.",
    "contactNote": "В перечне Управления указан также телефон председателя: 8 (498) 547-61-46."
  },
  "podolsk-city-court": {
    "url": "https://podolsky--mo.sudrf.ru/modules.php?name=sud_delo&name_op=d&srv_num=1",
    "contactNote": "В перечне Управления указаны два здания; дополнительно опубликованы телефоны 8 (496) 769-94-42 и 769-94-94. Перед визитом уточните корпус."
  },
  "khimki-city-court": {
    "url": "https://himki--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "lyubertsy-city-court": {
    "url": "https://luberetzy--mo.sudrf.ru/modules.php?name=sud_delo",
    "contactNote": "В перечне Управления отдельно указаны канцелярии: уголовная 8 (498) 642-99-91, гражданская 8 (498) 642-99-15."
  },
  "mytishchi-city-court": {
    "url": "https://mitishy--mo.sudrf.ru/modules.php?name=sud_delo",
    "information": "https://mitishy--mo.sudrf.ru/modules.php?name=information",
    "note": "Официальный раздел справочной информации содержит ссылки на графики приёма, телефонный справочник, реквизиты и мировые участки; содержание отдельных документов пока не сверено."
  },
  "domodedovo-city-court": {
    "url": "https://domodedovo--mo.sudrf.ru/modules.php?name=sud_delo",
    "information": "https://domodedovo--mo.sudrf.ru/modules.php?name=info_court"
  },
  "balashikha-city-court": {
    "url": "https://balashihinsky--mo.sudrf.ru/modules.php?name=sud_delo",
    "contactNote": "Телефон приёмной 8 (495) 521-16-71, дополнительный номер 529-33-84 указан также на официальном сайте суда."
  },
  "dolgoprudny-city-court": {
    "url": "https://dolgoprudniy--mo.sudrf.ru/modules.php?name=sud_delo",
    "information": "https://dolgoprudniy--mo.sudrf.ru/modules.php?name=info_court",
    "contactNote": "На официальном сайте и в перечне Управления опубликованы номера 8 (495) 408-70-11 и 408-82-12."
  }
};
export const OBLAST_PORTAL_OBSERVED_ON='2026-11-28';
export const OBLAST_DIRECTORY_SOURCE='https://usd--mo.sudrf.ru/modules.php?name=sud';
