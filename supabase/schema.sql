create table if not exists public.documents (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  content text not null default '',
  created_at bigint not null,
  updated_at bigint not null
);

create table if not exists public.books (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Book',
  document_ids uuid[] not null default '{}',
  created_at bigint not null,
  updated_at bigint not null
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_updated_idx on public.documents (user_id, updated_at desc);
create index if not exists books_user_updated_idx on public.books (user_id, updated_at desc);

alter table public.documents enable row level security;
alter table public.books enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Users can read their documents" on public.documents;
create policy "Users can read their documents"
  on public.documents for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their documents" on public.documents;
create policy "Users can insert their documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their documents" on public.documents;
create policy "Users can update their documents"
  on public.documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their documents" on public.documents;
create policy "Users can delete their documents"
  on public.documents for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read their books" on public.books;
create policy "Users can read their books"
  on public.books for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their books" on public.books;
create policy "Users can insert their books"
  on public.books for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their books" on public.books;
create policy "Users can update their books"
  on public.books for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their books" on public.books;
create policy "Users can delete their books"
  on public.books for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    ),
    new.email
  )
  on conflict (id) do update
    set
      display_name = excluded.display_name,
      email = excluded.email,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, display_name, email, created_at)
select
  id,
  coalesce(
    raw_user_meta_data->>'display_name',
    raw_user_meta_data->>'username',
    split_part(email, '@', 1)
  ),
  email,
  created_at
from auth.users
on conflict (id) do nothing;
