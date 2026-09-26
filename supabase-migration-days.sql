-- Migration: дни недели студента (Kunlar / Дни)
-- SQL Editor -> New query -> Run. Потом нажать «Синхронизировать» на сайте.

alter table students add column if not exists days text default '';
