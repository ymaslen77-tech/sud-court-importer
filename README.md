# Суды России — единый правовой портал

Стартовый фундамент независимого портала судов РФ. Текущий прототип не содержит фиктивных сведений о судах.

## Стек
- Next.js / React / TypeScript — публичные серверные страницы и SEO.
- NestJS / TypeScript — HTTP API.
- PostgreSQL + PostGIS — проверенные записи и будущая адресная подсудность.
- Python importer, полнотекстовый поиск и личный кабинет — дальнейшие задачи, **ещё не реализованы**.

## Запуск
Требуются Node.js 22+, pnpm 10+, Docker.

```bash
docker compose up -d
pnpm install
DATABASE_URL=postgresql://courts:courts@localhost:5432/courts pnpm --filter @courts/api dev
```

Во втором терминале:
```bash
pnpm --filter @courts/web dev
```

Интерфейс: http://localhost:3000; health API: http://localhost:4000/api/v1/health.

Файлы `db/migrations` выполняются только при **первой** инициализации пустого тома PostgreSQL. На существующей БД применять миграции отдельно с учётом данных. Публичных записей при запуске нет.

## API
- `GET /api/v1/health`
- `GET /api/v1/regions/:region/courts`
- `GET /api/v1/regions/:region/courts/:court`

Все публичные запросы возвращают только записи `verified`. Не импортировать данные в `verified` без официальной проверки. До появления данных региональные страницы исключены из индексации.

См. [политику данных](docs/data-policy.md) и [план развития](docs/roadmap.md).
