# Coolify `sudy-web`: тайм-аут npm при Deploy 26.11.2026

## Что видно в журнале

Предоставленный скриншот панели Coolify (`sudy-web → Deployment`) показывает:

```text
Dockerfile.coolify.web:11
RUN npm install -g pnpm@10.15.0
npm error code ETIMEDOUT
npm error syscall read
Invalid response body while trying to fetch https://registry.npmjs.org/pnpm: read ETIMEDOUT
```

**Это сетевой тайм-аут контейнера сборки, а не ошибка TypeScript или Next.js.**
Строка `Running (no healthcheck)` наверху означает, что приложение в целом показывает running, **не что отмеченная красным новая сборка состоялась**. В истории сбой относится к `e38b732`; на момент исследования в GitHub рабочая ветка имела HEAD `f6c2609`, поэтому версия Git-источника Coolify должна быть проверена отдельно. По одной истории деплоев нельзя доказать неправильную привязку ветки: это может быть исторический/отложенный выпуск.

## Изменение кода

`Dockerfile.coolify.web`:

1. Сохранены версия Node.js 22, pnpm 10.15.0, монорепозиторий `@courts/web`, порт 3000 и непривилегированный `USER node`.
2. В builder установлен `NODE_OPTIONS=--dns-result-order=ipv4first` для случаев проблем с IPv6; npm обращается **только к официальному** `registry.npmjs.org`, с увеличенными тайм-аутами и ограниченными повторными попытками.
3. BuildKit cache mount для `/root/.npm` и `/pnpm/store` позволяет повторно использовать скачанные архивы пакетов; данные из закрытых судебных архивов не помещаются в кеш зависимостей.
4. `pnpm install` также повторяется после временных ошибок. Сборка не объявляется успешной при отказе загрузить зависимости.
5. Вторую сетевую установку `pnpm` в runtime-стадии убрали: менеджер копируется из успешно собранного builder и запускается из `/usr/local/bin/pnpm`. Подстановка версии контролируется `pnpm --version`; нет `curl | bash`, обхода сертификатов, недоверенных зеркал или незакреплённой версии.
6. Добавлен workflow `.github/workflows/coolify-web-docker-build.yml`, который действительно выполняет `docker build -f Dockerfile.coolify.web`, затем проверяет `pnpm --version` в готовом образе и локально запускает Next.js с доступом к `/api/status`, `/courts/moscow-region/cases`, `/search`. Тест не обращается к Coolify и не публикует образ.

## Что необходимо выполнить после принятого PR и зелёного Docker CI

1. В Coolify открыть приложение `sudy-web` → `Configuration / Build / Git Source` (названия пунктов зависят от версии). Проверить репозиторий `ymaslen77-tech/sud-court-importer`, ветку `infra/coolify-russian-vps`, `Dockerfile.coolify.web`, build context `.` и порт 3000.
2. Убедиться, что указан **новый коммит** рабочей ветки после merge PR, а не `e38b732` из истории неуспешной сборки; не менять настройки других приложений или данные базы.
3. Нажать **Deploy** для `sudy-web`; увидеть в истории зелёный статус новой сборки и `Running` / реальную проверку ответов HTTP.
4. Проверить `https://sud-russia.ru/courts/moscow-region/cases`, `/courts/moscow`, `/search?q=33-32970%2F2026`. Тексты проверенных судебных решений и текущий штат судей автоматически не добавляются.

**Граница доступа:** у текущего чат-сеанса нет авторизованного Coolify API или SSH. Журнал прочитан только с переданного скриншота; серверные DNS/маршруты и более ранние строки build-лога непосредственно не проверены. Этот код повышает устойчивость к временным сбоям, но **не исправляет полностью запрещённые исходящие подключения**.

## Только если даже с новой сборкой остаётся ETIMEDOUT

Нужна серверная проверка от администратора или авторизованный облачный браузер, а не ещё одна перестройка приложения. Сначала проверить из среды VPS:

```bash
getent ahostsv4 registry.npmjs.org
curl -4 -I --connect-timeout 10 --max-time 25 https://registry.npmjs.org/pnpm
```

И отдельно именно из Docker-сети, где собирается Coolify:

```bash
docker run --rm node:22-bookworm-slim node -e "fetch('https://registry.npmjs.org/pnpm',{signal:AbortSignal.timeout(15000)}).then(r=>console.log(r.status)).catch(e=>{console.error(e.cause?.code||e.message);process.exit(1)})"
```

Если VPS имеет связь, а Docker — нет, проверять Docker DNS, proxy/NAT/iptables/IPv6. Если оба теста не проходят — провайдерский egress/firewall/DNS. Не отключать TLS и не заменять официальный registry неподтверждённым зеркалом для правового проекта.

## Отдельная безопасность панели управления

На снимке Coolify открыт через обычный HTTP по публичному IP и порту 8000, браузер показывает «Не защищено». После восстановления сборки следует настроить HTTPS-домен для административной панели и ограничить доступ к нему через firewall или VPN. Не пересылать логины и секреты в чат.
