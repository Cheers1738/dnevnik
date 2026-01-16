# AI-дневник (MVP)

Минимальный MVP “AI-дневника” с интервью, поддержкой и оцифровкой жизни. Локальное хранение — IndexedDB, сервер получает только генерацию артефакта и E2EE синк (сервер не расшифровывает).

## Стек

- **Web**: Next.js (App Router) + TypeScript + Tailwind
- **API**: Fastify + TypeScript
- **DB**: Postgres (Docker Compose)
- **Shared**: Zod схемы и типы
- **Tests**: Vitest, Playwright, ESLint, TypeScript

## Быстрый старт

```bash
npm install --no-audit --no-fund
```

Если в окружении есть кастомный npm registry, в репозитории зафиксирован `registry=https://registry.npmjs.org/` в `.npmrc`. Если видите 403 от npm, используйте установку с `--no-audit --no-fund`.

### Запуск через Docker Compose

```bash
docker compose up --build
```

Web: http://localhost:3000
API: http://localhost:4000/health

### Локальная разработка (без Docker)

```bash
npm run dev
```

## Проверки

```bash
./scripts/verify.sh
```

Smoke тест (нужен Docker):

```bash
LLM_STUB=1 ./scripts/smoke.sh
```

E2E:

```bash
npm run e2e
```

## LLM_STUB режим

Если нет ключей LLM или установлен `LLM_STUB=1`, API возвращает детерминированный артефакт.

```bash
export LLM_STUB=1
```

## Переменные окружения

- `DATABASE_URL` — строка подключения к Postgres (API)
- `JWT_SECRET` — секрет для JWT (API)
- `OPENAI_API_KEY` — ключ для LLM (если есть)
- `OPENAI_BASE_URL` — опционально, для OpenAI-compatible API
- `OPENAI_MODEL` — опционально

## Структура

```
apps/web        # Next.js UI
apps/api        # Fastify API
packages/shared # Zod схемы и типы
scripts         # verify/smoke
```
