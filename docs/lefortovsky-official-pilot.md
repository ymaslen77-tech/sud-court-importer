# Первый реальный суд-кандидат: Лефортовский районный суд Москвы

## Подтверждённые официальные источники

1. Карточка суда: https://mos-gorsud.ru/rs/lefortovskij
2. Часы и контакты: https://mos-gorsud.ru/rs/lefortovskij/help/hours
3. Подтверждение кода 77RS0014 из УИД опубликованного дела: https://m.mos-gorsud.ru/rs/lefortovskij/services/cases/civil/details/fef64000-869b-11f1-ade9-3f611993f6c1

Официальная страница сообщает: Лефортовский районный суд, Андроньевская пл., д. 5/9, Москва, телефон экспедиции +7 (495) 912-78-86, email info@14.msksud.ru. Это исходные данные для повторной проверки, а не гарантия неизменности номера телефона.

Суд представлен в `importer/seeds/lefortovsky-official-page-staging-unreviewed.json`. Отдельный тип `mos-gorsud-court` разрешает разовый **официальный адрес конкретного суда**, а не выдуманный адрес выгрузки. Никаких координат или фотографий в этом файле нет.

## Проверяемая подготовка карточки

После обновления локальных файлов и миграций:

```powershell
Copy-Item importer\seeds\lefortovsky-official-page-staging-unreviewed.json data\import\lefortovsky.json
docker compose -f compose.local.yaml run --rm --entrypoint python importer /work/importer/federation.py validate /input/lefortovsky.json --registry mos-gorsud-court
docker compose -f compose.local.yaml run --rm --entrypoint python importer /work/importer/federation.py stage /input/lefortovsky.json --registry mos-gorsud-court
```

Последняя команда возвращает `batch_id`. Она пишет только в закрытый импорт, не в публичный каталог.

После самостоятельной проверки действующей официальной страницы, соответствия кода и условий использования владелец/редактор может утвердить запись:

```powershell
docker compose -f compose.local.yaml run --rm importer approve --batch <BATCH_ID> --code 77RS0014 --reviewer "ФИО редактора" --checked-on 2026-10-13 --verification-url https://mos-gorsud.ru/rs/lefortovskij --attest-current --attest-reuse-rights
```

Замените `BATCH_ID`, имя и дату на фактические значения. Без реальной сверки нельзя использовать оба `--attest-*`. Попытка публикации суда с кодом, уже связанным с другой записью реестра, блокируется для ручного сопоставления.

В GitHub Actions проверяется, что официальный пилот корректно валидируется и попадает в staging с состоянием pending, а количество публичных судов остаётся неизменным.

## Дальнейшие сведения

- Публикация расписания приёма, телефонов отдельных отделов и должностей судей производится отдельно с собственными источниками и датами сверки.
- Перечень судей на https://www.mos-gorsud.ru/rs/lefortovskij/structure/judges имеет дату обновления 22.04.2026; актуальность каждого назначения необходимо проверять отдельно.
- Координаты, фасад, сведения о подсудности, судебные дела и решения добавляются только при подтверждённых основаниях и правах.
- Нельзя считать эту одну запись доказательством полного покрытия Москвы.
