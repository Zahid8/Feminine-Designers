-- Settings upgrades: editable customer bill terms and WhatsApp templates,
-- default prices per garment, and a managed list of tailors.
-- Safe to run more than once.

alter table store_settings add column if not exists customer_terms text;
alter table store_settings add column if not exists message_templates jsonb;

alter table garment_types add column if not exists default_rate numeric(10,2);

create table if not exists tailors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The app reads and writes through the server with the service role key.
alter table tailors enable row level security;

notify pgrst, 'reload schema';
