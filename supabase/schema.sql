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

create index if not exists documents_user_updated_idx on public.documents (user_id, updated_at desc);
create index if not exists books_user_updated_idx on public.books (user_id, updated_at desc);

alter table public.documents enable row level security;
alter table public.books enable row level security;

create policy "Users can read their documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert their documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their documents"
  on public.documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their documents"
  on public.documents for delete
  using (auth.uid() = user_id);

create policy "Users can read their books"
  on public.books for select
  using (auth.uid() = user_id);

create policy "Users can insert their books"
  on public.books for insert
  with check (auth.uid() = user_id);

create policy "Users can update their books"
  on public.books for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their books"
  on public.books for delete
  using (auth.uid() = user_id);
