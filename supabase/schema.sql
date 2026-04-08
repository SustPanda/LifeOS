create extension if not exists "pgcrypto";

create table if not exists profile (
  id bigint primary key generated always as identity,
  name text,
  avatar_url text,
  bio text,
  quote text,
  theme_mode text default 'dark' check (theme_mode in ('dark', 'light'))
);

create table if not exists skills (
  id bigint primary key generated always as identity,
  name text not null,
  category text not null,
  xp integer not null default 0,
  time_logged_minutes integer not null default 0,
  progress_percent numeric(5,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists skill_sessions (
  id bigint primary key generated always as identity,
  skill_id bigint not null references skills(id) on delete cascade,
  duration_minutes integer not null,
  date date not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists workouts (
  id bigint primary key generated always as identity,
  date date not null,
  exercise_name text not null,
  sets integer not null,
  reps integer not null,
  weight_kg numeric(8,2) not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists books (
  id bigint primary key generated always as identity,
  title text not null,
  author text not null,
  genre text not null default 'other',
  status text not null check (status in ('want to read', 'reading', 'finished')),
  current_page integer not null default 0,
  total_pages integer not null default 0,
  rating integer check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists reading_logs (
  id bigint primary key generated always as identity,
  book_id bigint not null references books(id) on delete cascade,
  previous_page integer not null default 0,
  current_page integer not null default 0,
  pages_read integer not null default 0,
  date date not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists projects (
  id bigint primary key generated always as identity,
  name text not null,
  description text,
  priority text not null check (priority in ('low', 'medium', 'high')),
  deadline date,
  status text not null check (status in ('todo', 'inprogress', 'done')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists tasks (
  id bigint primary key generated always as identity,
  project_id bigint not null references projects(id) on delete cascade,
  title text not null,
  priority text not null check (priority in ('low', 'medium', 'high')),
  deadline date,
  status text not null check (status in ('todo', 'inprogress', 'done')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create table if not exists weekly_summary (
  id bigint primary key generated always as identity,
  week_start_date date not null unique,
  skills_minutes integer not null default 0,
  workouts_count integer not null default 0,
  books_pages integer not null default 0,
  tasks_completed integer not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists daily_todos (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  completed boolean default false,
  created_at date default current_date
);

create table if not exists learnings (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists exercises (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists rep_logs (
  id uuid default gen_random_uuid() primary key,
  exercise_id uuid references exercises(id) on delete cascade,
  reps integer not null,
  logged_at timestamptz default now()
);

alter table books add column if not exists genre text not null default 'other';

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at
before update on tasks
for each row
execute function set_updated_at();

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

alter table profile enable row level security;
alter table skills enable row level security;
alter table skill_sessions enable row level security;
alter table workouts enable row level security;
alter table books enable row level security;
alter table reading_logs enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table weekly_summary enable row level security;
alter table daily_todos enable row level security;
alter table learnings enable row level security;
alter table exercises enable row level security;
alter table rep_logs enable row level security;

create policy "Public full access profile" on profile for all using (true) with check (true);
create policy "Public full access skills" on skills for all using (true) with check (true);
create policy "Public full access skill_sessions" on skill_sessions for all using (true) with check (true);
create policy "Public full access workouts" on workouts for all using (true) with check (true);
create policy "Public full access books" on books for all using (true) with check (true);
create policy "Public full access reading_logs" on reading_logs for all using (true) with check (true);
create policy "Public full access projects" on projects for all using (true) with check (true);
create policy "Public full access tasks" on tasks for all using (true) with check (true);
create policy "Public full access weekly_summary" on weekly_summary for all using (true) with check (true);
create policy "Public full access daily_todos" on daily_todos for all using (true) with check (true);
create policy "Public full access learnings" on learnings for all using (true) with check (true);
create policy "Public full access exercises" on exercises for all using (true) with check (true);
create policy "Public full access rep_logs" on rep_logs for all using (true) with check (true);

create policy "Public read avatar bucket" on storage.objects
for select
using (bucket_id = 'avatars');

create policy "Public write avatar bucket" on storage.objects
for insert
with check (bucket_id = 'avatars');

create policy "Public update avatar bucket" on storage.objects
for update
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');
