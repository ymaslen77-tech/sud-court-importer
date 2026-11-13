# Проверка схемы реальных гражданских JSON Москвы (без публикации)

Оба официальных ZIP загружены и распакованы пользователем на VPS. Поля
из первого примера включают lowerCamelCase `uid`, `number`, `judgeTeam`,
`lower`, `dateFinal`, `dateReg`, `publishingState`, `participants`.
Это показывает несовместимость части текущего словаря `FIELDS` с реальным
экспортом; значения и смысл некоторых полей ещё не подтверждены.

Нельзя автоматически считать `dateFinal` датой судебного решения,
`judgeTeam` ФИО единоличного судьи, а `lower` связью апелляции до проверки
вложенной схемы и реальных статусов. Поля `participants` запрещено
копировать в публичный JSON или технический отчёт.

Из каталога `/srv/sudy-bulk-work`:

```bash
git pull --ff-only origin infra/coolify-russian-vps
data/import/.moscow-venv/bin/python -m unittest discover -s importer/tests -p 'test_moscow_schema_audit.py' -v
data/import/.moscow-venv/bin/python importer/moscow_schema_audit.py --limit 300 --compact
```

Аудит потоково просматривает не более 300 записей на источник и печатает
только имена полей, имена вложенных полей судей/инстанций, число совпадений
по старым алиасам и агрегированную причину отказов импортёра.
Никаких фактических ФИО, номеров дела, судебных текстов или значений полей
не выводится. Расшифровка полей и настройка маппинга выполняются после
анализа отчёта. Не запускать `--apply`, `--push` или Coolify Redeploy.

## 05.11.2026 — диагностический результат и корректировка

В одном из отчётов по 300 апелляционным записям было
`missing_or_invalid_uin: 300`. Это старое сообщение объединяло **два**
случая: поле УИД отсутствует в словаре импортёра или его значение не
соответствует жёсткому шаблону. Нельзя утверждать, что сами УИД неверные.

Установлены безопасные альтернативные имена полей:
`uid`, `number`, `url`, `dateReg`, `lower`, а также во вложенных
ссылках `lower[].number`. Они допускаются лишь после обычной проверки
УИД, URL, даты, номера и связанного судьи. Старый формат продолжает работать.

`judgeTeam` не преобразуется автоматически в ФИО судьи:
без подтверждения типа и содержимого это было бы выдуманным
установлением судьи. `dateFinal` не считается датой вынесения решения,
и неизвестный результат не становится «удовлетворено/отказано».

Обновлённый аудит печатает `fieldFormatCounts`, `fieldTypes`,
`existingImporterOutcomes` **без значений** оригинальных полей.
Повторно выполнить:
```bash
cd /srv/sudy-bulk-work && git pull --ff-only origin infra/coolify-russian-vps
data/import/.moscow-venv/bin/python -m unittest discover -s importer/tests -p 'test_moscow_bulk_judge_pipeline.py' -v
data/import/.moscow-venv/bin/python -m unittest discover -s importer/tests -p 'test_moscow_schema_audit.py' -v
data/import/.moscow-venv/bin/python importer/moscow_schema_audit.py --limit 300 --compact
```
Вывод содержит только количество форматов и причин отказа; без ФИО,
номеров дел и другой информации об участниках.


## Продолжение проверки по реальным выгрузкам (05.11.2026)

Из 300 апелляционных записей 273 прошли предварительный разбор
`appeal_row`, 17 не содержали распознаваемых `lower[].number`,
10 не прошли проверку УИД. Это **не число связанных судебных дел**:
связь первой и апелляционной инстанций устанавливается только после
сопоставления УИД, номера и судьи с первой инстанцией.

Для диагностики без раскрытия ФИО добавлены:
- `judgeTeamRosterMatch`: число точных/однозначных совпадений
  строки `judgeTeam` с официальным перечнем конкретного суда;
- `lowerReferenceFormat`: причины отсутствия связей `lower`
  и количество номеров, проходящих существующий шаблон.

Совпадение по кадровому справочнику — лишь **кандидат на атрибуцию**,
не достаточная юридическая проверка судьи. `dateFinal` и результат
апелляции по-прежнему нельзя использовать как проверенную мотивировку.

Краткая безопасная сводка, по 1000 записей каждого реестра:

```bash
cd /srv/sudy-bulk-work
data/import/.moscow-venv/bin/python importer/moscow_schema_audit.py --limit 1000 --compact \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print(json.dumps({k:{"sampledRecords":d[k]["sampledRecords"],"existingImporterOutcomes":d[k]["existingImporterOutcomes"],"judgeTeamRosterMatch":d[k]["judgeTeamRosterMatch"],"lowerReferenceFormat":d[k]["lowerReferenceFormat"],"fieldFormatCounts":d[k]["fieldFormatCounts"]} for k in ("first","appeal")},ensure_ascii=False,indent=2))'
```

Команда не сохраняет в Git никакие реальные записи и ничего не публикует.
