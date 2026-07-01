create table if not exists garment_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table garment_types enable row level security;

drop policy if exists "active staff garment types read" on garment_types;
drop policy if exists "admins manage garment types" on garment_types;

create policy "active staff garment types read" on garment_types
for select using (current_staff_role() in ('admin', 'staff'));

create policy "admins manage garment types" on garment_types
for all using (current_staff_role() = 'admin')
with check (current_staff_role() = 'admin');

insert into garment_types(name, sort_order)
select name, sort_order
from (
  values
    ('Blouse', 1),
    ('Suit', 2),
    ('Salwar Suit', 3),
    ('Kurti', 4),
    ('Lehenga', 5),
    ('Gown', 6),
    ('Saree Fall/Pico', 7),
    ('Petticoat', 8),
    ('Alteration', 9),
    ('Dupatta', 10),
    ('Skirt', 11),
    ('Top', 12),
    ('Custom', 13)
) as g(name, sort_order)
on conflict (name) do update set
  sort_order = excluded.sort_order,
  active = true,
  updated_at = now();
