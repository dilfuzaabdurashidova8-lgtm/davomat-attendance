-- Supabase schema: Davomat / Посещаемость
-- SQL Editor da ishga tushiring

create table if not exists universities (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists students (
  id text primary key,
  full_name text not null,
  university_id text references universities(id) on delete cascade,
  group_name text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists attendance (
  date date not null,
  student_id text references students(id) on delete cascade,
  status text not null check (status in ('present','absent','late')),
  created_at timestamptz default now(),
  primary key (date, student_id)
);

-- RLS ni o'chirish (maktab ichki loyiha uchun, sodda):
alter table universities disable row level security;
alter table students disable row level security;
alter table attendance disable row level security;

-- Agar RLS kerak bo'lsa:
-- alter table universities enable row level security;
-- create policy "open" on universities for all using (true) with check (true);
-- alter table students enable row level security;
-- create policy "open" on students for all using (true) with check (true);
-- alter table attendance enable row level security;
-- create policy "open" on attendance for all using (true) with check (true);
