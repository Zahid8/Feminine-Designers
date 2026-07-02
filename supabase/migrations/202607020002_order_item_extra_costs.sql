alter table orders
add column if not exists extra_cost numeric(12,2) not null default 0 check (extra_cost >= 0);

alter table order_items
add column if not exists extra_cost numeric(12,2) not null default 0 check (extra_cost >= 0);

alter table measurement_template_fields
add column if not exists active boolean not null default true;

create table if not exists order_item_extra_costs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  order_item_id uuid references order_items(id) on delete cascade,
  item_sort_order integer,
  label text not null,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (order_id is not null or order_item_id is not null)
);

create index if not exists idx_order_item_extra_costs_order_id on order_item_extra_costs(order_id);
create index if not exists idx_order_item_extra_costs_order_item_id on order_item_extra_costs(order_item_id);

alter table order_item_extra_costs enable row level security;

drop policy if exists "active staff extra item costs read" on order_item_extra_costs;
drop policy if exists "active staff extra item costs manage" on order_item_extra_costs;

create policy "active staff extra item costs read" on order_item_extra_costs
for select using (current_staff_role() in ('admin', 'staff'));

create policy "active staff extra item costs manage" on order_item_extra_costs
for all using (current_staff_role() in ('admin', 'staff')) with check (current_staff_role() in ('admin', 'staff'));

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
  v_extra_cost jsonb;
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
    extra_cost,
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
    coalesce((p_payload #>> '{order,extra_cost}')::numeric, 0),
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
      stitching_cost,
      fabric_price,
      dye_price,
      extra_cost,
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
      coalesce((v_item ->> 'stitching_cost')::numeric, 0),
      coalesce((v_item ->> 'fabric_price')::numeric, 0),
      coalesce((v_item ->> 'dye_price')::numeric, 0),
      coalesce((v_item ->> 'extra_cost')::numeric, 0),
      (v_item ->> 'line_total')::numeric,
      nullif(v_item ->> 'fabric_length', ''),
      nullif(v_item ->> 'fabric_color', ''),
      nullif(v_item ->> 'design_reference', ''),
      nullif(v_item ->> 'stitching_instructions', ''),
      (v_item ->> 'sort_order')::integer
    )
    returning id into v_order_item_id;

    v_item_ids := jsonb_set(v_item_ids, array[v_item ->> 'sort_order'], to_jsonb(v_order_item_id::text), true);

    for v_extra_cost in select * from jsonb_array_elements(coalesce(v_item -> 'extra_costs', '[]'::jsonb))
    loop
      insert into order_item_extra_costs(order_id, order_item_id, item_sort_order, label, amount, sort_order)
      values (
        v_order_id,
        v_order_item_id,
        (v_item ->> 'sort_order')::integer,
        v_extra_cost ->> 'label',
        (v_extra_cost ->> 'amount')::numeric,
        (v_extra_cost ->> 'sort_order')::integer
      );
    end loop;
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

notify pgrst, 'reload schema';
