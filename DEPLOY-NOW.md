# Davomat PRO — быстрый деплой на Vercel (без установки Node)

У тебя нет Node/Git на ПК, поэтому самый быстрый путь — через сайт (3 минуты).

## Вариант 1 — через GitHub + Vercel (рекомендую, бесплатно)

1. Зайди на https://github.com → New repository → имя `davomat-attendance` → Create
2. Нажми `uploading an existing file` → перетащи ВСЕ файлы из папки:
   `Рабочий стол\davomat-attendance-app\` (index.html, vercel.json, supabase-config.js...)
   → Commit changes
3. Зайди на https://vercel.com → Sign Up (через GitHub) → Add New → Project
   → Import `davomat-attendance` → Deploy
4. Готово! Получишь ссылку вида `https://davomat-attendance.vercel.app`

## Вариант 2 — через Vercel CLI (если хочешь, чтобы я залил сам)

1. Установи Node.js: https://nodejs.org (LTS) + Git: https://git-scm.com
2. Перезапусти терминал, скажи мне — я выполню:
   ```
   cd "Рабочий стол\davomat-attendance-app"
   npx vercel --prod
   ```
3. Откроется браузер → Login → Enter → получишь ссылку.

## Важно после деплоя
- Открой ссылку с телефона и ПК — всё работает (localStorage отдельно на каждом устройстве).
- Для общей базы на всех устройствах: подключи Supabase:
  supabase.com → SQL → вставь supabase-schema.sql → ключи в supabase-config.js → залей заново на GitHub → Vercel сам передеплоит.
