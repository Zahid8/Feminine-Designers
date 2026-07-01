create extension if not exists "pgcrypto";

create type staff_role as enum ('admin', 'staff');
create type order_status as enum ('Draft', 'New', 'In Stitching', 'Ready', 'Delivered', 'Cancelled');
create type order_priority as enum ('Normal', 'Urgent', 'Express');
create type payment_method as enum ('Cash', 'UPI', 'Card', 'Bank Transfer', 'Mixed');
create type payment_status as enum ('Unpaid', 'Partial', 'Paid', 'Credit');
create type receipt_reset_frequency as enum ('yearly', 'never');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role staff_role not null default 'staff',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text not null,
  brand_subtitle text not null,
  gstin text not null,
  phone_primary text not null,
  phone_secondary text,
  email text,
  address_line_1 text not null,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  logo_path text not null default 'public/Logo.PNG',
  default_cgst_rate numeric(5,2) not null default 2.5,
  default_sgst_rate numeric(5,2) not null default 2.5,
  receipt_prefix text not null default 'SJD',
  receipt_reset_frequency receipt_reset_frequency not null default 'yearly',
  currency_code text not null default 'INR',
  measurement_unit_default text not null default 'in',
  terms_and_conditions text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text unique,
  full_name text not null,
  phone_primary text not null,
  phone_secondary text,
  email text,
  address text,
  birth_date date,
  notes text,
  preferred_communication text not null default 'WhatsApp',
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index customers_phone_primary_idx on customers(phone_primary);
create index customers_full_name_idx on customers using gin (to_tsvector('simple', full_name));
create index customers_created_at_idx on customers(created_at desc);

create table orders (
  id uuid primary key default gen_random_uuid(),
  receipt_number text unique,
  customer_id uuid not null references customers(id),
  status order_status not null default 'New',
  priority order_priority not null default 'Normal',
  order_date date not null default current_date,
  delivery_date date not null,
  assigned_tailor_id uuid references profiles(id),
  assigned_tailor_name text,
  cloth_sample_image_url text,
  subtotal numeric(12,2) not null default 0,
  item_discount_total numeric(12,2) not null default 0,
  order_discount_amount numeric(12,2) not null default 0,
  accessories_cost numeric(12,2) not null default 0,
  stitching_cost numeric(12,2) not null default 0,
  taxable_amount numeric(12,2) not null default 0,
  cgst_rate numeric(5,2) not null default 2.5,
  cgst_amount numeric(12,2) not null default 0,
  sgst_rate numeric(5,2) not null default 2.5,
  sgst_amount numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  advance_paid numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  payment_status payment_status not null default 'Unpaid',
  internal_notes text,
  customer_notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz,
  cancelled_at timestamptz,
  archived_at timestamptz,
  constraint receipt_required_for_non_draft check (status = 'Draft' or receipt_number is not null)
);

create index orders_customer_id_idx on orders(customer_id);
create index orders_delivery_date_idx on orders(delivery_date);
create index orders_status_idx on orders(status);
create index orders_created_at_idx on orders(created_at desc);
create index orders_order_date_idx on orders(order_date desc);

create table garment_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  garment_type text not null,
  custom_garment_type text,
  quantity numeric(8,2) not null check (quantity > 0),
  rate numeric(12,2) not null check (rate >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  fabric_length text,
  delivered boolean not null default false,
  delivered_at timestamptz,
  fabric_color text,
  design_reference text,
  stitching_instructions text,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table measurement_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  garment_category text not null,
  is_active boolean not null default true,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table measurement_template_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references measurement_templates(id) on delete cascade,
  field_key text not null,
  display_code text not null,
  display_label text not null,
  long_label text,
  input_type text not null default 'number',
  unit text not null default 'in',
  is_required boolean not null default false,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_id, field_key)
);

create table order_measurements (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  order_item_id uuid references order_items(id) on delete cascade,
  template_id uuid references measurement_templates(id),
  field_key text not null,
  display_code text not null,
  display_label text not null,
  value text not null,
  unit text not null default 'in',
  notes text,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table customer_measurement_profiles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  template_id uuid references measurement_templates(id),
  field_key text not null,
  value text not null,
  unit text not null default 'in',
  source_order_id uuid references orders(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(customer_id, template_id, field_key)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method payment_method not null,
  payment_reference text,
  paid_at timestamptz not null default now(),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  changed_by uuid references profiles(id),
  notes text,
  created_at timestamptz not null default now()
);

create table receipt_sequence (
  id uuid primary key default gen_random_uuid(),
  sequence_key text not null unique,
  current_value integer not null default 0,
  year integer not null,
  prefix text not null,
  updated_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_id uuid references profiles(id),
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function next_receipt_number(p_prefix text, p_year integer, p_starting_serial integer default 1)
returns text
language plpgsql
security definer
as $$
declare
  v_key text := p_prefix || '-' || p_year::text;
  v_next integer;
begin
  insert into receipt_sequence(sequence_key, current_value, year, prefix)
  values (v_key, p_starting_serial, p_year, p_prefix)
  on conflict (sequence_key)
  do update set current_value = receipt_sequence.current_value + 1, updated_at = now()
  returning current_value into v_next;

  return p_prefix || '-' || p_year::text || '-' || lpad(v_next::text, 6, '0');
end;
$$;

create or replace function create_order_from_payload(p_payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_receipt_number text;
  v_status order_status := (p_payload #>> '{order,status}')::order_status;
  v_order_year integer := extract(year from (p_payload #>> '{order,order_date}')::date)::integer;
  v_item jsonb;
  v_measurement jsonb;
  v_order_item_id uuid;
  v_item_ids jsonb := '{}'::jsonb;
begin
  select id into v_customer_id
  from customers
  where phone_primary = p_payload #>> '{customer,phone_primary}'
    and archived_at is null
  order by created_at desc
  limit 1;

  if v_customer_id is null then
    insert into customers(full_name, phone_primary, preferred_communication)
    values (
      p_payload #>> '{customer,full_name}',
      p_payload #>> '{customer,phone_primary}',
      'WhatsApp'
    )
    returning id into v_customer_id;
  else
    update customers
    set full_name = p_payload #>> '{customer,full_name}', updated_at = now()
    where id = v_customer_id;
  end if;

  if v_status <> 'Draft' then
    v_receipt_number := next_receipt_number('SJD', v_order_year, 1);
  end if;

  insert into orders (
    receipt_number,
    customer_id,
    status,
    priority,
    order_date,
    delivery_date,
    assigned_tailor_name,
    cloth_sample_image_url,
    subtotal,
    item_discount_total,
    order_discount_amount,
    accessories_cost,
    stitching_cost,
    taxable_amount,
    cgst_rate,
    cgst_amount,
    sgst_rate,
    sgst_amount,
    grand_total,
    advance_paid,
    balance_due,
    payment_status,
    internal_notes,
    customer_notes
  )
  values (
    v_receipt_number,
    v_customer_id,
    v_status,
    (p_payload #>> '{order,priority}')::order_priority,
    (p_payload #>> '{order,order_date}')::date,
    (p_payload #>> '{order,delivery_date}')::date,
    nullif(p_payload #>> '{order,assigned_tailor_name}', ''),
    nullif(p_payload #>> '{order,cloth_sample_image_url}', ''),
    (p_payload #>> '{order,subtotal}')::numeric,
    (p_payload #>> '{order,item_discount_total}')::numeric,
    (p_payload #>> '{order,order_discount_amount}')::numeric,
    coalesce((p_payload #>> '{order,accessories_cost}')::numeric, 0),
    coalesce((p_payload #>> '{order,stitching_cost}')::numeric, 0),
    (p_payload #>> '{order,taxable_amount}')::numeric,
    (p_payload #>> '{order,cgst_rate}')::numeric,
    (p_payload #>> '{order,cgst_amount}')::numeric,
    (p_payload #>> '{order,sgst_rate}')::numeric,
    (p_payload #>> '{order,sgst_amount}')::numeric,
    (p_payload #>> '{order,grand_total}')::numeric,
    (p_payload #>> '{order,advance_paid}')::numeric,
    (p_payload #>> '{order,balance_due}')::numeric,
    (p_payload #>> '{order,payment_status}')::payment_status,
    nullif(p_payload #>> '{order,internal_notes}', ''),
    nullif(p_payload #>> '{order,customer_notes}', '')
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_payload -> 'items', '[]'::jsonb))
  loop
    insert into order_items (
      order_id,
      garment_type,
      custom_garment_type,
      quantity,
      rate,
      discount_amount,
      line_total,
      fabric_length,
      fabric_color,
      design_reference,
      stitching_instructions,
      sort_order
    )
    values (
      v_order_id,
      v_item ->> 'garment_type',
      nullif(v_item ->> 'custom_garment_type', ''),
      (v_item ->> 'quantity')::numeric,
      (v_item ->> 'rate')::numeric,
      (v_item ->> 'discount_amount')::numeric,
      (v_item ->> 'line_total')::numeric,
      nullif(v_item ->> 'fabric_length', ''),
      nullif(v_item ->> 'fabric_color', ''),
      nullif(v_item ->> 'design_reference', ''),
      nullif(v_item ->> 'stitching_instructions', ''),
      (v_item ->> 'sort_order')::integer
    )
    returning id into v_order_item_id;

    v_item_ids := jsonb_set(v_item_ids, array[v_item ->> 'sort_order'], to_jsonb(v_order_item_id::text), true);
  end loop;

  for v_measurement in select * from jsonb_array_elements(coalesce(p_payload -> 'measurements', '[]'::jsonb))
  loop
    insert into order_measurements (
      order_id,
      order_item_id,
      field_key,
      display_code,
      display_label,
      value,
      unit,
      notes,
      sort_order
    )
    values (
      v_order_id,
      nullif(v_item_ids ->> coalesce(v_measurement ->> 'item_sort_order', ''), '')::uuid,
      v_measurement ->> 'field_key',
      v_measurement ->> 'display_code',
      v_measurement ->> 'display_label',
      v_measurement ->> 'value',
      coalesce(v_measurement ->> 'unit', 'in'),
      nullif(v_measurement ->> 'notes', ''),
      (v_measurement ->> 'sort_order')::integer
    );

    if v_status <> 'Draft' then
      insert into customer_measurement_profiles(customer_id, field_key, value, unit, source_order_id)
      values (
        v_customer_id,
        v_measurement ->> 'field_key',
        v_measurement ->> 'value',
        coalesce(v_measurement ->> 'unit', 'in'),
        v_order_id
      )
      on conflict (customer_id, template_id, field_key)
      do update set
        value = excluded.value,
        unit = excluded.unit,
        source_order_id = excluded.source_order_id,
        updated_at = now();
    end if;
  end loop;

  if jsonb_typeof(p_payload -> 'payment') = 'object' then
    insert into payments(order_id, amount, payment_method, payment_reference, notes)
    values (
      v_order_id,
      (p_payload #>> '{payment,amount}')::numeric,
      (p_payload #>> '{payment,payment_method}')::payment_method,
      nullif(p_payload #>> '{payment,payment_reference}', ''),
      nullif(p_payload #>> '{payment,notes}', '')
    );
  end if;

  insert into order_status_history(order_id, to_status, notes)
  values (v_order_id, v_status, 'Order created');

  insert into audit_log(entity_type, entity_id, action, after_data)
  values ('order', v_order_id, 'created', p_payload);

  return jsonb_build_object('order_id', v_order_id, 'receipt_number', v_receipt_number);
end;
$$;

alter table profiles enable row level security;
alter table store_settings enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table garment_types enable row level security;
alter table order_items enable row level security;
alter table measurement_templates enable row level security;
alter table measurement_template_fields enable row level security;
alter table order_measurements enable row level security;
alter table customer_measurement_profiles enable row level security;
alter table payments enable row level security;
alter table order_status_history enable row level security;
alter table receipt_sequence enable row level security;
alter table audit_log enable row level security;

create or replace function current_staff_role()
returns staff_role
language sql
stable
as $$
  select role from profiles where id = auth.uid() and active = true
$$;

create policy "active staff can read profiles" on profiles for select using (current_staff_role() in ('admin', 'staff'));
create policy "admins manage profiles" on profiles for all using (current_staff_role() = 'admin') with check (current_staff_role() = 'admin');

create policy "active staff read settings" on store_settings for select using (current_staff_role() in ('admin', 'staff'));
create policy "admins update settings" on store_settings for all using (current_staff_role() = 'admin') with check (current_staff_role() = 'admin');

create policy "active staff customer access" on customers for all using (current_staff_role() in ('admin', 'staff')) with check (current_staff_role() in ('admin', 'staff'));
create policy "active staff order access" on orders for all using (current_staff_role() in ('admin', 'staff')) with check (current_staff_role() in ('admin', 'staff'));
create policy "active staff garment types read" on garment_types for select using (current_staff_role() in ('admin', 'staff'));
create policy "admins manage garment types" on garment_types for all using (current_staff_role() = 'admin') with check (current_staff_role() = 'admin');
create policy "active staff order item access" on order_items for all using (current_staff_role() in ('admin', 'staff')) with check (current_staff_role() in ('admin', 'staff'));
create policy "active staff measurement templates read" on measurement_templates for select using (current_staff_role() in ('admin', 'staff'));
create policy "admins manage measurement templates" on measurement_templates for all using (current_staff_role() = 'admin') with check (current_staff_role() = 'admin');
create policy "active staff template fields read" on measurement_template_fields for select using (current_staff_role() in ('admin', 'staff'));
create policy "admins manage template fields" on measurement_template_fields for all using (current_staff_role() = 'admin') with check (current_staff_role() = 'admin');
create policy "active staff measurements access" on order_measurements for all using (current_staff_role() in ('admin', 'staff')) with check (current_staff_role() in ('admin', 'staff'));
create policy "active staff customer profile measurements access" on customer_measurement_profiles for all using (current_staff_role() in ('admin', 'staff')) with check (current_staff_role() in ('admin', 'staff'));
create policy "active staff payments access" on payments for all using (current_staff_role() in ('admin', 'staff')) with check (current_staff_role() in ('admin', 'staff'));
create policy "active staff status history access" on order_status_history for all using (current_staff_role() in ('admin', 'staff')) with check (current_staff_role() in ('admin', 'staff'));
create policy "admins receipt sequence access" on receipt_sequence for all using (current_staff_role() = 'admin') with check (current_staff_role() = 'admin');
create policy "active staff audit read" on audit_log for select using (current_staff_role() in ('admin', 'staff'));
create policy "active staff audit insert" on audit_log for insert with check (current_staff_role() in ('admin', 'staff'));
