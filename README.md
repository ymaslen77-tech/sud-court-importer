# Суды России — единый правовой портал

Фундамент независимого справочно-информационного портала судов РФ. Текущий прототип **не содержит вымышленных сведений** и пока не импортирует официальные данные.

## Локальный хост на Windows (рекомендуется)

Потребуются установленные **Git** и работающий **Docker Desktop**. Node.js и pnpm на Windows устанавливать отдельно не требуется.

В PowerShell:

```powershell
git clone --branch feat/001-court-portal-foundation https://github.com/ymaslen77-tech/sud-court-importer.git
cd sud-court-importer
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```

Скрипт поднимет базу данных, API и Next.js в изолированной Docker Compose-среде, дождётся HTTP-ответа и **откроет сайт в браузере Windows**.

- **Сайт:** http://localhost:4173
- **Health API:** http://localhost:4174/api/v1/health
- **Каталог Москвы:** http://localhost:4173/courts/moscow

Порты опубликованы **только на 127.0.0.1**, сайт недоступен из внешнего интернета. PostgreSQL вообще не открывает порт на компьютере. Отдельное имя сети и отдельный том для БД позволяют не смешивать проект с другими Docker Compose-проектами.

### Управление

```powershell
# Проверить состояние:
docker compose -f compose.local.yaml ps

# Посмотреть сообщения сервисов:
docker compose -f compose.local.yaml logs --tail 100

# Остановить сервисы (данные БД останутся):
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop-local.ps1

# Пересобрать после изменений:
docker compose -f compose.local.yaml up --build --detach
```

В случае конфликта порта 4173 необходимо изменить внешний порт в `compose.local.yaml` и URL в `scripts/start-local.ps1` одновременно.

## Стек и структура

- Next.js / React / TypeScript — публичные серверные страницы и SEO.
- NestJS / TypeScript — HTTP API.
- PostgreSQL + PostGIS — проверенные записи, назначения и геоданные.
- Docker Compose — выделенный локальный хост.
- Python importer, полнотекстовый поиск и личный кабинет — **будущие задачи**, не реализованы.

## API

- `GET /api/v1/health`
- `GET /api/v1/regions/:region/courts`
- `GET /api/v1/regions/:region/courts/:court`

Доступны только записи `verified`. Без предварительной загрузки и проверки официальных сведений каталог остаётся пустым — это ожидаемое состояние. Файлы `db/migrations` выполняются при **первой инициализации** пустого тома PostgreSQL.

См. [политику данных](docs/data-policy.md) и [план развития](docs/roadmap.md).
