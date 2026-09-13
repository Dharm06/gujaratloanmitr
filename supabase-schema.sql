create table if not exists public.loan_rates (
  loan_type text not null,
  bank_id integer not null,
  rate numeric(6, 2) not null,
  max_rate numeric(6, 2) not null,
  fee numeric(6, 2) not null,
  updated_at timestamptz not null default now(),
  primary key (loan_type, bank_id)
);

alter table public.loan_rates enable row level security;

create table if not exists public.government_schemes (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.government_schemes enable row level security;

create table if not exists public.dsa_profiles (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.dsa_profiles enable row level security;

create table if not exists public.custom_nbfcs (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.custom_nbfcs enable row level security;
