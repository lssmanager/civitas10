alter table location_countries
  add column if not exists phone_code varchar(32);

comment on column location_countries.phone_code is
  'International dialing code imported from dr5hn countries-states-cities-database countries.json phonecode field.';
