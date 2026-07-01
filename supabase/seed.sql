insert into store_settings (
  store_name,
  brand_subtitle,
  gstin,
  phone_primary,
  phone_secondary,
  email,
  address_line_1,
  address_line_2,
  city,
  state,
  postal_code,
  logo_path,
  default_cgst_rate,
  default_sgst_rate,
  receipt_prefix,
  receipt_reset_frequency,
  currency_code,
  measurement_unit_default,
  terms_and_conditions
) values (
  'Feminine Designer by Sajida',
  'By Sajida',
  '06AYWPB8525D1ZB',
  '9718926185',
  '8447371925',
  'bsajida77@gmail.com',
  'Shop No. 222, 2nd Floor, City Centre Mall',
  'MG Road Metro Station',
  'Gurugram',
  'Haryana',
  '122002',
  'public/Logo.PNG',
  2.5,
  2.5,
  'SJD',
  'yearly',
  'INR',
  'in',
  'Delivery date is approximate. Please bring this receipt at delivery. Alterations after delivery may be chargeable.'
);

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

with templates(name, category, description) as (
  values
    ('Blouse measurements', 'Blouse', 'Paper-bill code template for blouse orders'),
    ('Suit/Kurti measurements', 'Suit,Kurti,Salwar Suit,Top', 'Reusable template for daily suit and kurti stitching'),
    ('Gown/Lehenga measurements', 'Gown,Lehenga,Skirt', 'Full-length garment measurements'),
    ('General/custom measurements', 'Custom,Alteration,Petticoat,Dupatta,Saree Fall/Pico', 'Fallback template for custom and alteration work')
)
insert into measurement_templates(name, garment_category, description)
select name, category, description from templates;

insert into measurement_template_fields(template_id, field_key, display_code, display_label, long_label, input_type, unit, is_required, sort_order)
select
  t.id,
  f.field_key,
  f.display_code,
  f.display_code,
  f.long_label,
  'number',
  'in',
  f.sort_order <= 6,
  f.sort_order
from measurement_templates t
cross join (
  values
    ('length', 'L', 'Length', 1),
    ('chest', 'C', 'Chest', 2),
    ('waist', 'K', 'Waist', 3),
    ('hip', 'H', 'Hip', 4),
    ('depth', 'D', 'Depth', 5),
    ('shoulder', 'SH', 'Shoulder', 6),
    ('round', 'R', 'Round', 7),
    ('sleeve_length', 'SL', 'Sleeve Length', 8),
    ('neck', 'N', 'Neck', 9),
    ('measurement_c_2', 'C2', 'Secondary C', 10),
    ('measurement_l_2', 'L2', 'Secondary L', 11),
    ('piping', 'P', 'Piping', 12),
    ('bust', 'B', 'Bust', 13),
    ('armhole', 'A', 'Armhole', 14),
    ('measurement_h_2', 'H2', 'Secondary H', 15),
    ('tucks', 'T', 'Tucks', 16),
    ('ak', 'AK', 'AK', 17),
    ('opening', 'O', 'Opening', 18),
    ('collar', 'CL', 'Collar', 19),
    ('thigh', 'TH', 'Thigh', 20),
    ('knee', 'KN', 'Knee', 21),
    ('cup_size', 'CP', 'Cup Size', 22),
    ('backcross', 'BC', 'Backcross', 23),
    ('frontcross', 'FC', 'Frontcross', 24)
) as f(field_key, display_code, long_label, sort_order);
