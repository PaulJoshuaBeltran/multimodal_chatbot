create table todos (
  id bigserial primary key,
  title text not null,
  done boolean not null default false
);

alter table todos enable row level security;

-- dev-only policy so the anon key can read/write; replace with real auth policies later
create policy "dev open access" on todos for all using (true) with check (true);