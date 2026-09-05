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
