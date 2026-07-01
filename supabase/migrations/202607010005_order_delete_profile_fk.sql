alter table customer_measurement_profiles
  drop constraint if exists customer_measurement_profiles_source_order_id_fkey;

alter table customer_measurement_profiles
  add constraint customer_measurement_profiles_source_order_id_fkey
  foreign key (source_order_id)
  references orders(id)
  on delete set null;

notify pgrst, 'reload schema';
