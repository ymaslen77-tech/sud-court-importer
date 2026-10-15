# Обновление localhost на Windows с резервным копированием

Для выполнения пользовательских проверок запускайте Windows PowerShell **7** и Docker Desktop. Код GitHub **не обновляет localhost автоматически**.

## Безопасный сценарий

В корне текущего проекта `$HOME\sud-court-local` запускайте:

```powershell
pwsh -NoProfile -File .\scripts\update-local-safe.ps1
```

Скрипт скачивает последнее содержимое ветки `feat/001-court-portal-foundation` в системный временный каталог, проверяет наличие исходного проекта, запускает PostgreSQL, **создаёт бинарный pg_dump через контейнер** и сохраняет резервную копию в `$HOME\sud-court-backups\courts-YYYYMMDD-HHMMSS.dump`.

Только после того как копия существует и имеет ненулевой размер, файлы репозитория копируются поверх существующего каталога, применяются миграции, пересобираются контейнеры, и проверяются HTTP-ответы API и каталога.

**Не используются** `docker compose down -v`, `docker volume rm`, удаление PostgreSQL и зеркальное стирание локального проекта. Файлы `data/import` и `apps/web/public/court-media` не удаляются целенаправленно.

Скрипт не запускает автоматически профили `watch` или `intake`. Даже если они включены вручную, их работа зависит от доступности локального компьютера.

## Если миграция или сборка упала

Скрипт останавливается и оставляет резервную копию. Ничего не удаляйте из `sud-court-backups`. До восстановления сначала соберите вывод:

```powershell
docker compose -f compose.local.yaml ps
docker compose -f compose.local.yaml logs --tail 100 api web postgres
```

Восстановление `pg_restore` может уничтожить изменённые после резервирования данные, поэтому **не запускайте его автоматически**. Сначала выясните причину ошибки и выполните восстановление из подходящей копии в отдельной тестовой базе.

## Что НЕ считается готовностью к публичному запуску

Успешное обновление локального Docker-проекта не означает, что все суды наполнены, имена судей актуальны и разрешён массовый доступ к официальным источникам. Для объективной проверки базы служит:

```powershell
docker compose -f compose.local.yaml run --rm --entrypoint python importer /work/importer/coverage.py
docker compose -f compose.local.yaml run --rm --entrypoint python importer /work/importer/readiness.py --public-url https://VALID-VERIFIED-DOMAIN
```

Пока нет реальных подтверждённых судов и работающего мониторинга, `pilot_technical_ready` обязан оставаться `false`. Даже `true` не доказывает общероссийскую полноту: `nationwide_complete` остаётся `NOT_ASSESSED` до отдельной приёмки источников, состава реестра и территорий.
