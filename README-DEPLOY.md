# Davomat — посещаемость практикантов / amaliyotchilar davomati

Готовое приложение: HTML + JS, без сборки. Работает локально и на Vercel + Supabase.

## Возможности / Imkoniyatlar
- Вход с логином/паролем (по умолчанию admin / admin123)
- 2 языка: RU / UZB (кнопки сверху)
- Разделы: Посещаемость / Студенты / Университеты / Отчёты
- Добавление и удаление студентов и университетов
- Отметка: ✔ пришёл / ✖ пропустил / 🕒 опоздал
- Импорт студентов из XLSX + шаблон, экспорт студентов, посещаемости, отчёта в XLSX
- Авторасчёт пропущенных дней + % посещаемости, отчёт в XLSX
- Хранение локально (localStorage) + опционально Supabase

## Запуск локально
1. Откройте `attendance-app/index.html` двойным кликом
2. Логин: `admin`, пароль: `admin123`

## Деплой на Vercel (бесплатно)
1. Зайдите на https://vercel.com -> Add New -> Project -> Import папку `attendance-app`
   или через git:
   ```
   cd attendance-app
   npx vercel
   ```
2. Всё — сайт будет вида `https://davomat-xxx.vercel.app`

## Подключение Supabase (облачная база)
1. https://supabase.com -> New Project
2. SQL Editor -> вставьте содержимое `supabase-schema.sql` -> Run
3. Settings -> API -> скопируйте URL + anon key
4. Вставьте их в `supabase-config.js`:
   ```js
   window.SUPABASE_URL = "https://xyz.supabase.co";
   window.SUPABASE_ANON_KEY = "eyJ...";
   ```
5. Заново задеплойте на Vercel

## Структура XLSX импорта студентов
| Ф.И.О. / F.I.Sh. | Университет / Universitet | Группа / Guruh | Телефон / Telefon |
Скачайте готовый шаблон кнопкой «Шаблон импорта» в разделе Студенты.

## Файлы
- `index.html` — всё приложение
- `supabase-config.js` — ключи Supabase
- `supabase-schema.sql` — таблицы для Supabase
- `vercel.json` — конфиг деплоя
