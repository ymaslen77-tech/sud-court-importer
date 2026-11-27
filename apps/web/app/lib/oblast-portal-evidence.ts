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
  },
  "dmitrov-city-court": {
    "url": "https://dmitrov--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "egorievsk-city-court": {
    "url": "https://egorievsk--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "zhukovsky-city-court": {
    "url": "https://zhukovsk--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "kolomna-city-court": {
    "url": "https://kolomna--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "korolev-city-court": {
    "url": "https://korolev--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "ramenskoe-city-court": {
    "url": "https://ramenskoe--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "serpukhov-city-court": {
    "url": "https://serpuhov--mo.sudrf.ru/modules.php?name=sud_delo&srv_num=1"
  },
  "chekhov-city-court": {
    "url": "https://chehov--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "shelkovo-city-court": {
    "url": "https://shelkovo--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "volokolamsk-city-court": {
    "url": "https://volokolamsk--mo.sudrf.ru/modules.php?name=sud_delo&srv_num=1",
    "information": "https://volokolamsk--mo.sudrf.ru/",
    "note": "На официальной странице названы постоянные судебные присутствия в Лотошино и Шаховской; точное распределение работы по зданиям ещё не принято."
  },
  "voskresensk-city-court": {
    "url": "https://voskresensk--mo.sudrf.ru/modules.php?name=sud_delo",
    "information": "https://voskresensk--mo.sudrf.ru/modules.php?name=sud",
    "note": "Обнаружено расхождение контактных сведений: заголовок сохранённой страницы суда показывает другой номер 8 (496) 442-44-49. Не заменяем контакты из справочника без дополнительной проверки."
  },
  "zheleznodorozhny-city-court": {
    "url": "https://zheleznodorojniy--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "zaraysk-city-court": {
    "url": "https://zaraisk--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "ivanteevka-city-court": {
    "url": "https://ivanteevka--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "istra-city-court": {
    "url": "https://istra--mo.sudrf.ru/modules.php?name=sud_delo",
    "contactNote": "В официальных публикациях дополнительно указаны гражданская канцелярия 8 (495) 994-50-18 и уголовная канцелярия / административные правонарушения 8 (495) 994-50-35."
  },
  "kashira-city-court": {
    "url": "https://kashira--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "lukhovitsy-district-court": {
    "url": "https://luhovitsy--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "mozhaysk-city-court": {
    "url": "https://mojaisk--mo.sudrf.ru/modules.php?name=sud_delo",
    "contactNote": "Официальный источник указывает отдельно приёмную 8 (49638) 2-59-52 и общий отдел 2-07-88."
  },
  "naro-fominsk-city-court": {
    "url": "https://naro-fominsk--mo.sudrf.ru/modules.php?name=sud_delo",
    "contactNote": "В официальных публикациях указаны 4 и 5 этажи здания; дополнительные номера 8 (496) 343-79-58 и 343-96-01 (факс)."
  },
  "noginsk-city-court": {
    "url": "https://noginsk--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "odintsovo-city-court": {
    "url": "https://odintsovo--mo.sudrf.ru/modules.php?name=sud_delo&srv_num=",
    "contactNote": "Официальный источник также указывает здание в Звенигороде (ул. Почтовая, 51), гражданскую канцелярию (495) 590-74-76 и уголовную (495) 593-56-20. Назначение здания уточняйте."
  },
  "ozyory-city-court": {
    "url": "https://ozery--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "orekhovo-zuyevo-city-court": {
    "url": "https://orehovo-zuevo--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "pavlovsky-posad-city-court": {
    "url": "https://pavlov-posad--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "reutov-city-court": {
    "url": "https://reutov--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "ruza-district-court": {
    "url": "https://ruza--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "sergiev-posad-city-court": {
    "url": "https://sergiev-posad--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "solnechnogorsk-city-court": {
    "url": "https://solnechnogorsk--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "taldom-district-court": {
    "url": "https://taldom--mo.sudrf.ru/modules.php?name=sud_delo&srv_num=",
    "information": "https://taldom--mo.sudrf.ru/modules.php?name=information",
    "note": "В официальной справочной информации опубликованы ссылки на мировой судебный район, реквизиты и телефонный справочник; отдельные документы не приняты."
  },
  "shatura-city-court": {
    "url": "https://shatura--mo.sudrf.ru/modules.php?name=sud_delo"
  },
  "elektrostal-city-court": {
    "url": "https://elektrostal--mo.sudrf.ru/modules.php?name=sud_delo",
    "information": "https://elektrostal--mo.sudrf.ru/modules.php?name=information&rid=1",
    "note": "Найден официальный телефонный справочник с должностями и указами; полный текущий состав отдельно не подтверждён."
  }
};
export const OBLAST_PORTAL_OBSERVED_ON='2026-11-28';
export const OBLAST_DIRECTORY_SOURCE='https://usd--mo.sudrf.ru/modules.php?name=sud';
