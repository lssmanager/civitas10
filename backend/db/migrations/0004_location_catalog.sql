create table if not exists countries (
  id integer primary key,
  name varchar(160) not null,
  iso2 varchar(2) not null,
  iso3 varchar(3) not null,
  numeric_code varchar(8),
  phone_code varchar(32),
  capital varchar(160),
  currency varchar(16),
  currency_name varchar(120),
  currency_symbol varchar(16),
  region varchar(120),
  subregion varchar(120),
  native_name varchar(160),
  emoji varchar(16),
  latitude numeric(10,7),
  longitude numeric(10,7),
  wiki_data_id varchar(32)
);
create unique index if not exists countries_iso2_uidx on countries(iso2);
create unique index if not exists countries_iso3_uidx on countries(iso3);
create index if not exists countries_name_idx on countries(name);

create table if not exists states (
  id integer primary key,
  name varchar(160) not null,
  country_id integer not null references countries(id) on delete cascade,
  country_code varchar(2) not null,
  state_code varchar(16),
  type varchar(80),
  latitude numeric(10,7),
  longitude numeric(10,7),
  wiki_data_id varchar(32)
);
create index if not exists states_country_id_idx on states(country_id);
create index if not exists states_name_idx on states(name);
create index if not exists states_country_name_idx on states(country_id, name);

create table if not exists cities (
  id integer primary key,
  name varchar(180) not null,
  state_id integer references states(id) on delete cascade,
  state_code varchar(16),
  country_id integer not null references countries(id) on delete cascade,
  country_code varchar(2) not null,
  latitude numeric(10,7),
  longitude numeric(10,7),
  timezone varchar(120),
  wiki_data_id varchar(32)
);
create index if not exists cities_state_id_idx on cities(state_id);
create index if not exists cities_country_id_idx on cities(country_id);
create index if not exists cities_name_idx on cities(name);
create index if not exists cities_state_name_idx on cities(state_id, name);
